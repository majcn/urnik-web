<script lang="ts">
	import KidLegend from '$lib/components/KidLegend.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import NotesPanel from '$lib/components/NotesPanel.svelte';
	import ScheduleEditor from '$lib/components/ScheduleEditor.svelte';
	import WeekGrid from '$lib/components/WeekGrid.svelte';
	import { buildScale, pixelsPerMinute as ppmFor } from '$lib/schedule/scale';
	import scheduleText from '$lib/data.txt?raw';
	import { parseText } from '$lib/schedule/text';
	import { ACTIVITY_FORMS, CHILD_FORMS, WEEKDAYS, plural } from '$lib/schedule/time';
	import type { Schedule } from '$lib/schedule/types';

	/** Črtovje pod mrežo je tu, da zapolni kratek list; gost teden ga zapolni sam. */
	const NOTES_THRESHOLD = 430;

	let schedule = $state<Schedule>(parseText(scheduleText));
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
	}

	function onreset() {
		schedule = parseText(scheduleText);
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

	<KidLegend kids={schedule.kids} onprint={() => window.print()} />

	<WeekGrid kids={schedule.kids} activities={visible} {scale} {pixelsPerMinute} />

	{#if scale.total * pixelsPerMinute <= NOTES_THRESHOLD}
		<NotesPanel />
	{/if}

	<ScheduleEditor bind:text {onapply} {onreset} />
</div>
