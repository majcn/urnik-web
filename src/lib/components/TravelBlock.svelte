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
	class="travel absolute flex items-center overflow-hidden pr-[7px] pl-[10px]"
	class:tja={direction === 'tja'}
	class:nazaj={direction === 'nazaj'}
	style="--c:{color}; --top:{top}; --height:{span}; --track:{track}; --tracks:{tracks}"
	title={direction === 'tja' ? `Odhod ob ${clock(edge)}` : `Doma ob ${clock(edge)}`}
>
	{#if room >= 12}
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
</style>
