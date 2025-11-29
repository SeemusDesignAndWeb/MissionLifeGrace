<script lang="js">
	import { onMount } from 'svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';

	let navigationLinks = [];
	let navigationPages = [];
	let loading = true;
	let editing = null;
	let showForm = false;

	onMount(async () => {
		await Promise.all([loadNavigationLinks(), loadNavigationPages()]);
	});

	async function loadNavigationLinks() {
		try {
			const response = await fetch('/api/content?type=navigation-links');
			navigationLinks = await response.json();
		} catch (error) {
			console.error('Failed to load navigation links:', error);
			notifyError('Failed to load navigation links');
		} finally {
			loading = false;
		}
	}

	async function loadNavigationPages() {
		try {
			const response = await fetch('/api/navigation-pages');
			if (response.ok) {
				navigationPages = await response.json();
			}
		} catch (error) {
			console.error('Failed to load navigation pages:', error);
		}
	}

	function startEdit(link) {
		editing = link
			? { ...link }
			: {
					id: '',
					label: '',
					url: '',
					target: '_self',
					order: navigationLinks.length,
					enabled: true
				};
		showForm = true;
	}

	function cancelEdit() {
		editing = null;
		showForm = false;
	}

	async function saveLink() {
		if (!editing) return;

		if (!editing.label || !editing.url) {
			notifyError('Label and URL are required');
			return;
		}

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'navigation-link', data: editing })
			});

			if (response.ok) {
				await loadNavigationLinks();
				cancelEdit();
				notifySuccess('Navigation link saved successfully');
			} else {
				notifyError('Failed to save navigation link');
			}
		} catch (error) {
			console.error('Failed to save navigation link:', error);
			notifyError('Failed to save navigation link');
		}
	}

	async function deleteLink(id) {
		if (!confirm('Are you sure you want to delete this navigation link?')) return;

		try {
			const response = await fetch(`/api/content?type=navigation-link&id=${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadNavigationLinks();
				notifySuccess('Navigation link deleted successfully');
			} else {
				notifyError('Failed to delete navigation link');
			}
		} catch (error) {
			console.error('Failed to delete navigation link:', error);
			notifyError('Failed to delete navigation link');
		}
	}

	function getNavigationLabel(item) {
		return item.navigationLabel || item.title || 'Untitled';
	}
</script>

<svelte:head>
	<title>Navigation Links - Admin</title>
</svelte:head>

	<div class="container mx-auto px-4 py-8 admin-page">
	<h1 class="text-3xl font-bold mb-6">Navigation Links</h1>
	<p class="text-gray-600 mb-6">
		Manage custom navigation links that appear in the main navbar. These can be external URLs, anchor links, or any custom path.
	</p>

	<!-- Current Navigation Order Reference -->
	{#if navigationPages.length > 0}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
			<h3 class="text-sm font-semibold text-blue-900 mb-2">Current Navigation Order (for reference)</h3>
			<div class="text-xs text-blue-800 space-y-1">
				<p class="font-semibold mb-2">Lower order numbers appear first. Use this to position your custom links:</p>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
					{#each navigationPages.sort((a, b) => (a.navigationOrder || 999) - (b.navigationOrder || 999)) as item}
						<div class="flex items-center gap-2">
							<span class="font-mono text-blue-600">{(item.navigationOrder !== undefined ? item.navigationOrder : 999).toString().padStart(3, '0')}</span>
							<span class="text-blue-800">
								{item.type === 'link' ? '🔗' : '📄'} {getNavigationLabel(item)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<script>
		function getNavigationLabel(item) {
			return item.navigationLabel || item.title || 'Untitled';
		}
	</script>

	{#if showForm && editing}
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">
					{editing.id ? 'Edit Link' : 'New Link'}
				</h2>
				<div class="flex gap-2">
					<button
						on:click={saveLink}
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
					<label class="block text-sm font-medium mb-1">Label *</label>
					<input
						type="text"
						bind:value={editing.label}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., Contact Us"
					/>
					<p class="text-xs text-gray-500 mt-1">The text that appears in the navigation menu</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">URL *</label>
					<input
						type="text"
						bind:value={editing.url}
						class="w-full px-3 py-2 border rounded"
						placeholder="e.g., /contact, https://example.com, /#section, or /page#section"
					/>
					<div class="text-xs text-gray-500 mt-1 space-y-1">
						<p><strong>Anchor Links (sections on pages):</strong></p>
						<ul class="list-disc list-inside ml-2 space-y-0.5">
							<li>Home page section: <code class="bg-gray-100 px-1 rounded">/#section-id</code></li>
							<li>Other page section: <code class="bg-gray-100 px-1 rounded">/page-id#section-id</code></li>
							<li>Current page section: <code class="bg-gray-100 px-1 rounded">#section-id</code></li>
						</ul>
						<p class="mt-2"><strong>Other options:</strong> Relative path (<code class="bg-gray-100 px-1 rounded">/page</code>) or external URL (<code class="bg-gray-100 px-1 rounded">https://example.com</code>)</p>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Target</label>
					<select bind:value={editing.target} class="w-full px-3 py-2 border rounded">
						<option value="_self">Same Window</option>
						<option value="_blank">New Window</option>
					</select>
					<p class="text-xs text-gray-500 mt-1">How the link should open (usually "New Window" for external URLs)</p>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Order</label>
					<input
						type="number"
						bind:value={editing.order}
						class="w-full px-3 py-2 border rounded"
						placeholder="999"
					/>
					<div class="text-xs text-gray-500 mt-1 space-y-1">
						<p><strong>Lower numbers appear first.</strong> Use the reference above to see current navigation order.</p>
						<p><strong>Tips:</strong></p>
						<ul class="list-disc list-inside ml-2 space-y-0.5">
							<li>Conferences: Order 1</li>
							<li>Most pages: Order 2-10</li>
							<li>To place after a page: Use that page's order + 1</li>
							<li>To place before a page: Use that page's order - 1</li>
						</ul>
					</div>
				</div>
				<div>
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={editing.enabled}
							class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
						/>
						<span class="text-sm font-medium">Enabled</span>
					</label>
					<p class="text-xs text-gray-500 mt-1 ml-6">When disabled, the link will not appear in the navigation</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="flex justify-between items-center mb-4">
		<h2 class="text-xl font-semibold">All Navigation Links</h2>
		<button
			on:click={() => startEdit()}
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
		>
			Add New Link
		</button>
	</div>

	{#if loading}
		<p>Loading...</p>
	{:else if navigationLinks.length === 0}
		<p class="text-gray-600">No navigation links found. Create your first link!</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each navigationLinks.sort((a, b) => (a.order || 999) - (b.order || 999)) as link}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{link.label}</td>
							<td class="px-6 py-4 text-sm">
								<a href={link.url} target={link.target} class="text-primary hover:underline" rel="noopener noreferrer">
									{link.url}
								</a>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{link.target || '_self'}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{link.order !== undefined ? link.order : 999}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-2 py-1 text-xs rounded-full {link.enabled !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
									{link.enabled !== false ? 'Enabled' : 'Disabled'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<button
									on:click={() => startEdit(link)}
									class="text-primary hover:text-primary-dark mr-3"
								>
									Edit
								</button>
								<button
									on:click={() => deleteLink(link.id)}
									class="text-red-600 hover:text-red-800"
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

