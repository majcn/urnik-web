<script lang="ts">
	import type { Kid } from '$lib/schedule/types';

	interface Props {
		kids: Kid[];
		onprint: () => void;
	}

	let { kids, onprint }: Props = $props();
</script>

<div class="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 print:hidden">
	{#each kids as kid (kid.id)}
		<div class="flex items-center gap-2">
			<span class="block size-3 shrink-0 rounded-sm" style:background={kid.color}></span>
			<b class="text-sm font-semibold">{kid.name}</b>
			{#if kid.note}
				<span class="font-mono text-[11.5px] leading-none text-muted">{kid.note}</span>
			{/if}
		</div>
	{/each}

	<button
		type="button"
		class="ml-auto cursor-pointer rounded-sm border border-ink bg-ink px-[18px] py-[9px] text-[13px] leading-none font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent print:hidden"
		onclick={onprint}
	>
		Natisni
	</button>
</div>
