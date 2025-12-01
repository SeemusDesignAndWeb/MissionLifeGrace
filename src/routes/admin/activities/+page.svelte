<script lang="js">
	import { onMount } from 'svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';

	// Auto-generate ID from title
	function generateIdFromTitle(title) {
		if (!title) return '';
		return title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	export let params = {};

	let activities = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let showImagePicker = false;

	onMount(async () => {
		await loadActivities();
	});

	async function loadActivities() {
		try {
			const response = await fetch('/api/content?type=activities');
			activities = await response.json();
		} catch (error) {
			console.error('Failed to load activities:', error);
		} finally {
			loading = false;
		}
	}

	function startEdit(activity) {
		editing = activity
			? { ...activity }
			: {
					id: '',
					title: '',
					description: '',
					image: '',
					icon: '',
					timeInfo: '',
					audience: '',
					link: '',
					linkText: '',
					order: activities.length
				};
		showForm = true;
	}

	// Auto-generate ID when title changes (only for new activities or if ID is empty)
	$: if (editing && editing.title && (!editing.id || editing.id === '')) {
		editing.id = generateIdFromTitle(editing.title);
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

	async function saveActivity() {
		if (!editing) return;

		if (!editing.id || !editing.title) {
			notifyError('Please fill in ID and Title');
			return;
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'activity', data: editing })
			});

			if (response.ok) {
				await loadActivities();
				cancelEdit();
				notifySuccess('Activity saved successfully');
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save activity');
			}
		} catch (error) {
			console.error('Failed to save activity:', error);
			notifyError('Failed to save activity');
		}
	}

	async function deleteActivity(id) {
		if (!confirm('Are you sure you want to delete this activity?')) return;

		try {
			const response = await fetch(`/api/content?type=activity&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadActivities();
				notifySuccess('Activity deleted successfully');
			} else {
				notifyError('Failed to delete activity');
			}
		} catch (error) {
			console.error('Failed to delete activity:', error);
			notifyError('Failed to delete activity');
		}
	}

	function moveUp(index) {
		if (index === 0) return;
		const newActivities = [...activities];
		[newActivities[index - 1], newActivities[index]] = [newActivities[index], newActivities[index - 1]];
		activities = newActivities;
		// Update order values
		activities.forEach((a, i) => {
			a.order = i;
			saveActivity(a);
		});
	}

	function moveDown(index) {
		if (index === activities.length - 1) return;
		const newActivities = [...activities];
		[newActivities[index], newActivities[index + 1]] = [newActivities[index + 1], newActivities[index]];
		activities = newActivities;
		// Update order values
		activities.forEach((a, i) => {
			a.order = i;
			saveActivity(a);
		});
	}
</script>

<svelte:head>
	<title>Manage Activities - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Manage Community Activities</h1>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Activity
		</button>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Activity' : 'New Activity'}
				</h2>
				<div class="flex gap-2">
					<button
						on:click={saveActivity}
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
				<!-- ID field is hidden - auto-generated from title -->
				<input
					type="hidden"
					bind:value={editing.id}
				/>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Title *</label>
						<HelpIcon helpId="field-activity-title" position="right">
							{@html getHelpContent('field-activity-title').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.title}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., Fresh Ground Coffee House"
					/>
					<p class="text-xs text-gray-500 mt-1">Activity ID will be automatically generated from the title</p>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Description</label>
						<HelpIcon helpId="field-activity-description" position="right">
							{@html getHelpContent('field-activity-description').content}
						</HelpIcon>
					</div>
					<RichTextEditor bind:value={editing.description} height="250px" />
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Time Information</label>
						<HelpIcon helpId="field-activity-time" position="right">
							{@html getHelpContent('field-activity-time').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.timeInfo}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., Wed-Sat: 9:30am - 2:00pm"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Audience</label>
						<HelpIcon helpId="field-activity-audience" position="right">
							{@html getHelpContent('field-activity-audience').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.audience}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., For Children & Families"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Image URL</label>
						<HelpIcon helpId="field-activity-image" position="right">
							{@html getHelpContent('field-activity-image').content}
						</HelpIcon>
					</div>
					<div class="space-y-2">
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={editing.image}
								class="flex-1 px-3 py-2 border rounded"
								placeholder="/images/activity.jpg"
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
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Icon (SVG path or FontAwesome class, optional)</label>
						<HelpIcon helpId="field-activity-icon" position="right">
							{@html getHelpContent('field-activity-icon').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.icon}
						class="w-full px-3 py-2 border rounded"
						placeholder="fa fa-coffee or SVG path"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Link URL (optional)</label>
						<HelpIcon helpId="field-activity-link" position="right">
							{@html getHelpContent('field-activity-link').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.link}
						class="w-full px-3 py-2 border rounded"
						placeholder="https://example.com"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Link Text (optional)</label>
						<HelpIcon helpId="field-activity-link-text" position="right">
							{@html getHelpContent('field-activity-link-text').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.linkText}
						class="w-full px-3 py-2 border rounded"
						placeholder="Visit Website"
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
						on:click={saveActivity}
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
	{:else if activities.length === 0}
		<p class="text-gray-600">No activities found. Add your first activity!</p>
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
							Time/Audience
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each activities.sort((a, b) => (a.order || 0) - (b.order || 0)) as activity, index}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<div class="flex gap-1">
									<button
										on:click={() => moveUp(index)}
										disabled={index === 0}
										class="text-gray-400 hover:text-gray-600 disabled:opacity-30"
										title="Move up"
									>
										↑
									</button>
									<button
										on:click={() => moveDown(index)}
										disabled={index === activities.length - 1}
										class="text-gray-400 hover:text-gray-600 disabled:opacity-30"
										title="Move down"
									>
										↓
									</button>
									<span class="ml-2">{activity.order || 0}</span>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{activity.title}</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{#if activity.timeInfo}
									<div>{activity.timeInfo}</div>
								{/if}
								{#if activity.audience}
									<div class="text-xs text-gray-400">{activity.audience}</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									on:click={() => startEdit(activity)}
									class="text-primary hover:underline mr-4"
								>
									Edit
								</button>
								<button
									on:click={() => deleteActivity(activity.id)}
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

