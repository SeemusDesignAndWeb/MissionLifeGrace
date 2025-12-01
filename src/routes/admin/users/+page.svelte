<script lang="js">
	import { onMount } from 'svelte';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';

	export let data;

	let users = [];
	let loading = false;
	let error = '';
	let showCreateModal = false;
	let showEditModal = false;
	let selectedUser = null;
	
	// Form fields
	let formEmail = '';
	let formPassword = '';
	let formName = '';
	let formAccessLevel = 'conference_access';
	let formActive = true;
	let formError = '';
	let formLoading = false;

	const ACCESS_LEVELS = {
		full_access: 'Full Access',
		editor_access: 'Editor Access',
		conference_access: 'Conference Access'
	};

	onMount(async () => {
		await loadUsers();
	});

	async function loadUsers() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				const data = await response.json();
				users = data.users || [];
			} else {
				error = 'Failed to load users';
			}
		} catch (err) {
			error = 'An error occurred while loading users';
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		formEmail = '';
		formPassword = '';
		formName = '';
		formAccessLevel = 'conference_access';
		formActive = true;
		formError = '';
		showCreateModal = true;
	}

	function openEditModal(user) {
		selectedUser = user;
		formEmail = user.email || '';
		formPassword = '';
		formName = user.name || '';
		formAccessLevel = user.accessLevel || 'conference_access';
		formActive = user.active !== false;
		formError = '';
		showEditModal = true;
	}

	function closeModals() {
		showCreateModal = false;
		showEditModal = false;
		selectedUser = null;
		formError = '';
	}

	async function handleCreate() {
		formError = '';
		formLoading = true;

		if (!formEmail) {
			formError = 'Email is required';
			formLoading = false;
			return;
		}

		if (!formPassword || formPassword.length < 8) {
			formError = 'Password must be at least 8 characters';
			formLoading = false;
			return;
		}

		try {
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: formEmail,
					password: formPassword,
					name: formName || formEmail,
					accessLevel: formAccessLevel,
					active: formActive
				})
			});

			if (response.ok) {
				closeModals();
				await loadUsers();
			} else {
				const data = await response.json();
				formError = data.error || 'Failed to create user';
			}
		} catch (err) {
			formError = 'An error occurred';
		} finally {
			formLoading = false;
		}
	}

	async function handleUpdate() {
		formError = '';
		formLoading = true;

		if (!formEmail) {
			formError = 'Email is required';
			formLoading = false;
			return;
		}

		if (formPassword && formPassword.length < 8) {
			formError = 'Password must be at least 8 characters';
			formLoading = false;
			return;
		}

		try {
			const response = await fetch('/api/admin/users', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: selectedUser.id,
					email: formEmail,
					password: formPassword || null,
					name: formName || formEmail,
					accessLevel: formAccessLevel,
					active: formActive
				})
			});

			if (response.ok) {
				closeModals();
				await loadUsers();
			} else {
				const data = await response.json();
				formError = data.error || 'Failed to update user';
			}
		} catch (err) {
			formError = 'An error occurred';
		} finally {
			formLoading = false;
		}
	}

	async function handleDelete(user) {
		if (!confirm(`Are you sure you want to delete ${user.name || user.email}?`)) {
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/admin/users?id=${user.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadUsers();
			} else {
				const data = await response.json();
				alert(data.error || 'Failed to delete user');
			}
		} catch (err) {
			alert('An error occurred');
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return 'Never';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Admin Users - MLG</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<div class="flex items-center gap-2">
			<h1 class="text-3xl font-bold text-gray-900">Admin Users</h1>
			<HelpIcon helpId="admin-users-page" position="right">
				{@html getHelpContent('admin-users-page').content}
			</HelpIcon>
		</div>
		<button
			on:click={openCreateModal}
			class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
		>
			+ Add Admin User
		</button>
	</div>

	{#if error}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
			{error}
		</div>
	{/if}

	{#if loading && users.length === 0}
		<p>Loading users...</p>
	{:else if users.length === 0}
		<div class="bg-white rounded-lg shadow p-8 text-center">
			<p class="text-gray-600 mb-4">No admin users found.</p>
			<button
				on:click={openCreateModal}
				class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
			>
				Create First Admin User
			</button>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Level</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each users as user}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{user.name}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
								{user.email || 'N/A'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-2 py-1 text-xs rounded {
									user.accessLevel === 'full_access' ? 'bg-purple-100 text-purple-800' :
									user.accessLevel === 'editor_access' ? 'bg-blue-100 text-blue-800' :
									'bg-green-100 text-green-800'
								}">
									{ACCESS_LEVELS[user.accessLevel] || user.accessLevel}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-2 py-1 text-xs rounded {
									user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
								}">
									{user.active ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
								{formatDate(user.lastLogin)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<div class="flex gap-2">
									<button
										on:click={() => openEditModal(user)}
										class="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
									>
										Edit
									</button>
									{#if user.id !== data.adminUser?.id}
										<button
											on:click={() => handleDelete(user)}
											class="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
										>
											Delete
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Create User Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg max-w-md w-full shadow-xl">
			<div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
				<h2 class="text-2xl font-bold text-gray-900">Create Admin User</h2>
				<button
					on:click={closeModals}
					class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					aria-label="Close"
				>
					×
				</button>
			</div>
			
			<div class="p-6">
				{#if formError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
						{formError}
					</div>
				{/if}

				<form on:submit|preventDefault={handleCreate} class="space-y-4">
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="create-email" class="text-sm font-medium text-gray-700">
								Email *
							</label>
							<HelpIcon helpId="field-user-email" position="right">
								{@html getHelpContent('field-user-email').content}
							</HelpIcon>
						</div>
						<input
							id="create-email"
							type="email"
							required
							bind:value={formEmail}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="user@example.com"
						/>
					</div>

					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="create-name" class="text-sm font-medium text-gray-700">
								Name
							</label>
							<HelpIcon helpId="field-user-name" position="right">
								{@html getHelpContent('field-user-name').content}
							</HelpIcon>
						</div>
						<input
							id="create-name"
							type="text"
							bind:value={formName}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Full Name"
						/>
					</div>

					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="create-password" class="text-sm font-medium text-gray-700">
								Password *
							</label>
							<HelpIcon helpId="field-user-password" position="right">
								{@html getHelpContent('field-user-password').content}
							</HelpIcon>
						</div>
						<input
							id="create-password"
							type="password"
							bind:value={formPassword}
							required
							minlength="8"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Minimum 8 characters"
						/>
					</div>

					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="create-access-level" class="text-sm font-medium text-gray-700">
								Access Level *
							</label>
							<HelpIcon helpId="field-user-access-level" position="right">
								{@html getHelpContent('field-user-access-level').content}
							</HelpIcon>
						</div>
						<select
							id="create-access-level"
							bind:value={formAccessLevel}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="full_access">Full Access (All content, conference and admin user setup)</option>
							<option value="editor_access">Editor Access (All content and front end website updates excluding Conference)</option>
							<option value="conference_access">Conference Access (Just conference access)</option>
						</select>
					</div>

					<div class="flex items-center">
						<input
							id="create-active"
							type="checkbox"
							bind:checked={formActive}
							class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
						/>
						<label for="create-active" class="ml-2 text-sm text-gray-700">
							Active
						</label>
					</div>

					<div class="flex justify-end gap-3 pt-4 border-t">
						<button
							type="button"
							on:click={closeModals}
							disabled={formLoading}
							class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={formLoading}
							class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold disabled:opacity-50"
						>
							{formLoading ? 'Creating...' : 'Create User'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Edit User Modal -->
{#if showEditModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg max-w-md w-full shadow-xl">
			<div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
				<h2 class="text-2xl font-bold text-gray-900">Edit Admin User</h2>
				<button
					on:click={closeModals}
					class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					aria-label="Close"
				>
					×
				</button>
			</div>
			
			<div class="p-6">
				{#if formError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
						{formError}
					</div>
				{/if}

				<form on:submit|preventDefault={handleUpdate} class="space-y-4">
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="edit-email" class="text-sm font-medium text-gray-700">
								Email *
							</label>
							<HelpIcon helpId="field-user-email" position="right">
								{@html getHelpContent('field-user-email').content}
							</HelpIcon>
						</div>
						<input
							id="edit-email"
							type="email"
							required
							bind:value={formEmail}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="user@example.com"
						/>
					</div>

					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="edit-name" class="text-sm font-medium text-gray-700">
								Name
							</label>
							<HelpIcon helpId="field-user-name" position="right">
								{@html getHelpContent('field-user-name').content}
							</HelpIcon>
						</div>
						<input
							id="edit-name"
							type="text"
							bind:value={formName}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Full Name"
						/>
					</div>

					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="edit-password" class="text-sm font-medium text-gray-700">
								New Password (leave blank to keep current)
							</label>
							<HelpIcon helpId="field-user-password" position="right">
								{@html getHelpContent('field-user-password').content}
							</HelpIcon>
						</div>
						<input
							id="edit-password"
							type="password"
							bind:value={formPassword}
							minlength="8"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Minimum 8 characters"
						/>
					</div>

					<div>
						<div class="flex items-center gap-1 mb-1">
							<label for="edit-access-level" class="text-sm font-medium text-gray-700">
								Access Level *
							</label>
							<HelpIcon helpId="field-user-access-level" position="right">
								{@html getHelpContent('field-user-access-level').content}
							</HelpIcon>
						</div>
						<select
							id="edit-access-level"
							bind:value={formAccessLevel}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="full_access">Full Access (All content, conference and admin user setup)</option>
							<option value="editor_access">Editor Access (All content and front end website updates excluding Conference)</option>
							<option value="conference_access">Conference Access (Just conference access)</option>
						</select>
					</div>

					<div class="flex items-center">
						<input
							id="edit-active"
							type="checkbox"
							bind:checked={formActive}
							class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
						/>
						<label for="edit-active" class="ml-2 text-sm text-gray-700">
							Active
						</label>
					</div>

					<div class="flex justify-end gap-3 pt-4 border-t">
						<button
							type="button"
							on:click={closeModals}
							disabled={formLoading}
							class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={formLoading}
							class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold disabled:opacity-50"
						>
							{formLoading ? 'Updating...' : 'Update User'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

