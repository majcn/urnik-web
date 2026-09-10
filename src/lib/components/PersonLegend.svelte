<script lang="ts">
	import type { Person } from '$lib/schedule/types';

	interface Props {
		people: Person[];
		/** Id-ji tistih, ki so trenutno umaknjeni z lista. */
		hidden: string[];
		ontoggle: (id: string) => void;
		onprint: () => void;
	}

	let { people, hidden, ontoggle, onprint }: Props = $props();
</script>

<div class="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 print:hidden">
	{#each people as person (person.id)}
		{@const off = hidden.includes(person.id)}
		<button
			type="button"
			class="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5
				focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
			aria-pressed={!off}
			title={off ? `Pokaži ${person.name}` : `Skrij ${person.name}`}
			onclick={() => ontoggle(person.id)}
		>
			{#if person.background}
				<span
					class="block size-3 shrink-0 rounded-sm border-2"
					class:opacity-30={off}
					style:border-color={person.color}
				></span>
			{:else}
				<span
					class="block size-3 shrink-0 rounded-sm"
					class:opacity-30={off}
					style:background={person.color}
				></span>
			{/if}
			<b
				class="text-lead"
				class:font-semibold={!person.background}
				class:font-medium={person.background}
				class:text-muted={person.background || off}
				class:line-through={off}
			>
				{person.name}
			</b>
		</button>
	{/each}

	<button
		type="button"
		class="ml-auto cursor-pointer rounded-sm border border-ink bg-ink px-btn-x py-btn-y text-lead
			leading-none font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2
			focus-visible:outline-accent"
		onclick={onprint}
	>
		Natisni
	</button>
</div>
