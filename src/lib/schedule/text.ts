/**
 * Besedilni zapis urnika — oblika, ki se ureja na roko.
 *
 *   # opomba
 *   Nejc #C4562F:
 *     pon  08:20-09:05  SLJ
 *     sre  08:20-09:05  SLJ
 *     sre  17:45-18:30  Orkester  @ Tržič  ~17:15/18:45
 *
 *   Nejc + Zala:
 *     tor  18:00-19:00  Gasilci
 */
import { colorAt } from './palette';
import { clock, dayIndex, deaccent, minutes, slugify } from './time';
import type { Activity, Kid, Schedule } from './types';

const HEADER = /^(.*?)\s*:$/;
const COLOR = /#[0-9a-fA-F]{3,8}/;
const ROW = /^(\S+)\s+(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})\s+(.+)$/;
/**
 * Pot za "~": ura odhoda, poševnica, ura prihoda domov. Ena stran sme
 * manjkati: "~17:15", "~/18:45", "~17:15/18:45". Razlika do začetka oz. konca
 * pokrije pot in morebitno čakanje, zato se ni treba nič računati.
 */
const TRAVEL = /\s~(\S+)(?=\s|$)/;
const MAX_REPORTED = 3;

/** Napake naštejemo v eno sporočilo; urejevalnik jih pokaže z njihovo vrstico. */
function reportProblems(problems: string[]): never {
	const shown = problems.slice(0, MAX_REPORTED).join('; ');
	const extra = problems.length > MAX_REPORTED ? ` (+${problems.length - MAX_REPORTED})` : '';
	throw new Error(shown + extra);
}

/** Odreže neobvezne "~minute poti", "@ kraj" in "/ kdo pelje" z repa vrstice. */
function splitTail(rest: string): {
	name: string;
	where: string;
	driver: string;
	travel: string;
} {
	let body = rest.trim();
	let driver = '';
	let where = '';

	// "~..." sme stati kjerkoli za nazivom, zato ga poberemo prvega.
	let travel = '';
	const marked = body.match(TRAVEL);
	if (marked) {
		travel = marked[1];
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
	return { name: body.trim(), where, driver, travel };
}

type TravelPart = { span: number } | { problem: string };

/**
 * Ena stran zapisa "~" v minute razlike do sidra (začetka oz. konca dejavnosti).
 * Ob napaki pove, kaj je narobe — ura na napačni strani je skoraj vedno vrstica,
 * prepisana z drugega dne.
 */
function travelPart(part: string, anchor: number, side: 'pred' | 'po'): TravelPart {
	if (part === '') return { span: 0 };
	const stamp = part.match(/^(\d{1,2})[:.](\d{2})$/);
	if (!stamp) return { problem: `"${part}" ni ura v obliki 17:15` };

	const at = Number(stamp[1]) * 60 + Number(stamp[2]);
	const span = side === 'pred' ? anchor - at : at - anchor;
	if (span <= 0) {
		return {
			problem:
				side === 'pred'
					? `odhod ${part} ni pred začetkom ${clock(anchor)}`
					: `prihod ${part} ni po koncu ${clock(anchor)}`
		};
	}
	return { span };
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

		const { name, where, driver, travel } = splitTail(row[6]);
		if (name === '') {
			problems.push(`${lineNo}: manjka naziv dejavnosti`);
			return;
		}

		const start = `${row[2].padStart(2, '0')}:${row[3]}`;
		const end = `${row[4].padStart(2, '0')}:${row[5]}`;

		const [there = '', home = ''] = travel.split('/');
		const lead = travelPart(there, minutes(start), 'pred');
		const back = travelPart(home, minutes(end), 'po');
		if ('problem' in lead || 'problem' in back) {
			const why = 'problem' in lead ? lead.problem : (back as { problem: string }).problem;
			problems.push(`${lineNo}: pot "~${travel}" — ${why}`);
			return;
		}

		activities.push({
			kids: [...current],
			name,
			day,
			start,
			end,
			where,
			driver,
			lead: lead.span,
			back: back.span
		});
	});

	if (kids.length === 0) {
		problems.push('ni nobenega otroka — vrstica z imenom se konča z dvopičjem');
	}
	if (problems.length > 0) reportProblems(problems);

	activities.sort((a, b) => a.day - b.day || minutes(a.start) - minutes(b.start));
	return { kids, activities };
}
