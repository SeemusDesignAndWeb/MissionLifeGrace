<script lang="js">
	import { onMount } from 'svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';

	export let params = {};
	
	// Get help content for team page (safe for SSR)
	const teamHelpContent = getHelpContent('admin-team-page');

	let team = [];
	let loading = true;
	let editing = null;
	let showForm = false;
	let showImagePicker = false;

	onMount(async () => {
		await loadTeam();
	});

	async function loadTeam() {
		try {
			const response = await fetch('/api/content?type=team');
			team = await response.json();
		} catch (error) {
			console.error('Failed to load team:', error);
		} finally {
			loading = false;
		}
	}


	const categories = [
		'Leadership Team',
		'Network Development Team',
		'Conference Development Team',
		'Conference Ministry Team'
	];

	// Auto-generate ID from name
	function generateIdFromName(name) {
		if (!name) return '';
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function startEdit(member) {
		editing = member
			? { ...member, social: member.social || {}, category: member.category || 'Leadership Team' }
			: {
					id: '',
					name: '',
					role: '',
					image: '',
					quote: '',
					category: 'Leadership Team',
					social: { facebook: '', twitter: '', instagram: '', linkedin: '' }
				};
		showForm = true;
	}

	// Auto-generate ID when name changes (only for new members or if ID is empty)
	$: if (editing && editing.name && (!editing.id || editing.id === '')) {
		editing.id = generateIdFromName(editing.name);
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

	async function saveMember() {
		if (!editing) return;

		// Ensure ID is generated if missing
		if (!editing.id && editing.name) {
			editing.id = generateIdFromName(editing.name);
		}

		if (!editing.id || !editing.name) {
			alert('Please fill in Name (ID will be auto-generated)');
			return;
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'team', data: editing })
			});

			if (response.ok) {
				await loadTeam();
				cancelEdit();
			}
		} catch (error) {
			console.error('Failed to save team member:', error);
		}
	}

	async function deleteMember(id) {
		if (!confirm('Are you sure you want to delete this team member?')) return;

		try {
			const response = await fetch(`/api/content?type=team&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadTeam();
			}
		} catch (error) {
			console.error('Failed to delete team member:', error);
		}
	}
</script>

<svelte:head>
	<title>Manage Team - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex items-center gap-2 mb-8">
		<h1 class="text-3xl font-bold">Manage Team</h1>
		<HelpIcon helpId="admin-team-page" position="right">
			{@html teamHelpContent.content}
		</HelpIcon>
	</div>

	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold">Team Members</h2>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
		>
			Add New Member
		</button>
	</div>

	{#if showForm && editing}
		<div class="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
			<!-- Header -->
			<div class="bg-gradient-to-r from-primary to-brand-blue text-white px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-bold text-white">
							{editing.id ? 'Edit Team Member' : 'New Team Member'}
						</h2>
						{#if editing.id}
							<p class="text-sm text-white/80 mt-1">ID: {editing.id}</p>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							on:click={saveMember}
							class="px-4 py-2 bg-white text-primary rounded-full hover:bg-gray-100 font-semibold transition-colors"
						>
							Save
						</button>
						<button
							on:click={cancelEdit}
							class="px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 font-semibold transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
			
			<div class="p-6 space-y-6">
				<!-- Basic Information Panel -->
				<div class="bg-primary/5 rounded-lg p-5 border border-primary/20">
					<h3 class="text-lg font-semibold text-primary mb-4">Basic Information</h3>
					<div class="space-y-4">
						<div>
							<div class="flex items-center gap-1 mb-1">
								<label class="text-sm font-medium">Name</label>
								<HelpIcon helpId="field-team-name" position="right">
									{@html getHelpContent('field-team-name').content}
								</HelpIcon>
							</div>
							<input
								type="text"
								bind:value={editing.name}
								class="w-full px-3 py-2 border rounded-lg bg-white"
							/>
						</div>
						<div>
							<div class="flex items-center gap-1 mb-1">
								<label class="text-sm font-medium">Category</label>
								<HelpIcon helpId="field-team-category" position="right">
									{@html getHelpContent('field-team-category').content}
								</HelpIcon>
							</div>
							<select
								bind:value={editing.category}
								class="w-full px-3 py-2 border rounded-lg bg-white"
							>
								{#each categories as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>
						<div>
							<div class="flex items-center gap-1 mb-1">
								<label class="text-sm font-medium">Role</label>
								<HelpIcon helpId="field-team-role" position="right">
									{@html getHelpContent('field-team-role').content}
								</HelpIcon>
							</div>
							<input
								type="text"
								bind:value={editing.role}
								class="w-full px-3 py-2 border rounded-lg bg-white"
							/>
						</div>
					</div>
				</div>

				<!-- Image Panel -->
				<div class="bg-brand-blue/5 rounded-lg p-5 border border-brand-blue/20">
					<h3 class="text-lg font-semibold text-brand-blue mb-4">Image</h3>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Image URL</label>
							<HelpIcon helpId="field-team-image" position="right">
								{@html getHelpContent('field-team-image').content}
							</HelpIcon>
						</div>
						<div class="space-y-2">
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={editing.image}
									class="flex-1 px-3 py-2 border rounded bg-white"
									placeholder="/images/team-member.jpg"
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
				</div>

				<!-- Content Panel -->
				<div class="bg-brand-cyan/5 rounded-lg p-5 border border-brand-cyan/20">
					<h3 class="text-lg font-semibold text-brand-cyan mb-4">Content</h3>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Quote</label>
							<HelpIcon helpId="field-team-quote" position="right">
								{@html getHelpContent('field-team-quote').content}
							</HelpIcon>
						</div>
						<textarea
							bind:value={editing.quote}
							rows="3"
							class="w-full px-3 py-2 border rounded-lg bg-white"
						></textarea>
					</div>
				</div>

				<!-- Social Links Panel -->
				<div class="bg-primary/5 rounded-lg p-5 border border-primary/20">
					<h3 class="text-lg font-semibold text-primary mb-4">Social Links</h3>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Social Links</label>
							<HelpIcon helpId="field-team-social" position="right">
								{@html getHelpContent('field-team-social').content}
							</HelpIcon>
						</div>
						{#if editing && editing.social}
							<div class="grid grid-cols-2 gap-2">
								<input
									type="text"
									bind:value={editing.social.facebook}
									placeholder="Facebook URL"
									class="px-3 py-2 border rounded bg-white"
								/>
								<input
									type="text"
									bind:value={editing.social.twitter}
									placeholder="Twitter URL"
									class="px-3 py-2 border rounded bg-white"
								/>
								<input
									type="text"
									bind:value={editing.social.instagram}
									placeholder="Instagram URL"
									class="px-3 py-2 border rounded bg-white"
								/>
								<input
									type="text"
									bind:value={editing.social.linkedin}
									placeholder="LinkedIn URL"
									class="px-3 py-2 border rounded bg-white"
								/>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<p>Loading...</p>
	{:else if team.length === 0}
		<p class="text-gray-600">No team members found. Add your first member!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Category
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Role
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each team.sort((a, b) => {
						const catOrder = categories.indexOf(a.category || 'Leadership Team') - categories.indexOf(b.category || 'Leadership Team');
						return catOrder !== 0 ? catOrder : (a.name || '').localeCompare(b.name || '');
					}) as member}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								{member.name}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
									{member.category || 'Leadership Team'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{member.role}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<button
									on:click={() => startEdit(member)}
									class="text-primary hover:underline mr-4"
								>
									Edit
								</button>
								<button
									on:click={() => deleteMember(member.id)}
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

