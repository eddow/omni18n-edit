<script lang="ts">
	import IconButton from '@smui/icon-button'
	import type { DbContext } from '$lib/types'
	import { getContext } from 'svelte'
	import { MemDB, localeFlagsEngine, type Locale, type WorkDictionary } from 'omni18n/ts/s-a'
	import DataTable, { Body, Head, Row, Cell } from '@smui/data-table'
	import type { Readable, Writable } from 'svelte/store'
	import Textfield, { Input } from '@smui/textfield'
	import List, { Item } from '@smui/list'
	import TextEdit from '$lib/textEdit.svelte'
	import Dialog, { Actions, Content } from '@smui/dialog'
	import Snackbar, { Label } from '@smui/snackbar'

	const localeFlags = localeFlagsEngine()
	const context = getContext<Readable<DbContext>>('db'),
		dirty = getContext<Writable<boolean>>('dirty'),
		dev = getContext<Readable<boolean>>('dev')
	let { locales, db } = $state({
			locales: <Locale[]>[],
			db: <MemDB<FileI18n.KeyInfos> | null>null
		}),
		flags: Record<string, string> = {},
		workDictionary: WorkDictionary<FileI18n.KeyInfos> = $state([]),
		filters: Record<string, string> = $state({ key: '', locale: '', text: '' })
	context.subscribe((c) => {
		if (c) {
			locales = c.locales
			filters = { key: '', locale: locales[0], text: '' }
			for (const l of locales) flags[l] = localeFlags(l)[0]
			db = c.db
			c.setCreating(initCreating)
		}
	})
	let filteredDictionary: WorkDictionary<FileI18n.KeyInfos> = $derived(
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
	async function renameKey() {
		if (editing === newName) return showSnack('Identical the key')
		if (!newName) return showSnack('No key')
		if (workDictionary.find((w) => w.key === newName)) return showSnack('Key already exists')
		await db?.reKey(editing!, newName)
		workDictionary.find((w) => w.key === editing)!.key = newName
		editing = undefined
		isEditing = false
		dirty.set(true)
	}
	async function deleteKey() {
		if (!deleting) return showSnack('No key')
		await db?.reKey(deleting!)
		workDictionary = workDictionary.filter((w) => w.key !== deleting)
		deleting = undefined
		isDeleting = false
		dirty.set(true)
	}
	function initCreating() {
		creating = true
		newEntry = { key: '' }
		for (const l of locales) newEntry[l] = ''
	}
	async function createKey() {
		if (!newEntry.key) return showSnack('No key')
		await db?.key(newEntry!.key, '')
		await Promise.all(
			locales.filter((l) => newEntry![l]).map((l) => save(newEntry!.key, l, newEntry![l]))
		)
		workDictionary.push({
			key: newEntry!.key,
			texts: Object.fromEntries(
				Object.entries(newEntry)
					.filter(([k]) => newEntry[k] && k != 'key')
					.map(([k, text]) => [k, { text }])
			),
			zone: ''
		})
		creating = false
		dirty.set(true)
	}
	let deleting: string | undefined = $state(undefined),
		isDeleting = $state(false),
		editing: string | undefined = $state(undefined),
		isEditing = $state(false),
		newName = $state(''),
		creating = $state(false),
		newEntry: Record<'key' | Locale, string> = $state({}),
		snackMessage = $state(''),
		snackbarError: Snackbar | null = null
	function showSnack(message: string) {
		snackMessage = message
		snackbarError?.open()
	}
</script>

<Snackbar bind:this={snackbarError} class="demo-error">
	<Label>{snackMessage}</Label>
	<Actions>
		<IconButton class="material-icons" title="Dismiss" onclick={() => snackbarError?.close()}
			>close</IconButton
		>
	</Actions>
</Snackbar>
<Dialog onkeyup={(e) => e.key === 'Enter' && deleteKey()} bind:open={isDeleting}>
	<Content>
		Are you sure you want to delete <pre>{deleting}</pre>
		?
	</Content>
	<Actions>
		<IconButton
			color="secondary"
			class="material-icons"
			onclick={() => ((deleting = undefined), (isDeleting = false))}
		>
			close
		</IconButton>
		<IconButton color="primary" class="material-icons" onclick={deleteKey}>delete</IconButton>
	</Actions>
</Dialog>
<Dialog onkeyup={(e) => e.key === 'Enter' && renameKey()} bind:open={isEditing}>
	<Content>
		New name for <pre>{editing}</pre>
		<br />
		<Input bind:value={newName} />
	</Content>
	<Actions>
		<IconButton color="secondary" class="material-icons" onclick={() => (editing = undefined)}>
			close
		</IconButton>
		<IconButton color="primary" class="material-icons" onclick={renameKey}>edit</IconButton>
	</Actions>
</Dialog>
<Dialog onkeyup={(e) => e.key === 'Enter' && createKey()} bind:open={creating}>
	<Content>
		<DataTable table$class="fit" style="width: 100%">
			<Head>
				<Row>
					<Cell>🗝️</Cell>
					<Cell width={640}>
						<Input bind:value={newEntry.key} />
					</Cell>
				</Row>
			</Head>
			<Body>
				{#each locales as locale}
					<Row>
						<Cell>{@html flags[locale]}</Cell>
						<Cell>
							<Input bind:value={newEntry[locale]} />
						</Cell>
					</Row>
				{/each}
			</Body>
		</DataTable>
	</Content>
	<Actions>
		<IconButton color="secondary" class="material-icons" onclick={() => delete newEntry.key}>
			close
		</IconButton>
		<IconButton color="primary" class="material-icons" onclick={createKey}>add</IconButton>
	</Actions>
</Dialog>
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
							{@html flags[locale]}
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
		{#each filteredDictionary as { key, texts, infos }}
			{#if !infos?.inFileOnly}
				{#each locales as locale, i}
					<Row>
						{#if i === 0}
							<Cell rowspan={locales.length} class="key">
								{#if $dev}
									<IconButton
										class="material-icons on-cell-hover"
										onclick={() => {
											deleting = key
											isDeleting = true
										}}
									>
										delete
									</IconButton>
									<IconButton
										class="material-icons on-cell-hover"
										onclick={() => {
											editing = newName = key
											isEditing = true
										}}
									>
										edit
									</IconButton>
								{/if}
								{key}
							</Cell>
						{/if}
						<Cell>{@html flags[locale]}</Cell>
						<TextEdit bind:value={texts[locale]} onsave={(text) => save(key, locale, text)} />
					</Row>
				{/each}
			{/if}
		{/each}
	</Body>
</DataTable>

<style lang="scss">
	:global(table.fit) {
		:global(.key) {
			background-color: lightgrey;
		}
		:global(input) {
			min-width: 150px;
		}
	}
	:global(.material-icon.on-cell-hover),
	:global(.on-cell-hover) {
		display: none;
	}
	:global(td:hover .on-cell-hover) {
		display: inline-block;
	}
</style>
