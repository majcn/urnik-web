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
	class="travel slot flex items-center overflow-hidden pr-[7px] pl-[10px]"
	class:tja={direction === 'tja'}
	class:nazaj={direction === 'nazaj'}
	class:behind={placed.background}
	style="--c:{color}; --top:{top}; --height:{span}; --track:{track}; --tracks:{tracks}"
	title={direction === 'tja' ? `Odhod ob ${clock(edge)}` : `Doma ob ${clock(edge)}`}
>
	{#if room >= 12}
		<span class="truncate font-mono text-tiny leading-none font-medium">{clock(edge)}</span>
	{/if}
</div>

<style>
	/*
	 * Pot: le črtkan obris brez polnila. Za razliko od dejavnosti brez reže in
	 * brez roba na njeni strani, da sta bloka videti kot en lik.
	 */
	.travel {
		border: 1px dashed color-mix(in oklab, var(--c) 60%, #fff);
		color: color-mix(in oklab, var(--c) 80%, #fff);
		background: none;
	}

	.behind {
		border-color: color-mix(in oklab, var(--c) 32%, #fff);
		color: var(--color-muted);
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
