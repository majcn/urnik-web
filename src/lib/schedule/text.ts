/**
 * Besedilni zapis urnika — oblika, ki se ureja na roko.
 *
 *   # opomba
 *   Nejc #C4562F:
 *     pon  08:20-09:05  SLJ
 *     sre  08:20-09:05  SLJ
 *     pet  15:00-16:00  Nogomet  @ Igrišče  / oči  ~15/20
 *
 *   Nejc + Zala:
 *     tor  18:00-19:00  Gasilci
 */
import { PALETTE, colorAt } from './palette';
import { DAY_ABBR, dayIndex, deaccent, minutes, slugify } from './time';
import type { Activity, Kid, Schedule } from './types';

const HEADER = /^(.*?)\s*:$/;
const COLOR = /#[0-9a-fA-F]{3,8}/;
const ROW = /^(\S+)\s+(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})\s+(.+)$/;
/** "~15" = pot tja, "~15/20" = tja in nazaj, "~/20" = samo nazaj. */
const TRAVEL = /\s~(\d{1,3})?(?:\/(\d{1,3}))?(?=\s|$)/;
const MAX_REPORTED = 3;

export class ScheduleTextError extends Error {
	readonly problems: string[];

	constructor(problems: string[]) {
		const shown = problems.slice(0, MAX_REPORTED).join('; ');
		const extra = problems.length > MAX_REPORTED ? ` (+${problems.length - MAX_REPORTED})` : '';
		super(shown + extra);
		this.name = 'ScheduleTextError';
		this.problems = problems;
	}
}

/** Odreže neobvezne "~minute poti", "@ kraj" in "/ kdo pelje" z repa vrstice. */
function splitTail(rest: string): {
	name: string;
	where: string;
	driver: string;
	lead: number;
	back: number;
} {
	let body = rest.trim();
	let driver = '';
	let where = '';

	// "~15" sme stati kjerkoli za nazivom, zato ga poberemo prvega.
	let lead = 0;
	let back = 0;
	const travel = body.match(TRAVEL);
	if (travel && (travel[1] || travel[2])) {
		lead = Number(travel[1] ?? 0);
		back = Number(travel[2] ?? 0);
		body = body.replace(TRAVEL, '').trim();
	}

	const byDriver = body.split(' / ');
	if (byDriver.length > 1) {
		driver = byDriver.pop()!.trim();
		body = byDriver.join(' / ');
	}
	const byPlace = body.split(' @ ');
	if (byPlace.length > 1) {
		where = byPlace.pop()!.trim();
		body = byPlace.join(' @ ');
	}
	return { name: body.trim(), where, driver, lead, back };
}

export function parseText(source: string): Schedule {
	const kids: Kid[] = [];
	const activities: Activity[] = [];
	const problems: string[] = [];
	let current: string[] | null = null;

	source.split('\n').forEach((raw, index) => {
		const line = raw.trim();
		if (line === '' || line.startsWith('#')) return;
		const lineNo = index + 1;

		const header = line.match(HEADER);
		if (header) {
			const color = header[1].match(COLOR)?.[0] ?? null;
			const names = header[1]
				.replace(COLOR, '')
				.split('+')
				.map((part) => part.trim())
				.filter(Boolean);

			if (names.length === 0) {
				problems.push(`${lineNo}: prazno ime otroka`);
				return;
			}
			current = names.map((name) => {
				const existing = kids.find((kid) => deaccent(kid.name) === deaccent(name));
				if (existing) {
					if (color) existing.color = color;
					return existing.id;
				}
				const kid: Kid = { id: slugify(name), name, color: color ?? colorAt(kids.length) };
				kids.push(kid);
				return kid.id;
			});
			return;
		}

		const row = line.match(ROW);
		if (!row) {
			problems.push(`${lineNo}: ne razumem — "${line}"`);
			return;
		}
		if (!current) {
			problems.push(`${lineNo}: vrstica pred imenom otroka`);
			return;
		}

		const day = dayIndex(row[1]);
		if (day < 0) {
			problems.push(`${lineNo}: neznan dan — "${row[1]}"`);
			return;
		}

		const { name, where, driver, lead, back } = splitTail(row[6]);
		if (name === '') {
			problems.push(`${lineNo}: manjka naziv dejavnosti`);
			return;
		}

		const start = `${row[2].padStart(2, '0')}:${row[3]}`;
		const end = `${row[4].padStart(2, '0')}:${row[5]}`;
		activities.push({ kids: [...current], name, day, start, end, where, driver, lead, back });
	});

	if (kids.length === 0) {
		problems.push('ni nobenega otroka — vrstica z imenom se konča z dvopičjem');
	}
	if (problems.length > 0) throw new ScheduleTextError(problems);

	activities.sort((a, b) => a.day - b.day || minutes(a.start) - minutes(b.start));
	return { kids, activities };
}

/** Obratna smer: ena vrstica na dejavnost, urejeno po dnevu in uri. */
export function toText(schedule: Schedule): string {
	const byOwner = new Map<string, Activity[]>();
	for (const activity of schedule.activities) {
		const key = activity.kids.join('+');
		const list = byOwner.get(key);
		if (list) list.push(activity);
		else byOwner.set(key, [activity]);
	}

	const shared = [...byOwner.keys()].filter((key) => key.includes('+'));
	const order = [...schedule.kids.map((kid) => kid.id), ...shared];
	const lines: string[] = [];

	for (const key of order) {
		const list = byOwner.get(key);
		if (!list || list.length === 0) continue;

		const owners = key
			.split('+')
			.map(
				(id) => schedule.kids.find((kid) => kid.id === id) ?? { id, name: id, color: PALETTE[0] }
			);
		const color = owners.length === 1 ? ` ${owners[0].color}` : '';
		lines.push(`${owners.map((kid) => kid.name).join(' + ')}${color}:`);

		const rows = [...list].sort((a, b) => a.day - b.day || minutes(a.start) - minutes(b.start));
		for (const activity of rows) {
			let line = `  ${DAY_ABBR[activity.day]}  ${activity.start}-${activity.end}  ${activity.name}`;
			if (activity.where) line += `  @ ${activity.where}`;
			if (activity.driver) line += `  / ${activity.driver}`;
			if (activity.lead || activity.back) {
				line += `  ~${activity.lead || ''}${activity.back ? `/${activity.back}` : ''}`;
			}
			lines.push(line);
		}
		lines.push('');
	}

	return `${lines.join('\n').trimEnd()}\n`;
}
