# Urnik

Tedenski urnik oseb (ponedeljek–petek), narejen za tisk. Brez datumov, ena
barva na osebo — list gre na hladilnik in velja, dokler se urnik ne spremeni.

Stran je brez strežnika in brez shrambe: **urnik je zapisan kar v naslovu**,
stisnjen z `lz-string`. Povezava je celotno stanje, zaznamek pa arhiv.

## Kako se uporablja

**Uredi urnik.** Polje pod mrežo je odprto. Vanj napišeš ali prilepiš urnik in
pritisneš **Uporabi**; naslov se posodobi. Shrani si ga med zaznamke — ob
naslednjem obisku se urnik naloži iz njega. **Ponastavi** te vrne na vzorec.

**Osebe.** V legendi zgoraj levo klik na ime osebo umakne z lista in jo vrne
nazaj; prečrtano ime pomeni, da je skrita. Klik na barvno ploščico odpre
izbirnik barv. Ko ostane ena sama oseba, dobi cel stolpec dneva zase in besedilo
se neha lomiti.

**Na telefonu.** Pod 1024 px teden odstopi mesto enemu dnevu čez cel zaslon: s
prstom levo-desno med dnevi, zavihki zgoraj za skok, ob obisku se odpre današnji
dan. Vrstice so tam višje kot na listu, zato gre v bloke več besedila. Tisk
ostane teden — tudi če ga sprožiš s telefona.

**Prikaži od–do.** Zoži list na del dneva. Dejavnost, ki gleda čez mejo, se
obreže, ne izgine. Če te zanima samo popoldne, se s tem podvoji višina vrstic in
v bloke gre več besedila.

**List.** Stikalo zgoraj desno:

|          | kaj natisneš           | kaj dobiš                                                              |
| -------- | ---------------------- | ---------------------------------------------------------------------- |
| **A4**   | en list ležeče         | cel teden, najmanj prostora                                            |
| **A3 ↕** | dva lista **ležeče**   | zlepiš ju po višini; dvojna višina vrstic                              |
| **A3 ↔** | dva lista **pokončno** | zlepiš ju po širini; pon–sre levo, čet–pet in stolpec za zapiske desno |

Pri obeh A3 se mreža konča točno na robu tiskanega polja, zato je bel rob
papirja hkrati mesto stika: odreži ga na strani stika in lista zlepi. Stolpci so
v milimetrih in enaki na obeh listih, zato se mreža ujame.

**Natisni.** Natisne se samo mreža — naslov, legenda in vnosna polja ne.

## Oblika urnika

Ena vrstica je ena dejavnost:

```
Nejc #1E216B:
  pon  08:20-09:05  MAT
  pon  14:00-15:00  Plavanje   @ Bazen   / mama  ~13:30/15:30
  sre  16:00-17:00  Kitara     @ Glasbena šola   ~15:40

Nejc + Zala:
  tor  18:00-19:00  Gasilci    @ Dom  / oči  ~17:45/19:15

Eva #13F2E7 (ozadje):
  pon  08:00-16:00
  sre  16:20-17:20  @ Kranj  ~16:00
```

- **Ime z dvopičjem** odpre blok osebe. Barva za imenom je neobvezna — brez nje
  jo stran dodeli sama.
- **`A + B:`** je skupna dejavnost: gre čez oba pasova in dobi deljen barvni rob.
- **`(ozadje)`** označi osebo, ki je na listu le za vednost: nima svojega pasu,
  riše se čez vso širino, pod ostalimi in bledo.
- **Dnevi** so `pon tor sre čet pet` (ali polna imena), en dan na vrstico.
- **`@ kraj`** in **`/ kdo pelje`** sta neobvezna in smeta priti v poljubnem
  vrstnem redu. Voznik se izpiše v pasu poti, ne v bloku dejavnosti.
- **`~pot`** se piše z urami, ne z minutami: `~17:15/18:45` je odhod ob 17:15 in
  prihod domov ob 18:45; ena stran sme manjkati (`~17:15`, `~/18:45`). Razlika do
  začetka pokrije pot in morebitno čakanje, zato ni treba nič računati.
- **Naziv sme izostati:** `pon 08:00-16:00` nariše sam pas, `sre 16:20-17:20 @ Kranj`
  pas s krajem.
- Vrstice, ki se začnejo z **`#`**, so opombe.

Mreža pokriva 07:00–19:00 in se razširi, če kaj pade izven nje. Vsaka oseba ima
svoj stalni pas v stolpcu dneva, tudi kadar je sosednji prazen — tako je na prvi
pogled jasno, čigav je blok.

Brez parametra v naslovu se naloži `src/lib/data.example.txt`.

## utils/

Pomočniki, ki niso del strani.

### `utils/ics2txt.py`

Pretvori izvožene koledarje (`.ics`) v besedilo, ki ga prilepiš v polje na
strani. Ime datoteke postane ime osebe.

```sh
./utils/ics2txt.py Nejc.ics Zala.ics          # izpiše na zaslon
./utils/ics2txt.py *.ics -o urnik.txt            # zapiše v datoteko
./utils/ics2txt.py *.ics --from 13:00            # brez pouka, samo popoldne
```

Časi v UTC se pretvorijo v krajevni čas; celodnevni in odpovedani dogodki ter
vikend odpadejo; podvojeni termini (isti predmet čez več tednov) se združijo.
Kraj pride iz `LOCATION`, voznika in poti pa koledar ne pozna — ta dva dopišeš
sam in se ob ponovni gradnji izgubita.

## Razvoj

```sh
npm install
npm run dev        # razvojni strežnik
npm run build      # produkcijska gradnja
npm run check      # svelte-check
npm run format     # prettier
```

Zgradba:

```
src/lib/schedule/         čista logika, brez DOM
  types.ts                Person, Activity, Schedule
  time.ts                 ure, dnevi, slovenske sklanjatve
  palette.ts              barve oseb in deljeni barvni rob
  scale.ts                navpična lestvica, razporeditev prekrivanj, velikost lista
  text.ts                 razčlenjevalnik besedilne oblike
  url.ts                  stiskanje urnika v naslov in nazaj
  data.example.txt        vzorec, ki se naloži brez parametra

src/lib/components/       izris
  Masthead, TopBar, TimeRange        glava in kontrole, samo na zaslonu
  WeekGrid > TimeGutter, DayColumn > ActivityBlock + TravelBlock
  NotesColumn                        črte za ročne zapiske (A3 ↔)
  DetailsPanel, ScheduleEditor       urejanje, samo na zaslonu
```

`src/routes/+page.svelte` sestavi zgornje in drži stanje. Barve, pisave in
pravila za tisk (`@page`) so v `src/routes/layout.css`.
