<script lang="ts">
	interface Props {
		/** Koliko praznih črt narišemo pod mrežo. */
		lines?: number;
	}

	let { lines = 5 }: Props = $props();
</script>

<section
	class="mt-3.5 rounded-sm border border-rule-strong bg-surface px-3.5 pt-[11px] pb-1 print:break-inside-avoid"
>
	<h2 class="m-0 mb-1.5 label-caps">Ta teden</h2>
	{#each { length: lines }, index (index)}
		<div class="h-[26px] border-b border-rule"></div>
	{/each}
</section>
