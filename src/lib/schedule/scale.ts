/**
 * Navpična lestvica mreže in razporeditev prekrivajočih se dejavnosti.
 *
 * Mreža vedno pokriva 07:00–19:00. Če kakšna dejavnost pade izven tega okna,
 * se okno razširi do prve pol ure, da se nič ne izgubi.
 */
import type { Activity } from './types';
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
/** Korak črtovja; vsaka druga črta je polna ura. */
const STEP = 30;

/**
 * Ciljna višina mreže v pikslih: kar ostane od strani A4 ležeče, ko odštejemo rob.
 * Na tisku sta glava in legenda skriti, zato je na voljo skoraj cel list.
 * Izmerjeno: pri 690 se stran še ravno izide, pri 695 pade na dve.
 */
const TARGET_HEIGHT = 685;
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

export function buildScale(activities: Activity[]): Scale {
	let from = DAY_START;
	let to = DAY_END;
	for (const activity of activities) {
		const leaves = minutes(activity.start) - (activity.lead ?? 0);
		from = Math.min(from, Math.floor(leaves / STEP) * STEP);
		const home = minutes(activity.end) + (activity.back ?? 0);
		to = Math.max(to, Math.ceil(home / STEP) * STEP);
	}

	const rows: ScaleRow[] = [];
	for (let minute = from; minute <= to; minute += STEP) {
		rows.push({ minute, offset: minute - from, major: minute % 60 === 0 });
	}

	return { rows, total: to - from, at: (minute) => minute - from };
}

export function pixelsPerMinute(total: number): number {
	return Math.max(MIN_PPM, Math.min(MAX_PPM, TARGET_HEIGHT / (total || TARGET_HEIGHT)));
}

export interface PlacedActivity {
	activity: Activity;
	start: number;
	end: number;
	/** Stolpec znotraj dneva in koliko stolpcev si delijo prostor. */
	track: number;
	tracks: number;
}

/** Prekrivajoče se dejavnosti postavi eno ob drugo znotraj enega dneva. */
export function packDay(activities: Activity[]): PlacedActivity[] {
	const sorted = activities
		.map((activity) => ({
			activity,
			start: minutes(activity.start),
			end: minutes(activity.end),
			track: 0,
			tracks: 1
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
