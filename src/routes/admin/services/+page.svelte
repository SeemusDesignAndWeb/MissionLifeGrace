<script lang="js">
	import { onMount } from 'svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	export let params = {};

	let services = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let showImagePicker = false;
	let draggedIndex = null;
	let dragOverIndex = null;

	onMount(async () => {
		await loadServices();
	});

	async function loadServices() {
		try {
			const response = await fetch('/api/content?type=services');
			services = await response.json();
		} catch (error) {
			console.error('Failed to load services:', error);
		} finally {
			loading = false;
		}
	}

	function startEdit(service) {
		editing = service
			? { ...service, time: service.time || '', url: service.url || '', order: service.order !== undefined ? service.order : services.length }
			: {
					id: '',
					title: '',
					description: '',
					image: '',
					icon: '',
					time: '',
					url: '',
					order: services.length
				};
		showForm = true;
	}

	function handleDragStart(event, index) {
		draggedIndex = index;
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/html', event.target);
	}

	function handleDragOver(event, index) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	async function handleDrop(event, dropIndex) {
		event.preventDefault();
		
		if (draggedIndex === null || draggedIndex === dropIndex) {
			draggedIndex = null;
			dragOverIndex = null;
			return;
		}

		const sorted = [...services].sort((a, b) => (a.order || 0) - (b.order || 0));
		const draggedItem = sorted[draggedIndex];
		
		// Remove dragged item from array
		sorted.splice(draggedIndex, 1);
		
		// Insert at new position
		sorted.splice(dropIndex, 0, draggedItem);
		
		// Update order values
		for (let i = 0; i < sorted.length; i++) {
			sorted[i].order = i;
		}
		
		// Save all services with updated order
		try {
			for (const s of sorted) {
				await saveServiceData(s);
			}
			await loadServices();
			notifySuccess('Order updated successfully');
		} catch (error) {
			console.error('Failed to reorder services:', error);
			notifyError('Failed to reorder services');
		}
		
		draggedIndex = null;
		dragOverIndex = null;
	}

	function cancelEdit() {
		editing = null;
		showForm = false;
	}

	function openImagePicker() {
		showImagePicker = true;
	}

	function handleImageSelect(imagePath) {
		if (editing) {
			editing.image = imagePath;
		}
		showImagePicker = false;
	}

	async function saveServiceData(serviceData) {
		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'service', data: serviceData })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save service');
			}
			return true;
		} catch (error) {
			console.error('Failed to save service:', error);
			throw error;
		}
	}

	async function saveService() {
		if (!editing) return;

		try {
			await saveServiceData(editing);
			await loadServices();
			cancelEdit();
		} catch (error) {
			console.error('Failed to save service:', error);
			notifyError('Failed to save service');
		}
	}

	async function deleteService(id) {
		if (!confirm('Are you sure you want to delete this service?')) return;

		try {
			const response = await fetch(`/api/content?type=service&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadServices();
			}
		} catch (error) {
			console.error('Failed to delete service:', error);
		}
	}
</script>

<svelte:head>
	<title>Manage Training and Networking - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Manage Training and Networking</h1>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Service
		</button>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Service' : 'New Service'}
				</h2>
				<div class="flex gap-2">
					<button
						on:click={saveService}
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
					<label class="block text-sm font-medium mb-1">ID</label>
					<input
						type="text"
						bind:value={editing.id}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., sunday-worship"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Title</label>
					<input
						type="text"
						bind:value={editing.title}
						class="w-full px-3 py-2 border rounded"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Description</label>
					<RichTextEditor bind:value={editing.description} height="250px" />
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Time</label>
					<input
						type="text"
						bind:value={editing.time}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., Sunday 10:30 AM"
					/>
					<p class="text-xs text-gray-500 mt-1">Service time or schedule information</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">URL (optional)</label>
					<input
						type="text"
						bind:value={editing.url}
						class="w-full px-3 py-2 border rounded"
						placeholder="https://example.com or /page"
					/>
					<p class="text-xs text-gray-500 mt-1">If provided, the service card will be clickable and link to this URL</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Image URL</label>
					<div class="space-y-2">
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={editing.image}
								class="flex-1 px-3 py-2 border rounded"
								placeholder="/images/service.jpg"
							/>
							<button
								type="button"
								on:click={openImagePicker}
								class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
							>
								Select Image
							</button>
						</div>
						{#if editing.image}
							<div class="mt-2">
								<img
									src={editing.image}
									alt="Preview"
									class="max-w-xs h-32 object-cover rounded border"
								/>
							</div>
						{/if}
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Icon (FontAwesome class, optional)</label>
					<input
						type="text"
						bind:value={editing.icon}
						class="w-full px-3 py-2 border rounded"
						placeholder="fa fa-heart"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Order</label>
					<input
						type="number"
						bind:value={editing.order}
						class="w-full px-3 py-2 border rounded"
						min="0"
					/>
					<p class="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
				</div>
				<div class="flex gap-2">
					<button
						on:click={saveService}
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
		</div>
	{/if}

	{#if loading}
		<p>Loading...</p>
	{:else if services.length === 0}
		<p class="text-gray-600">No services found. Add your first service!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Order
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Title
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Description Preview
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each services.sort((a, b) => (a.order || 0) - (b.order || 0)) as service, index}
						<tr
							draggable="true"
							on:dragstart={(e) => handleDragStart(e, index)}
							on:dragover={(e) => handleDragOver(e, index)}
							on:dragleave={handleDragLeave}
							on:drop={(e) => handleDrop(e, index)}
							class="cursor-move transition-all {draggedIndex === index ? 'opacity-50' : ''} {dragOverIndex === index && draggedIndex !== index ? 'bg-blue-50 border-l-4 border-blue-500' : ''}"
						>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center gap-2">
									<span class="text-gray-400 text-lg cursor-grab active:cursor-grabbing">☰</span>
									<span class="text-sm text-gray-500 ml-2">Drag to reorder</span>
									<span class="ml-4 text-xs text-gray-400">({service.order || 0})</span>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{service.title}</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{service.description ? (service.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...') : ''}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									on:click={() => startEdit(service)}
									class="text-primary hover:underline mr-4"
								>
									Edit
								</button>
								<button
									on:click={() => deleteService(service.id)}
									class="text-red-600 hover:underline"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<ImagePicker open={showImagePicker} onSelect={handleImageSelect} />

