<script lang="ts">
	import Textfield from '@smui/textfield'
	import { Cell } from '@smui/data-table'
	import IconButton from '@smui/icon-button'
	import type { WorkDictionaryText } from 'omni18n/ts/s-a'

	type EditableEntry = WorkDictionaryText & { original?: string }
	let {
		value = $bindable(),
		onsave
	}: { value: EditableEntry | undefined; onsave?: (value: string | undefined) => void } = $props()
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
		value = { text: editValue, original: editValue }
		onsave?.(editValue)
		editing = false
	}
	function enter(evt: KeyboardEvent) {
		if (evt.key === 'Enter' && editing !== 'multiline') save()
	}
</script>

{#if editing}
	<Cell>
		{#if editing !== 'multiline'}
			<IconButton class="material-icons" onclick={() => (editing = 'multiline')}>crop54</IconButton>
		{/if}
		<IconButton class="material-icons" onclick={cancel}>cancel</IconButton>
		<IconButton disabled={editValue === value?.original} class="material-icons" onclick={save}
			>check</IconButton
		>
	</Cell>
	<Cell style="width: 100%">
		<Textfield
			textarea={editing === 'multiline'}
			bind:value={editValue}
			style="width: 100%"
			onkeyup={enter}
		></Textfield>
	</Cell>
{:else}
	<Cell>
		<IconButton class="material-icons" onclick={edit}>edit</IconButton>
	</Cell>
	<Cell style="width: 100%">
		{value?.text || ''}
	</Cell>
{/if}
