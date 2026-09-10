<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		/** Privzeto odprto: zloženo ga ljudje niso našli. */
		open?: boolean;
		children: Snippet;
	}

	let { title, open = true, children }: Props = $props();
</script>

<details {open} class="mt-[22px] border-t border-rule pt-3.5 print:hidden">
	<summary
		class="head flex cursor-pointer items-center gap-2 text-lead font-semibold
			text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
	>
		<svg viewBox="0 0 10 10" class="chevron" aria-hidden="true">
			<path
				d="M3 1 L7 5 L3 9"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		{title}
	</summary>
	{@render children()}
</details>

<style>
	/* Privzeto trikotnik zamenjamo s svojim, da je vrstica videti kot gumb. */
	.head {
		list-style: none;
	}

	.head::-webkit-details-marker {
		display: none;
	}

	.chevron {
		width: 10px;
		height: 10px;
		flex: none;
	}

	details[open] .chevron {
		rotate: 90deg;
	}

	@media (prefers-reduced-motion: no-preference) {
		.chevron {
			transition: rotate 0.15s ease;
		}
	}
</style>
