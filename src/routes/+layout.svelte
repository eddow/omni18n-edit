<script lang="ts">
	// TODO Compare strings with some distance to avoid duplicates
	// TODO Filters get under the toolbar
	import '$lib'
	import { MemDB, localeFlagsEngine, serialization, type Locale } from 'omni18n/ts/s-a'
	import TopAppBar, { Row, Section, Title, AutoAdjust } from '@smui/top-app-bar'
	import IconButton from '@smui/icon-button'
	import FormField from '@smui/form-field'
	import Paper from '@smui/paper'
	import Dialog, { Content, Actions } from '@smui/dialog'
	import List, { Item } from '@smui/list'
	import Checkbox from '@smui/checkbox'
	import { setContext } from 'svelte'
	import type { DbContext } from '$lib/types'
	import { writable, type Readable, type Writable } from 'svelte/store'

	const localeFlags = localeFlagsEngine()
	let config: Record<Locale | 'dev', boolean> = $state(
		(typeof window !== 'undefined' && JSON.parse(window.localStorage.getItem('locales') || '{}')) ||
			{}
	)
	if (!config.dev) config.dev = false
	let flags: Record<string, string> = {},
		fileName = '',
		configure = $state(false),
		{ children } = $props(),
		db = new MemDB<FileI18n.KeyInfos>(),
		locales: Locale[] = $state([]),
		context = writable<DbContext>(),
		lastSetLocales: Locale[] = [],
		topAppBar: TopAppBar | null = $state(null),
		dirty = writable(false),
		dev = writable(!!config.dev)
	setContext<Readable<DbContext>>('db', context)
	setContext<Writable<boolean>>('dirty', dirty)
	setContext<Writable<boolean>>('dev', dev)
	$effect(() => {
		dev.set(config.dev)
	})
	$effect(() => {
		for (const l of locales) if (config[l] !== false) config[l] = true
		if (typeof window !== 'undefined')
			window.localStorage.setItem('locales', JSON.stringify(config))
		const newLocales = locales.filter((l) => config[l])
		if (
			newLocales.length !== lastSetLocales.length ||
			newLocales.some((l, i) => l !== lastSetLocales[i])
		) {
			lastSetLocales = newLocales
			context.set({
				db,
				locales: locales.filter((l) => config[l]),
				setCreating(creating: () => void) {
					add = creating
				}
			})
		}
	})
	let fileInput: HTMLInputElement
	function load() {
		let fileContent: string = ''
		const file = fileInput.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = () => {
				fileContent = reader.result as string
				try {
					db.dictionary = serialization.deserialize(fileContent)
					locales = db.dictionary['.dbInfos']?.locales || []
					for (const l of locales) flags[l] = localeFlags(l)[0]
				} catch (e) {}
			}
			reader.readAsText(file)
			fileName = file.name
		}
		fileInput.files = null
		fileInput.value = ''
	}
	function save() {
		const dbRaw = serialization.serialize(db.dictionary),
			byteArray = new Uint8Array(dbRaw.length * 2)
		for (var i = 0; i < dbRaw.length; i++) {
			byteArray[i * 2] = dbRaw.charCodeAt(i) // & 0xff;
			byteArray[i * 2 + 1] = dbRaw.charCodeAt(i) >> 8 // & 0xff;
		}
		const blob = new Blob([byteArray], { type: 'text/plain;charset=utf-16le' })
		const url = window.URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = fileName
		link.click()
		window.URL.revokeObjectURL(url)
		dirty.set(false)
	}
	let add: (() => void) | undefined = $state(undefined)
	dirty.subscribe((d) => {
		if (typeof window !== 'undefined')
			window.onbeforeunload = d ? () => 'Changes have been made and not saved.' : null
	})
</script>

<svelte:head>
	<!-- Fonts -->
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700"
	/>

	<!-- Material Typography -->
	<link
		rel="stylesheet"
		href="https://unpkg.com/@material/typography@14.0.0/dist/mdc.typography.css"
	/>
</svelte:head>
<input bind:this={fileInput} type="file" style="display: none;" onchange={load} />
<TopAppBar color="primary" variant="fixed" bind:this={topAppBar}>
	<Row>
		<Section>
			{#if $dev}
				<IconButton disabled={!add} class="material-icons" onclick={add}>add</IconButton>
			{/if}
		</Section>
		<Section align="end">
			{#if locales.length}
				<IconButton class="material-icons" onclick={() => (configure = true)}>settings</IconButton>
			{/if}
			<IconButton class="material-icons" onclick={() => fileInput.click()}>file_open</IconButton>
			<IconButton class="material-icons" onclick={save} disabled={!$dirty}>save</IconButton>
		</Section>
	</Row>
</TopAppBar>
<Dialog bind:open={configure} aria-labelledby="simple-title" aria-describedby="simple-content">
	<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
	<Title id="simple-title">Use languages/features</Title>
	<Content id="simple-content">
		<List>
			<Item>
				<FormField>
					<Checkbox bind:checked={config.dev} />
					<span slot="label">I'm a developer</span>
				</FormField>
			</Item>
			{#each locales as l}
				<Item>
					<FormField>
						<Checkbox bind:checked={config[l]} />
						<span slot="label">{@html flags[l]}</span>
					</FormField>
				</Item>
			{/each}
		</List>
	</Content>
</Dialog>
<AutoAdjust {topAppBar}>
	{#if !locales.length}
		<Paper color="error">
			<p>No locales defined.</p>
			<p>Open a database and make sure it has some locales defines.</p>
			<p>The first line should resemble:</p>
			<pre>#&lbrace;locales: ['en','de']&rbrace;</pre>
		</Paper>
	{:else}
		{@render children()}
	{/if}
</AutoAdjust>
