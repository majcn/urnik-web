<script lang="ts">
	interface Props {
		title: string;
		subtitle: string;
		/** Kratke vrstice v desnem kotu; na tisku so skrite. */
		stamp: string[];
	}

	let { title, subtitle, stamp }: Props = $props();
</script>

<header class="flex flex-wrap items-end gap-x-6 gap-y-2.5 border-b-2 border-ink pb-3 print:hidden">
	<div>
		<h1
			class="m-0 font-display text-[29px] leading-none font-extrabold tracking-tight text-balance"
		>
			{title}
		</h1>
		<p class="mt-[5px] mb-0 text-[13.5px] text-muted">{subtitle}</p>
	</div>
	<div
		class="ml-auto text-right font-mono text-[11px] leading-normal font-medium tracking-wider text-muted uppercase print:hidden"
	>
		{#each stamp as line (line)}
			<div>{line}</div>
		{/each}
	</div>
</header>
