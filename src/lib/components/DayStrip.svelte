<script lang="ts">
	/*
	 * Telefonska različica mreže: en dan čez cel zaslon, s prstom med dnevi.
	 * Teden na dlan ne gre — pet stolpcev in pasovi oseb dajo ~60 px na dan —,
	 * zato tu ni lista, ampak zaslon. Tisk vedno vzame WeekGrid, ne tega.
	 *
	 * Listanje je navadno drsenje s prijemom (scroll-snap): brez lovljenja potez,
	 * z zaletom in odbojem, kakršnega telefon že ima.
	 */
	import type { Activity, Person } from '$lib/schedule/types';
	import type { Scale } from '$lib/schedule/scale';
	import { packDay } from '$lib/schedule/scale';
	import { DAY_LABELS, WEEKDAYS } from '$lib/schedule/time';
	import DayColumn from './DayColumn.svelte';
	import TimeGutter from './TimeGutter.svelte';

	interface Props {
		people: Person[];
		/** Že filtrirane in obrezane dejavnosti — iste, kot jih dobi mreža. */
		activities: Activity[];
		scale: Scale;
	}

	let { people, activities, scale }: Props = $props();

	/*
	 * Višina vrstice ni več odvisna od lista: dan je daljši od zaslona in se
	 * prevrti. 1,7 px na minuto da 45-minutni dejavnosti ~76 px — dovolj za naziv,
	 * uro in kraj, kar so na papirju vrstice, ki jih tam pogosto zmanjka.
	 */
	const PPM = 1.7;

	const days = Array.from({ length: WEEKDAYS }, (_, day) => day);
	const colors = $derived(new Map(people.map((person) => [person.id, person.color])));
	const columns = $derived(
		days.map((day) =>
			packDay(
				activities.filter((activity) => activity.day === day),
				people
			)
		)
	);
	const height = $derived(`${scale.total * PPM}px`);

	/** Ob obisku se odpre današnji dan; čez vikend ponedeljek. */
	function today(): number {
		const weekday = new Date().getDay(); // 0 = nedelja
		return weekday >= 1 && weekday <= WEEKDAYS ? weekday - 1 : 0;
	}

	let strip = $state<HTMLDivElement>();
	/*
	 * Začnemo pri ponedeljku in na današnji dan skočimo šele ob pripetju, ker se
	 * stran prednapiše ob gradnji — datum od tam ne pove ničesar o obiskovalcu.
	 */
	let day = $state(0);

	function goto(next: number, smooth = true) {
		if (!strip) return;
		strip.scrollTo({ left: next * strip.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
	}

	/** Med drsenjem je merilo lega traku, ne klik — tako se oznaka ujame s prstom. */
	function onscroll() {
		if (!strip) return;
		const index = Math.round(strip.scrollLeft / strip.clientWidth);
		day = Math.min(days.length - 1, Math.max(0, index));
	}
</script>

<!-- Obrat telefona spremeni širino traku; brez tega bi dan obtičal med stranema. -->
<svelte:window onresize={() => goto(day, false)} />

<div class="mt-1 mb-3">
	<div class="sticky top-0 z-10 -mx-1 flex gap-1 bg-ground/95 px-1 py-2 backdrop-blur-sm">
		{#each days as index (index)}
			<button
				type="button"
				class="flex-1 cursor-pointer rounded-sm border border-rule-strong bg-surface py-2.5
					text-body leading-none font-semibold text-muted focus-visible:outline-2
					focus-visible:outline-offset-[-2px] focus-visible:outline-accent
					aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
				aria-pressed={day === index}
				title={DAY_LABELS[index]}
				onclick={() => goto(index)}
			>
				{DAY_LABELS[index].slice(0, 3)}
			</button>
		{/each}
	</div>

	<div
		{onscroll}
		class="strip flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
		{@attach (node) => {
			strip = node;
			const start = today();
			day = start;
			node.scrollLeft = start * node.clientWidth;
			return () => (strip = undefined);
		}}
	>
		{#each days as index (index)}
			<section class="w-full shrink-0 snap-center" aria-label={DAY_LABELS[index]}>
				<div class="relative rounded-sm border border-rule-strong bg-surface">
					<div
						class="grid"
						style="grid-template-columns: var(--gutter) minmax(0, 1fr)"
						style:height
					>
						<TimeGutter {scale} pixelsPerMinute={PPM} />
						<DayColumn
							items={columns[index]}
							{scale}
							{colors}
							pixelsPerMinute={PPM}
							tinted={false}
						/>
					</div>

					{#if columns[index].length === 0}
						<p class="absolute inset-x-0 top-24 text-center text-lead text-muted">
							{DAY_LABELS[index]} je prost.
						</p>
					{/if}
				</div>
			</section>
		{/each}
	</div>
</div>

<style>
	/* Trak je le nosilec listanja; njegov drsnik bi bil na zaslonu odvečna črta. */
	.strip {
		scrollbar-width: none;
	}

	.strip::-webkit-scrollbar {
		display: none;
	}
</style>
