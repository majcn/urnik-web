/** Dnevi, ure in slovenske sklanjatve. */

export const DAY_LABELS = ['Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek'] as const;
const DAY_FULL = ['ponedeljek', 'torek', 'sreda', 'cetrtek', 'petek'] as const;

export const WEEKDAYS = DAY_LABELS.length;

/** "13:15" -> 795 */
export function minutes(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

/** 795 -> "13:15" */
export function clock(total: number): string {
	const h = Math.floor(total / 60);
	return `${String(h).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function deaccent(value: string): string {
	return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Sprejme "pon", "ponedeljek" in vmesne okrajšave, ne pa "ponx". -1, če dneva ne prepozna. */
export function dayIndex(token: string): number {
	const t = deaccent(token).replace(/\.$/, '');
	return t.length >= 3 ? DAY_FULL.findIndex((full) => full.startsWith(t)) : -1;
}

export function slugify(value: string): string {
	const base = deaccent(value)
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return base || 'oseba';
}

/** Slovenska števila: 1 / 2 / 3–4 / 5+ */
type PluralForms = readonly [string, string, string, string];

export function plural(count: number, forms: PluralForms): string {
	const rest = count % 100;
	if (rest === 1) return forms[0];
	if (rest === 2) return forms[1];
	if (rest === 3 || rest === 4) return forms[2];
	return forms[3];
}

export const ACTIVITY_FORMS: PluralForms = ['dejavnost', 'dejavnosti', 'dejavnosti', 'dejavnosti'];
export const PERSON_FORMS: PluralForms = ['oseba', 'osebi', 'osebe', 'oseb'];
