<script lang="ts">
	import type { DbContext } from '$lib/types'
	import { getContext } from 'svelte'
	import { MemDB, localeFlags, type Locale, type WorkDictionary } from 'omni18n/ts/s-a'
	import DataTable, { Body, Head, Row, Cell } from '@smui/data-table'
	import type { Readable, Writable } from 'svelte/store'
	import Textfield from '@smui/textfield'
	import List, { Item } from '@smui/list'
	import TextEdit from '$lib/textEdit.svelte'

	const context = getContext<Readable<DbContext>>('db'),
		dirty = getContext<Writable<boolean>>('dirty')
	let { locales, db } = $state({ locales: <Locale[]>[], db: <MemDB | null>null }),
		flags: Record<string, string> = {},
		workDictionary: WorkDictionary = $state([]),
		filters: Record<string, string> = $state({ key: '', locale: '', text: '' })
	context.subscribe((c) => {
		if (c) {
			locales = c.locales
			filters = { key: '', locale: locales[0], text: '' }
			for (const l of locales) flags[l] = localeFlags(l)[0]
			db = c.db
		}
	})
	let filteredDictionary: WorkDictionary = $derived(
		workDictionary.filter(
			({ key, texts }) =>
				key[0] !== '.' &&
				(!filters.key || key.includes(filters.key)) &&
				(!filters.text ||
					texts[filters.locale]?.text?.toLowerCase()?.includes(filters.text.toLowerCase()))
		)
	)
	$effect(() => {
		if (db && db.dictionary) db.workList(locales).then((w) => (workDictionary = w))
	})
	function save(key: string, locale: string, text: string | undefined) {
		db!.modify(key, locale, text)
		dirty.set(true)
	}
</script>

<DataTable table$class="fit" stickyHeader table$aria-label="Dictionary" style="width: 100%">
	<Head>
		<Row>
			<Cell>
				<Textfield style="width: 100%" bind:value={filters.key} />
			</Cell>
			<Cell colspan={2}>
				<List>
					{#each locales as locale}
						<Item activated={filters.locale === locale} onclick={() => (filters.locale = locale)}>
							{flags[locale]}
						</Item>
					{/each}
				</List>
			</Cell>
			<Cell style="width: 100%">
				<Textfield style="width: 100%" bind:value={filters.text} />
			</Cell>
		</Row>
	</Head>
	<Body>
		{#each filteredDictionary as { key, texts }}
			{#each locales as locale, i}
				<Row>
					{#if i === 0}<Cell rowspan={locales.length} class="key">{key}</Cell>{/if}
					<Cell>{flags[locale]}</Cell>
					<TextEdit bind:value={texts[locale]} onsave={(text) => save(key, locale, text)} />
				</Row>
			{/each}
		{/each}
	</Body>
</DataTable>

<style lang="scss">
	:global(table.fit) {
		:global(.key) {
			background-color: lightgrey;
		}
	}
</style>
