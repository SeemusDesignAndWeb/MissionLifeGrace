<script lang="js">
	import { onMount } from 'svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	export let params = {};

	let churches = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let showImagePicker = false;
	
	function updateShowOnFrontEnd(checked) {
		if (!editing) return;
		editing.showOnFrontEnd = checked;
		if (checked && editing.hideFromAll) {
			editing.hideFromAll = false;
		}
	}
	
	function updateShowInConference(checked) {
		if (!editing) return;
		editing.showInConference = checked;
		if (checked && editing.hideFromAll) {
			editing.hideFromAll = false;
		}
	}
	
	function updateHideFromAll(checked) {
		if (!editing) return;
		editing.hideFromAll = checked;
		if (checked) {
			editing.showOnFrontEnd = false;
			editing.showInConference = false;
		}
	}

	onMount(async () => {
		await loadChurches();
	});

	async function loadChurches() {
		try {
			const response = await fetch('/api/content?type=churches');
			churches = await response.json();
		} catch (error) {
			console.error('Failed to load churches:', error);
		} finally {
			loading = false;
		}
	}

	function startEdit(church) {
		editing = church
			? { 
					...church,
					showOnFrontEnd: church.showOnFrontEnd !== undefined ? church.showOnFrontEnd : true,
					showInConference: church.showInConference !== undefined ? church.showInConference : false,
					hideFromAll: church.hideFromAll !== undefined ? church.hideFromAll : false
				}
			: {
					id: '',
					title: '',
					link: '',
					image: '',
					showOnFrontEnd: true,
					showInConference: false,
					hideFromAll: false
				};
		showForm = true;
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

	async function saveChurch() {
		if (!editing) return;
		
		if (!editing.title || !editing.link) {
			notifyError('Please fill in all required fields (Name and Website Link)');
			return;
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'church', data: editing })
			});

			if (response.ok) {
				await loadChurches();
				cancelEdit();
				notifySuccess('Church saved successfully');
			} else {
				const error = await response.json();
				notifyError('Failed to save church: ' + (error.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Failed to save church:', error);
			notifyError('Failed to save church. Please try again.');
		}
	}

	async function deleteChurch(id) {
		if (!confirm('Are you sure you want to delete this church?')) return;

		try {
			const response = await fetch(`/api/content?type=church&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadChurches();
				notifySuccess('Church deleted successfully');
			} else {
				notifyError('Failed to delete church');
			}
		} catch (error) {
			console.error('Failed to delete church:', error);
			notifyError('Failed to delete church. Please try again.');
		}
	}
</script>

<svelte:head>
	<title>Manage Churches - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Manage Churches</h1>
	<p class="text-gray-600 mb-6">Add and manage churches in the Mission Life Grace network. Changes will automatically update the churches page.</p>

	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold">Churches</h2>
		<button
			type="button"
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
		>
			+ Add New Church
		</button>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow-lg mb-6 border-2 border-primary/20">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Church' : 'New Church'}
				</h2>
				<div class="flex gap-2">
					<button
						type="button"
						on:click={saveChurch}
						class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
					>
						Save
					</button>
					<button
						on:click={cancelEdit}
						class="px-4 py-2 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-1">Church Name *</label>
					<input
						type="text"
						bind:value={editing.title}
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
						placeholder="e.g., Eltham Green Community Church"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Website Link *</label>
					<input
						type="url"
						bind:value={editing.link}
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
						placeholder="https://www.example.com"
					/>
					<p class="text-xs text-gray-500 mt-1">Enter the full website URL (e.g., https://www.egcc.co.uk)</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Church Logo *</label>
					<div class="space-y-2">
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={editing.image}
								class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
								placeholder="Logo image URL"
							/>
							<button
								type="button"
								on:click={openImagePicker}
								class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
							>
								Select Logo
							</button>
						</div>
						{#if editing.image}
							<div class="mt-2 p-4 bg-gray-50 rounded-lg border">
								<img
									src={editing.image}
									alt={editing.title || 'Church logo'}
									class="max-h-32 w-auto object-contain mx-auto"
									on:error={(e) => {
										e.target.style.display = 'none';
									}}
								/>
							</div>
						{/if}
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-2">Visibility Options</label>
					<div class="space-y-3">
						<div class="flex items-center">
							<input
								type="checkbox"
								checked={editing.showOnFrontEnd}
								id="visibility-frontend"
								class="mr-2"
								on:change={(e) => updateShowOnFrontEnd(e.target.checked)}
								disabled={editing.hideFromAll}
							/>
							<label for="visibility-frontend" class="cursor-pointer {editing.hideFromAll ? 'text-gray-400' : ''}">Show on front end</label>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								checked={editing.showInConference}
								id="visibility-conference"
								class="mr-2"
								on:change={(e) => updateShowInConference(e.target.checked)}
								disabled={editing.hideFromAll}
							/>
							<label for="visibility-conference" class="cursor-pointer {editing.hideFromAll ? 'text-gray-400' : ''}">Show in conference</label>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								checked={editing.hideFromAll}
								id="visibility-hidden"
								class="mr-2"
								on:change={(e) => updateHideFromAll(e.target.checked)}
							/>
							<label for="visibility-hidden" class="cursor-pointer">Hide from all</label>
						</div>
					</div>
					<p class="text-xs text-gray-500 mt-2">You can select both "Show on front end" and "Show in conference" together. "Hide from all" will disable the other options.</p>
				</div>
				<div class="flex gap-2 pt-4">
					<button
						type="button"
						on:click={saveChurch}
						class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
					>
						Save Church
					</button>
					<button
						type="button"
						on:click={cancelEdit}
						class="px-4 py-2 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<p class="text-gray-600">Loading churches...</p>
	{:else if churches.length === 0}
		<div class="bg-white rounded-lg shadow p-8 text-center">
			<p class="text-gray-600 mb-4">No churches found. Add your first church to get started!</p>
			<button
				type="button"
				on:click={() => startEdit()}
				class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
			>
				+ Add First Church
			</button>
		</div>
	{:else}
		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each churches as church}
				<div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:border-primary/30 transition-all hover:shadow-xl">
					{#if church.image}
						<div class="p-6 bg-gray-50 flex items-center justify-center min-h-[200px]">
							<img
								src={church.image}
								alt={church.title || 'Church logo'}
								class="max-h-32 w-auto object-contain"
								on:error={(e) => {
									e.target.style.display = 'none';
								}}
							/>
						</div>
					{:else}
						<div class="p-6 bg-gray-50 flex items-center justify-center min-h-[200px] text-gray-400">
							No logo
						</div>
					{/if}
					<div class="p-6">
						<h3 class="text-xl font-bold text-gray-900 mb-2">{church.title || 'Unnamed Church'}</h3>
						{#if church.link}
							<a
								href={church.link}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:text-primary-dark text-sm font-medium inline-flex items-center gap-1"
							>
								Visit Website
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
								</svg>
							</a>
						{/if}
						<div class="mt-4 flex gap-2">
							<button
								type="button"
								on:click={() => startEdit(church)}
								class="flex-1 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors text-sm font-medium"
							>
								Edit
							</button>
							<button
								type="button"
								on:click={() => deleteChurch(church.id)}
								class="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-sm font-medium"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<ImagePicker open={showImagePicker} onSelect={handleImageSelect} />

