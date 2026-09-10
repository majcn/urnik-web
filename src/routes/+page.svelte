<script lang="ts">
	import Masthead from '$lib/components/Masthead.svelte';
	import TimeRange from '$lib/components/TimeRange.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import ScheduleEditor from '$lib/components/ScheduleEditor.svelte';
	import WeekGrid from '$lib/components/WeekGrid.svelte';
	import {
		buildScale,
		naturalWindow,
		pixelsPerMinute as ppmFor,
		SHEET,
		type Sheet
	} from '$lib/schedule/scale';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import example from '$lib/data.example.txt?raw';
	import { readUrl, writeUrl } from '$lib/schedule/url';
	import { parseText, setPersonColor } from '$lib/schedule/text';
	import {
		ACTIVITY_FORMS,
		PERSON_FORMS,
		WEEKDAYS,
		clock,
		minutes,
		plural
	} from '$lib/schedule/time';
	import type { Activity, Schedule } from '$lib/schedule/types';

	/* Napaka v urniku ne sme podreti strani — mrežo pustimo prazno in povemo, kaj je narobe. */
	function load(source: string): { schedule: Schedule; error: string } {
		try {
			return { schedule: parseText(source), error: '' };
		} catch (problem) {
			const error = problem instanceof Error ? problem.message : String(problem);
			return { schedule: { people: [], activities: [] }, error };
		}
	}

	/* Urnik pride iz naslova; brez njega pokažemo vzorec, da stran ni prazna. */
	const initialText = readUrl(page.url) ?? example;
	const initial = load(initialText);
	let schedule = $state<Schedule>(initial.schedule);
	let loadError = $state(initial.error);
	let text = $state(initialText);
	/** Uri, med katerima nas list zanima; prazno pomeni brez omejitve. */
	let showFrom = $state('');
	let showTo = $state('');
	/** A3 je isti list, le dvakrat višji — natisne se na dva A4 in zlepi. */
	let sheet = $state<Sheet>('A4');
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
	const pixelsPerMinute = $derived(ppmFor(scale.total, SHEET[sheet]));

	const stamp = $derived.by(() => {
		const omitted = schedule.activities.length - visible.length;
		const counts =
			`${visible.length} ${plural(visible.length, ACTIVITY_FORMS)} · ` +
			`${people.length} ${plural(people.length, PERSON_FORMS)}`;
		const paper =
			sheet === 'A4' ? 'A4 ležeče' : `${sheet === 'A3V' ? 'A3 pokončno' : 'A3 ležeče'} · dva lista`;
		return [counts, omitted > 0 ? `${omitted} zunaj izbora · ${paper}` : `pon–pet · ${paper}`];
	});

	/** Naslov je edino stanje, zato ga posodobimo šele, ko se urnik razčleni. */
	function apply(next: string) {
		const fresh = load(next);
		if (fresh.error !== '') {
			loadError = fresh.error;
			return;
		}
		text = next;
		schedule = fresh.schedule;
		loadError = '';
		if (browser) replaceState(writeUrl(next === example ? '' : next), {});
	}

	function onapply() {
		apply(text);
	}

	/** Barva se zapiše nazaj v besedilo, ker je to vir, iz katerega gre v naslov. */
	function onrecolor(id: string, color: string) {
		const person = schedule.people.find((candidate) => candidate.id === id);
		if (!person) return;
		apply(setPersonColor(text, person.name, color));
	}

	function onreset() {
		const fresh = load(example);
		schedule = fresh.schedule;
		loadError = fresh.error;
		hidden = [];
		text = example;
		if (browser) replaceState(writeUrl(''), {});
	}
</script>

<svelte:head><title>Urnik</title></svelte:head>

<div
	class="mx-auto max-w-[1180px] px-[22px] pt-[26px] pb-12 print:max-w-none print:p-0"
	class:sheet-a3v={sheet === 'A3V'}
	class:sheet-a3h={sheet === 'A3H'}
>
	<Masthead {stamp} />

	{#if loadError}
		<p
			class="my-3 rounded-sm border border-dashed border-danger px-3 py-2 text-block text-danger print:hidden"
		>
			Napaka v urniku — {loadError}
		</p>
	{/if}

	<TopBar
		people={schedule.people}
		{hidden}
		bind:sheet
		ontoggle={(id) =>
			(hidden = hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id])}
		{onrecolor}
		onprint={() => window.print()}
	/>
	<TimeRange bind:from={showFrom} bind:to={showTo} {bounds} />

	{#if sheet === 'A3H'}
		<!-- Levi list nosi uro in pon–sre, desni čet–pet in prostor za zapiske. -->
		<div class="left-sheet">
			<WeekGrid {people} activities={visible} {scale} {pixelsPerMinute} days={[0, 1, 2]} />
		</div>
		<div class="mt-4 print:mt-0">
			<WeekGrid
				{people}
				activities={visible}
				{scale}
				{pixelsPerMinute}
				days={[3, 4]}
				gutter={false}
				notes
			/>
		</div>
	{:else}
		<WeekGrid {people} activities={visible} {scale} {pixelsPerMinute} days={[0, 1, 2, 3, 4]} />
	{/if}

	<ScheduleEditor bind:text {onapply} {onreset} />
</div>
