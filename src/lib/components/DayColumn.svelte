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
	const colorsOf = (ids: string[]) => ids.map((id) => colors.get(id) ?? FALLBACK_COLOR);
</script>

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

	<!-- Poti gredo v svoj prehod, da dejavnosti vedno pokrijejo črtkane obrise. -->
	{#each items.filter((placed) => placed.activity.lead) as placed (placed.activity.name + placed.start)}
		<TravelBlock
			{placed}
			direction="tja"
			colors={colorsOf(placed.activity.kids)}
			{pixelsPerMinute}
			at={scale.at}
		/>
	{/each}
	{#each items.filter((placed) => placed.activity.back) as placed (placed.activity.name + placed.end)}
		<TravelBlock
			{placed}
			direction="nazaj"
			colors={colorsOf(placed.activity.kids)}
			{pixelsPerMinute}
			at={scale.at}
		/>
	{/each}

	{#each items as placed (placed.activity.name + placed.start + placed.track)}
		<ActivityBlock
			{placed}
			top={scale.at(placed.start)}
			height={placed.end - placed.start}
			colors={colorsOf(placed.activity.kids)}
			{pixelsPerMinute}
		/>
	{/each}
</div>

<style>
	.rule {
		top: calc(var(--top) * var(--ppm) * 1px);
	}
</style>
