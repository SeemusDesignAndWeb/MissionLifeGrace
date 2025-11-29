<script lang="js">
	import { onMount } from 'svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	let formFields = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let selectedFormType = 'teen'; // 'teen' or 'child'
	let draggedIndex = null;
	let draggedOverIndex = null;

	onMount(async () => {
		await loadFormFields();
	});

	async function loadFormFields() {
		try {
			const response = await fetch(`/api/content?type=conference-form-fields&formType=${selectedFormType}`);
			if (response.ok) {
				formFields = await response.json();
				// Sort by order
				formFields.sort((a, b) => (a.order || 0) - (b.order || 0));
			}
		} catch (error) {
			console.error('Failed to load form fields:', error);
		} finally {
			loading = false;
		}
	}

	$: if (selectedFormType) {
		loadFormFields();
	}

	function startEdit(field = null) {
		if (field) {
			editing = { ...field };
		} else {
			editing = {
				id: `field-${Date.now()}`,
				formType: selectedFormType,
				label: '',
				name: '',
				type: 'text',
				required: false,
				placeholder: '',
				helpText: '',
				order: formFields.length + 1,
				options: [] // For select/radio/checkbox types
			};
		}
		showForm = true;
	}

	function cancelEdit() {
		editing = null;
		showForm = false;
	}

	function addOption() {
		if (!editing.options) editing.options = [];
		editing.options.push({ label: '', value: '' });
		editing = { ...editing };
	}

	function removeOption(index) {
		editing.options.splice(index, 1);
		editing = { ...editing };
	}

	function generateNameFromLabel() {
		if (editing && editing.label && !editing.name) {
			editing.name = editing.label.toLowerCase()
				.replace(/[^a-z0-9]+/g, '_')
				.replace(/^_+|_+$/g, '');
		}
	}

	async function saveField() {
		if (!editing) return;

		if (!editing.label || !editing.name) {
			notifyError('Please fill in Label and Name');
			return;
		}

		// Generate name from label if not provided
		if (!editing.name && editing.label) {
			generateNameFromLabel();
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'conference-form-field', data: editing })
			});

			if (response.ok) {
				await loadFormFields();
				cancelEdit();
				notifySuccess('Form field saved successfully');
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save form field');
			}
		} catch (error) {
			console.error('Failed to save form field:', error);
			notifyError('Failed to save form field');
		}
	}

	async function deleteField(id) {
		if (!confirm('Are you sure you want to delete this form field?')) return;

		try {
			const response = await fetch(`/api/content?type=conference-form-field&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadFormFields();
				notifySuccess('Form field deleted successfully');
			} else {
				notifyError('Failed to delete form field');
			}
		} catch (error) {
			console.error('Failed to delete form field:', error);
			notifyError('Failed to delete form field');
		}
	}

	function moveField(index, direction) {
		if (direction === 'up' && index === 0) return;
		if (direction === 'down' && index === formFields.length - 1) return;

		const newIndex = direction === 'up' ? index - 1 : index + 1;
		const field = formFields[index];
		const swapField = formFields[newIndex];

		// Swap orders
		const tempOrder = field.order;
		field.order = swapField.order;
		swapField.order = tempOrder;

		// Save both fields
		Promise.all([
			fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'conference-form-field', data: field })
			}),
			fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'conference-form-field', data: swapField })
			})
		]).then(() => {
			loadFormFields();
		});
	}

	function handleDragStart(index) {
		draggedIndex = index;
	}

	function handleDragOver(event, index) {
		event.preventDefault();
		if (draggedIndex !== null && draggedIndex !== index) {
			draggedOverIndex = index;
		}
	}

	function handleDragLeave() {
		draggedOverIndex = null;
	}

	function handleDrop(event, dropIndex) {
		event.preventDefault();
		if (draggedIndex === null || draggedIndex === dropIndex) {
			draggedIndex = null;
			draggedOverIndex = null;
			return;
		}

		// Reorder the fields
		const newFields = [...formFields];
		const draggedField = newFields[draggedIndex];
		newFields.splice(draggedIndex, 1);
		newFields.splice(dropIndex, 0, draggedField);

		// Update orders
		newFields.forEach((field, index) => {
			field.order = index + 1;
		});

		// Save all fields with new orders
		Promise.all(
			newFields.map(field =>
				fetch('/api/content', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type: 'conference-form-field', data: field })
				})
			)
		).then(() => {
			loadFormFields();
		});

		draggedIndex = null;
		draggedOverIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
		draggedOverIndex = null;
	}
</script>

<svelte:head>
	<title>Manage Form Fields - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Manage Form Fields</h1>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Field
		</button>
	</div>

	<!-- Form Type Selector -->
	<div class="mb-6 bg-white p-4 rounded-lg shadow">
		<label class="block text-sm font-medium mb-2">Form Type</label>
		<div class="flex gap-4">
			<button
				on:click={() => { selectedFormType = 'teen'; }}
				class="px-4 py-2 rounded {selectedFormType === 'teen' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}"
			>
				Teen Form
			</button>
			<button
				on:click={() => { selectedFormType = 'child'; }}
				class="px-4 py-2 rounded {selectedFormType === 'child' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}"
			>
				Child Form
			</button>
		</div>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Form Field' : 'New Form Field'}
				</h2>
				<div class="flex gap-2">
					<button
						on:click={saveField}
						class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
					>
						Save
					</button>
					<button
						on:click={cancelEdit}
						class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
					>
						Cancel
					</button>
				</div>
			</div>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-1">Label *</label>
					<input
						type="text"
						bind:value={editing.label}
						on:input={generateNameFromLabel}
						class="w-full px-3 py-2 border rounded"
						placeholder="Field Label"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Field Name (ID) *</label>
					<input
						type="text"
						bind:value={editing.name}
						class="w-full px-3 py-2 border rounded"
						placeholder="field_name"
					/>
					<p class="text-xs text-gray-500 mt-1">Used internally. Use lowercase letters, numbers, and underscores only.</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Field Type *</label>
					<select
						bind:value={editing.type}
						class="w-full px-3 py-2 border rounded"
					>
						<option value="text">Text Input</option>
						<option value="textarea">Textarea</option>
						<option value="email">Email</option>
						<option value="tel">Phone</option>
						<option value="date">Date</option>
						<option value="number">Number</option>
						<option value="select">Dropdown (Select)</option>
						<option value="checkbox">Checkbox</option>
						<option value="radio">Radio Buttons</option>
					</select>
				</div>
				{#if editing.type === 'select' || editing.type === 'radio'}
					<div>
						<label class="block text-sm font-medium mb-1">Options</label>
						<div class="space-y-2">
							{#each editing.options || [] as option, index}
								<div class="flex gap-2">
									<input
										type="text"
										bind:value={option.label}
										class="flex-1 px-3 py-2 border rounded"
										placeholder="Label"
									/>
									<input
										type="text"
										bind:value={option.value}
										class="flex-1 px-3 py-2 border rounded"
										placeholder="Value"
									/>
									<button
										on:click={() => removeOption(index)}
										class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
									>
										Remove
									</button>
								</div>
							{/each}
							<button
								on:click={addOption}
								class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
							>
								Add Option
							</button>
						</div>
					</div>
				{/if}
				<div>
					<label class="block text-sm font-medium mb-1">Placeholder</label>
					<input
						type="text"
						bind:value={editing.placeholder}
						class="w-full px-3 py-2 border rounded"
						placeholder="Enter placeholder text"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Help Text</label>
					<textarea
						bind:value={editing.helpText}
						class="w-full px-3 py-2 border rounded"
						rows="2"
						placeholder="Additional help text for users"
					></textarea>
				</div>
				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={editing.required}
						class="mr-2"
					/>
					<label>Required Field</label>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<p>Loading...</p>
	{:else if formFields.length === 0}
		<p class="text-gray-600">No form fields found for {selectedFormType} form. Add your first field!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each formFields as field, index}
						<tr
							draggable="true"
							on:dragstart={() => handleDragStart(index)}
							on:dragover={(e) => handleDragOver(e, index)}
							on:dragleave={handleDragLeave}
							on:drop={(e) => handleDrop(e, index)}
							on:dragend={handleDragEnd}
							class="cursor-move {draggedIndex === index ? 'opacity-50' : ''} {draggedOverIndex === index ? 'bg-blue-50 border-t-2 border-b-2 border-blue-400' : ''} hover:bg-gray-50 transition-colors"
						>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<div class="flex items-center gap-2">
									<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
									</svg>
									<span class="text-gray-500 text-xs">Drag to reorder</span>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{field.label}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.name}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{field.type}</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								{#if field.required}
									<span class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Required</span>
								{:else}
									<span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Optional</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex gap-2">
									<button
										on:click={() => startEdit(field)}
										class="text-primary hover:underline"
									>
										Edit
									</button>
									<button
										on:click={() => deleteField(field.id)}
										class="text-red-600 hover:underline"
									>
										Delete
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

