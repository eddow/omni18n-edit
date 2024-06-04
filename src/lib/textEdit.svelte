<script lang="ts">
	import Textfield from '@smui/textfield'
	import { Cell } from '@smui/data-table'
	import IconButton from '@smui/icon-button'
	import type { WorkDictionaryText } from 'omni18n/ts/s-a'

	type EditableEntry = WorkDictionaryText & { original?: string }
	let {
		value = $bindable(),
		onsave,
		multiline = true,
		rowspan = 1
	}: {
		value: EditableEntry | undefined
		onsave?: (value: string | undefined) => void
		multiline?: boolean
		rowspan?: number
	} = $props()
	let editing: boolean | 'multiline' = $state(false)
	let editValue = $state(value?.text)

	$effect(() => {
		if (value) value.original = value.text
		else value = { text: '' }
	})
	function edit() {
		editing = editValue && editValue?.includes('\n') ? 'multiline' : true
	}
	function cancel() {
		editValue = value!.original
		editing = false
	}
	function save() {
		if (value?.original !== editValue) {
			value = { text: editValue, original: editValue }
			onsave?.(editValue)
		}
		editing = false
	}
	function enter(evt: KeyboardEvent) {
		if (evt.key === 'Enter' && editing !== 'multiline') save()
	}
</script>

{#if editing}
	<Cell {rowspan}>
		{#if editing !== 'multiline' && multiline}
			<IconButton class="material-icons" onclick={() => (editing = 'multiline')}>crop54</IconButton>
		{/if}
		<IconButton class="material-icons" onclick={cancel}>cancel</IconButton>
		<IconButton disabled={editValue === value?.original} class="material-icons" onclick={save}
			>check</IconButton
		>
	</Cell>
	<Cell style={multiline ? 'width: 100%' : ''} {rowspan}>
		<Textfield
			textarea={editing === 'multiline'}
			bind:value={editValue}
			style="width: 100%"
			onkeyup={enter}
		/>
	</Cell>
{:else}
	<Cell>
		<IconButton class="material-icons on-row-hover" onclick={edit}>edit</IconButton>
	</Cell>
	<Cell style="width: 100%">
		{value?.text || ''}
	</Cell>
{/if}

<style lang="scss">
	:global(.material-icon.on-row-hover),
	:global(.on-row-hover) {
		display: none;
	}
	:global(tr:hover .on-row-hover) {
		display: inline-block;
	}
</style>
