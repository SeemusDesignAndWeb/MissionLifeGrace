<script lang="js">
	import { onMount } from 'svelte';

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
	}

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
</script>

<svelte:head>
	<title>Bookings - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<h1 class="text-3xl font-bold mb-6">Conference Bookings</h1>

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

	<div class="mb-4 text-sm text-gray-600">
		Showing {filterBookings().length} {showArchived ? 'archived' : 'active'} booking{filterBookings().length !== 1 ? 's' : ''}
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
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Date</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filterBookings() as booking}
						<tr 
							class="cursor-pointer hover:bg-gray-50 transition-colors {booking.archived ? 'opacity-60 bg-gray-50' : ''}"
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
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								{#if booking.hasAccount}
									<span class="px-2 py-1 text-xs rounded-full {
										booking.accountVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
									}">
										{booking.accountVerified ? '✓ Verified' : 'Pending'}
									</span>
								{:else}
									<span class="text-xs text-gray-400">No account</span>
								{/if}
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
{/if}

