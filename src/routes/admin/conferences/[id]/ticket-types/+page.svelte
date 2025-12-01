<script lang="js">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { notifyError, notifySuccess } from '$lib/utils/notify';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';

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
			if (!confResponse.ok) {
				console.error('Failed to load conference:', confResponse.statusText);
				loading = false;
				return;
			}
			const confData = await confResponse.json();
			
			// Check if we got an error object or null
			if (confData && !confData.error) {
				conference = confData;
			} else {
				console.error('Conference not found or error:', confData);
				conference = null;
			}

			// Load early bird settings from conference
			if (conference) {
				earlyBirdSettings = {
					earlyBirdStartDate: conference.earlyBirdStartDate || '',
					earlyBirdEndDate: conference.earlyBirdEndDate || '',
					earlyBirdDiscountAmount: conference.earlyBirdDiscountAmount || 0
				};
			}

			const typesResponse = await fetch(`/api/content?type=conference-ticket-types&conferenceId=${params.id}`);
			if (typesResponse.ok) {
				ticketTypes = await typesResponse.json();
			} else {
				console.error('Failed to load ticket types:', typesResponse.statusText);
				ticketTypes = [];
			}
		} catch (error) {
			console.error('Failed to load data:', error);
			conference = null;
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
					<div class="flex items-center gap-1 mb-1">
						<label for="early-bird-start" class="text-sm font-medium">Early Bird Start Date</label>
						<HelpIcon helpId="field-early-bird-start" position="right">
							{@html getHelpContent('field-early-bird-start').content}
						</HelpIcon>
					</div>
					<input
						id="early-bird-start"
						type="date"
						bind:value={earlyBirdSettings.earlyBirdStartDate}
						class="w-full px-3 py-2 border rounded"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label for="early-bird-end" class="text-sm font-medium">Early Bird End Date</label>
						<HelpIcon helpId="field-early-bird-end" position="right">
							{@html getHelpContent('field-early-bird-end').content}
						</HelpIcon>
					</div>
					<input
						id="early-bird-end"
						type="date"
						bind:value={earlyBirdSettings.earlyBirdEndDate}
						class="w-full px-3 py-2 border rounded"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label for="early-bird-discount" class="text-sm font-medium">Discount Amount (£)</label>
						<HelpIcon helpId="field-early-bird-discount" position="right">
							{@html getHelpContent('field-early-bird-discount').content}
						</HelpIcon>
					</div>
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
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Name *</label>
						<HelpIcon helpId="field-ticket-name" position="right">
							{@html getHelpContent('field-ticket-name').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.name}
						class="w-full px-3 py-2 border rounded"
						placeholder="Adult - Non-Camping"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Type</label>
							<HelpIcon helpId="field-ticket-type" position="right">
								{@html getHelpContent('field-ticket-type').content}
							</HelpIcon>
						</div>
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
						<div class="flex items-center gap-1">
							<label>Camping Option</label>
							<HelpIcon helpId="field-ticket-camping" position="right">
								{@html getHelpContent('field-ticket-camping').content}
							</HelpIcon>
						</div>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Regular Price (£) *</label>
							<HelpIcon helpId="field-ticket-regular-price" position="right">
								{@html getHelpContent('field-ticket-regular-price').content}
							</HelpIcon>
						</div>
						<input
							type="number"
							bind:value={editing.price}
							class="w-full px-3 py-2 border rounded"
							min="0"
							step="0.01"
						/>
					</div>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Early Bird Price (£)</label>
							<HelpIcon helpId="field-ticket-early-bird-price" position="right">
								{@html getHelpContent('field-ticket-early-bird-price').content}
							</HelpIcon>
						</div>
						<input
							type="number"
							bind:value={editing.earlyBirdPrice}
							class="w-full px-3 py-2 border rounded"
							min="0"
							step="0.01"
						/>
					</div>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Late Price (£)</label>
							<HelpIcon helpId="field-ticket-late-price" position="right">
								{@html getHelpContent('field-ticket-late-price').content}
							</HelpIcon>
						</div>
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
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Early Bird End Date</label>
							<HelpIcon helpId="field-ticket-early-bird-end" position="right">
								{@html getHelpContent('field-ticket-early-bird-end').content}
							</HelpIcon>
						</div>
						<input
							type="date"
							bind:value={editing.earlyBirdEndDate}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Late Price Start Date</label>
							<HelpIcon helpId="field-ticket-late-start" position="right">
								{@html getHelpContent('field-ticket-late-start').content}
							</HelpIcon>
						</div>
						<input
							type="date"
							bind:value={editing.latePriceStartDate}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Capacity</label>
							<HelpIcon helpId="field-ticket-capacity" position="right">
								{@html getHelpContent('field-ticket-capacity').content}
							</HelpIcon>
						</div>
						<input
							type="number"
							bind:value={editing.capacity}
							class="w-full px-3 py-2 border rounded"
							min="0"
						/>
					</div>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Min Age</label>
							<HelpIcon helpId="field-ticket-min-age" position="right">
								{@html getHelpContent('field-ticket-min-age').content}
							</HelpIcon>
						</div>
						<input
							type="number"
							bind:value={editing.ageMin}
							class="w-full px-3 py-2 border rounded"
							min="0"
						/>
					</div>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Max Age</label>
							<HelpIcon helpId="field-ticket-max-age" position="right">
								{@html getHelpContent('field-ticket-max-age').content}
							</HelpIcon>
						</div>
						<input
							type="number"
							bind:value={editing.ageMax}
							class="w-full px-3 py-2 border rounded"
							min="0"
						/>
					</div>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Description</label>
						<HelpIcon helpId="field-ticket-description" position="right">
							{@html getHelpContent('field-ticket-description').content}
						</HelpIcon>
					</div>
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
					<div class="flex items-center gap-1">
						<label>Enabled</label>
						<HelpIcon helpId="field-ticket-enabled" position="right">
							{@html getHelpContent('field-ticket-enabled').content}
						</HelpIcon>
					</div>
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
	{:else if !conference}
		<div class="bg-red-50 border border-red-200 rounded-lg p-6">
			<h2 class="text-xl font-bold text-red-900 mb-2">Conference Not Found</h2>
			<p class="text-red-700 mb-4">The conference with ID "{params.id}" could not be found.</p>
			<button
				on:click={() => goto('/admin/conferences')}
				class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
			>
				Back to Conferences
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

