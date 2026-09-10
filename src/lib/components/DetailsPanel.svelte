<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();
</script>

<details class="mt-[22px] border-t border-rule pt-3.5 print:hidden">
	<summary class="cursor-pointer label-caps focus-visible:outline-2 focus-visible:outline-accent">
		{title}
	</summary>
	{@render children()}
</details>
