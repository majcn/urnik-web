#!/usr/bin/env python3
"""Zapise urnik v kratko povezavo /goto/{id}.

  ./utils/shorten.py src/lib/data.txt
  ./utils/ics2txt.py *.ics | ./utils/shorten.py       # naravnost iz koledarja
  ./utils/shorten.py src/lib/data.txt --local         # v krajevni KV za npm run dev:cf

Brez datoteke bere s stdin. Izpise povezavo; z -q samo njo, brez oblacenja.

V KV pise `wrangler kv key put`, torej z istimi pravicami, kot jih ima tvoj
`wrangler login` — strani ni treba dati vhoda v shrambo in ga tudi nima. Kdor
nima dostopa do racuna, kratke povezave ne more ustvariti.

V shrambi je urnik v besedilni obliki; stisne ga funkcija `functions/goto/[id].ts`
sproti ob preusmeritvi. Tako je zapis berljiv (`wrangler kv key get`) in
stiskanje ziveti le na enem mestu, v `src/lib/schedule/url.ts`.

Id je odtis vsebine: isti urnik vedno da isto povezavo, zato ponovni zapis ne
naredi novega vnosa in shramba se ne redci s podvojenimi.

Namespaca ni treba povedati: poisce se po imenu z `wrangler kv namespace list`,
tako kot vezavo v produkciji po istem imenu poisce nadzorna plosca. Njegovega
id-ja s tem ni v repozitoriju, ki je javen. Pri --local se ne isce nic —
krajevni predal nosi kar ime vezave, tak, kot ga naredi
`wrangler pages dev --kv URNIK_LINKS`.

Naslov strani je v $URNIK_HOST ali --host; brez njega se izpise sama pot.
"""

import argparse
import hashlib
import json
import os
import shlex
import subprocess
import sys
import tempfile
from pathlib import Path

BINDING = 'URNIK_LINKS'
HOST = 'URNIK_HOST'
WRANGLER = 'WRANGLER'
DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'
LENGTH = 8                                    # 36^8 je za osebni predal dovolj


def fingerprint(text):
    """Odtis vsebine, skrajsan na kratek niz iz stevk in crk."""
    value = int.from_bytes(hashlib.sha256(text.encode('utf-8')).digest()[:8], 'big')
    out = ''
    while value:
        value, rest = divmod(value, 36)
        out = DIGITS[rest] + out
    return (out or '0').rjust(LENGTH, '0')[:LENGTH]


def wrangler():
    """Ukaz, s katerim se poklice wrangler; $WRANGLER ga sme zamenjati."""
    return shlex.split(os.environ.get(WRANGLER, 'npx wrangler'))


def run(command, what):
    """Pozene wrangler in vrne izpis; ob napaki ga izpljune in konca."""
    try:
        done = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    except FileNotFoundError:
        raise SystemExit(f'Ni mogoce pognati {command[0]} — je wrangler nameščen?')
    if done.returncode != 0:
        sys.stderr.write(done.stderr or done.stdout)
        raise SystemExit(f'{what} ni uspelo (wrangler {done.returncode}).')
    return done.stdout


def namespace_id(title):
    """Poisce namespace po imenu, da id-ja ni treba nositi s sabo."""
    out = run([*wrangler(), 'kv', 'namespace', 'list'], 'Iskanje namespacea')
    start = out.find('[')                     # wrangler rad pripne se kaksno vrstico
    try:
        found = json.loads(out[start:]) if start >= 0 else []
    except json.JSONDecodeError:
        raise SystemExit(f'Seznama namespacev ni bilo mogoce prebrati:\n{out}')

    for entry in found:
        if entry.get('title') == title:
            return entry['id']

    names = ', '.join(entry.get('title', '?') for entry in found) or 'nobenega'
    raise SystemExit(f'Namespacea {title} ni na racunu — na voljo je {names}.')


def put(key, text, namespace, local):
    """Zapise v KV; vrednost gre skozi datoteko, ne skozi ukazno vrstico."""
    with tempfile.NamedTemporaryFile('w', suffix='.txt', encoding='utf-8', delete=False) as file:
        file.write(text)
        path = file.name
    try:
        run(
            [*wrangler(), 'kv', 'key', 'put', key,
             '--path', path,
             '--namespace-id', namespace,
             '--local' if local else '--remote'],
            'Zapis v KV',
        )
    finally:
        os.unlink(path)


def main():
    parser = argparse.ArgumentParser(
        description='Zapise urnik v kratko povezavo /goto/{id}.',
        epilog=f'Pise z wranglerjem, torej s pravicami tvojega racuna. '
               f'Namespace {BINDING} se poisce sam. Naslov: --host ali ${HOST}.',
    )
    parser.add_argument('file', nargs='?', help='urnik; brez njega se bere stdin')
    parser.add_argument('--host', default=os.environ.get(HOST), help=f'naslov strani (${HOST})')
    parser.add_argument('--local', action='store_true', help='v krajevni KV, ne v pravega')
    parser.add_argument('-q', '--quiet', action='store_true', help='izpise samo povezavo')
    args = parser.parse_args()

    text = Path(args.file).read_text(encoding='utf-8') if args.file else sys.stdin.read()
    text = text.strip()
    if text == '':
        raise SystemExit('Urnik je prazen, ni kaj zapisati.')

    # Krajevni predal nosi kar ime vezave, pravega je treba poiskati po imenu.
    namespace = BINDING if args.local else namespace_id(BINDING)

    key = fingerprint(text)
    put(key, text, namespace, args.local)

    link = f'{args.host.rstrip("/")}/goto/{key}' if args.host else f'/goto/{key}'
    if args.quiet:
        print(link)
    else:
        source = args.file or 'stdin'
        where = 'krajevni KV' if args.local else 'KV'
        print(f'{source}: {len(text.splitlines())} vrstic -> {link}  ({where})')


if __name__ == '__main__':
    main()
