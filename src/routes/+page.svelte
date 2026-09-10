<script lang="ts">
	import PersonLegend from '$lib/components/PersonLegend.svelte';
	import Masthead from '$lib/components/Masthead.svelte';
	import TimeRange from '$lib/components/TimeRange.svelte';
	import ScheduleEditor from '$lib/components/ScheduleEditor.svelte';
	import WeekGrid from '$lib/components/WeekGrid.svelte';
	import { buildScale, naturalWindow, pixelsPerMinute as ppmFor } from '$lib/schedule/scale';
	import scheduleText from '$lib/data.txt?raw';
	import { parseText } from '$lib/schedule/text';
	import {
		ACTIVITY_FORMS,
		PERSON_FORMS,
		WEEKDAYS,
		clock,
		minutes,
		plural
	} from '$lib/schedule/time';
	import type { Activity, Schedule } from '$lib/schedule/types';

	/* Napaka v data.txt ne sme podreti strani — mrežo pustimo prazno in povemo, kaj je narobe. */
	function load(source: string): { schedule: Schedule; error: string } {
		try {
			return { schedule: parseText(source), error: '' };
		} catch (problem) {
			const error = problem instanceof Error ? problem.message : String(problem);
			return { schedule: { people: [], activities: [] }, error };
		}
	}

	const initial = load(scheduleText);
	let schedule = $state<Schedule>(initial.schedule);
	let loadError = $state(initial.error);
	let text = $state(scheduleText);
	/** Uri, med katerima nas list zanima; prazno pomeni brez omejitve. */
	let showFrom = $state('');
	let showTo = $state('');
	/** Osebe, ki so odklikane v legendi — z lista izginejo skupaj s svojim pasom. */
	let hidden = $state<string[]>([]);

	const people = $derived(schedule.people.filter((person) => !hidden.includes(person.id)));
	const shows = (id: string) => !hidden.includes(id);

	const from = $derived(showFrom === '' ? -1 : minutes(showFrom));
	const to = $derived(showTo === '' ? -1 : minutes(showTo));

	/* Dejavnost čez mejo obdržimo, a ji odrežemo tisto, kar gleda ven — tudi pot. */
	function clip(activity: Activity): Activity {
		let start = minutes(activity.start);
		let end = minutes(activity.end);
		let lead = activity.lead ?? 0;
		let back = activity.back ?? 0;

		if (from >= 0) {
			if (start < from) {
				start = from;
				lead = 0;
			} else {
				lead = Math.min(lead, start - from);
			}
		}
		if (to >= 0) {
			if (end > to) {
				end = to;
				back = 0;
			} else {
				back = Math.min(back, to - end);
			}
		}
		return { ...activity, start: clock(start), end: clock(end), lead, back };
	}

	/* Izbire v filtru so iz nefiltriranega okna, da se ne krčijo same vase. */
	const inWeek = $derived(
		schedule.activities
			.filter((activity) => activity.day >= 0 && activity.day < WEEKDAYS)
			.filter((activity) => activity.people.some(shows))
	);
	const bounds = $derived(naturalWindow(inWeek));

	const visible = $derived(
		inWeek
			.map((activity) => ({ ...activity, people: activity.people.filter(shows) }))
			.filter((activity) => from < 0 || minutes(activity.end) > from)
			.filter((activity) => to < 0 || minutes(activity.start) < to)
			.map(clip)
	);
	const scale = $derived(buildScale(visible, from < 0 ? undefined : from, to < 0 ? undefined : to));
	const pixelsPerMinute = $derived(ppmFor(scale.total));

	const stamp = $derived.by(() => {
		const omitted = schedule.activities.length - visible.length;
		const counts =
			`${visible.length} ${plural(visible.length, ACTIVITY_FORMS)} · ` +
			`${people.length} ${plural(people.length, PERSON_FORMS)}`;
		return [counts, omitted > 0 ? `${omitted} zunaj izbora` : 'pon–pet · A4 ležeče'];
	});

	function onapply(parsed: Schedule) {
		schedule = parsed;
		hidden = [];
		loadError = '';
	}

	function onreset() {
		const fresh = load(scheduleText);
		schedule = fresh.schedule;
		loadError = fresh.error;
		hidden = [];
		text = scheduleText;
	}
</script>

<svelte:head><title>Urnik</title></svelte:head>

<div class="mx-auto max-w-[1180px] px-[22px] pt-[26px] pb-12 print:max-w-none print:p-0">
	<Masthead {stamp} />

	{#if loadError}
		<p
			class="my-3 rounded-sm border border-dashed border-danger px-3 py-2 text-block text-danger print:hidden"
		>
			Napaka v <code class="font-mono">data.txt</code> — {loadError}
		</p>
	{/if}

	<PersonLegend
		people={schedule.people}
		{hidden}
		ontoggle={(id) =>
			(hidden = hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id])}
		onprint={() => window.print()}
	/>
	<TimeRange bind:from={showFrom} bind:to={showTo} {bounds} />

	<WeekGrid {people} activities={visible} {scale} {pixelsPerMinute} />

	<ScheduleEditor bind:text {onapply} {onreset} />
</div>
