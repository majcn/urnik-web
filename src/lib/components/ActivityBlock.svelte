<script lang="ts">
	import type { PlacedActivity } from '$lib/schedule/scale';
	import { FALLBACK_COLOR, stripe } from '$lib/schedule/palette';

	interface Props {
		placed: PlacedActivity;
		/** Barve vseh oseb, ki jim dejavnost pripada. */
		colors: string[];
		/** Minuta dneva -> odmik na lestvici. */
		at: (minute: number) => number;
		pixelsPerMinute: number;
	}

	let { placed, colors, at, pixelsPerMinute }: Props = $props();

	/*
	 * Izmerjene višine ene vrstice besedila in obrobe z odmiki. Iz njih izračunamo,
	 * kaj gre v blok: najprej naziv, nato ura, nato kraj — in če po tem ostane
	 * višina, dobi naziv še eno vrstico, namesto da bi ga odrezali.
	 */
	const CHROME = 6;
	const LINE_NAME = 16;
	const LINE_META = 12;
	const MAX_NAME_LINES = 3;

	const top = $derived(at(placed.start));
	const height = $derived(placed.end - placed.start);

	const { activity, track, tracks } = $derived(placed);
	const color = $derived(colors[0] ?? FALLBACK_COLOR);
	/** Koliko prostora blok res ima — od tega je odvisno, koliko vrstic gre vanj. */
	const room = $derived(height * pixelsPerMinute);
	/** Blok čez cel stolpec prenese celoten razpon, polovični pa se odreže. */
	const wide = $derived(placed.tracks === 1);

	/*
	 * Kraj v svoji vrstici. Voznik gre v črtkani pas poti, kjer je prostor tako
	 * ali tako prazen — tu bi zasedel vrstico, ki jo potrebuje kraj. Če poti ni,
	 * ostane tu, sicer bi izginil.
	 */
	const travels = $derived(Boolean(activity.lead || activity.back));
	const caption = $derived(
		[activity.where, travels ? '' : activity.driver].filter(Boolean).join(' · ')
	);

	const named = $derived(activity.name !== '');
	const firstLine = $derived(CHROME + (named ? LINE_NAME : 0));
	const showTime = $derived(room >= firstLine + LINE_META);
	const showPlace = $derived(Boolean(caption) && room >= firstLine + 2 * LINE_META);
	/** Preostala višina gre nazivu, da se dolgi prelomijo namesto odrežejo. */
	const nameLines = $derived(
		Math.max(
			1,
			Math.min(
				MAX_NAME_LINES,
				Math.floor(
					(room - CHROME - (showTime ? LINE_META : 0) - (showPlace ? LINE_META : 0)) / LINE_NAME
				)
			)
		)
	);
</script>

<div
	class="placed slot flex flex-col justify-center overflow-hidden rounded-sm py-[2px] pr-[7px] pl-[11px]"
	class:has-lead={activity.lead}
	class:has-back={activity.back}
	class:behind={placed.background}
	style="--c:{color}; --top:{top}; --height:{height}; --track:{track}; --tracks:{tracks}"
>
	<span class="stripe absolute inset-y-0 left-0 w-[5px]" style:background={stripe(colors)}></span>
	{#if named}
		<span class="name text-block leading-[1.15] font-semibold" style="--lines:{nameLines}">
			{activity.name}
		</span>
	{/if}
	{#if showPlace}
		<span class="truncate font-mono text-meta leading-[1.1] text-muted tabular-nums">
			{activity.start}–{activity.end}
		</span>
		<span class="truncate text-note leading-[1.1] text-muted">{caption}</span>
	{:else if showTime}
		<!--
			Za dve vrstici je premalo prostora za oboje, zato gre kraj k uri. V ozkem
			pasu izpustimo še konec — pove ga že višina bloka —, sicer bi se odrezal kraj.
		-->
		<span class="truncate font-mono text-tiny leading-[1.1] text-muted tabular-nums">
			{#if !caption}
				{activity.start}–{activity.end}
			{:else if wide}
				{activity.start}–{activity.end} · {caption}
			{:else}
				{activity.start} · {caption}
			{/if}
		</span>
	{/if}
</div>

<style>
	.name {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: var(--lines);
		line-clamp: var(--lines);
		overflow: hidden;
	}

	/* Barva bloka je barva osebe, zato je tudi to calc ob izrisu, ne utility. */
	.placed {
		/* Reža pod blokom loči zaporedni dejavnosti. */
		height: calc(var(--height) * var(--ppm) * 1px - 3px);
		background: color-mix(in oklab, var(--c) 13%, #fff);
		border: 1px solid color-mix(in oklab, var(--c) 50%, #fff);
		border-left: 0;
	}

	/* Kjer se drži poti, sta bloka en lik: zaokrožitev na tisti strani odpade. */
	.placed.has-lead {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	/* Ozadje: bledo in brez poudarka, da otroci ostanejo prvi na pogled. */
	.placed.behind {
		background: color-mix(in oklab, var(--c) 7%, #fff);
		border-color: color-mix(in oklab, var(--c) 28%, #fff);
	}

	.placed.behind .name {
		font-weight: 500;
		color: var(--color-muted);
	}

	.placed.behind .stripe {
		width: 3px;
		opacity: 0.55;
	}

	.placed.has-back {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
</style>
