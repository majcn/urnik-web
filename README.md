# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.17.0 create --template minimal --types ts --add prettier tailwindcss="plugins:none" ai-tools="ide:claude-code+delivery:plugin" --install npm urnik-generator-pdf
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Urnik

Tedenski urnik otrok (ponedeljek–petek), narejen za tisk na eno stran A4 ležeče.
Brez datumov, ena barva na otroka. Natisne se samo mreža: naslov, legenda in
vnosna polja so `print:hidden`. Mreža pokriva 07:00–19:00 in se raztegne čez
ves list; če kakšna dejavnost pade izven tega okna, se okno razširi.

### Zgradba

```
src/lib/data.txt      urnik — edini vir podatkov, ureja se na roko
src/lib/schedule/     čista logika, brez DOM — se da testirati sama zase
  types.ts            Kid, Activity, Schedule
  time.ts             ure, dnevi, slovenske sklanjatve
  palette.ts          barve otrok in deljeni barvni rob
  scale.ts            navpična lestvica 07:00–19:00 in razporeditev prekrivanj
  text.ts             razčlenjevalnik in izpis besedilne oblike urnika
scripts/ics2txt.py    .ics -> data.txt, zunaj aplikacije

src/lib/components/   izris
  Masthead, KidLegend                glava in legenda, samo na zaslonu
  WeekGrid > TimeGutter, DayColumn > ActivityBlock + TravelBlock
  DetailsPanel, ScheduleEditor       urejanje, samo na zaslonu
```

`src/routes/+page.svelte` samo sestavi zgornje in drži stanje.
Barve in pisave so v `src/routes/layout.css` (Tailwind `@theme`), tam je tudi `@page`.

### Vnos podatkov

Urnik živi v `src/lib/data.txt` in se v stran uvozi kot besedilo (`?raw`), zato
ga dev strežnik ob shranjevanju sam osveži. Ena vrstica na dejavnost:

```
Nejc #C4562F:
  pon  08:20-09:05  SLJ
  sre  08:20-09:05  SLJ
  pet  15:00-16:00  Nogomet  @ Igrišče  / oči  ~14:40/16:20

Nejc + Zala:
  tor  18:00-19:00  Gasilci
```

Dnevi so `pon tor sre čet pet` (ali polna imena), en dan na vrstico.
Neobvezno `@ kraj`, `/ kdo pelje` in pot z `~`: ura odhoda, poševnica, ura
prihoda domov (`~17:15/18:45`). Ena stran sme manjkati — `~17:15` ali `~/18:45`.
Razlika do začetka oz. konca pokrije pot in morebitno čakanje, zato se ni treba
nič računati. Pot se izriše kot črtkan blok, prilepljen na dejavnost: nad njo
z uro odhoda, pod njo z uro prihoda domov. Barva v glavi je neobvezna.
Vrstice, ki se začnejo z `#`, so opombe — skripta jih sama postavi kot
glavo datoteke in kot ločila med dnevi.
Pod mrežo je isto besedilo tudi v polju za hitre popravke, a se ob osvežitvi
strani vrne na `data.txt`.

### Iz Google Koledarja

Izvoženih `.ics` aplikacija ne bere — pretvori jih skripta:

```sh
./scripts/ics2txt.py Nejc.ics Zala.ics -o src/lib/data.txt
./scripts/ics2txt.py *.ics --from 13:00        # samo popoldne, brez pouka
```

Ime datoteke postane ime otroka. Časi v UTC se pretvorijo v krajevni čas,
celodnevni in odpovedani dogodki ter vikend odpadejo, podvojeni termini pa se
združijo.
