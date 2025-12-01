<script lang="js">
	import { onMount } from 'svelte';

	export let data;

	let events = [];
	let bookings = data.bookings || [];
	let selectedEventId = '';
	let searchQuery = '';
	let showArchived = false;
	let loading = true;
	let selectedBooking = null;
	let selectedBookingAttendees = [];
	let ticketTypes = [];
	let loadingDetails = false;

	onMount(async () => {
		await loadEvents();
		await loadBookings();
		await loadTicketTypes();
	});

	$: if (events.length > 0 && ticketTypes.length === 0) {
		loadTicketTypes();
	}

	async function loadEvents() {
		try {
			const response = await fetch('/api/content?type=events');
			events = await response.json();
		} catch (error) {
			console.error('Failed to load events:', error);
		}
	}

	async function loadBookings() {
		try {
			if (data && data.bookings) {
				bookings = data.bookings;
			} else {
				const response = await fetch('/api/content?type=event-bookings');
				bookings = await response.json();
			}
		} catch (error) {
			console.error('Failed to load bookings:', error);
		} finally {
			loading = false;
		}
	}

	async function loadTicketTypes() {
		if (events.length === 0) return;
		try {
			const allTicketTypes = [];
			for (const event of events) {
				const response = await fetch(`/api/content?type=event-ticket-types&eventId=${event.id}`);
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
			const response = await fetch(`/api/content?type=event-attendees&bookingId=${booking.id}`);
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
		
		// Filter by event
		if (selectedEventId) {
			filtered = filtered.filter(booking => booking.eventId === selectedEventId);
		}
		
		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(booking => {
				// Search in booking reference
				if (booking.bookingReference?.toLowerCase().includes(query)) return true;
				
				// Search in customer name
				if (booking.customerName?.toLowerCase().includes(query)) return true;
				
				// Search in customer email
				if (booking.customerEmail?.toLowerCase().includes(query)) return true;
				
				// Search in event name
				const eventName = getEventName(booking.eventId);
				if (eventName.toLowerCase().includes(query)) return true;
				
				return false;
			});
		}
		
		return filtered;
	}

	async function toggleArchive(booking, event) {
		event.stopPropagation();
		
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
					type: 'event-booking',
					data: updatedBooking
				})
			});

			if (response.ok) {
				const index = bookings.findIndex(b => b.id === booking.id);
				if (index >= 0) {
					bookings[index] = updatedBooking;
					bookings = [...bookings];
				}
				
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

	function getEventName(id) {
		const event = events.find(e => e.id === id);
		return event ? event.title : 'Unknown';
	}

	function getTicketTypeName(id) {
		const ticketType = ticketTypes.find(t => t.id === id);
		return ticketType ? ticketType.name : 'Unknown';
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
		return { label: 'Unpaid', class: 'bg-red-100 text-red-800' };
	}
</script>

<svelte:head>
	<title>Event Bookings - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<h1 class="text-3xl font-bold mb-6">Event Bookings</h1>

	<div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
		<div>
			<label for="search" class="block text-sm font-medium mb-1">Search Bookings</label>
			<div class="relative">
				<input
					id="search"
					type="text"
					bind:value={searchQuery}
					placeholder="Search by reference, name, email, or event..."
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
			<label for="event-filter" class="block text-sm font-medium mb-1">Filter by Event</label>
			<select
				id="event-filter"
				bind:value={selectedEventId}
				on:change={loadBookings}
				class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="">All Events</option>
				{#each events as event}
					<option value={event.id}>{event.title}</option>
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
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
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
							<td class="px-6 py-4 text-sm">
								<div class="flex items-center gap-2">
									{getEventName(booking.eventId)}
									{#if booking.archived}
										<span class="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
											Archived
										</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 text-sm">
								{booking.customerName || 'N/A'}
								<br />
								<span class="text-gray-500 text-xs">{booking.customerEmail}</span>
							</td>
							<td class="px-6 py-4 text-sm">{booking.ticketCount || 0}</td>
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
									<label class="text-xs font-semibold text-gray-500 uppercase">Event</label>
									<p class="text-sm font-medium text-gray-900">{getEventName(selectedBooking.eventId)}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Customer Name</label>
									<p class="text-sm font-medium text-gray-900">{selectedBooking.customerName || 'N/A'}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Customer Email</label>
									<p class="text-sm font-medium text-gray-900">{selectedBooking.customerEmail || 'N/A'}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Customer Phone</label>
									<p class="text-sm font-medium text-gray-900">{selectedBooking.customerPhone || 'N/A'}</p>
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
							<h3 class="text-lg font-bold text-gray-900 mb-4">Tickets ({selectedBookingAttendees.length})</h3>
							{#if selectedBookingAttendees.length === 0}
								<p class="text-gray-600 text-sm">No tickets found for this booking.</p>
							{:else}
								<div class="grid grid-cols-2 gap-4 max-h-[calc(90vh-200px)] overflow-y-auto">
								{#each selectedBookingAttendees as attendee, index}
									{@const ticketType = ticketTypes.find(t => t.id === attendee.ticketTypeId)}
									<div class="border-2 rounded-lg p-3 border-gray-200 bg-white">
										<div class="mb-2">
											<h4 class="text-sm font-bold text-gray-900">
												{attendee.fullName || 'N/A'}
											</h4>
											<p class="text-xs text-gray-600 mt-0.5">
												{getTicketTypeName(attendee.ticketTypeId)}
											</p>
										</div>
										
										<div class="space-y-2 text-xs">
											{#if ticketType}
												<div>
													<label class="text-xs font-semibold text-gray-500">Price:</label>
													<p class="text-gray-900">{formatCurrency(ticketType.price)}</p>
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

