<script lang="js">
	import { onMount } from 'svelte';

	let conferences = [];
	let bookings = [];
	let attendees = [];
	let ticketTypes = [];
	let selectedConferenceId = '';
	let loading = true;

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			const [confResponse, bookingsResponse, attendeesResponse, ticketTypesResponse] = await Promise.all([
				fetch('/api/content?type=conferences'),
				fetch('/api/content?type=conference-bookings'),
				fetch('/api/content?type=conference-attendees'),
				fetch('/api/content?type=conference-ticket-types')
			]);
			conferences = await confResponse.json();
			bookings = await bookingsResponse.json();
			attendees = await attendeesResponse.json();
			ticketTypes = await ticketTypesResponse.json();
		} catch (error) {
			console.error('Failed to load data:', error);
		} finally {
			loading = false;
		}
	}

	function filterData() {
		if (!selectedConferenceId) {
			return { bookings: bookings, attendees: attendees };
		}
		return {
			bookings: bookings.filter(b => b.conferenceId === selectedConferenceId),
			attendees: attendees.filter(a => {
				const booking = bookings.find(b => b.id === a.bookingId);
				return booking && booking.conferenceId === selectedConferenceId;
			})
		};
	}

	function getConferenceName(id) {
		const conf = conferences.find(c => c.id === id);
		return conf ? conf.title : 'Unknown';
	}

	function getRevenue() {
		const filtered = filterData();
		return filtered.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
	}

	function getTotalReceived() {
		const filtered = filterData();
		return filtered.bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
	}

	function getChildAttendees() {
		const filtered = filterData();
		return filtered.attendees.filter(a => {
			const ticketType = ticketTypes.find(t => t.id === a.ticketTypeId);
			return ticketType && ticketType.type === 'child';
		});
	}

	function getTeenAttendees() {
		const filtered = filterData();
		return filtered.attendees.filter(a => {
			const ticketType = ticketTypes.find(t => t.id === a.ticketTypeId);
			return ticketType && ticketType.type === 'teen';
		});
	}

	function getGroupLeaders() {
		const filtered = filterData();
		return filtered.bookings.map(booking => {
			const bookingAttendees = filtered.attendees.filter(a => a.bookingId === booking.id);
			return {
				...booking,
				groupSize: bookingAttendees.length,
				conferenceName: getConferenceName(booking.conferenceId)
			};
		});
	}

	function getFinancials() {
		const filtered = filterData();
		return filtered.bookings.map(booking => ({
			...booking,
			conferenceName: getConferenceName(booking.conferenceId),
			balance: (booking.totalAmount || 0) - (booking.paidAmount || 0)
		}));
	}

	function exportFinancialsCSV() {
		const financials = getFinancials();
		const headers = ['Booking Reference', 'Conference', 'Group Leader', 'Total Amount', 'Paid Amount', 'Balance', 'Payment Status', 'Payment Method', 'Payment Date', 'PayPal Order ID'];
		const rows = financials.map(f => [
			f.bookingReference,
			f.conferenceName,
			f.groupLeaderName || '',
			f.totalAmount || 0,
			f.paidAmount || 0,
			f.balance || 0,
			f.paymentStatus || 'unpaid',
			f.paymentMethod || 'full',
			f.paymentDate ? new Date(f.paymentDate).toLocaleString() : '',
			f.paypalOrderId || ''
		]);
		
		const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `financials-${selectedConferenceId || 'all'}-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportGroupLeadersCSV() {
		const groupLeaders = getGroupLeaders();
		const headers = ['Booking Reference', 'Conference', 'Group Leader Name', 'Email', 'Phone', 'Address', 'Home Church/Group', 'Group Size', 'Total Amount', 'Payment Status', 'Date'];
		const rows = groupLeaders.map(gl => [
			gl.bookingReference,
			gl.conferenceName,
			gl.groupLeaderName || '',
			gl.groupLeaderEmail || '',
			gl.groupLeaderPhone || '',
			[gl.groupLeaderAddress?.line1, gl.groupLeaderAddress?.line2, gl.groupLeaderAddress?.city, gl.groupLeaderAddress?.postcode].filter(Boolean).join(', '),
			gl.groupLeaderHomeChurch || '',
			gl.groupSize,
			gl.totalAmount || 0,
			gl.paymentStatus || 'unpaid',
			new Date(gl.createdAt).toLocaleDateString()
		]);
		
		const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `group-leaders-${selectedConferenceId || 'all'}-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportTeensCSV() {
		const teens = getTeenAttendees();
		const filtered = filterData();
		const headers = ['Name', 'Email', 'Date of Birth', 'Age', 'Emergency Contact Name', 'Emergency Contact Phone', 'Emergency Contact Relationship', 'Medical History', 'Allergies', 'Dietary Restrictions', 'Group Leader', 'Booking Reference', 'Conference'];
		const rows = teens.map(teen => {
			const booking = filtered.bookings.find(b => b.id === teen.bookingId);
			return [
				teen.fullName || '',
				teen.email || '',
				teen.dateOfBirth || '',
				teen.age || '',
				teen.emergencyContact?.name || '',
				teen.emergencyContact?.phone || '',
				teen.emergencyContact?.relationship || '',
				teen.medicalHistory || '',
				teen.allergies || '',
				teen.dietaryRestrictions || '',
				booking?.groupLeaderName || '',
				booking?.bookingReference || '',
				booking ? getConferenceName(booking.conferenceId) : ''
			];
		});
		
		const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `teens-${selectedConferenceId || 'all'}-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportKidsCSV() {
		const kids = getChildAttendees();
		const filtered = filterData();
		const headers = ['Name', 'Email', 'Date of Birth', 'Age', 'Emergency Contact Name', 'Emergency Contact Phone', 'Emergency Contact Relationship', 'Medical History', 'Allergies', 'Dietary Restrictions', 'Medical Consent', 'Photo Consent', 'Activities Consent', 'Group Leader', 'Booking Reference', 'Conference'];
		const rows = kids.map(kid => {
			const booking = filtered.bookings.find(b => b.id === kid.bookingId);
			return [
				kid.fullName || '',
				kid.email || '',
				kid.dateOfBirth || '',
				kid.age || '',
				kid.emergencyContact?.name || '',
				kid.emergencyContact?.phone || '',
				kid.emergencyContact?.relationship || '',
				kid.medicalHistory || '',
				kid.allergies || '',
				kid.dietaryRestrictions || '',
				kid.consentMedical ? 'Yes' : 'No',
				kid.consentPhoto ? 'Yes' : 'No',
				kid.consentActivities ? 'Yes' : 'No',
				booking?.groupLeaderName || '',
				booking?.bookingReference || '',
				booking ? getConferenceName(booking.conferenceId) : ''
			];
		});
		
		const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `kids-${selectedConferenceId || 'all'}-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function exportToCSV() {
		const filtered = filterData();
		const headers = ['Booking Reference', 'Conference', 'Group Leader', 'Email', 'Attendees', 'Total', 'Payment Status', 'Date'];
		const rows = filtered.bookings.map(b => [
			b.bookingReference,
			getConferenceName(b.conferenceId),
			b.groupLeaderName,
			b.groupLeaderEmail,
			b.attendeeCount,
			b.totalAmount,
			b.paymentStatus,
			new Date(b.createdAt).toLocaleDateString()
		]);
		
		const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `conference-bookings-${selectedConferenceId || 'all'}-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	$: filteredData = loading ? { bookings: [], attendees: [] } : filterData();
	$: totalValue = loading ? 0 : getRevenue();
	$: totalReceived = loading ? 0 : getTotalReceived();
	$: childAttendees = loading ? [] : getChildAttendees();
	$: teenAttendees = loading ? [] : getTeenAttendees();
	$: groupLeaders = loading ? [] : getGroupLeaders();
	$: financials = loading ? [] : getFinancials();
</script>

<svelte:head>
	<title>Conference Reports - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 admin-page">
	<h1 class="text-3xl font-bold mb-6">Conference Reports</h1>

	<div class="mb-6">
		<label class="block text-sm font-medium mb-1">Filter by Conference</label>
		<select
			bind:value={selectedConferenceId}
			on:change={loadData}
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
	{:else}
		<!-- Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-600 mb-1">Total Bookings</h3>
				<p class="text-3xl font-bold">{filteredData.bookings.length}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-600 mb-1">Total Attendees</h3>
				<p class="text-3xl font-bold">{filteredData.attendees.length}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-600 mb-1">Total Value</h3>
				<p class="text-3xl font-bold">£{totalValue.toFixed(2)}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-600 mb-1">Total Received</h3>
				<p class="text-3xl font-bold text-green-600">£{totalReceived.toFixed(2)}</p>
			</div>
			<div class="bg-white p-6 rounded-lg shadow">
				<h3 class="text-sm font-medium text-gray-600 mb-1">Outstanding</h3>
				<p class="text-3xl font-bold text-red-600">£{(totalValue - totalReceived).toFixed(2)}</p>
			</div>
		</div>

		<!-- Financial Report -->
		<div class="bg-white rounded-lg shadow overflow-hidden mb-6">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-xl font-bold">Financial Report</h2>
				<button
					on:click={exportFinancialsCSV}
					class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
				>
					Export Financials CSV
				</button>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Ref</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conference</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Leader</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each financials as f}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{f.bookingReference}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{f.conferenceName}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{f.groupLeaderName || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">£{(f.totalAmount || 0).toFixed(2)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">£{(f.paidAmount || 0).toFixed(2)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">£{(f.balance || 0).toFixed(2)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">
									<span class="px-2 py-1 text-xs rounded {f.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : f.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
										{f.paymentStatus || 'unpaid'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm capitalize">{f.paymentMethod === 'deposit20' ? '20% Deposit' : f.paymentMethod || '-'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Group Leaders Report -->
		<div class="bg-white rounded-lg shadow overflow-hidden mb-6">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-xl font-bold">Group Leaders Report</h2>
				<button
					on:click={exportGroupLeadersCSV}
					class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
				>
					Export to CSV
				</button>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Reference</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conference</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Leader Name</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Home Church/Group</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Size</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each groupLeaders as gl}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{gl.bookingReference}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{gl.conferenceName}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{gl.groupLeaderName || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{gl.groupLeaderEmail || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{gl.groupLeaderPhone || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">{gl.groupLeaderHomeChurch || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold">{gl.groupSize}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">£{(gl.totalAmount || 0).toFixed(2)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">
									<span class="px-2 py-1 text-xs rounded {gl.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : gl.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
										{gl.paymentStatus || 'unpaid'}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Teens Report -->
		<div class="bg-white rounded-lg shadow overflow-hidden mb-6">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-xl font-bold">Teens Report ({teenAttendees.length})</h2>
				<button
					on:click={exportTeensCSV}
					class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
				>
					Export to CSV
				</button>
			</div>
			{#if teenAttendees.length === 0}
				<div class="p-6 text-center text-gray-500">No teen attendees found.</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Birth</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emergency Contact</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medical History</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allergies</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dietary Restrictions</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Leader</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each teenAttendees as teen}
								{@const booking = filteredData.bookings.find(b => b.id === teen.bookingId)}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{teen.fullName || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{teen.email || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{teen.dateOfBirth || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{teen.age || 'N/A'}</td>
									<td class="px-6 py-4 text-sm">
										{teen.emergencyContact?.name || 'N/A'}
										<br />
										<span class="text-gray-500 text-xs">{teen.emergencyContact?.phone || ''}</span>
										{#if teen.emergencyContact?.relationship}
											<br />
											<span class="text-gray-500 text-xs">({teen.emergencyContact.relationship})</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm">{teen.medicalHistory || 'None'}</td>
									<td class="px-6 py-4 text-sm">{teen.allergies || 'None'}</td>
									<td class="px-6 py-4 text-sm">{teen.dietaryRestrictions || 'None'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{booking?.groupLeaderName || 'N/A'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Kids Report -->
		<div class="bg-white rounded-lg shadow overflow-hidden mb-6">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-xl font-bold">Kids Report ({childAttendees.length})</h2>
				<button
					on:click={exportKidsCSV}
					class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
				>
					Export to CSV
				</button>
			</div>
			{#if childAttendees.length === 0}
				<div class="p-6 text-center text-gray-500">No child attendees found.</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Birth</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emergency Contact</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medical History</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allergies</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consents</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Leader</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each childAttendees as kid}
								{@const booking = filteredData.bookings.find(b => b.id === kid.bookingId)}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{kid.fullName || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{kid.email || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{kid.dateOfBirth || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{kid.age || 'N/A'}</td>
									<td class="px-6 py-4 text-sm">
										{kid.emergencyContact?.name || 'N/A'}
										<br />
										<span class="text-gray-500 text-xs">{kid.emergencyContact?.phone || ''}</span>
										{#if kid.emergencyContact?.relationship}
											<br />
											<span class="text-gray-500 text-xs">({kid.emergencyContact.relationship})</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm">{kid.medicalHistory || 'None'}</td>
									<td class="px-6 py-4 text-sm">{kid.allergies || 'None'}</td>
									<td class="px-6 py-4 text-sm">
										<div class="flex flex-col gap-1">
											<span class="text-xs {kid.consentMedical ? 'text-green-600' : 'text-red-600'}">
												Medical: {kid.consentMedical ? '✓' : '✗'}
											</span>
											<span class="text-xs {kid.consentPhoto ? 'text-green-600' : 'text-red-600'}">
												Photo: {kid.consentPhoto ? '✓' : '✗'}
											</span>
											<span class="text-xs {kid.consentActivities ? 'text-green-600' : 'text-red-600'}">
												Activities: {kid.consentActivities ? '✓' : '✗'}
											</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">{booking?.groupLeaderName || 'N/A'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

