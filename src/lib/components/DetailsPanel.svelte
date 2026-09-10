<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		help?: Snippet;
		children: Snippet;
	}

	let { title, help, children }: Props = $props();
</script>

<details class="mt-[22px] border-t border-rule pt-3.5 print:hidden">
	<summary class="cursor-pointer label-caps focus-visible:outline-2 focus-visible:outline-accent">
		{title}
	</summary>
	{#if help}
		<p class="max-w-[70ch] text-[13.5px] text-muted">{@render help()}</p>
	{/if}
	{@render children()}
</details>
