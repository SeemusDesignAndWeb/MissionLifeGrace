<script lang="js">
	import { onMount } from 'svelte';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent';
	import { notify } from '$lib/utils/notify';
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte';

	export let data;

	let conferences = [];
	let bookings = data.bookings || [];
	let selectedConferenceId = '';
	let searchQuery = '';
	let showArchived = false;
	let loading = true;
	let selectedBooking = null;
	let selectedBookingAttendees = [];
	let ticketTypes = [];
	let loadingDetails = false;
	
	// Bulk communication
	let selectedBookings = new Set();
	let showBulkEmailModal = false;
	let bulkEmailSubject = '';
	let bulkEmailMessage = '';
	let bulkEmailLoading = false;
	let bulkEmailError = '';
	let bulkEmailSuccess = false;

	// Single Booking Actions
	let showQuickMessageModal = false;
	let quickMessageSubject = '';
	let quickMessageBody = '';
	let sendingEmail = false;
	let quickMessageError = '';
	let quickMessageSuccess = false;
	let targetBooking = null;

	// Password Reset
	let resettingPassword = false;
	let resetPasswordError = '';
	let resetPasswordSuccess = false;
	let resetPasswordNewPassword = '';

	// Confirmation
	let showConfirm = false;
	let confirmTitle = '';
	let confirmMessage = '';
	let onConfirm = () => {};

	onMount(async () => {
		await loadConferences();
		await loadBookings();
		await loadTicketTypes();
	});

	$: if (conferences.length > 0 && ticketTypes.length === 0) {
		loadTicketTypes();
	}

	async function loadConferences() {
		try {
			const response = await fetch('/api/content?type=conferences');
			conferences = await response.json();
		} catch (error) {
			console.error('Failed to load conferences:', error);
		}
	}

	async function loadBookings() {
		try {
			// Use server data if available, otherwise fetch
			if (data && data.bookings) {
				bookings = data.bookings;
			} else {
				const response = await fetch('/api/content?type=conference-bookings');
				bookings = await response.json();
			}
		} catch (error) {
			console.error('Failed to load bookings:', error);
		} finally {
			loading = false;
		}
	}

	async function loadTicketTypes() {
		if (conferences.length === 0) return;
		try {
			// Load all ticket types for all conferences
			const allTicketTypes = [];
			for (const conf of conferences) {
				const response = await fetch(`/api/content?type=conference-ticket-types&conferenceId=${conf.id}`);
				const types = await response.json();
				allTicketTypes.push(...types);
			}
			ticketTypes = allTicketTypes;
		} catch (error) {
			console.error('Failed to load ticket types:', error);
		}
	}

	async function sendPaymentReminder(booking) {
		confirmTitle = 'Send Reminder';
		confirmMessage = 'Are you sure you want to send a payment/information reminder to this customer?';
		showConfirm = true;
		onConfirm = async () => {
			sendingEmail = true;
			try {
				const response = await fetch('/api/admin/send-booking-email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						bookingId: booking.id,
						subject: "Hi, we have been thinking of you...",
						message: `This is a friendly reminder that we are still awaiting payment or information regarding your booking ({bookingReference}).

Please log in to your account to update your details or complete payment.

Best regards,
Mission Life Grace Team`
					})
				});

				const result = await response.json();

				if (response.ok) {
					notify('Payment/Info reminder sent successfully!', 'success');
				} else {
					notify('Failed to send reminder: ' + (result.error || 'Unknown error'), 'error');
				}
			} catch (error) {
				console.error('Error sending reminder:', error);
				notify('An error occurred while sending the reminder.', 'error');
			} finally {
				sendingEmail = false;
			}
		};
	}

	function openQuickMessageModal(booking) {
		targetBooking = booking;
		quickMessageSubject = '';
		quickMessageBody = '';
		quickMessageError = '';
		quickMessageSuccess = false;
		showQuickMessageModal = true;
	}

	function closeQuickMessageModal() {
		showQuickMessageModal = false;
		targetBooking = null;
		quickMessageSubject = '';
		quickMessageBody = '';
		quickMessageError = '';
		quickMessageSuccess = false;
	}

	async function sendQuickMessage() {
		if (!quickMessageSubject.trim() || !quickMessageBody.trim()) {
			quickMessageError = 'Subject and message are required';
			return;
		}

		sendingEmail = true;
		quickMessageError = '';
		quickMessageSuccess = false;

		try {
			const response = await fetch('/api/admin/send-booking-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookingId: targetBooking.id,
					subject: quickMessageSubject,
					message: quickMessageBody
				})
			});

			const result = await response.json();

			if (response.ok) {
				quickMessageSuccess = true;
				setTimeout(() => {
					closeQuickMessageModal();
				}, 2000);
			} else {
				quickMessageError = result.error || 'Failed to send message';
			}
		} catch (error) {
			quickMessageError = 'An error occurred. Please try again.';
			console.error('Quick message error:', error);
		} finally {
			sendingEmail = false;
		}
	}

	async function resetUserPassword(booking, sendEmail = false) {
		if (!booking.accountEmail) {
			notify('No account email found for this booking', 'error');
			return;
		}

		resettingPassword = true;
		resetPasswordError = '';
		resetPasswordSuccess = false;
		resetPasswordNewPassword = '';

		try {
			const response = await fetch('/api/admin/reset-user-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: booking.accountEmail,
					sendEmail: sendEmail
				})
			});

			const result = await response.json();

			if (response.ok) {
				resetPasswordSuccess = true;
				if (result.newPassword) {
					resetPasswordNewPassword = result.newPassword;
				}
				if (result.emailSent) {
					notify('Password reset successfully! Reset email sent to user.', 'success');
				} else {
					notify('Password reset successfully!', 'success');
				}
			} else {
				resetPasswordError = result.error || 'Failed to reset password';
				notify(resetPasswordError, 'error');
			}
		} catch (error) {
			resetPasswordError = 'An error occurred. Please try again.';
			notify(resetPasswordError, 'error');
			console.error('Reset password error:', error);
		} finally {
			resettingPassword = false;
		}
	}

	async function viewBookingDetails(booking) {
		selectedBooking = booking;
		loadingDetails = true;
		try {
			const response = await fetch(`/api/content?type=conference-attendees&bookingId=${booking.id}`);
			selectedBookingAttendees = await response.json();
		} catch (error) {
			console.error('Failed to load booking details:', error);
			selectedBookingAttendees = [];
		} finally {
			loadingDetails = false;
		}
	}

	function closeBookingDetails() {
		selectedBooking = null;
		selectedBookingAttendees = [];
	}

	// Reactive filtered bookings
	$: filteredBookings = (() => {
		let filtered = bookings;
		
		// Filter by archived status
		if (!showArchived) {
			filtered = filtered.filter(booking => !booking.archived);
		} else {
			filtered = filtered.filter(booking => booking.archived);
		}
		
		// Filter by conference
		if (selectedConferenceId) {
			filtered = filtered.filter(booking => booking.conferenceId === selectedConferenceId);
		}
		
		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(booking => {
				// Search in booking reference
				if (booking.bookingReference?.toLowerCase().includes(query)) return true;
				
				// Search in group leader name
				if (booking.groupLeaderName?.toLowerCase().includes(query)) return true;
				
				// Search in group leader email
				if (booking.groupLeaderEmail?.toLowerCase().includes(query)) return true;
				
				// Search in conference name
				const conferenceName = getConferenceName(booking.conferenceId);
				if (conferenceName.toLowerCase().includes(query)) return true;
				
				return false;
			});
		}
		
		return filtered;
	})();

	async function toggleArchive(booking, event) {
		event.stopPropagation(); // Prevent opening booking details
		
		try {
			const updatedBooking = {
				...booking,
				archived: !booking.archived,
				archivedAt: !booking.archived ? new Date().toISOString() : null
			};

			const response = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'conference-booking',
					data: updatedBooking
				})
			});

			if (response.ok) {
				// Update local bookings array
				const index = bookings.findIndex(b => b.id === booking.id);
				if (index >= 0) {
					bookings[index] = updatedBooking;
					bookings = [...bookings]; // Trigger reactivity
				}
				
				// Update selected booking if it's the same one
				if (selectedBooking && selectedBooking.id === booking.id) {
					selectedBooking = updatedBooking;
				}
			} else {
				console.error('Failed to archive/unarchive booking');
			}
		} catch (error) {
			console.error('Error archiving booking:', error);
		}
	}

	function getConferenceName(id) {
		const conf = conferences.find(c => c.id === id);
		return conf ? conf.title : 'Unknown';
	}

	function getTicketTypeName(id) {
		const ticketType = ticketTypes.find(t => t.id === id);
		return ticketType ? ticketType.name : 'Unknown';
	}

	function getTicketTypeInfo(id) {
		const ticketType = ticketTypes.find(t => t.id === id);
		return ticketType || null;
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatDateTime(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { 
			day: 'numeric', 
			month: 'short', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
	}

	function getPaymentStatus(booking) {
		if (booking.paymentStatus === 'paid') return { label: 'Paid', class: 'bg-green-100 text-green-800' };
		if (booking.paymentStatus === 'partial') return { label: 'Partial', class: 'bg-yellow-100 text-yellow-800' };
		return { label: 'Unpaid', class: 'bg-red-100 text-red-800' };
	}

	function formatAddress(address) {
		if (!address) return 'N/A';
		const parts = [];
		if (address.line1) parts.push(address.line1);
		if (address.line2) parts.push(address.line2);
		if (address.city) parts.push(address.city);
		if (address.postcode) parts.push(address.postcode);
		if (address.country) parts.push(address.country);
		return parts.length > 0 ? parts.join(', ') : 'N/A';
	}

	function toggleBookingSelection(bookingId, event) {
		event.stopPropagation();
		if (selectedBookings.has(bookingId)) {
			selectedBookings.delete(bookingId);
		} else {
			selectedBookings.add(bookingId);
		}
		selectedBookings = new Set(selectedBookings); // Trigger reactivity
	}

	function toggleAllBookings() {
		if (selectedBookings.size === filteredBookings.length) {
			selectedBookings.clear();
		} else {
			filteredBookings.forEach(b => selectedBookings.add(b.id));
		}
		selectedBookings = new Set(selectedBookings);
	}

	function openBulkEmailModal() {
		if (selectedBookings.size === 0) {
			alert('Please select at least one booking');
			return;
		}
		bulkEmailSubject = '';
		bulkEmailMessage = '';
		bulkEmailError = '';
		bulkEmailSuccess = false;
		showBulkEmailModal = true;
	}

	function closeBulkEmailModal() {
		showBulkEmailModal = false;
		bulkEmailSubject = '';
		bulkEmailMessage = '';
		bulkEmailError = '';
		bulkEmailSuccess = false;
	}

	async function sendBulkEmail() {
		if (!bulkEmailSubject.trim() || !bulkEmailMessage.trim()) {
			bulkEmailError = 'Subject and message are required';
			return;
		}

		bulkEmailLoading = true;
		bulkEmailError = '';
		bulkEmailSuccess = false;

		try {
			const response = await fetch('/api/admin/bulk-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookingIds: Array.from(selectedBookings),
					subject: bulkEmailSubject,
					message: bulkEmailMessage
				})
			});

			const result = await response.json();

			if (response.ok) {
				bulkEmailSuccess = true;
				selectedBookings.clear();
				selectedBookings = new Set(selectedBookings);
				setTimeout(() => {
					closeBulkEmailModal();
				}, 2000);
			} else {
				bulkEmailError = result.error || 'Failed to send emails';
			}
		} catch (error) {
			bulkEmailError = 'An error occurred. Please try again.';
			console.error('Bulk email error:', error);
		} finally {
			bulkEmailLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Bookings - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<div class="flex items-center gap-2 mb-6">
		<h1 class="text-3xl font-bold">Conference Bookings</h1>
		<HelpIcon helpId="admin-bookings-page" position="right">
			{@html getHelpContent('admin-bookings-page').content}
		</HelpIcon>
	</div>

	<div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
		<div>
			<label for="search" class="block text-sm font-medium mb-1">Search Bookings</label>
			<div class="relative">
				<input
					id="search"
					type="text"
					bind:value={searchQuery}
					placeholder="Search by reference, name, email, or conference..."
					class="w-full px-3 py-2 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
				/>
				<svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				{#if searchQuery}
					<button
						on:click={() => searchQuery = ''}
						class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
						aria-label="Clear search"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
		<div>
			<label for="conference-filter" class="block text-sm font-medium mb-1">Filter by Conference</label>
			<select
				id="conference-filter"
				bind:value={selectedConferenceId}
				on:change={loadBookings}
				class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="">All Conferences</option>
				{#each conferences as conf}
					<option value={conf.id}>{conf.title}</option>
				{/each}
			</select>
		</div>
		<div class="flex items-end">
			<label class="flex items-center space-x-2 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={showArchived}
					class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
				/>
				<span class="text-sm font-medium">Show Archived</span>
			</label>
		</div>
	</div>

	<div class="mb-4 flex items-center justify-between">
		<div class="text-sm text-gray-600">
			Showing {filteredBookings.length} {showArchived ? 'archived' : 'active'} booking{filteredBookings.length !== 1 ? 's' : ''}
			{#if !showArchived}
				<span class="text-gray-400">
					({bookings.filter(b => b.archived).length} archived)
				</span>
			{/if}
			{#if searchQuery}
				<span class="ml-2">
					matching "<strong>{searchQuery}</strong>"
				</span>
			{/if}
		</div>
		{#if selectedBookings.size > 0}
			<div class="flex items-center gap-3">
				<span class="text-sm font-medium text-gray-700">
					{selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''} selected
				</span>
				<button
					on:click={openBulkEmailModal}
					class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold text-sm"
				>
					Send Email to Selected
				</button>
				<button
					on:click={() => { selectedBookings.clear(); selectedBookings = new Set(selectedBookings); }}
					class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
				>
					Clear Selection
				</button>
			</div>
		{/if}
	</div>

	{#if loading}
		<p>Loading...</p>
	{:else if filteredBookings.length === 0}
		<p class="text-gray-600">No bookings found.</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							<input
								type="checkbox"
								checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0}
								on:change={toggleAllBookings}
								class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
							/>
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conference</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Leader</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendees</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Date</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredBookings as booking}
						<tr 
							class="cursor-pointer hover:bg-gray-50 transition-colors {booking.archived ? 'opacity-60 bg-gray-50' : ''} {selectedBookings.has(booking.id) ? 'bg-blue-50' : ''}"
							on:click={() => viewBookingDetails(booking)}
							role="button"
							tabindex="0"
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									viewBookingDetails(booking);
								}
							}}
						>
							<td class="px-6 py-4 whitespace-nowrap" on:click={(e) => toggleBookingSelection(booking.id, e)}>
								<input
									type="checkbox"
									checked={selectedBookings.has(booking.id)}
									on:change={(e) => toggleBookingSelection(booking.id, e)}
									on:click|stopPropagation
									class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
								/>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex items-center gap-2">
									{booking.bookingReference}
									{#if booking.archived}
										<span class="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
											Archived
										</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 text-sm">{getConferenceName(booking.conferenceId)}</td>
							<td class="px-6 py-4 text-sm">
								{booking.groupLeaderName || 'N/A'}
								<br />
								<span class="text-gray-500 text-xs">{booking.groupLeaderEmail}</span>
							</td>
							<td class="px-6 py-4 text-sm">{booking.attendeeCount || 0}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(booking.totalAmount || 0)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								{formatCurrency(booking.paidAmount || 0)}
								{#if booking.paidAmount && booking.totalAmount && booking.paidAmount < booking.totalAmount}
									<br />
									<span class="text-xs text-gray-500">
										Balance: {formatCurrency(booking.totalAmount - booking.paidAmount)}
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								{#each [booking] as b}
									{@const status = getPaymentStatus(b)}
									<span class="px-3 py-1 text-xs rounded-full {status.class}">
										{status.label}
									</span>
								{/each}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(booking.createdAt)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{booking.paymentDate ? formatDateTime(booking.paymentDate) : '-'}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<button
									on:click={(e) => toggleArchive(booking, e)}
									class="px-3 py-1 text-xs rounded {
										booking.archived 
											? 'bg-green-100 text-green-800 hover:bg-green-200' 
											: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
									}"
									title={booking.archived ? 'Unarchive booking' : 'Archive booking'}
								>
									{booking.archived ? 'Unarchive' : 'Archive'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Bulk Email Modal -->
{#if showBulkEmailModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
				<h2 class="text-2xl font-bold text-gray-900">Send Bulk Email</h2>
				<button
					on:click={closeBulkEmailModal}
					class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					aria-label="Close"
				>
					×
				</button>
			</div>
			
			<div class="p-6">
				{#if bulkEmailSuccess}
					<div class="text-center py-8">
						<div class="mb-4">
							<svg class="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
						<p class="text-lg font-semibold text-gray-900 mb-2">Emails Sent Successfully!</p>
						<p class="text-sm text-gray-600">Your email has been sent to {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''}.</p>
					</div>
				{:else}
					<div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p class="text-sm text-blue-800">
							<strong>{selectedBookings.size}</strong> booking{selectedBookings.size !== 1 ? 's' : ''} selected. 
							This email will be sent to the group leader of each selected booking.
						</p>
					</div>

					{#if bulkEmailError}
						<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-sm text-red-800">{bulkEmailError}</p>
						</div>
					{/if}

					<form on:submit|preventDefault={sendBulkEmail} class="space-y-4">
						<div>
							<label for="bulk-email-subject" class="block text-sm font-medium text-gray-700 mb-1">
								Subject *
							</label>
							<input
								id="bulk-email-subject"
								type="text"
								bind:value={bulkEmailSubject}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="Email subject line"
							/>
						</div>

						<div>
							<label for="bulk-email-message" class="block text-sm font-medium text-gray-700 mb-1">
								Message *
							</label>
							<textarea
								id="bulk-email-message"
								bind:value={bulkEmailMessage}
								required
								rows="10"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="Enter your message here. You can use {'{'}bookingReference{'}'} and {'{'}groupLeaderName{'}'} as placeholders."
							></textarea>
							<p class="text-xs text-gray-500 mt-1">
								Tip: Use <code class="bg-gray-100 px-1 rounded">{'{bookingReference}'}</code> and <code class="bg-gray-100 px-1 rounded">{'{groupLeaderName}'}</code> for personalization
							</p>
						</div>

						<div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
							<button
								type="button"
								on:click={closeBulkEmailModal}
								disabled={bulkEmailLoading}
								class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={bulkEmailLoading}
								class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold disabled:opacity-50"
							>
								{bulkEmailLoading ? 'Sending...' : `Send to ${selectedBookings.size} Booking${selectedBookings.size !== 1 ? 's' : ''}`}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Booking Details Modal -->
{#if selectedBooking}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
		<div class="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
				<h2 class="text-2xl font-bold text-gray-900">Booking Details</h2>
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-2">
						<button
							on:click={() => sendPaymentReminder(selectedBooking)}
							disabled={sendingEmail}
							class="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
							title="Send Payment/Info Reminder"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
							{sendingEmail ? 'Sending...' : 'Reminder'}
						</button>
						<button
							on:click|stopPropagation={() => openQuickMessageModal(selectedBooking)}
							class="px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium text-sm flex items-center gap-2"
							title="Send Quick Message"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
							Message
						</button>
					</div>
					<div class="h-6 w-px bg-gray-300 mx-2"></div>
					<button
						on:click={closeBookingDetails}
						class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
						aria-label="Close"
					>
						×
					</button>
				</div>
			</div>
			
			<div class="p-6">
				{#if loadingDetails}
					<div class="text-center py-8">
						<p class="text-gray-600">Loading booking details...</p>
					</div>
				{:else}
					<div class="grid grid-cols-3 gap-6">
						<!-- Column 1: Booking Information -->
						<div>
							<h3 class="text-lg font-bold text-gray-900 mb-4">Booking Information</h3>
							<div class="bg-gray-50 rounded-lg p-4 space-y-4">
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Booking Reference</label>
									<div class="flex items-center gap-2">
										<p class="text-sm font-medium text-gray-900">{selectedBooking.bookingReference}</p>
										{#if selectedBooking.archived}
											<span class="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
												Archived
											</span>
										{/if}
									</div>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Conference</label>
									<p class="text-sm font-medium text-gray-900">{getConferenceName(selectedBooking.conferenceId)}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Payment Status</label>
									<div class="mt-1">
										{#each [selectedBooking] as booking}
											{@const status = getPaymentStatus(booking)}
											<span class="px-3 py-1 text-xs rounded-full {status.class}">
												{status.label}
											</span>
										{/each}
									</div>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Payment Method</label>
									<p class="text-sm font-medium text-gray-900">{selectedBooking.paymentMethod || 'N/A'}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Subtotal</label>
									<p class="text-sm font-medium text-gray-900">{formatCurrency(selectedBooking.subtotal || 0)}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Discount</label>
									<p class="text-sm font-medium text-gray-900">
										{selectedBooking.discountCode ? `${selectedBooking.discountCode} - ${formatCurrency(selectedBooking.discountAmount || 0)}` : 'None'}
									</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Total Amount</label>
									<p class="text-lg font-bold text-gray-900">{formatCurrency(selectedBooking.totalAmount || 0)}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Amount Paid</label>
									<p class="text-sm font-medium text-gray-900">{formatCurrency(selectedBooking.paidAmount || 0)}</p>
									{#if selectedBooking.paidAmount && selectedBooking.totalAmount && selectedBooking.paidAmount < selectedBooking.totalAmount}
										<p class="text-xs text-gray-500 mt-1">
											Balance: {formatCurrency(selectedBooking.totalAmount - selectedBooking.paidAmount)}
										</p>
									{/if}
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">User Account</label>
									{#if selectedBooking.hasAccount}
										<div class="mt-1">
											<span class="px-2 py-1 text-xs rounded-full {
												selectedBooking.accountVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
											}">
												{selectedBooking.accountVerified ? '✓ Verified Account' : 'Pending Verification'}
											</span>
											{#if selectedBooking.accountEmail}
												<p class="text-xs text-gray-600 mt-1">{selectedBooking.accountEmail}</p>
											{/if}
											<div class="mt-2 flex gap-2">
												<button
													on:click={(e) => {
														e.stopPropagation();
														resetUserPassword(selectedBooking, false);
													}}
													disabled={resettingPassword}
													class="px-3 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium text-xs flex items-center gap-1 disabled:opacity-50"
													title="Reset Password (Show in modal)"
												>
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
													{resettingPassword ? 'Resetting...' : 'Reset Password'}
												</button>
												<button
													on:click={(e) => {
														e.stopPropagation();
														resetUserPassword(selectedBooking, true);
													}}
													disabled={resettingPassword}
													class="px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium text-xs flex items-center gap-1 disabled:opacity-50"
													title="Reset Password & Send Email"
												>
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
													{resettingPassword ? 'Sending...' : 'Reset & Email'}
												</button>
											</div>
											{#if resetPasswordSuccess && resetPasswordNewPassword}
												<div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
													<p class="text-xs font-semibold text-yellow-800 mb-1">New Password:</p>
													<p class="text-xs font-mono text-yellow-900 break-all">{resetPasswordNewPassword}</p>
													<p class="text-xs text-yellow-700 mt-1">Copy this password and share it securely with the user.</p>
												</div>
											{/if}
											{#if resetPasswordError}
												<p class="text-xs text-red-600 mt-1">{resetPasswordError}</p>
											{/if}
										</div>
									{:else}
										<p class="text-sm text-gray-500">No account created</p>
									{/if}
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Booking Date</label>
									<p class="text-sm font-medium text-gray-900">{formatDateTime(selectedBooking.createdAt)}</p>
								</div>
								{#if selectedBooking.archivedAt}
									<div>
										<label class="text-xs font-semibold text-gray-500 uppercase">Archived Date</label>
										<p class="text-sm font-medium text-gray-900">{formatDateTime(selectedBooking.archivedAt)}</p>
									</div>
								{/if}
								<div>
									<button
										on:click={(e) => {
											e.stopPropagation();
											toggleArchive(selectedBooking, e);
										}}
										class="px-4 py-2 text-sm rounded {
											selectedBooking.archived 
												? 'bg-green-100 text-green-800 hover:bg-green-200' 
												: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
										}"
									>
										{selectedBooking.archived ? 'Unarchive Booking' : 'Archive Booking'}
									</button>
								</div>
							</div>
						</div>

						<!-- Columns 2 & 3: Attendees -->
						<div class="col-span-2">
							<h3 class="text-lg font-bold text-gray-900 mb-4">Attendees ({selectedBookingAttendees.length})</h3>
							{#if selectedBookingAttendees.length === 0}
								<p class="text-gray-600 text-sm">No attendees found for this booking.</p>
							{:else}
								<div class="grid grid-cols-2 gap-4 max-h-[calc(90vh-200px)] overflow-y-auto">
								{#each selectedBookingAttendees as attendee, index}
									{@const ticketType = getTicketTypeInfo(attendee.ticketTypeId)}
									<div class="border-2 rounded-lg p-3 {
										attendee.isGroupLeader ? 'border-blue-300 bg-blue-50' : 
										ticketType?.type === 'teen' ? 'border-purple-300 bg-purple-50' :
										ticketType?.type === 'child' ? 'border-yellow-300 bg-yellow-50' :
										'border-gray-200 bg-white'
									}">
										<div class="mb-2">
											<h4 class="text-sm font-bold text-gray-900">
												{attendee.fullName || 'N/A'}
												{#if attendee.isGroupLeader}
													<span class="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">GL</span>
												{/if}
											</h4>
											<p class="text-xs text-gray-600 mt-0.5">
												{getTicketTypeName(attendee.ticketTypeId)}
												{#if ticketType?.camping}
													<span class="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">Camp</span>
												{/if}
											</p>
										</div>
										
										<div class="space-y-2 text-xs">
											{#if attendee.email}
												<div>
													<label class="text-xs font-semibold text-gray-500">Email:</label>
													<p class="text-gray-900">{attendee.email}</p>
												</div>
											{/if}
											{#if attendee.phone}
												<div>
													<label class="text-xs font-semibold text-gray-500">Phone:</label>
													<p class="text-gray-900">{attendee.phone}</p>
												</div>
											{/if}
											{#if attendee.dateOfBirth}
												<div>
													<label class="text-xs font-semibold text-gray-500">DOB:</label>
													<p class="text-gray-900">{formatDate(attendee.dateOfBirth)}</p>
												</div>
											{/if}
											{#if attendee.age}
												<div>
													<label class="text-xs font-semibold text-gray-500">Age:</label>
													<p class="text-gray-900">{attendee.age}</p>
												</div>
											{/if}
											{#if attendee.homeChurch || attendee.homeChurchOther}
												<div>
													<label class="text-xs font-semibold text-gray-500">Church:</label>
													<p class="text-gray-900">{attendee.homeChurchOther || attendee.homeChurch || 'N/A'}</p>
												</div>
											{/if}
											{#if attendee.isGroupLeader && attendee.address}
												<div>
													<label class="text-xs font-semibold text-gray-500">Address:</label>
													<p class="text-gray-900 text-xs">{formatAddress(attendee.address)}</p>
												</div>
											{/if}
											
											<!-- Emergency Contact (for Teens/Children) -->
											{#if attendee.emergencyContact && (attendee.emergencyContact.name || attendee.emergencyContact.phone)}
												<div class="pt-2 mt-2 border-t border-gray-300">
													<label class="text-xs font-semibold text-gray-500">Emergency:</label>
													<p class="text-gray-900">{attendee.emergencyContact.name || 'N/A'}</p>
													<p class="text-gray-600 text-xs">{attendee.emergencyContact.phone || ''}</p>
												</div>
											{/if}

											<!-- Medical Information (for Teens/Children) -->
											{#if attendee.medicalHistory || attendee.allergies || attendee.dietaryRestrictions}
												<div class="pt-2 mt-2 border-t border-gray-300">
													{#if attendee.medicalHistory}
														<div class="mb-1">
															<label class="text-xs font-semibold text-gray-500">Medical:</label>
															<p class="text-gray-900 text-xs">{attendee.medicalHistory}</p>
														</div>
													{/if}
													{#if attendee.allergies}
														<div class="mb-1">
															<label class="text-xs font-semibold text-gray-500">Allergies:</label>
															<p class="text-gray-900 text-xs">{attendee.allergies}</p>
														</div>
													{/if}
													{#if attendee.dietaryRestrictions}
														<div>
															<label class="text-xs font-semibold text-gray-500">Dietary:</label>
															<p class="text-gray-900 text-xs">{attendee.dietaryRestrictions}</p>
														</div>
													{/if}
												</div>
											{/if}

											<!-- Consent Waivers (for Children) -->
											{#if attendee.consentWaivers && (attendee.consentWaivers.medical !== undefined || attendee.consentWaivers.photo !== undefined || attendee.consentWaivers.activities !== undefined)}
												<div class="pt-2 mt-2 border-t border-gray-300">
													<label class="text-xs font-semibold text-gray-500">Consents:</label>
													<div class="flex flex-wrap gap-2 mt-1">
														<span class="text-xs {attendee.consentWaivers.medical ? 'text-green-600' : 'text-red-600'}">
															Med: {attendee.consentWaivers.medical ? '✓' : '✗'}
														</span>
														<span class="text-xs {attendee.consentWaivers.photo ? 'text-green-600' : 'text-red-600'}">
															Photo: {attendee.consentWaivers.photo ? '✓' : '✗'}
														</span>
														<span class="text-xs {attendee.consentWaivers.activities ? 'text-green-600' : 'text-red-600'}">
															Act: {attendee.consentWaivers.activities ? '✓' : '✗'}
														</span>
													</div>
												</div>
											{/if}

											<!-- Ticket ID -->
											{#if attendee.ticketId}
												<div class="pt-2 mt-2 border-t border-gray-300">
													<label class="text-xs font-semibold text-gray-500">Ticket ID:</label>
													<p class="text-xs font-mono text-gray-900">{attendee.ticketId}</p>
												</div>
											{/if}
										</div>
									</div>
								{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
	<ConfirmationDialog
		open={showConfirm}
		title={confirmTitle}
		message={confirmMessage}
		on:confirm={onConfirm}
		on:cancel={() => showConfirm = false}
	/>
{/if}

<!-- Quick Message Modal -->
{#if showQuickMessageModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4" style="z-index: 100;">
		<div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
				<h2 class="text-2xl font-bold text-gray-900">Send Message</h2>
				<button
					on:click={closeQuickMessageModal}
					class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					aria-label="Close"
				>
					×
				</button>
			</div>
			
			<div class="p-6">
				{#if quickMessageSuccess}
					<div class="text-center py-8">
						<div class="mb-4">
							<svg class="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
						<p class="text-lg font-semibold text-gray-900 mb-2">Message Sent Successfully!</p>
						<p class="text-sm text-gray-600">Your message has been sent to {targetBooking?.groupLeaderName}.</p>
					</div>
				{:else}
					<div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p class="text-sm text-blue-800">
							Sending message to <strong>{targetBooking?.groupLeaderName}</strong> ({targetBooking?.groupLeaderEmail}).
						</p>
					</div>

					{#if quickMessageError}
						<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-sm text-red-800">{quickMessageError}</p>
						</div>
					{/if}

					<form on:submit|preventDefault={sendQuickMessage} class="space-y-4">
						<div>
							<label for="quick-message-subject" class="block text-sm font-medium text-gray-700 mb-1">
								Subject *
							</label>
							<input
								id="quick-message-subject"
								type="text"
								bind:value={quickMessageSubject}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="Email subject line"
							/>
						</div>

						<div>
							<label for="quick-message-body" class="block text-sm font-medium text-gray-700 mb-1">
								Message *
							</label>
							<textarea
								id="quick-message-body"
								bind:value={quickMessageBody}
								required
								rows="10"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="Enter your message here. You can use {'{'}bookingReference{'}'} and {'{'}groupLeaderName{'}'} as placeholders."
							></textarea>
							<p class="text-xs text-gray-500 mt-1">
								Tip: Use <code class="bg-gray-100 px-1 rounded">{'{bookingReference}'}</code> and <code class="bg-gray-100 px-1 rounded">{'{groupLeaderName}'}</code> for personalization
							</p>
						</div>

						<div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
							<button
								type="button"
								on:click={closeQuickMessageModal}
								disabled={sendingEmail}
								class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={sendingEmail}
								class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold disabled:opacity-50"
							>
								{sendingEmail ? 'Sending...' : 'Send Message'}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

