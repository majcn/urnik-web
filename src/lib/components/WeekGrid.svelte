<script lang="ts">
	import type { Activity, Person } from '$lib/schedule/types';
	import type { Scale } from '$lib/schedule/scale';
	import { packDay } from '$lib/schedule/scale';
	import { DAY_LABELS, WEEKDAYS } from '$lib/schedule/time';
	import DayColumn from './DayColumn.svelte';
	import TimeGutter from './TimeGutter.svelte';

	interface Props {
		people: Person[];
		activities: Activity[];
		scale: Scale;
		pixelsPerMinute: number;
	}

	let { people, activities, scale, pixelsPerMinute }: Props = $props();

	const colors = $derived(new Map(people.map((person) => [person.id, person.color])));
	const days = $derived(
		Array.from({ length: WEEKDAYS }, (_, day) =>
			packDay(
				activities.filter((activity) => activity.day === day),
				people
			)
		)
	);
	const height = $derived(`${scale.total * pixelsPerMinute}px`);
</script>

<div class="overflow-x-auto">
	<div class="min-w-[760px] rounded-sm border border-rule-strong bg-surface print:min-w-0">
		<div class="grid grid-cols-[56px_repeat(5,1fr)] border-b border-rule-strong">
			<div></div>
			{#each DAY_LABELS as label (label)}
				<div
					class="border-l border-rule-strong px-[9px] py-2 text-center text-body leading-none font-semibold"
				>
					{label}
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-[56px_repeat(5,1fr)]" style:height>
			<TimeGutter {scale} {pixelsPerMinute} />
			{#each days as items, day (day)}
				<DayColumn {items} {scale} {colors} {pixelsPerMinute} tinted={day % 2 === 1} />
			{/each}
		</div>
	</div>
</div>
