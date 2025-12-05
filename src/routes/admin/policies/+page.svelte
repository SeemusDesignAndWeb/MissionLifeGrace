<script lang="js">
	import { onMount } from 'svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import { notifyError, notifySuccess } from '$lib/utils/notify';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';

	let policies = {
		privacyPolicy: { title: '', content: '' },
		termsAndConditions: { title: '', content: '' },
		cookiePolicy: { title: '', content: '' }
	};
	let loading = true;
	let editing = null;
	let showForm = false;

	onMount(async () => {
		await loadPolicies();
	});

	async function loadPolicies() {
		try {
			const response = await fetch('/api/content?type=policies');
			if (response.ok) {
				const data = await response.json();
				console.log('Loaded policies data:', data);
				policies = {
					privacyPolicy: data.privacyPolicy || { title: 'Privacy Policy', content: '' },
					termsAndConditions: data.termsAndConditions || { title: 'Terms and Conditions', content: '' },
					cookiePolicy: data.cookiePolicy || { title: 'Cookie Policy', content: '' }
				};
				console.log('Policies after assignment:', policies);
			} else {
				console.error('Failed to load policies:', response.status, response.statusText);
				notifyError('Failed to load policies');
			}
		} catch (error) {
			console.error('Failed to load policies:', error);
			notifyError('Failed to load policies');
		} finally {
			loading = false;
		}
	}

	function startEdit(policyType) {
		console.log('Starting edit for:', policyType);
		console.log('Policy data:', policies[policyType]);
		editing = {
			type: policyType,
			title: policies[policyType]?.title || '',
			content: policies[policyType]?.content || ''
		};
		console.log('Editing object:', editing);
		showForm = true;
	}

	function cancelEdit() {
		editing = null;
		showForm = false;
	}

	async function savePolicy() {
		if (!editing) return;

		try {
			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'policy', data: editing })
			});

			if (response.ok) {
				await loadPolicies();
				cancelEdit();
				notifySuccess('Policy saved successfully');
			} else {
				notifyError('Failed to save policy');
			}
		} catch (error) {
			console.error('Failed to save policy:', error);
			notifyError('Failed to save policy');
		}
	}
</script>

<svelte:head>
	<title>Policy Pages - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<h1 class="text-3xl font-bold mb-6">Policy Pages</h1>
	<p class="text-gray-600 mb-6">
		Manage the content for Privacy Policy, Terms and Conditions, and Cookie Policy pages.
	</p>

	{#if showForm && editing}
		<div class="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
			<!-- Header -->
			<div class="bg-gradient-to-r from-primary to-brand-blue text-white px-6 py-4">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-bold text-white">Edit {editing.title}</h2>
					<div class="flex gap-2">
						<button
							on:click={savePolicy}
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
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Title</label>
							<HelpIcon helpId="field-policy-title" position="right">
								{@html getHelpContent('field-policy-title').content}
							</HelpIcon>
						</div>
						<input
							type="text"
							bind:value={editing.title}
							class="w-full px-3 py-2 border rounded-lg bg-white"
						/>
					</div>
				</div>

				<!-- Content Panel -->
				<div class="bg-brand-cyan/5 rounded-lg p-5 border border-brand-cyan/20">
					<h3 class="text-lg font-semibold text-brand-cyan mb-4">Content</h3>
					<div>
						<div class="flex items-center gap-1 mb-1">
							<label class="text-sm font-medium">Content</label>
							<HelpIcon helpId="field-policy-content" position="right">
								{@html getHelpContent('field-policy-content').content}
							</HelpIcon>
						</div>
						<div class="relative" style="height: 500px;">
							<RichTextEditor bind:value={editing.content} height="480px" />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<p>Loading...</p>
	{:else}
		<div class="grid md:grid-cols-3 gap-6">
			<!-- Privacy Policy -->
			<div class="bg-white rounded-lg shadow p-6">
				<h3 class="text-xl font-semibold mb-2">{policies.privacyPolicy.title || 'Privacy Policy'}</h3>
				<p class="text-gray-600 text-sm mb-2">
					Edit the privacy policy content that appears on the /privacy-policy page.
				</p>
				{#if policies.privacyPolicy.content}
					<p class="text-xs text-gray-500 mb-2">
						Content: {policies.privacyPolicy.content.length} characters
					</p>
				{/if}
				{#if policies.privacyPolicy.lastUpdated}
					<p class="text-xs text-gray-500 mb-4">
						Last updated: {new Date(policies.privacyPolicy.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
					</p>
				{:else}
					<p class="text-xs text-gray-500 mb-4">No content yet</p>
				{/if}
				<button
					on:click={() => startEdit('privacyPolicy')}
					class="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
				>
					Edit Privacy Policy
				</button>
			</div>

			<!-- Terms and Conditions -->
			<div class="bg-white rounded-lg shadow p-6">
				<h3 class="text-xl font-semibold mb-2">{policies.termsAndConditions.title || 'Terms and Conditions'}</h3>
				<p class="text-gray-600 text-sm mb-2">
					Edit the terms and conditions content that appears on the /terms-and-conditions page.
				</p>
				{#if policies.termsAndConditions.content}
					<p class="text-xs text-gray-500 mb-2">
						Content: {policies.termsAndConditions.content.length} characters
					</p>
				{/if}
				{#if policies.termsAndConditions.lastUpdated}
					<p class="text-xs text-gray-500 mb-4">
						Last updated: {new Date(policies.termsAndConditions.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
					</p>
				{:else}
					<p class="text-xs text-gray-500 mb-4">No content yet</p>
				{/if}
				<button
					on:click={() => startEdit('termsAndConditions')}
					class="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
				>
					Edit Terms & Conditions
				</button>
			</div>

			<!-- Cookie Policy -->
			<div class="bg-white rounded-lg shadow p-6">
				<h3 class="text-xl font-semibold mb-2">{policies.cookiePolicy.title || 'Cookie Policy'}</h3>
				<p class="text-gray-600 text-sm mb-2">
					Edit the cookie policy content that appears on the /cookie-policy page.
				</p>
				{#if policies.cookiePolicy.content}
					<p class="text-xs text-gray-500 mb-2">
						Content: {policies.cookiePolicy.content.length} characters
					</p>
				{/if}
				{#if policies.cookiePolicy.lastUpdated}
					<p class="text-xs text-gray-500 mb-4">
						Last updated: {new Date(policies.cookiePolicy.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
					</p>
				{:else}
					<p class="text-xs text-gray-500 mb-4">No content yet</p>
				{/if}
				<button
					on:click={() => startEdit('cookiePolicy')}
					class="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
				>
					Edit Cookie Policy
				</button>
			</div>
		</div>
	{/if}
</div>

