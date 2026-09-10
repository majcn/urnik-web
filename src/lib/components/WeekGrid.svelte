<script lang="ts">
	import type { Activity, Person } from '$lib/schedule/types';
	import type { Scale } from '$lib/schedule/scale';
	import { packDay } from '$lib/schedule/scale';
	import { DAY_LABELS } from '$lib/schedule/time';
	import DayColumn from './DayColumn.svelte';
	import NotesColumn from './NotesColumn.svelte';
	import TimeGutter from './TimeGutter.svelte';

	interface Props {
		people: Person[];
		activities: Activity[];
		scale: Scale;
		pixelsPerMinute: number;
		/** Indeksi dni v tej mreži — pri A3 je teden razrezan na dva lista. */
		days: number[];
		/** Uro nosi le levi list, sicer bi bila po lepljenju na sredini. */
		gutter?: boolean;
		/** Prostor za ročne zapiske; smiseln tam, kjer dnevi ne zapolnijo lista. */
		notes?: boolean;
	}

	let {
		people,
		activities,
		scale,
		pixelsPerMinute,
		days,
		gutter = true,
		notes = false
	}: Props = $props();

	const colors = $derived(new Map(people.map((person) => [person.id, person.color])));
	const columns = $derived(
		days.map((day) =>
			packDay(
				activities.filter((activity) => activity.day === day),
				people
			)
		)
	);
	const height = $derived(`${scale.total * pixelsPerMinute}px`);
	/*
	 * Širini stolpca in ure sta spremenljivki: na zaslonu se raztegneta, na
	 * tisku pa sta v milimetrih, da se lista po lepljenju ujameta.
	 */
	const template = $derived(
		[
			gutter ? 'var(--gutter)' : '',
			`repeat(${days.length}, var(--day))`,
			notes ? 'var(--notes)' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class="sheet overflow-x-auto">
	<div class="rounded-sm border border-rule-strong bg-surface print:min-w-0">
		<div class="grid border-b border-rule-strong" style="grid-template-columns: {template}">
			{#if gutter}
				<div></div>
			{/if}
			{#each days as day (day)}
				<div
					class="border-l border-rule-strong px-[9px] py-2 text-center text-body leading-none font-semibold"
				>
					{DAY_LABELS[day]}
				</div>
			{/each}
			{#if notes}
				<div
					class="border-l border-rule-strong px-[9px] py-2 text-center text-body leading-none font-semibold text-muted"
				>
					Opombe
				</div>
			{/if}
		</div>

		<div class="grid" style="grid-template-columns: {template}" style:height>
			{#if gutter}
				<TimeGutter {scale} {pixelsPerMinute} />
			{/if}
			{#each columns as items, index (days[index])}
				<DayColumn {items} {scale} {colors} {pixelsPerMinute} tinted={days[index] % 2 === 1} />
			{/each}
			{#if notes}
				<NotesColumn />
			{/if}
		</div>
	</div>
</div>
