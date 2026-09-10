<script lang="ts">
	import { parseText } from '$lib/schedule/text';
	import type { Schedule } from '$lib/schedule/types';
	import DetailsPanel from './DetailsPanel.svelte';

	interface Props {
		/** Celotna vsebina data.txt, vključno z uvodnimi opombami. */
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

<DetailsPanel title="Urnik — besedilo">
	<textarea
		bind:value={text}
		spellcheck="false"
		class="mt-2.5 h-[280px] w-full resize-y rounded-sm border border-rule-strong bg-surface p-3 font-mono text-body leading-relaxed text-ink focus-visible:outline-2 focus-visible:outline-accent"
	></textarea>

	<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
		<button
			type="button"
			onclick={apply}
			class="cursor-pointer rounded-sm border border-ink bg-ink px-btn-x py-btn-y text-lead leading-none font-semibold text-white focus-visible:outline-2 focus-visible:outline-accent"
		>
			Uporabi
		</button>
		<button
			type="button"
			onclick={reset}
			class="cursor-pointer rounded-sm border border-ink bg-transparent px-btn-x py-btn-y text-lead leading-none font-semibold text-ink focus-visible:outline-2 focus-visible:outline-accent"
		>
			Ponastavi
		</button>
		{#if error}
			<span class="text-lead text-danger">{error}</span>
		{/if}
	</div>
</DetailsPanel>
