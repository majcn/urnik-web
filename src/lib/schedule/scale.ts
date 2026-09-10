/**
 * Navpična lestvica mreže in razporeditev prekrivajočih se dejavnosti.
 *
 * Mreža privzeto pokriva 07:00–19:00 in se razširi do prve pol ure, če kaj pade
 * izven okna. Filter na strani meji zoži tako, da dejavnosti obreže še prej.
 */
import type { Activity, Person } from './types';
import { minutes } from './time';

/**
 * Privzeto okno dneva — najmanjše, ne pa največje. Meji sta le izhodišče za
 * `buildScale()`, ki ju po potrebi razmakne navzven, nikoli navznoter: dejavnost
 * izven okna ga razširi, dejavnost znotraj njega pa ga ne skrči.
 *
 * Meji ni treba biti polni uri; `6 * 60 + 30` je v redu, ker se oznaka nariše
 * pri `minute % 60 === 0`, pol ure pa dobi le pikčasto črto brez oznake.
 *
 * Širše okno stane gostoto, ne pa strani: `TARGET_HEIGHT` je nespremenjen, zato
 * se pri več urah zmanjša `pixelsPerMinute()`. Pri 07:00–21:00 pade 45-minutni
 * blok na ~37 px in ura pod nazivom še ravno gre zraven (meja je 35 px v
 * ActivityBlock), pri 07:00–21:30 pa je ni več.
 */
const DAY_START = 7 * 60;
const DAY_END = 19 * 60;
/** Korak črtovja in hkrati korak izbir v filtru; vsaka druga črta je polna ura. */
export const STEP = 30;

/**
 * Ciljna višina mreže v pikslih. Na tisku sta glava in legenda skriti, zato je
 * na voljo skoraj cel list.
 *
 * A4 je en list ležeče. A3V je pokončni A3 iz dveh ležečih A4, zloženih po
 * višini — od tod dvojna višina. A3H je ležeči A3 iz dveh pokončnih A4 drug ob
 * drugem — tam je na voljo višina pokončnega lista, širina pa dvojna.
 *
 * Izmerjeno: A4 se izide pri 670 in pade pri 680; A3V ostane na dveh straneh pri
 * 1400 in pade pri 1420; A3H ostane na dveh pri 1020 in pade pri 1030.
 */
export const SHEET = { A4: 665, A3V: 1370, A3H: 990 } as const;
export type Sheet = keyof typeof SHEET;
/** Strop, da urnik z eno samo uro ne zraste v en sam ogromen blok. */
const MAX_PPM = 4;
const MIN_PPM = 0.4;

interface ScaleRow {
	/** Absolutna minuta dneva, na kateri leži črta. */
	minute: number;
	offset: number;
	/** Polna ura dobi polno črto in oznako, pol ure le piko. */
	major: boolean;
}

export interface Scale {
	rows: ScaleRow[];
	total: number;
	/** Minuta dneva -> odmik na lestvici. */
	at: (minute: number) => number;
}

/** Meji sta izhodišče; okno se razširi navzven, kadar kaj pade izven njiju. */
function windowFor(
	activities: Activity[],
	dayStart: number,
	dayEnd: number
): { from: number; to: number } {
	let from = dayStart;
	let to = Math.max(dayEnd, dayStart + 60);
	for (const activity of activities) {
		const leaves = minutes(activity.start) - (activity.lead ?? 0);
		from = Math.min(from, Math.floor(leaves / STEP) * STEP);
		const home = minutes(activity.end) + (activity.back ?? 0);
		to = Math.max(to, Math.ceil(home / STEP) * STEP);
	}
	return { from, to: Math.max(to, from + 60) };
}

/** Okno, kakršno bi mreža imela brez filtra — iz njega so izbire v filtru. */
export const naturalWindow = (activities: Activity[]) => windowFor(activities, DAY_START, DAY_END);

export function buildScale(
	activities: Activity[],
	dayStart: number = DAY_START,
	dayEnd: number = DAY_END
): Scale {
	const { from, to } = windowFor(activities, dayStart, dayEnd);

	const rows: ScaleRow[] = [];
	for (let minute = from; minute <= to; minute += STEP) {
		rows.push({ minute, offset: minute - from, major: minute % 60 === 0 });
	}

	return { rows, total: to - from, at: (minute) => minute - from };
}

export function pixelsPerMinute(total: number, target: number = SHEET.A4): number {
	return Math.max(MIN_PPM, Math.min(MAX_PPM, target / (total || target)));
}

export interface PlacedActivity {
	activity: Activity;
	start: number;
	end: number;
	/** Odrasli iz ozadja se rišejo prvi in čez vso širino. */
	background: boolean;
	/** Stolpec znotraj dneva in koliko stolpcev si delijo prostor. */
	track: number;
	tracks: number;
}

/**
 * Vsaka oseba ima svoj stalni pas čez cel teden, tudi kadar je sosednji prazen —
 * tako je na prvi pogled jasno, čigav je blok, brez preverjanja barve.
 * Skupne dejavnosti gredo čez vse pasove, znotraj pasu pa se prekrivanja
 * razdelijo naprej.
 */
export function packDay(activities: Activity[], people: Person[]): PlacedActivity[] {
	const behind = new Set(people.filter((person) => person.background).map((person) => person.id));
	const lanePeople = people.filter((person) => !person.background);
	const lanes = Math.max(1, lanePeople.length);
	const placed: PlacedActivity[] = [];

	const isBehind = (activity: Activity) => activity.people.every((id) => behind.has(id));
	for (const item of packOverlaps(activities.filter(isBehind))) {
		placed.push({ ...item, background: true });
	}

	const own = activities.filter((activity) => !isBehind(activity));
	placed.push(...packOverlaps(own.filter((activity) => activity.people.length !== 1)));

	lanePeople.forEach((person, lane) => {
		const mine = own.filter(
			(activity) => activity.people.length === 1 && activity.people[0] === person.id
		);
		for (const item of packOverlaps(mine)) {
			// Pas in delitev znotraj pasu zložimo v en ulomek: track / tracks.
			placed.push({
				...item,
				track: lane * item.tracks + item.track,
				tracks: lanes * item.tracks
			});
		}
	});

	return placed;
}

/** Prekrivajoče se dejavnosti postavi eno ob drugo. */
function packOverlaps(activities: Activity[]): PlacedActivity[] {
	const sorted = activities
		.map((activity) => ({
			activity,
			start: minutes(activity.start),
			end: minutes(activity.end),
			track: 0,
			tracks: 1,
			background: false
		}))
		.sort((a, b) => a.start - b.start || b.end - a.end);

	const placed: PlacedActivity[] = [];
	let cluster: PlacedActivity[] = [];
	let ends: number[] = [];

	const flush = () => {
		const tracks = Math.max(1, ...cluster.map((item) => item.track + 1));
		for (const item of cluster) {
			item.tracks = tracks;
			placed.push(item);
		}
		cluster = [];
		ends = [];
	};

	for (const item of sorted) {
		if (cluster.length > 0 && item.start >= Math.max(...ends)) flush();
		const free = ends.findIndex((end) => end <= item.start);
		if (free === -1) {
			item.track = ends.length;
			ends.push(item.end);
		} else {
			item.track = free;
			ends[free] = item.end;
		}
		cluster.push(item);
	}
	if (cluster.length > 0) flush();

	return placed;
}
