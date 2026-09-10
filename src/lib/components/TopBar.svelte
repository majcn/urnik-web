<script lang="ts">
	import type { Sheet } from '$lib/schedule/scale';
	import type { Person } from '$lib/schedule/types';

	interface Props {
		people: Person[];
		/** Id-ji tistih, ki so trenutno umaknjeni z lista. */
		hidden: string[];
		sheet: Sheet;
		ontoggle: (id: string) => void;
		onrecolor: (id: string, color: string) => void;
		onprint: () => void;
	}

	let { people, hidden, sheet = $bindable(), ontoggle, onrecolor, onprint }: Props = $props();

	const SHEETS: { value: Sheet; label: string; hint: string }[] = [
		{ value: 'A4', label: 'A4', hint: 'En list A4 ležeče' },
		{
			value: 'A3V',
			label: 'A3 ↕',
			hint: 'A3 pokončno: dva ležeča A4 eden pod drugim — cel teden, dvojna višina'
		},
		{
			value: 'A3H',
			label: 'A3 ↔',
			hint: 'A3 ležeče: dva pokončna A4 eden ob drugem — pon–sre levo, čet–pet in opombe desno'
		}
	];
</script>

<div class="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 print:hidden">
	{#each people as person (person.id)}
		{@const off = hidden.includes(person.id)}
		<div class="flex items-center gap-2">
			<!-- Barvo ureja domači izbirnik; klik na ime osebo umakne z lista. -->
			<span
				class="swatch"
				class:hollow={person.background}
				class:dim={off}
				style:--c={person.color}
			>
				<input
					type="color"
					value={person.color}
					aria-label="Barva — {person.name}"
					title="Barva — {person.name}"
					onchange={(event) => onrecolor(person.id, event.currentTarget.value)}
				/>
			</span>
			<button
				type="button"
				class="cursor-pointer rounded-sm px-1 py-0.5 text-lead focus-visible:outline-2
					focus-visible:outline-offset-1 focus-visible:outline-accent"
				class:font-semibold={!person.background}
				class:font-medium={person.background}
				class:text-muted={person.background || off}
				class:line-through={off}
				aria-pressed={!off}
				title={off ? `Pokaži ${person.name}` : `Skrij ${person.name}`}
				onclick={() => ontoggle(person.id)}
			>
				{person.name}
			</button>
		</div>
	{/each}

	<div class="ml-auto flex items-center gap-2">
		<div class="flex overflow-hidden rounded-sm border border-rule-strong">
			{#each SHEETS as option (option.value)}
				<button
					type="button"
					class="w-14 cursor-pointer border-r border-rule bg-surface py-2 text-body leading-none
						font-semibold text-muted last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px]
						focus-visible:outline-accent aria-pressed:bg-ink aria-pressed:text-white"
					aria-pressed={sheet === option.value}
					title={option.hint}
					onclick={() => (sheet = option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>

		<button
			type="button"
			class="cursor-pointer rounded-sm border border-ink bg-ink px-btn-x py-btn-y text-lead
				leading-none font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2
				focus-visible:outline-accent"
			onclick={onprint}
		>
			Natisni
		</button>
	</div>
</div>

<style>
	/*
	 * Vhod za barvo je prosojen in leži čez ploščico, tako da ostane videz iz
	 * legende — polna za otroke, obrobljena za ozadje —, klik pa odpre izbirnik.
	 */
	.swatch {
		position: relative;
		display: block;
		width: 12px;
		height: 12px;
		flex: none;
		border-radius: 2px;
		background: var(--c);
	}

	.swatch.hollow {
		background: none;
		border: 2px solid var(--c);
	}

	.swatch.dim {
		opacity: 0.3;
	}

	.swatch input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		opacity: 0;
		cursor: pointer;
	}
</style>
