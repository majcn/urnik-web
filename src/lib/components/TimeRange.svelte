<script lang="ts">
	import { STEP } from '$lib/schedule/scale';
	import { clock } from '$lib/schedule/time';

	interface Props {
		/** Uri "HH:MM"; prazno pomeni brez omejitve na tisti strani. */
		from: string;
		to: string;
		/** Okno, ki bi ga mreža imela brez filtra — iz njega so izbire. */
		bounds: { from: number; to: number };
	}

	let { from = $bindable(), to = $bindable(), bounds }: Props = $props();

	/* Izbire so iste pol ure kot črtovje, zato ni mogoče izbrati ure vmes. */
	const slots = $derived(
		Array.from({ length: Math.floor((bounds.to - bounds.from) / STEP) + 1 }, (_, i) =>
			clock(bounds.from + i * STEP)
		)
	);
	const laterThanFrom = $derived(slots.filter((slot) => from === '' || slot > from));

	const field =
		'cursor-pointer rounded-sm border border-rule-strong bg-surface py-[7px] pr-7 pl-[9px] ' +
		'font-mono text-lead leading-none font-medium text-ink focus-visible:outline-2 ' +
		'focus-visible:outline-accent';
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-2 pb-3.5 print:hidden">
	<span class="label-caps">Prikaži</span>

	<label class="flex items-center gap-2">
		<span class="text-body text-muted">od</span>
		<select
			class={field}
			value={from}
			onchange={(event) => {
				from = event.currentTarget.value;
				if (to !== '' && to <= from) to = ''; // konec pred začetkom nima smisla
			}}
		>
			<option value="">začetka</option>
			{#each slots as slot (slot)}
				<option value={slot}>{slot}</option>
			{/each}
		</select>
	</label>

	<label class="flex items-center gap-2">
		<span class="text-body text-muted">do</span>
		<select class={field} bind:value={to}>
			<option value="">konca</option>
			{#each laterThanFrom as slot (slot)}
				<option value={slot}>{slot}</option>
			{/each}
		</select>
	</label>

	{#if from !== '' || to !== ''}
		<button
			type="button"
			class="cursor-pointer text-body text-muted underline underline-offset-2
				focus-visible:outline-2 focus-visible:outline-accent"
			onclick={() => {
				from = '';
				to = '';
			}}
		>
			ves dan
		</button>
	{/if}
</div>
