<script lang="js">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	export let params = {};

	let conferences = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let showImagePicker = false;

	onMount(async () => {
		await loadConferences();
	});

	async function loadConferences() {
		try {
			const response = await fetch('/api/content?type=conferences');
			conferences = await response.json();
		} catch (error) {
			console.error('Failed to load conferences:', error);
		} finally {
			loading = false;
		}
	}

	function startEdit(conference) {
		if (conference) {
			editing = {
				...conference,
				description: conference.description || '',
				schedule: conference.schedule || '',
				venue: conference.venue || {},
				startDate: conference.startDate || '',
				endDate: conference.endDate || '',
				registrationOpen: conference.registrationOpen !== undefined ? conference.registrationOpen : true,
				published: conference.published !== undefined ? conference.published : false,
				supportingPages: {
					worshipAndMinistry: conference.supportingPages?.worshipAndMinistry || '',
					kidsActivities: conference.supportingPages?.kidsActivities || '',
					youthActivities: conference.supportingPages?.youthActivities || '',
					socialActivities: conference.supportingPages?.socialActivities || '',
					accommodation: conference.supportingPages?.accommodation || '',
					whatYouNeed: conference.supportingPages?.whatYouNeed || ''
				}
			};
		} else {
			editing = {
				id: `conf-${Date.now()}`,
				title: '',
				slug: '',
				description: '',
				schedule: '',
				venue: {
					name: '',
					address: '',
					city: '',
					postcode: '',
					country: ''
				},
				startDate: '',
				endDate: '',
				startTime: '',
				endTime: '',
				images: [],
				registrationOpen: true,
				published: false,
				paymentSettings: {
					paypalEnabled: true,
					payLaterEnabled: true,
					depositAmount: 0,
					depositPercentage: 0,
					installmentCount: 3,
					installmentInterval: 30 // days
				},
				supportingPages: {
					worshipAndMinistry: '',
					kidsActivities: '',
					youthActivities: '',
					socialActivities: '',
					accommodation: '',
					whatYouNeed: ''
				}
			};
		}
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
			if (!editing.images) editing.images = [];
			if (!editing.images.includes(imagePath)) {
				editing.images.push(imagePath);
			}
		}
		showImagePicker = false;
	}

	function removeImage(index) {
		if (editing && editing.images) {
			editing.images.splice(index, 1);
			editing = { ...editing };
		}
	}


	async function saveConference() {
		if (!editing) return;

		if (!editing.title || !editing.startDate) {
			notifyError('Please fill in Title and Start Date');
			return;
		}

		// Generate slug if not provided
		if (!editing.slug && editing.title) {
			editing.slug = editing.title.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'conference', data: editing })
			});

			if (response.ok) {
				await loadConferences();
				cancelEdit();
				notifySuccess('Conference saved successfully');
			} else {
				const error = await response.json();
				notifyError(error.error || 'Failed to save conference');
			}
		} catch (error) {
			console.error('Failed to save conference:', error);
			notifyError('Failed to save conference');
		}
	}

	async function deleteConference(id) {
		if (!confirm('Are you sure you want to delete this conference? This will also delete all associated bookings, attendees, and ticket types.')) return;

		try {
			const response = await fetch(`/api/content?type=conference&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadConferences();
				notifySuccess('Conference deleted successfully');
			} else {
				notifyError('Failed to delete conference');
			}
		} catch (error) {
			console.error('Failed to delete conference:', error);
			notifyError('Failed to delete conference');
		}
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function manageTicketTypes(conferenceId) {
		goto(`/admin/conferences/${conferenceId}/ticket-types`);
	}
</script>

<svelte:head>
	<title>Manage Conferences - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Manage Conferences</h1>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Conference
		</button>
	</div>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Conference' : 'New Conference'}
				</h2>
				<div class="flex gap-2">
					<button
						on:click={saveConference}
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
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Conference ID</label>
						<input
							type="text"
							bind:value={editing.id}
							class="w-full px-3 py-2 border rounded"
							placeholder="conf-2024"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Slug (URL)</label>
						<input
							type="text"
							bind:value={editing.slug}
							class="w-full px-3 py-2 border rounded"
							placeholder="conference-2024"
						/>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Title *</label>
					<input
						type="text"
						bind:value={editing.title}
						class="w-full px-3 py-2 border rounded"
						placeholder="Annual Conference 2024"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Description</label>
					<RichTextEditor bind:value={editing.description} />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Start Date *</label>
						<input
							type="date"
							bind:value={editing.startDate}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">End Date</label>
						<input
							type="date"
							bind:value={editing.endDate}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Start Time</label>
						<input
							type="time"
							bind:value={editing.startTime}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">End Time</label>
						<input
							type="time"
							bind:value={editing.endTime}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Schedule</label>
					<RichTextEditor bind:value={editing.schedule} />
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Venue</label>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<input
								type="text"
								bind:value={editing.venue.name}
								class="w-full px-3 py-2 border rounded"
								placeholder="Venue Name"
							/>
						</div>
						<div>
							<input
								type="text"
								bind:value={editing.venue.address}
								class="w-full px-3 py-2 border rounded"
								placeholder="Address"
							/>
						</div>
						<div>
							<input
								type="text"
								bind:value={editing.venue.city}
								class="w-full px-3 py-2 border rounded"
								placeholder="City"
							/>
						</div>
						<div>
							<input
								type="text"
								bind:value={editing.venue.postcode}
								class="w-full px-3 py-2 border rounded"
								placeholder="Postcode"
							/>
						</div>
						<div>
							<input
								type="text"
								bind:value={editing.venue.country}
								class="w-full px-3 py-2 border rounded"
								placeholder="Country"
							/>
						</div>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Images</label>
					<div class="flex flex-wrap gap-2 mb-2">
						{#if editing.images && editing.images.length > 0}
							{#each editing.images as image, index}
								<div class="relative">
									<img src={image} alt="Conference" class="w-24 h-24 object-cover rounded" />
									<button
										on:click={() => removeImage(index)}
										class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
									>
										×
									</button>
								</div>
							{/each}
						{/if}
					</div>
					<button
						on:click={openImagePicker}
						class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
					>
						Add Image
					</button>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Supporting Pages</label>
					<div class="space-y-4 border rounded p-4 bg-gray-50">
						<div>
							<label class="block text-sm font-medium mb-1">Worship and Ministry</label>
							<RichTextEditor bind:value={editing.supportingPages.worshipAndMinistry} />
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Kids Activities</label>
							<RichTextEditor bind:value={editing.supportingPages.kidsActivities} />
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Youth Activities</label>
							<RichTextEditor bind:value={editing.supportingPages.youthActivities} />
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Social Activities</label>
							<RichTextEditor bind:value={editing.supportingPages.socialActivities} />
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Accommodation</label>
							<RichTextEditor bind:value={editing.supportingPages.accommodation} />
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">What You Need</label>
							<RichTextEditor bind:value={editing.supportingPages.whatYouNeed} />
						</div>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Payment Settings</label>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex items-center">
							<input
								type="checkbox"
								bind:checked={editing.paymentSettings.paypalEnabled}
								class="mr-2"
							/>
							<label>PayPal Enabled</label>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								bind:checked={editing.paymentSettings.payLaterEnabled}
								class="mr-2"
							/>
							<label>Pay Later (BNPL) Enabled</label>
						</div>
						<div>
							<label class="block text-xs text-gray-600 mb-1">Deposit Amount (£)</label>
							<input
								type="number"
								bind:value={editing.paymentSettings.depositAmount}
								class="w-full px-3 py-2 border rounded"
								min="0"
								step="0.01"
							/>
						</div>
						<div>
							<label class="block text-xs text-gray-600 mb-1">Deposit Percentage (%)</label>
							<input
								type="number"
								bind:value={editing.paymentSettings.depositPercentage}
								class="w-full px-3 py-2 border rounded"
								min="0"
								max="100"
							/>
						</div>
						<div>
							<label class="block text-xs text-gray-600 mb-1">Installment Count</label>
							<input
								type="number"
								bind:value={editing.paymentSettings.installmentCount}
								class="w-full px-3 py-2 border rounded"
								min="2"
								max="12"
							/>
						</div>
						<div>
							<label class="block text-xs text-gray-600 mb-1">Installment Interval (days)</label>
							<input
								type="number"
								bind:value={editing.paymentSettings.installmentInterval}
								class="w-full px-3 py-2 border rounded"
								min="7"
							/>
						</div>
					</div>
				</div>
				<div class="flex gap-4">
					<div class="flex items-center">
						<input
							type="checkbox"
							bind:checked={editing.registrationOpen}
							class="mr-2"
						/>
						<label>Registration Open</label>
					</div>
					<div class="flex items-center">
						<input
							type="checkbox"
							bind:checked={editing.published}
							class="mr-2"
						/>
						<label>Published</label>
					</div>
				</div>
				<div class="flex gap-2 pt-4">
					<button
						on:click={saveConference}
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
	{:else if conferences.length === 0}
		<p class="text-gray-600">No conferences found. Add your first conference!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Title
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Start Date
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							End Date
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
					{#each conferences.sort((a, b) => {
						const dateA = new Date(a.startDate || '9999-12-31');
						const dateB = new Date(b.startDate || '9999-12-31');
						return dateA.getTime() - dateB.getTime();
					}) as conference}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex items-center gap-2">
									{conference.title}
									{#if conference.published}
										<span class="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full">Published</span>
									{/if}
									{#if conference.registrationOpen}
										<span class="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Open</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(conference.startDate)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(conference.endDate)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-3 py-1 text-xs rounded-full {conference.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
									{conference.published ? 'Published' : 'Draft'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex gap-2">
									<button
										on:click={() => startEdit(conference)}
										class="text-primary hover:underline"
									>
										Edit
									</button>
									<button
										on:click={() => manageTicketTypes(conference.id)}
										class="text-blue-600 hover:underline"
									>
										Ticket Types
									</button>
									<button
										on:click={() => deleteConference(conference.id)}
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

<ImagePicker open={showImagePicker} onSelect={handleImageSelect} />

