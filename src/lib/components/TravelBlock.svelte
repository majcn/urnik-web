<script lang="ts">
	import type { PlacedActivity } from '$lib/schedule/scale';
	import { FALLBACK_COLOR } from '$lib/schedule/palette';
	import { clock } from '$lib/schedule/time';

	interface Props {
		placed: PlacedActivity;
		/** "tja" stoji nad dejavnostjo, "nazaj" pod njo. */
		direction: 'tja' | 'nazaj';
		colors: string[];
		pixelsPerMinute: number;
		/** Minuta dneva -> odmik na lestvici. */
		at: (minute: number) => number;
	}

	let { placed, direction, colors, pixelsPerMinute, at }: Props = $props();

	const { activity, track, tracks } = $derived(placed);
	const color = $derived(colors[0] ?? FALLBACK_COLOR);
	const span = $derived(direction === 'tja' ? (activity.lead ?? 0) : (activity.back ?? 0));
	/** Tja: kdaj oditi. Nazaj: kdaj smo doma. Oba kažeta uro na drugem koncu poti. */
	const edge = $derived(direction === 'tja' ? placed.start - span : placed.end + span);
	const top = $derived(direction === 'tja' ? at(placed.start - span) : at(placed.end));
	const room = $derived(span * pixelsPerMinute);
</script>

<div
	class="travel absolute flex items-center gap-[3px] overflow-hidden pr-[7px] pl-[9px]"
	class:tja={direction === 'tja'}
	class:nazaj={direction === 'nazaj'}
	style="--c:{color}; --top:{top}; --height:{span}; --track:{track}; --tracks:{tracks}"
	title={direction === 'tja' ? `Odhod ob ${clock(edge)}` : `Doma ob ${clock(edge)}`}
>
	{#if room >= 12}
		<svg viewBox="0 0 16 10" class="icon" aria-hidden="true">
			<!-- avto: streha, karoserija in dve kolesi -->
			<path
				d="M2.4 6.2 L3.4 3.6 Q3.6 3 4.3 3 H9.4 Q10 3 10.4 3.5 L12 5.6 H13.2 Q14 5.6 14 6.4 V7 H2 V6.8 Q2 6.2 2.4 6.2 Z"
				fill="currentColor"
			/>
			<circle cx="5" cy="7.4" r="1.3" fill="currentColor" />
			<circle cx="11.4" cy="7.4" r="1.3" fill="currentColor" />
		</svg>
		<span class="truncate font-mono text-[9.5px] leading-none font-medium">{clock(edge)}</span>
	{/if}
</div>

<style>
	/*
	 * Pot: isti stolpec in širina kot dejavnost, a le črtkan obris brez polnila.
	 * Brez skrčka in brez roba na strani dejavnosti, da sta bloka videti kot en lik.
	 */
	.travel {
		position: absolute;
		top: calc(var(--top) * var(--ppm) * 1px);
		height: calc(var(--height) * var(--ppm) * 1px);
		left: calc(var(--track) / var(--tracks) * 100% + 2px);
		width: calc(100% / var(--tracks) - 4px);
		border: 1px dashed color-mix(in oklab, var(--c) 60%, #fff);
		color: color-mix(in oklab, var(--c) 80%, #fff);
		background: none;
	}

	.tja {
		border-bottom: 0;
		border-radius: 2px 2px 0 0;
	}

	.nazaj {
		border-top: 0;
		border-radius: 0 0 2px 2px;
	}

	.icon {
		width: 13px;
		height: 8px;
		flex: none;
	}

	/* Nazaj grede avto pelje v drugo smer. */
	.nazaj .icon {
		transform: scaleX(-1);
	}
</style>
