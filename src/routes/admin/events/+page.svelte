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

	let events = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let showImagePicker = false;

	onMount(async () => {
		await loadEvents();
	});

	async function loadEvents() {
		try {
			const response = await fetch('/api/content?type=events');
			events = await response.json();
		} catch (error) {
			console.error('Failed to load events:', error);
		} finally {
			loading = false;
		}
	}

		function startEdit(event) {
		if (event) {
			editing = {
				...event,
				description: event.description || '',
				eventInfo: typeof event.eventInfo === 'string' ? event.eventInfo : '',
				paymentSettings: event.paymentSettings || { paypalEnabled: false }
			};
		} else {
			editing = {
				id: '',
				title: '',
				description: '',
				eventInfo: '',
				date: '',
				time: '',
				location: '',
				image: '',
				featured: false,
				highlighted: false,
				published: true,
				order: events.length,
				paymentSettings: { paypalEnabled: false }
			};
		}
		showForm = true;
	}

	// Auto-generate ID when title changes (only for new events or if ID is empty)
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

	async function saveEvent() {
		if (!editing) return;

		if (!editing.id || !editing.title || !editing.date) {
			notifyError('Please fill in ID, Title, and Date');
			return;
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'event', data: editing })
			});

			if (response.ok) {
				await loadEvents();
				cancelEdit();
				notifySuccess('Event saved successfully');
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save event');
			}
		} catch (error) {
			console.error('Failed to save event:', error);
			notifyError('Failed to save event');
		}
	}

	async function deleteEvent(id) {
		if (!confirm('Are you sure you want to delete this event?')) return;

		try {
			const response = await fetch(`/api/content?type=event&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadEvents();
				notifySuccess('Event deleted successfully');
			} else {
				notifyError('Failed to delete event');
			}
		} catch (error) {
			console.error('Failed to delete event:', error);
			notifyError('Failed to delete event');
		}
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Manage Events - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<div class="flex items-center gap-2">
			<h1 class="text-3xl font-bold">Manage Events</h1>
			<HelpIcon helpId="admin-events-page" position="right">
				{@html getHelpContent('admin-events-page').content}
			</HelpIcon>
		</div>
		<div class="flex gap-3">
			<a
				href="/admin/events/bookings"
				class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				View Bookings
			</a>
			<button
				on:click={() => startEdit()}
				class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
			>
				Add New Event
			</button>
		</div>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Event' : 'New Event'}
				</h2>
				<div class="flex gap-2">
					<button
						on:click={saveEvent}
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
						<label for="event-title" class="text-sm font-medium">Title *</label>
						<HelpIcon helpId="field-event-title" position="right">
							{@html getHelpContent('field-event-title').content}
						</HelpIcon>
					</div>
					<input
						id="event-title"
						type="text"
						bind:value={editing.title}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., Easter Service"
					/>
					<p class="text-xs text-gray-500 mt-1">Event ID will be automatically generated from the title</p>
				</div>
				<div class="relative mb-4">
					<div class="flex items-center gap-1 mb-1">
						<label for="event-info" class="text-sm font-medium">Event Info</label>
						<HelpIcon helpId="field-event-info" position="right">
							{@html getHelpContent('field-event-info').content}
						</HelpIcon>
					</div>
					<div id="event-info" class="relative" style="height: 300px;">
						<RichTextEditor bind:value={editing.eventInfo} height="300px" placeholder="" />
					</div>
					<p class="text-xs text-gray-500 mt-1">This information will be displayed on the event detail page</p>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="event-date" class="text-sm font-medium">Date *</label>
							<HelpIcon helpId="field-event-date" position="right">
								{@html getHelpContent('field-event-date').content}
							</HelpIcon>
						</div>
						<input
							id="event-date"
							type="date"
							bind:value={editing.date}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="event-time" class="text-sm font-medium">Time</label>
							<HelpIcon helpId="field-event-time" position="right">
								{@html getHelpContent('field-event-time').content}
							</HelpIcon>
						</div>
						<input
							id="event-time"
							type="time"
							bind:value={editing.time}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label for="event-location" class="text-sm font-medium">Location</label>
						<HelpIcon helpId="field-event-location" position="right">
							{@html getHelpContent('field-event-location').content}
						</HelpIcon>
					</div>
					<input
						id="event-location"
						type="text"
						bind:value={editing.location}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., Main Hall"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label for="event-image" class="text-sm font-medium">Image URL</label>
						<HelpIcon helpId="field-event-image" position="right">
							{@html getHelpContent('field-event-image').content}
						</HelpIcon>
					</div>
					<div class="space-y-2">
						<div class="flex gap-2">
							<input
								id="event-image"
								type="text"
								bind:value={editing.image}
								class="flex-1 px-3 py-2 border rounded"
								placeholder="/images/event.jpg"
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
				<div class="flex gap-6 flex-wrap">
					<div class="flex items-center gap-2">
						<input type="checkbox" bind:checked={editing.featured} class="rounded" />
						<div class="flex items-center gap-1">
							<span class="text-sm font-medium">Featured (Show on home page)</span>
							<HelpIcon helpId="field-event-featured" position="right">
								{@html getHelpContent('field-event-featured').content}
							</HelpIcon>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<input type="checkbox" bind:checked={editing.highlighted} class="rounded" />
						<div class="flex items-center gap-1">
							<span class="text-sm font-medium">Highlight (Show banner at top)</span>
							<HelpIcon helpId="field-event-highlighted" position="right">
								{@html getHelpContent('field-event-highlighted').content}
							</HelpIcon>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<input type="checkbox" bind:checked={editing.published} class="rounded" />
						<div class="flex items-center gap-1">
							<span class="text-sm font-medium">Published</span>
							<HelpIcon helpId="field-event-published" position="right">
								{@html getHelpContent('field-event-published').content}
							</HelpIcon>
						</div>
					</div>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label for="event-order" class="text-sm font-medium">Order</label>
						<HelpIcon helpId="field-event-order" position="right">
							{@html getHelpContent('field-event-order').content}
						</HelpIcon>
					</div>
					<input
						id="event-order"
						type="number"
						bind:value={editing.order}
						class="w-full px-3 py-2 border rounded"
						min="0"
					/>
					<p class="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Payment Settings</label>
						<HelpIcon helpId="field-event-paypal" position="right">
							{@html getHelpContent('field-event-paypal').content}
						</HelpIcon>
					</div>
					<div class="flex items-center">
						<input
							type="checkbox"
							bind:checked={editing.paymentSettings.paypalEnabled}
							class="mr-2"
						/>
						<label>PayPal Enabled (Required for ticket sales)</label>
					</div>
					<p class="text-xs text-gray-500 mt-1">Enable PayPal to allow ticket purchases for this event</p>
				</div>
				<div class="flex gap-2">
					<button
						on:click={saveEvent}
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
	{:else if events.length === 0}
		<p class="text-gray-600">No events found. Add your first event!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Title
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Date
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Time
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Location
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each events.sort((a, b) => {
						// Sort by date, then by order
						const dateA = new Date(a.date || '9999-12-31');
						const dateB = new Date(b.date || '9999-12-31');
						if (dateA.getTime() !== dateB.getTime()) {
							return dateA.getTime() - dateB.getTime();
						}
						return (a.order || 0) - (b.order || 0);
					}) as event}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex items-center gap-2">
									{event.title}
									{#if event.featured}
										<span class="px-3 py-1 text-xs bg-primary text-white rounded-full">Featured</span>
									{/if}
									{#if event.highlighted}
										<span class="px-3 py-1 text-xs bg-yellow-500 text-white rounded-full">Highlighted</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(event.date)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{event.time || '-'}</td>
							<td class="px-6 py-4 text-sm text-gray-500">{event.location || '-'}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-3 py-1 text-xs rounded-full {event.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
									{event.published ? 'Published' : 'Draft'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									on:click={() => startEdit(event)}
									class="text-primary hover:underline mr-4"
								>
									Edit
								</button>
								<a
									href="/admin/events/{event.id}/ticket-types"
									class="text-blue-600 hover:underline mr-4"
								>
									Ticket Types
								</a>
								<button
									on:click={() => deleteEvent(event.id)}
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

