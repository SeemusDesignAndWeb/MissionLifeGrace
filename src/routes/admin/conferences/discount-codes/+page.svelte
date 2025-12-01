<script lang="js">
	import { onMount } from 'svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';

	let conferences = [];
	let discountCodes = [];
	let selectedConferenceId = '';
	let loading = true;
	let editing = null;
	let showForm = false;

	onMount(async () => {
		await loadConferences();
		await loadDiscountCodes();
	});

	async function loadConferences() {
		try {
			const response = await fetch('/api/content?type=conferences');
			conferences = await response.json();
		} catch (error) {
			console.error('Failed to load conferences:', error);
		}
	}

	async function loadDiscountCodes() {
		try {
			const response = await fetch('/api/content?type=conference-discount-codes');
			discountCodes = await response.json();
		} catch (error) {
			console.error('Failed to load discount codes:', error);
		} finally {
			loading = false;
		}
	}

	function filterCodes() {
		if (!selectedConferenceId) return discountCodes;
		return discountCodes.filter(code => code.conferenceId === selectedConferenceId);
	}

	function startEdit(discountCode) {
		if (discountCode) {
			editing = { ...discountCode };
		} else {
			editing = {
				id: `discount-${Date.now()}`,
				conferenceId: selectedConferenceId || '',
				code: '',
				type: 'percentage', // percentage or fixed
				value: 0,
				applicableTicketTypes: [], // empty = all types
				maxUsage: 0, // 0 = unlimited
				usedCount: 0,
				expiryDate: '',
				enabled: true
			};
		}
		showForm = true;
	}

	function cancelEdit() {
		editing = null;
		showForm = false;
	}

	async function saveDiscountCode() {
		if (!editing) return;

		if (!editing.code || !editing.conferenceId) {
			notifyError('Please fill in Code and select a Conference');
			return;
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'conference-discount-code', data: editing })
			});

			if (response.ok) {
				await loadDiscountCodes();
				cancelEdit();
				notifySuccess('Discount code saved successfully');
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save discount code');
			}
		} catch (error) {
			console.error('Failed to save discount code:', error);
			notifyError('Failed to save discount code');
		}
	}

	async function deleteDiscountCode(id) {
		if (!confirm('Are you sure you want to delete this discount code?')) return;

		try {
			const response = await fetch(`/api/content?type=conference-discount-code&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadDiscountCodes();
				notifySuccess('Discount code deleted successfully');
			} else {
				notifyError('Failed to delete discount code');
			}
		} catch (error) {
			console.error('Failed to delete discount code:', error);
			notifyError('Failed to delete discount code');
		}
	}

	function getConferenceName(id) {
		const conf = conferences.find(c => c.id === id);
		return conf ? conf.title : 'Unknown';
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Discount Codes - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Discount Codes</h1>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Discount Code
		</button>
	</div>

	<div class="mb-4">
		<label class="block text-sm font-medium mb-1">Filter by Conference</label>
		<select
			bind:value={selectedConferenceId}
			class="px-3 py-2 border rounded"
		>
			<option value="">All Conferences</option>
			{#each conferences as conf}
				<option value={conf.id}>{conf.title}</option>
			{/each}
		</select>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Discount Code' : 'New Discount Code'}
				</h2>
				<div class="flex gap-2">
					<button
						on:click={saveDiscountCode}
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
						<label class="text-sm font-medium">Conference *</label>
						<HelpIcon helpId="field-discount-conference" position="right">
							{@html getHelpContent('field-discount-conference').content}
						</HelpIcon>
					</div>
					<select
						bind:value={editing.conferenceId}
						class="w-full px-3 py-2 border rounded"
					>
						<option value="">Select Conference</option>
						{#each conferences as conf}
							<option value={conf.id}>{conf.title}</option>
						{/each}
					</select>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Code *</label>
						<HelpIcon helpId="field-discount-code" position="right">
							{@html getHelpContent('field-discount-code').content}
						</HelpIcon>
					</div>
					<input
						type="text"
						bind:value={editing.code}
						class="w-full px-3 py-2 border rounded uppercase"
						placeholder="SAVE20"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Type</label>
							<HelpIcon helpId="field-discount-type" position="right">
								{@html getHelpContent('field-discount-type').content}
							</HelpIcon>
						</div>
						<select bind:value={editing.type} class="w-full px-3 py-2 border rounded">
							<option value="percentage">Percentage</option>
							<option value="fixed">Fixed Amount</option>
						</select>
					</div>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Value *</label>
							<HelpIcon helpId="field-discount-value" position="right">
								{@html getHelpContent('field-discount-value').content}
							</HelpIcon>
						</div>
						<input
							type="number"
							bind:value={editing.value}
							class="w-full px-3 py-2 border rounded"
							min="0"
							step="0.01"
							placeholder={editing.type === 'percentage' ? '20' : '10.00'}
						/>
					</div>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Max Usage (0 = unlimited)</label>
						<HelpIcon helpId="field-discount-max-usage" position="right">
							{@html getHelpContent('field-discount-max-usage').content}
						</HelpIcon>
					</div>
					<input
						type="number"
						bind:value={editing.maxUsage}
						class="w-full px-3 py-2 border rounded"
						min="0"
					/>
				</div>
				<div>
					<div class="flex items-center gap-1 mb-1">
						<label class="text-sm font-medium">Expiry Date</label>
						<HelpIcon helpId="field-discount-expiry" position="right">
							{@html getHelpContent('field-discount-expiry').content}
						</HelpIcon>
					</div>
					<input
						type="date"
						bind:value={editing.expiryDate}
						class="w-full px-3 py-2 border rounded"
					/>
				</div>
				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={editing.enabled}
						class="mr-2"
					/>
					<div class="flex items-center gap-1">
						<label>Enabled</label>
						<HelpIcon helpId="field-discount-enabled" position="right">
							{@html getHelpContent('field-discount-enabled').content}
						</HelpIcon>
					</div>
				</div>
				<div class="flex gap-2 pt-4">
					<button
						on:click={saveDiscountCode}
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
	{:else if filterCodes().length === 0}
		<p class="text-gray-600">No discount codes found. Add your first discount code!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conference</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filterCodes() as code}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								{code.code}
								{#if !code.enabled}
									<span class="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Disabled</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm">{getConferenceName(code.conferenceId)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm capitalize">{code.type}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								{code.type === 'percentage' ? `${code.value}%` : `£${code.value.toFixed(2)}`}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								{code.usedCount || 0} / {code.maxUsage || '∞'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(code.expiryDate)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									on:click={() => startEdit(code)}
									class="text-primary hover:underline mr-4"
								>
									Edit
								</button>
								<button
									on:click={() => deleteDiscountCode(code.id)}
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

