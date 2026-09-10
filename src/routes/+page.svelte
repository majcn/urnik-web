<script lang="ts">
	import KidLegend from '$lib/components/KidLegend.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import ScheduleEditor from '$lib/components/ScheduleEditor.svelte';
	import WeekGrid from '$lib/components/WeekGrid.svelte';
	import { buildScale, pixelsPerMinute as ppmFor } from '$lib/schedule/scale';
	import scheduleText from '$lib/data.txt?raw';
	import { parseText } from '$lib/schedule/text';
	import { ACTIVITY_FORMS, CHILD_FORMS, WEEKDAYS, plural } from '$lib/schedule/time';
	import type { Schedule } from '$lib/schedule/types';

	/* Napaka v data.txt ne sme podreti strani — mrežo pustimo prazno in povemo, kaj je narobe. */
	function load(source: string): { schedule: Schedule; error: string } {
		try {
			return { schedule: parseText(source), error: '' };
		} catch (problem) {
			const error = problem instanceof Error ? problem.message : String(problem);
			return { schedule: { kids: [], activities: [] }, error };
		}
	}

	const initial = load(scheduleText);
	let schedule = $state<Schedule>(initial.schedule);
	let loadError = $state(initial.error);
	let text = $state(scheduleText);

	const visible = $derived(
		schedule.activities.filter((activity) => activity.day >= 0 && activity.day < WEEKDAYS)
	);
	const scale = $derived(buildScale(visible));
	const pixelsPerMinute = $derived(ppmFor(scale.total));

	const title = $derived.by(() => {
		const names = schedule.kids.map((kid) => kid.name);
		if (names.length === 0) return 'Tedenski urnik';
		if (names.length === 1) return names[0];
		return `${names.slice(0, -1).join(', ')} in ${names.at(-1)}`;
	});

	const stamp = $derived.by(() => {
		const hidden = schedule.activities.length - visible.length;
		const counts =
			`${visible.length} ${plural(visible.length, ACTIVITY_FORMS)} · ` +
			`${schedule.kids.length} ${plural(schedule.kids.length, CHILD_FORMS)}`;
		return [counts, hidden > 0 ? `${hidden} skritih` : 'pon–pet · A4 ležeče'];
	});

	function onapply(parsed: Schedule) {
		schedule = parsed;
		loadError = '';
	}

	function onreset() {
		const fresh = load(scheduleText);
		schedule = fresh.schedule;
		loadError = fresh.error;
		text = scheduleText;
	}
</script>

<svelte:head><title>Urnik otrok</title></svelte:head>

<div class="mx-auto max-w-[1180px] px-[22px] pt-[26px] pb-12 print:max-w-none print:p-0">
	<Masthead
		{title}
		subtitle="Od ponedeljka do petka — ena barva za vsakega otroka, brez datumov."
		{stamp}
	/>

	{#if loadError}
		<p
			class="my-3 rounded-sm border border-dashed border-danger px-3 py-2 text-block text-danger print:hidden"
		>
			Napaka v <code class="font-mono">data.txt</code> — {loadError}
		</p>
	{/if}

	<KidLegend kids={schedule.kids} onprint={() => window.print()} />

	<WeekGrid kids={schedule.kids} activities={visible} {scale} {pixelsPerMinute} />

	<ScheduleEditor bind:text {onapply} {onreset} />
</div>
