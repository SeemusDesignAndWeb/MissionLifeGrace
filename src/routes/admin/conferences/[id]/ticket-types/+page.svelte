<script lang="js">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	export let params = {};

	let conference = null;
	let ticketTypes = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let earlyBirdSettings = {
		earlyBirdStartDate: '',
		earlyBirdEndDate: '',
		earlyBirdDiscountAmount: 0
	};

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			const confResponse = await fetch(`/api/content?type=conferences&id=${params.id}`);
			conference = await confResponse.json();

			// Load early bird settings from conference
			if (conference) {
				earlyBirdSettings = {
					earlyBirdStartDate: conference.earlyBirdStartDate || '',
					earlyBirdEndDate: conference.earlyBirdEndDate || '',
					earlyBirdDiscountAmount: conference.earlyBirdDiscountAmount || 0
				};
			}

			const typesResponse = await fetch(`/api/content?type=conference-ticket-types&conferenceId=${params.id}`);
			ticketTypes = await typesResponse.json();
		} catch (error) {
			console.error('Failed to load data:', error);
		} finally {
			loading = false;
		}
	}

	function startEdit(ticketType) {
		if (ticketType) {
			editing = { ...ticketType };
		} else {
			editing = {
				id: `ticket-${Date.now()}`,
				conferenceId: params.id,
				name: '',
				type: 'adult', // adult, teen, child, under-2s
				camping: false,
				price: 0,
				earlyBirdPrice: 0,
				latePrice: 0,
				capacity: 0,
				sold: 0,
				ageMin: 0,
				ageMax: 999,
				earlyBirdEndDate: '',
				latePriceStartDate: '',
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
				body: JSON.stringify({ type: 'conference-ticket-type', data: editing })
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
			const response = await fetch(`/api/content?type=conference-ticket-type&id=${id}`, {
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

	async function saveEarlyBirdSettings() {
		if (!conference) return;

		try {
			const updatedConference = {
				...conference,
				earlyBirdStartDate: earlyBirdSettings.earlyBirdStartDate,
				earlyBirdEndDate: earlyBirdSettings.earlyBirdEndDate,
				earlyBirdDiscountAmount: parseFloat(earlyBirdSettings.earlyBirdDiscountAmount) || 0
			};

			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'conference', data: updatedConference })
			});

			if (response.ok) {
				conference = updatedConference;
				notifySuccess('Early bird settings saved successfully');
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save early bird settings');
			}
		} catch (error) {
			console.error('Failed to save early bird settings:', error);
			notifyError('Failed to save early bird settings');
		}
	}
</script>

<svelte:head>
	<title>Ticket Types - {conference?.title || 'Conference'} - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<div class="flex justify-between items-center mb-6">
		<div>
			<button
				on:click={() => goto('/admin/conferences')}
				class="text-primary hover:underline mb-2"
			>
				← Back to Conferences
			</button>
			<h1 class="text-3xl font-bold">
				Ticket Types - {conference?.title || 'Loading...'}
			</h1>
		</div>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Ticket Type
		</button>
	</div>

	<!-- Early Bird Settings Section -->
	<div class="bg-white p-6 rounded-lg shadow mb-6">
		<h2 class="text-2xl font-bold mb-4">Early Bird Pricing Settings</h2>
		<p class="text-sm text-gray-600 mb-4">
			Configure early bird pricing that applies to all tickets. The discount amount will be subtracted from each ticket's standard price during the early bird period.
		</p>
		<div class="space-y-4">
			<div class="grid grid-cols-3 gap-4">
				<div>
					<label for="early-bird-start" class="block text-sm font-medium mb-1">Early Bird Start Date</label>
					<input
						id="early-bird-start"
						type="date"
						bind:value={earlyBirdSettings.earlyBirdStartDate}
						class="w-full px-3 py-2 border rounded"
					/>
				</div>
				<div>
					<label for="early-bird-end" class="block text-sm font-medium mb-1">Early Bird End Date</label>
					<input
						id="early-bird-end"
						type="date"
						bind:value={earlyBirdSettings.earlyBirdEndDate}
						class="w-full px-3 py-2 border rounded"
					/>
				</div>
				<div>
					<label for="early-bird-discount" class="block text-sm font-medium mb-1">Discount Amount (£)</label>
					<input
						id="early-bird-discount"
						type="number"
						bind:value={earlyBirdSettings.earlyBirdDiscountAmount}
						class="w-full px-3 py-2 border rounded"
						min="0"
						step="0.01"
						placeholder="0.00"
					/>
					<p class="text-xs text-gray-500 mt-1">Amount to discount from each ticket's standard price</p>
				</div>
			</div>
			<div class="flex justify-end">
				<button
					on:click={saveEarlyBirdSettings}
					class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
				>
					Save Early Bird Settings
				</button>
			</div>
		</div>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Ticket Type' : 'New Ticket Type'}
				</h2>
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
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-1">Name *</label>
					<input
						type="text"
						bind:value={editing.name}
						class="w-full px-3 py-2 border rounded"
						placeholder="Adult - Non-Camping"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Type</label>
						<select bind:value={editing.type} class="w-full px-3 py-2 border rounded">
							<option value="adult">Adult</option>
							<option value="teen">Teen</option>
							<option value="child">Child</option>
							<option value="under-2s">Under 2s</option>
						</select>
					</div>
					<div class="flex items-center pt-6">
						<input
							type="checkbox"
							bind:checked={editing.camping}
							class="mr-2"
						/>
						<label>Camping Option</label>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Regular Price (£) *</label>
						<input
							type="number"
							bind:value={editing.price}
							class="w-full px-3 py-2 border rounded"
							min="0"
							step="0.01"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Early Bird Price (£)</label>
						<input
							type="number"
							bind:value={editing.earlyBirdPrice}
							class="w-full px-3 py-2 border rounded"
							min="0"
							step="0.01"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Late Price (£)</label>
						<input
							type="number"
							bind:value={editing.latePrice}
							class="w-full px-3 py-2 border rounded"
							min="0"
							step="0.01"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Early Bird End Date</label>
						<input
							type="date"
							bind:value={editing.earlyBirdEndDate}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Late Price Start Date</label>
						<input
							type="date"
							bind:value={editing.latePriceStartDate}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Capacity</label>
						<input
							type="number"
							bind:value={editing.capacity}
							class="w-full px-3 py-2 border rounded"
							min="0"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Min Age</label>
						<input
							type="number"
							bind:value={editing.ageMin}
							class="w-full px-3 py-2 border rounded"
							min="0"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Max Age</label>
						<input
							type="number"
							bind:value={editing.ageMax}
							class="w-full px-3 py-2 border rounded"
							min="0"
						/>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Description</label>
					<textarea
						bind:value={editing.description}
						class="w-full px-3 py-2 border rounded"
						rows="3"
						placeholder="Ticket description..."
					></textarea>
				</div>
				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={editing.enabled}
						class="mr-2"
					/>
					<label>Enabled</label>
				</div>
				<div class="flex gap-2 pt-4">
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
	{:else if ticketTypes.length === 0}
		<p class="text-gray-600">No ticket types found. Add your first ticket type!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each ticketTypes as ticketType}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								{ticketType.name}
								{#if ticketType.camping}
									<span class="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Camping</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm capitalize">{ticketType.type}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(ticketType.price)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{ticketType.capacity || 'Unlimited'}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{ticketType.sold || 0}</td>
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

