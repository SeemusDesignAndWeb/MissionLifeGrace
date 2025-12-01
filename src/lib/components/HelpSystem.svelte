<script lang="js">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { notifySuccess, notifyError } from '$lib/utils/notify';
	
	let showSupportForm = false;
	let supportFormData = {
		name: '',
		email: '',
		subject: '',
		message: '',
		page: '',
		settings: ''
	};
	let submitting = false;
	
	// Get current page info
	$: currentPage = $page.url.pathname;
	$: currentPageName = getPageName(currentPage);
	
	function getPageName(path) {
		if (path.startsWith('/admin/settings')) return 'Admin Settings';
		if (path.startsWith('/admin/conferences')) return 'Conferences Management';
		if (path.startsWith('/admin/events')) return 'Events Management';
		if (path.startsWith('/admin')) return 'Admin Dashboard';
		if (path.startsWith('/conference/')) return 'Conference Booking';
		if (path.startsWith('/my-account')) return 'My Account';
		if (path.startsWith('/conferences')) return 'Conferences List';
		return 'Website';
	}
	
	onMount(() => {
		supportFormData.page = currentPage;
		supportFormData.settings = currentPageName;
	});
	
	async function submitSupportForm() {
		if (!supportFormData.name || !supportFormData.email || !supportFormData.message) {
			notifyError('Please fill in all required fields');
			return;
		}
		
		submitting = true;
		try {
			const response = await fetch('/api/help/support', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(supportFormData)
			});
			
			const result = await response.json();
			
			if (response.ok) {
				notifySuccess('Support request sent successfully! We\'ll get back to you soon.');
				// Reset form
				supportFormData = {
					name: '',
					email: '',
					subject: '',
					message: '',
					page: currentPage,
					settings: currentPageName
				};
				showSupportForm = false;
			} else {
				notifyError(result.error || 'Failed to send support request. Please try again.');
			}
		} catch (error) {
			console.error('Support form error:', error);
			notifyError('An error occurred. Please try again.');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="help-system">
	<!-- Support Form Modal -->
	{#if showSupportForm}
		<div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="support-modal-title" role="dialog" aria-modal="true">
			<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" on:click={() => showSupportForm = false}></div>
				
				<span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
				
				<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div class="sm:flex sm:items-start">
							<div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
								<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="support-modal-title">
									Contact Support
								</h3>
								<p class="text-sm text-gray-500 mb-4">
									Need help? Send us a message and we'll get back to you as soon as possible.
								</p>
								
								<form on:submit|preventDefault={submitSupportForm} class="space-y-4">
									<div>
										<label for="support-name" class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
										<input
											id="support-name"
											type="text"
											bind:value={supportFormData.name}
											required
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
										/>
									</div>
									
									<div>
										<label for="support-email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
										<input
											id="support-email"
											type="email"
											bind:value={supportFormData.email}
											required
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
										/>
									</div>
									
									<div>
										<label for="support-subject" class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
										<input
											id="support-subject"
											type="text"
											bind:value={supportFormData.subject}
											placeholder="Brief description of your question"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
										/>
									</div>
									
									<div>
										<label for="support-message" class="block text-sm font-medium text-gray-700 mb-1">Message *</label>
										<textarea
											id="support-message"
											bind:value={supportFormData.message}
											required
											rows="5"
											class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
											placeholder="Describe your question or issue..."
										></textarea>
									</div>
									
									<div class="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
										<strong>Context:</strong> This request is from {currentPageName} ({currentPage})
									</div>
									
									<div class="flex gap-2 pt-2">
										<button
											type="submit"
											disabled={submitting}
											class="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
										>
											{submitting ? 'Sending...' : 'Send Message'}
										</button>
										<button
											type="button"
											on:click={() => showSupportForm = false}
											class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
										>
											Cancel
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Help Button (Floating) -->
	<button
		type="button"
		on:click={() => showSupportForm = true}
		class="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center"
		aria-label="Get Help"
		title="Get Help"
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>
	</button>
</div>

