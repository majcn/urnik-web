<script lang="ts">
	import { parseText } from '$lib/schedule/text';
	import type { Schedule } from '$lib/schedule/types';
	import DetailsPanel from './DetailsPanel.svelte';

	interface Props {
		/** Besedilo urnika; uvoz .ics ga prepiše od zunaj. */
		text: string;
		onapply: (schedule: Schedule) => void;
		onreset: () => void;
	}

	let { text = $bindable(), onapply, onreset }: Props = $props();

	let error = $state('');

	function apply() {
		try {
			onapply(parseText(text));
			error = '';
		} catch (problem) {
			error = `Ni uporabljeno — ${problem instanceof Error ? problem.message : problem}`;
		}
	}

	function reset() {
		error = '';
		onreset();
	}
</script>

{#snippet code(sample: string)}
	<code class="rounded-sm bg-surface-2 px-1 font-mono text-[12.5px]">{sample}</code>
{/snippet}

<DetailsPanel title="Urnik — besedilo">
	{#snippet help()}
		Ena vrstica na dejavnost. Ime otroka z dvopičjem odpre njegov blok, za njim pa vrstice
		{@render code('dan ura-ura naziv')}. Dnevi so {@render code('pon tor sre čet pet')}, en dan na
		vrstico. Neobvezno {@render code('@ kraj')}, {@render code('~15/20')} ali {@render code(
			'~17:15/18:45'
		)} za pot tja/nazaj in
		{@render code('/ kdo pelje')}. Barvo pripišeš v glavo ({@render code('Nejc #C4562F:')}),
		skupno dejavnost pa pod {@render code('Nejc + Zala:')}. Vrstice s
		{@render code('#')} na začetku so opombe.
	{/snippet}

	<textarea
		bind:value={text}
		spellcheck="false"
		class="mt-2.5 h-[280px] w-full resize-y rounded-sm border border-rule-strong bg-surface p-3 font-mono text-[12.5px] leading-relaxed text-ink focus-visible:outline-2 focus-visible:outline-accent"
	></textarea>

	<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
		<button
			type="button"
			onclick={apply}
			class="cursor-pointer rounded-sm border border-ink bg-ink px-[18px] py-[9px] text-[13px] leading-none font-semibold text-white focus-visible:outline-2 focus-visible:outline-accent"
		>
			Uporabi
		</button>
		<button
			type="button"
			onclick={reset}
			class="cursor-pointer rounded-sm border border-ink bg-transparent px-[18px] py-[9px] text-[13px] leading-none font-semibold text-ink focus-visible:outline-2 focus-visible:outline-accent"
		>
			Ponastavi
		</button>
		{#if error}
			<span class="text-[13px] text-danger">{error}</span>
		{/if}
	</div>
</DetailsPanel>
