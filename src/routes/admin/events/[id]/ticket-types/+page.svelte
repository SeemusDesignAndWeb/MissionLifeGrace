<script lang="js">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	export let params = {};

	let event = null;
	let ticketTypes = [];
	let loading = true;
	let editing = null;
	let showForm = false;

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			const eventResponse = await fetch(`/api/content?type=events&id=${params.id}`);
			if (!eventResponse.ok) {
				console.error('Failed to load event:', eventResponse.statusText);
				loading = false;
				return;
			}
			const eventData = await eventResponse.json();
			
			if (eventData && !eventData.error) {
				event = eventData;
			} else {
				console.error('Event not found or error:', eventData);
				event = null;
			}

			const typesResponse = await fetch(`/api/content?type=event-ticket-types&eventId=${params.id}`);
			if (typesResponse.ok) {
				ticketTypes = await typesResponse.json();
			} else {
				console.error('Failed to load ticket types:', typesResponse.statusText);
				ticketTypes = [];
			}
		} catch (error) {
			console.error('Failed to load data:', error);
			event = null;
			ticketTypes = [];
		} finally {
			loading = false;
		}
	}

	function startEdit(ticketType) {
		if (ticketType) {
			editing = { ...ticketType };
		} else {
			editing = {
				id: `event-ticket-${Date.now()}`,
				eventId: params.id,
				name: '',
				price: 0,
				capacity: 0,
				sold: 0,
				description: '',
				enabled: true
			};
		}
		showForm = true;
	}

	function cancelEdit() {
		editing = null;
		showForm = false;
	}

	async function saveTicketType() {
		if (!editing) return;

		if (!editing.name || editing.price === undefined) {
			notifyError('Please fill in Name and Price');
			return;
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'event-ticket-type', data: editing })
			});

			if (response.ok) {
				await loadData();
				cancelEdit();
				notifySuccess('Ticket type saved successfully');
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save ticket type');
			}
		} catch (error) {
			console.error('Failed to save ticket type:', error);
			notifyError('Failed to save ticket type');
		}
	}

	async function deleteTicketType(id) {
		if (!confirm('Are you sure you want to delete this ticket type?')) return;

		try {
			const response = await fetch(`/api/content?type=event-ticket-type&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadData();
				notifySuccess('Ticket type deleted successfully');
			} else {
				notifyError('Failed to delete ticket type');
			}
		} catch (error) {
			console.error('Failed to delete ticket type:', error);
			notifyError('Failed to delete ticket type');
		}
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
	}
</script>

<svelte:head>
	<title>Ticket Types - {event?.title || 'Event'} - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<div class="flex justify-between items-center mb-6">
		<div>
			<button
				on:click={() => goto('/admin/events')}
				class="text-primary hover:underline mb-2"
			>
				← Back to Events
			</button>
			<h1 class="text-3xl font-bold">
				Ticket Types - {event?.title || 'Loading...'}
			</h1>
		</div>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Ticket Type
		</button>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id && ticketTypes.find(t => t.id === editing.id) ? 'Edit Ticket Type' : 'New Ticket Type'}
				</h2>
				<button
					on:click={cancelEdit}
					class="text-gray-500 hover:text-gray-700"
				>
					✕
				</button>
			</div>
			<div class="space-y-4">
				<div>
					<label for="ticket-name" class="block text-sm font-medium mb-1">Name *</label>
					<input
						id="ticket-name"
						type="text"
						bind:value={editing.name}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., General Admission"
					/>
				</div>
				<div>
					<label for="ticket-description" class="block text-sm font-medium mb-1">Description</label>
					<textarea
						id="ticket-description"
						bind:value={editing.description}
						class="w-full px-3 py-2 border rounded"
						rows="3"
						placeholder="Optional description of this ticket type"
					></textarea>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="ticket-price" class="block text-sm font-medium mb-1">Price (£) *</label>
						<input
							id="ticket-price"
							type="number"
							bind:value={editing.price}
							class="w-full px-3 py-2 border rounded"
							min="0"
							step="0.01"
						/>
					</div>
					<div>
						<label for="ticket-capacity" class="block text-sm font-medium mb-1">Capacity</label>
						<input
							id="ticket-capacity"
							type="number"
							bind:value={editing.capacity}
							class="w-full px-3 py-2 border rounded"
							min="0"
							placeholder="0 = Unlimited"
						/>
						<p class="text-xs text-gray-500 mt-1">Leave as 0 for unlimited tickets</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<input
						id="ticket-enabled"
						type="checkbox"
						bind:checked={editing.enabled}
						class="rounded"
					/>
					<label for="ticket-enabled" class="text-sm font-medium">Enabled (available for purchase)</label>
				</div>
				<div class="flex gap-2">
					<button
						on:click={saveTicketType}
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
	{:else if !event}
		<div class="bg-red-50 border border-red-200 rounded-lg p-6">
			<h2 class="text-xl font-bold text-red-900 mb-2">Event Not Found</h2>
			<p class="text-red-700 mb-4">The event with ID "{params.id}" could not be found.</p>
			<button
				on:click={() => goto('/admin/events')}
				class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
			>
				Back to Events
			</button>
		</div>
	{:else if ticketTypes.length === 0}
		<p class="text-gray-600">No ticket types found. Add your first ticket type!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each ticketTypes as ticketType}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div>
									{ticketType.name}
									{#if ticketType.description}
										<p class="text-xs text-gray-500 mt-1">{ticketType.description}</p>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(ticketType.price)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{ticketType.capacity || 'Unlimited'}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{ticketType.sold || 0}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-3 py-1 text-xs rounded-full {ticketType.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
									{ticketType.enabled ? 'Enabled' : 'Disabled'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									on:click={() => startEdit(ticketType)}
									class="text-primary hover:underline mr-4"
								>
									Edit
								</button>
								<button
									on:click={() => deleteTicketType(ticketType.id)}
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

