<script lang="ts">
	import type { PlacedActivity, Scale } from '$lib/schedule/scale';
	import { FALLBACK_COLOR } from '$lib/schedule/palette';
	import ActivityBlock from './ActivityBlock.svelte';
	import TravelBlock from './TravelBlock.svelte';

	interface Props {
		items: PlacedActivity[];
		scale: Scale;
		colors: Map<string, string>;
		pixelsPerMinute: number;
		/** Vsak drugi dan dobi rahel podliv, da se stolpci ločijo. */
		tinted: boolean;
	}

	let { items, scale, colors, pixelsPerMinute, tinted }: Props = $props();

	/** Robova mreže že narišeta okvir in glava, zato ju preskočimo. */
	const inner = $derived(scale.rows.filter((row) => row.offset > 0 && row.offset < scale.total));
	const behind = $derived(items.filter((placed) => placed.background));
	const front = $derived(items.filter((placed) => !placed.background));

	const colorsOf = (ids: string[]) => ids.map((id) => colors.get(id) ?? FALLBACK_COLOR);
	/** Ime in ura se ponovita pri dveh osebah hkrati, pas pa je enkraten. */
	const key = (placed: PlacedActivity) =>
		`${placed.activity.name}|${placed.start}|${placed.track}/${placed.tracks}`;
</script>

{#snippet blocks(list: PlacedActivity[])}
	<!-- Poti gredo v svoj prehod, da dejavnosti vedno pokrijejo črtkane obrise. -->
	{#each list as placed (key(placed))}
		{#if placed.activity.lead}
			<TravelBlock
				{placed}
				direction="tja"
				colors={colorsOf(placed.activity.people)}
				at={scale.at}
				{pixelsPerMinute}
			/>
		{/if}
		{#if placed.activity.back}
			<TravelBlock
				{placed}
				direction="nazaj"
				colors={colorsOf(placed.activity.people)}
				at={scale.at}
				{pixelsPerMinute}
			/>
		{/if}
	{/each}
	{#each list as placed (key(placed))}
		<ActivityBlock
			{placed}
			colors={colorsOf(placed.activity.people)}
			at={scale.at}
			{pixelsPerMinute}
		/>
	{/each}
{/snippet}

<div
	class="relative border-l border-rule-strong"
	class:bg-tinted={tinted}
	style="--ppm:{pixelsPerMinute}"
>
	{#each inner as row (row.minute)}
		<div
			class="rule absolute inset-x-0 border-t"
			class:border-rule-strong={row.major}
			class:border-rule={!row.major}
			class:border-dotted={!row.major}
			style="--top:{row.offset}"
		></div>
	{/each}

	<!--
		Vrstni red risanja je hkrati globina: najprej odrasli iz ozadja, nato ostali.
		Tako oseba nikoli ne izgine pod blokom, ki je na listu le za vednost.
	-->
	{@render blocks(behind)}
	{@render blocks(front)}
</div>

<style>
	.rule {
		top: calc(var(--top) * var(--ppm) * 1px);
	}
</style>
