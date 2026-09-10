/** Barve oseb. Prva je dodeljena prvi osebi, druga drugi in tako naprej. */
const PALETTE = ['#C4562F', '#6A4C93', '#2E7D6E', '#2C6E8F', '#B4762A', '#8E4470'] as const;

export const FALLBACK_COLOR = '#68717D';

export const colorAt = (index: number): string => PALETTE[index % PALETTE.length];

/** Levi rob bloka: ena barva ali vodoravni pasovi, kadar je dejavnost skupna. */
export function stripe(colors: string[]): string {
	if (colors.length <= 1) return colors[0] ?? FALLBACK_COLOR;
	const step = 100 / colors.length;
	const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(',');
	return `linear-gradient(to bottom,${stops})`;
}
