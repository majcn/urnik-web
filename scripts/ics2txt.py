#!/usr/bin/env python3
"""Pretvori izvozene koledarje .ics v besedilni urnik za src/lib/data.txt.

Ime datoteke postane ime otroka: Nejc.ics -> Nejc,
"Obveznosti - Zala.ics" -> Zala.

  ./scripts/ics2txt.py Nejc.ics Zala.ics                 # izpise na stdout
  ./scripts/ics2txt.py *.ics -o src/lib/data.txt            # zapise v datoteko
  ./scripts/ics2txt.py *.ics --from 13:00                   # izpusti pouk pred 13:00

Bere se en teden: vsak dogodek pristane na svojem dnevu. Casi z "Z" so v UTC in
se pretvorijo v krajevni cas, casi s TZID se vzamejo takisni, kot so zapisani.
Celodnevni, odpovedani in vikend dogodki odpadejo, podvojeni termini (isti
predmet cez vec tednov) pa se zdruzijo. Ena vrstica je en dan.
"""

import argparse
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

PALETTE = ['#C4562F', '#6A4C93', '#2E7D6E', '#2C6E8F', '#B4762A', '#8E4470']
DAY_ABBR = ['pon', 'tor', 'sre', 'čet', 'pet']
DAY_FULL = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek']
HEADER = """\
# Urnik. Ena vrstica = ena dejavnost:
#
#   dan  ura-ura  naziv  [@ kraj]  [/ kdo pelje]  [~pot]
#
# Dnevi so pon tor sre čet pet (ali polna imena), en dan na vrstico. Rep za uro
# je neobvezen in sme priti v poljubnem vrstnem redu; tudi naziv sme izostati:
#   pon  08:00-16:00              sam pas, brez napisa
#   sre  16:20-17:20  @ Kranj     pas s krajem, brez naziva
#
# Pot "~" se piše z urami, ne z minutami:
#   ~17:15/18:45   odhod ob 17:15, doma ob 18:45
#   ~17:15         samo odhod          ~/18:45   samo prihod
# Nariše se kot črtkan blok, prilepljen nad oz. pod dejavnost. Razlika do
# začetka pokrije pot in morebitno čakanje, zato se ni treba nič računati.
#
# Ime z dvopičjem odpre blok osebe, barva za imenom je neobvezna:
#   Nejc #1E216B:            otrok — svoja polovica stolpca, tudi če je sosednja prazna
#   Nejc + Zala:            skupna dejavnost — čez oba pasova, z deljenim robom
#   Eva #13F2E7 (ozadje):   odrasli — čez vso širino, pod otroki in bledo
#
# Mreža pokriva 07:00–19:00 in se sama razširi, če kaj pade izven nje.
# Vrstice, ki se začnejo z #, so opombe.
#
# Zgrajeno s scripts/ics2txt.py. Če datoteko zgradiš znova, ostanejo nazivi,
# ure in kraji, ročni dodatki (/ kdo pelje, ~pot, (ozadje)) pa se izgubijo.
"""
BYDAY = {'MO': 0, 'TU': 1, 'WE': 2, 'TH': 3, 'FR': 4, 'SA': 5, 'SU': 6}
KEEP = {'DTSTART', 'DTEND', 'SUMMARY', 'LOCATION', 'RRULE', 'STATUS'}
WEEKDAYS = 5
STAMP = re.compile(r'^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$')


def unfold(text):
    """Nadaljevalne vrstice se v .ics zacnejo s presledkom ali tabulatorjem."""
    lines = []
    for line in text.replace('\r\n', '\n').replace('\r', '\n').split('\n'):
        if line[:1] in (' ', '\t') and lines:
            lines[-1] += line[1:]
        else:
            lines.append(line)
    return lines


def unescape(value):
    return (value.replace('\\n', ' ').replace('\\N', ' ')
                 .replace('\\,', ',').replace('\\;', ';')
                 .replace('\\\\', '\\').strip())


def read_stamp(raw, local_tz):
    match = STAMP.match(raw)
    if not match or match.group(4) is None:
        return None                                    # celodnevni dogodek
    y, mo, d, h, mi, s, utc = match.groups()
    stamp = datetime(int(y), int(mo), int(d), int(h), int(mi), int(s))
    return stamp.replace(tzinfo=timezone.utc).astimezone(local_tz) if utc else stamp


def weekly_days(rrule, fallback):
    if not re.search(r'FREQ=WEEKLY', rrule, re.I):
        return [fallback]
    byday = re.search(r'BYDAY=([^;]+)', rrule, re.I)
    if not byday:
        return [fallback]
    days = []
    for token in byday.group(1).split(','):
        key = re.sub(r'^[-+]?\d+', '', token).upper()
        if key in BYDAY:
            days.append(BYDAY[key])
    return days or [fallback]


def read_events(path, local_tz):
    raw, current = [], None
    for line in unfold(Path(path).read_text(encoding='utf-8')):
        if line == 'BEGIN:VEVENT':
            current = {}
        elif line == 'END:VEVENT':
            if current is not None:
                raw.append(current)
            current = None
        elif current is not None and ':' in line:
            key, value = line.split(':', 1)
            key = key.split(';')[0].upper()
            if key in KEEP:
                current[key] = value

    events = []
    for entry in raw:
        if entry.get('STATUS') == 'CANCELLED':
            continue
        start = read_stamp(entry.get('DTSTART', ''), local_tz)
        end = read_stamp(entry.get('DTEND', ''), local_tz)
        if not start or not end:
            continue
        name = unescape(entry.get('SUMMARY', '(brez naslova)'))
        where = unescape(entry.get('LOCATION', ''))
        for day in weekly_days(entry.get('RRULE', ''), start.weekday()):
            events.append({'name': name, 'day': day, 'where': where,
                           'start': start.strftime('%H:%M'), 'end': end.strftime('%H:%M')})
    return events


def kid_name(path):
    name = Path(path).stem.strip()
    if ' - ' in name:
        name = name.split(' - ')[-1].strip()
    return name or 'Otrok'


def render(kid, color, events):
    """Blok enega otroka; ena vrstica na dejavnost, dnevi ločeni z opombo."""
    lines = [f'{kid} {color}:']
    current_day = None
    for event in sorted(events, key=lambda e: (e['day'], e['start'])):
        if event['day'] != current_day:
            current_day = event['day']
            lines.append('')
            lines.append(f'  # {DAY_FULL[current_day]}')
        line = f"  {DAY_ABBR[event['day']]}  {event['start']}-{event['end']}  {event['name']}"
        if event['where']:
            line += f"  @ {event['where']}"
        lines.append(line)
    return lines


def main():
    parser = argparse.ArgumentParser(description='Pretvori .ics koledarje v besedilni urnik.')
    parser.add_argument('files', nargs='+', help='datoteke .ics, ena na otroka')
    parser.add_argument('-o', '--out', help='zapisi v to datoteko namesto na stdout')
    parser.add_argument('--from', dest='frm', help='izpusti dejavnosti pred to uro, npr. 13:00')
    args = parser.parse_args()

    local_tz = datetime.now().astimezone().tzinfo
    cut = None
    if args.frm:
        hour, minute = args.frm.split(':')
        cut = int(hour) * 60 + int(minute)

    blocks, seen = [], set()
    for index, path in enumerate(args.files):
        name = kid_name(path)
        kept = []
        for event in read_events(path, local_tz):
            if event['day'] >= WEEKDAYS:
                continue
            if cut is not None and int(event['start'][:2]) * 60 + int(event['start'][3:]) < cut:
                continue
            key = (name, event['name'], event['day'], event['start'], event['end'])
            if key in seen:                            # isti termin v vec tednih
                continue
            seen.add(key)
            kept.append(event)
        if kept:
            blocks.append(render(name, PALETTE[index % len(PALETTE)], kept))

    text = HEADER + '\n' + '\n\n'.join('\n'.join(block) for block in blocks) + '\n'
    if args.out:
        Path(args.out).write_text(text, encoding='utf-8')
        total = sum(len(block) - 1 for block in blocks)
        print(f'Zapisano v {args.out}: {total} vrstic, {len(blocks)} otrok.', file=sys.stderr)
    else:
        sys.stdout.write(text)


if __name__ == '__main__':
    main()
