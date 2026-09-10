<script lang="ts">
	import type { Scale } from '$lib/schedule/scale';
	import { clock } from '$lib/schedule/time';

	interface Props {
		scale: Scale;
		pixelsPerMinute: number;
	}

	let { scale, pixelsPerMinute }: Props = $props();

	/* Zadnja črta je dno mreže; njena oznaka bi visela čez rob, zato je ni. */
	const labelled = $derived(scale.rows.filter((row) => row.major && row.offset < scale.total));
</script>

<div class="relative" style="--ppm:{pixelsPerMinute}">
	{#each labelled as row (row.minute)}
		<div
			class="hour absolute right-[9px] font-mono text-meta leading-none font-medium text-muted tabular-nums"
			class:top-edge={row.offset === 0}
			style="--top:{row.offset}"
		>
			{clock(row.minute)}
		</div>
	{/each}
</div>

<style>
	/* Oznake ležijo sredinsko na svoji črti; pasovi so zato vsi enako visoki. */
	.hour {
		top: calc(var(--top) * var(--ppm) * 1px);
		transform: translateY(-50%);
	}

	/* Prva bi s polovico visela čez vrh mreže, zato se postavi pod svojo črto. */
	.top-edge {
		transform: translateY(2px);
	}
</style>
