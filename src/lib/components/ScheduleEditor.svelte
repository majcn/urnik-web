<script lang="ts">
	import DetailsPanel from './DetailsPanel.svelte';

	interface Props {
		/** Celoten urnik, vključno z uvodnimi opombami; iz naslova ali iz vzorca. */
		text: string;
		/** Razčlenjevanje in sporočanje napake je na strani — tu bi bilo podvojeno. */
		onapply: () => void;
		onreset: () => void;
	}

	let { text = $bindable(), onapply, onreset }: Props = $props();

	const button =
		'cursor-pointer rounded-sm border border-ink px-btn-x py-btn-y text-lead leading-none ' +
		'font-semibold focus-visible:outline-2 focus-visible:outline-accent';
</script>

<DetailsPanel title="Uredi urnik">
	<textarea
		bind:value={text}
		spellcheck="false"
		class="mt-2.5 h-[280px] w-full resize-y rounded-sm border border-rule-strong
			bg-surface p-3 font-mono text-body leading-relaxed text-ink focus-visible:outline-2 focus-visible:outline-accent"
	></textarea>

	<div class="mt-2.5 flex flex-wrap items-center gap-2.5">
		<button type="button" onclick={onapply} class="{button} bg-ink text-white">Uporabi</button>
		<button type="button" onclick={onreset} class="{button} bg-transparent text-ink">
			Ponastavi
		</button>
	</div>
</DetailsPanel>
