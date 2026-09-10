<script lang="ts">
	import type { PlacedActivity } from '$lib/schedule/scale';
	import { FALLBACK_COLOR, stripe } from '$lib/schedule/palette';

	interface Props {
		placed: PlacedActivity;
		/** Odmik in višina na lestvici, v minutah lestvice. */
		top: number;
		height: number;
		/** Barve vseh otrok, ki jim dejavnost pripada. */
		colors: string[];
		pixelsPerMinute: number;
	}

	let { placed, top, height, colors, pixelsPerMinute }: Props = $props();

	const { activity, track, tracks } = $derived(placed);
	const color = $derived(colors[0] ?? FALLBACK_COLOR);
	/** Koliko prostora blok res ima — od tega je odvisno, koliko vrstic gre vanj. */
	const room = $derived(height * pixelsPerMinute);
	/* Kolikšno višino porabi posamezna vrstica besedila, vključno z obrobo in odmiki. */
	const NAME_ROW = 22;
	const TEXT_ROW = 13;
	/*
	 * Ura in kraj gresta v isto vrstico. Zložena drug pod drugega bi skupaj z
	 * nazivom zahtevala 48 px, 45-minutna ura pa jih ima pri polnem listu ~43 —
	 * kraj bi tako izpadel prav pri najpogostejšem bloku.
	 */
	const meta = $derived(
		[`${activity.start}–${activity.end}`, activity.where, activity.driver]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<div
	class="placed absolute flex flex-col justify-center overflow-hidden rounded-sm py-[2px] pr-[7px] pl-[11px]"
	class:has-lead={activity.lead}
	class:has-back={activity.back}
	style="--c:{color}; --top:{top}; --height:{height}; --track:{track}; --tracks:{tracks}"
>
	<span class="stripe absolute inset-y-0 left-0 w-[5px]" style:background={stripe(colors)}></span>
	<span class="truncate text-[13.5px] leading-[1.15] font-semibold">{activity.name}</span>
	{#if room >= NAME_ROW + TEXT_ROW}
		<span class="truncate font-mono text-[10.5px] leading-[1.1] text-muted tabular-nums">
			{meta}
		</span>
	{/if}
</div>

<style>
	/* Lega in velikost sta izračunani iz lestvice, zato ju Tailwind ne more izraziti. */
	.placed {
		top: calc(var(--top) * var(--ppm) * 1px);
		height: calc(var(--height) * var(--ppm) * 1px - 3px);
		left: calc(var(--track) / var(--tracks) * 100% + 2px);
		width: calc(100% / var(--tracks) - 4px);
		background: color-mix(in oklab, var(--c) 13%, #fff);
		border: 1px solid color-mix(in oklab, var(--c) 50%, #fff);
		border-left: 0;
	}

	/* Kjer se drži poti, sta bloka en lik: zaokrožitev na tisti strani odpade. */
	.placed.has-lead {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	.placed.has-back {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
</style>
