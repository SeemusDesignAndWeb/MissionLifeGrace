<script lang="js">
	import { onMount } from 'svelte';

	let conferences = [];
	let bookings = [];
	let selectedConferenceId = '';
	let loading = true;
	let selectedBooking = null;
	let selectedBookingAttendees = [];
	let ticketTypes = [];
	let loadingDetails = false;

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
			const response = await fetch('/api/content?type=conference-bookings');
			bookings = await response.json();
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

	function filterBookings() {
		if (!selectedConferenceId) return bookings;
		return bookings.filter(booking => booking.conferenceId === selectedConferenceId);
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
</script>

<svelte:head>
	<title>Bookings - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<h1 class="text-3xl font-bold mb-6">Conference Bookings</h1>

	<div class="mb-4">
		<label class="block text-sm font-medium mb-1">Filter by Conference</label>
		<select
			bind:value={selectedConferenceId}
			on:change={loadBookings}
			class="px-3 py-2 border rounded"
		>
			<option value="">All Conferences</option>
			{#each conferences as conf}
				<option value={conf.id}>{conf.title}</option>
			{/each}
		</select>
	</div>

	{#if loading}
		<p>Loading...</p>
	{:else if filterBookings().length === 0}
		<p class="text-gray-600">No bookings found.</p>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conference</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Leader</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendees</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filterBookings() as booking}
						<tr 
							class="cursor-pointer hover:bg-gray-50 transition-colors"
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
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								{booking.bookingReference}
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
								{#each [booking] as b}
									{@const status = getPaymentStatus(b)}
									<span class="px-3 py-1 text-xs rounded-full {status.class}">
										{status.label}
									</span>
								{/each}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(booking.createdAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Booking Details Modal -->
{#if selectedBooking}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
		<div class="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
				<h2 class="text-2xl font-bold text-gray-900">Booking Details</h2>
				<button
					on:click={closeBookingDetails}
					class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					aria-label="Close"
				>
					×
				</button>
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
									<p class="text-sm font-medium text-gray-900">{selectedBooking.bookingReference}</p>
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
									<label class="text-xs font-semibold text-gray-500 uppercase">Booking Date</label>
									<p class="text-sm font-medium text-gray-900">{formatDateTime(selectedBooking.createdAt)}</p>
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
{/if}

