/**
 * Urnik potuje v naslovu strani, stisnjen z lz-string. Stran je s tem brez
 * strežnika in brez shrambe: povezava je celotno stanje, zaznamek pa arhiv.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export const PARAM = 'u';

/** Vrne urnik iz naslova ali null, kadar ga ni oz. je pokvarjen. */
export function readUrl(url: URL): string | null {
	const packed = url.searchParams.get(PARAM);
	if (!packed) return null;
	const text = decompressFromEncodedURIComponent(packed);
	return text ? text : null;
}

/** Naslov, ki nosi ta urnik; prazen niz pomeni gol naslov brez parametra. */
export function writeUrl(text: string): string {
	return text.trim() === '' ? '?' : `?${PARAM}=${compressToEncodedURIComponent(text)}`;
}
