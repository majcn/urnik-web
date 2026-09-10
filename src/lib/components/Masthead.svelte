<script lang="ts">
	interface Props {
		/** Kratke vrstice v desnem kotu; na tisku so skrite. */
		stamp: string[];
	}

	let { stamp }: Props = $props();
</script>

<header class="flex flex-wrap items-end gap-x-6 gap-y-2.5 border-b-2 border-ink pb-3 print:hidden">
	<div>
		<!-- Kdo je na listu, pove legenda z barvami; naslova ni treba ponavljati. -->
		<h1 class="m-0 font-display text-title leading-none font-extrabold tracking-tight">Urnik</h1>
	</div>
	<div
		class="ml-auto text-right font-mono text-note leading-normal font-medium tracking-wider text-muted uppercase print:hidden"
	>
		{#each stamp as line (line)}
			<div>{line}</div>
		{/each}
	</div>
</header>
