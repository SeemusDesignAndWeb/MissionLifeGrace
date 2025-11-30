<script lang="js">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	export let data;

	let loading = false;
	let selectedBooking = null;
	let selectedBookingAttendees = [];
	let loadingDetails = false;
	let ticketTypes = [];
	let showChangePassword = false;
	let changePasswordCurrent = '';
	let changePasswordNew = '';
	let changePasswordConfirm = '';
	let changePasswordLoading = false;
	let changePasswordError = '';
	let changePasswordSuccess = false;
	let showPaymentModal = false;
	let paymentBooking = null;
	let paymentAmount = '';
	let paymentAmountError = '';

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
	}

	function openPaymentModal(booking) {
		paymentBooking = booking;
		const balanceDue = booking.totalAmount - (booking.paidAmount || 0);
		paymentAmount = balanceDue.toFixed(2);
		paymentAmountError = '';
		showPaymentModal = true;
	}

	function closePaymentModal() {
		showPaymentModal = false;
		paymentBooking = null;
		paymentAmount = '';
		paymentAmountError = '';
	}

	async function handlePayment(bookingId, customAmount = null) {
		loading = true;
		try {
			const balanceDue = paymentBooking ? paymentBooking.totalAmount - (paymentBooking.paidAmount || 0) : 0;
			const amountToPay = customAmount ? parseFloat(customAmount) : balanceDue;

			// Validate amount
			if (isNaN(amountToPay) || amountToPay <= 0) {
				paymentAmountError = 'Please enter a valid amount';
				loading = false;
				return;
			}

			if (amountToPay > balanceDue) {
				paymentAmountError = `Amount cannot exceed balance due of ${formatCurrency(balanceDue)}`;
				loading = false;
				return;
			}

			// Redirect to payment page or trigger PayPal
			const response = await fetch('/api/conference/paypal/create-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookingId,
					paymentMethod: customAmount ? 'partial' : 'full',
					amount: customAmount ? amountToPay : null
				})
			});

			const result = await response.json();
			if (result.links) {
				const approveLink = result.links.find(link => link.rel === 'approve');
				if (approveLink) {
					closePaymentModal();
					window.location.href = approveLink.href;
				}
			} else if (result.error) {
				paymentAmountError = result.error;
			}
		} catch (error) {
			console.error('Payment error:', error);
			paymentAmountError = 'Failed to initiate payment. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function logout() {
		await fetch('/api/user/logout', { method: 'POST' });
		goto('/my-account/login');
	}

	async function viewBookingDetails(booking) {
		selectedBooking = booking;
		loadingDetails = true;
		try {
			// Load attendees
			const attendeesResponse = await fetch(`/api/content?type=conference-attendees&bookingId=${booking.id}`);
			if (attendeesResponse.ok) {
				selectedBookingAttendees = await attendeesResponse.json();
			}

			// Load ticket types for the conference
			if (booking.conferenceId) {
				const ticketTypesResponse = await fetch(`/api/content?type=conference-ticket-types&conferenceId=${booking.conferenceId}`);
				if (ticketTypesResponse.ok) {
					ticketTypes = await ticketTypesResponse.json();
				}
			}
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

	function getTicketTypeName(id) {
		const ticketType = ticketTypes.find(t => t.id === id);
		return ticketType ? ticketType.name : 'Unknown';
	}

	function getTicketTypeInfo(id) {
		const ticketType = ticketTypes.find(t => t.id === id);
		return ticketType || null;
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

	async function handleChangePassword() {
		changePasswordError = '';
		changePasswordSuccess = false;
		changePasswordLoading = true;

		// Validation
		if (!changePasswordCurrent || !changePasswordNew || !changePasswordConfirm) {
			changePasswordError = 'All fields are required';
			changePasswordLoading = false;
			return;
		}

		if (changePasswordNew.length < 6) {
			changePasswordError = 'New password must be at least 6 characters';
			changePasswordLoading = false;
			return;
		}

		if (changePasswordNew !== changePasswordConfirm) {
			changePasswordError = 'New passwords do not match';
			changePasswordLoading = false;
			return;
		}

		try {
			const response = await fetch('/api/user/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword: changePasswordCurrent,
					newPassword: changePasswordNew
				})
			});

			const data = await response.json();

			if (response.ok) {
				changePasswordSuccess = true;
				changePasswordCurrent = '';
				changePasswordNew = '';
				changePasswordConfirm = '';
				// Hide form after 2 seconds
				setTimeout(() => {
					showChangePassword = false;
					changePasswordSuccess = false;
				}, 2000);
			} else {
				changePasswordError = data.error || 'Failed to change password';
			}
		} catch (error) {
			changePasswordError = 'An error occurred. Please try again.';
		} finally {
			changePasswordLoading = false;
		}
	}
</script>

<svelte:head>
	<title>My Account - Bookings</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-3xl font-bold text-gray-900">
				{data.groupLeaderName || 'My Account'}
			</h1>
			<div class="flex gap-3">
				<button
					on:click={() => showChangePassword = !showChangePassword}
					class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
				>
					{showChangePassword ? 'Cancel' : 'Change Password'}
				</button>
				<button
					on:click={logout}
					class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
				>
					Logout
				</button>
			</div>
		</div>

		<!-- Change Password Section -->
		{#if showChangePassword}
			<div class="bg-white shadow rounded-lg p-6 mb-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
				
				{#if changePasswordSuccess}
					<div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
						Password changed successfully!
					</div>
				{/if}

				{#if changePasswordError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
						{changePasswordError}
					</div>
				{/if}

				<form on:submit|preventDefault={handleChangePassword} class="space-y-4">
					<div>
						<label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">
							Current Password
						</label>
						<input
							id="current-password"
							type="password"
							bind:value={changePasswordCurrent}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Enter your current password"
						/>
					</div>

					<div>
						<label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">
							New Password
						</label>
						<input
							id="new-password"
							type="password"
							bind:value={changePasswordNew}
							required
							minlength="6"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Enter your new password (min 6 characters)"
						/>
					</div>

					<div>
						<label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">
							Confirm New Password
						</label>
						<input
							id="confirm-password"
							type="password"
							bind:value={changePasswordConfirm}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Confirm your new password"
						/>
					</div>

					<div class="flex gap-3">
						<button
							type="submit"
							disabled={changePasswordLoading}
							class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
						>
							{changePasswordLoading ? 'Changing...' : 'Change Password'}
						</button>
						<button
							type="button"
							on:click={() => {
								showChangePassword = false;
								changePasswordCurrent = '';
								changePasswordNew = '';
								changePasswordConfirm = '';
								changePasswordError = '';
								changePasswordSuccess = false;
							}}
							class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		{#if data.bookings && data.bookings.length > 0}
			<div class="space-y-6">
				{#each data.bookings as booking}
					<div class="bg-white shadow rounded-lg overflow-hidden">
						<div class="p-6">
							<div class="flex justify-between items-start mb-4">
								<div>
									<h2 class="text-xl font-semibold text-gray-900">
										{booking.conference?.title || 'Conference'}
									</h2>
									<p class="text-sm text-gray-600 mt-1">
										Booking Reference: <strong>{booking.bookingReference}</strong>
									</p>
									{#if booking.groupLeaderName}
										<p class="text-sm text-gray-600 mt-1">
											Group Leader: <strong>{booking.groupLeaderName}</strong>
										</p>
									{/if}
									{#if booking.conference}
										<p class="text-sm text-gray-600 mt-1">
											{formatDate(booking.conference.startDate)}
											{#if booking.conference.endDate && booking.conference.endDate !== booking.conference.startDate}
												- {formatDate(booking.conference.endDate)}
											{/if}
										</p>
									{/if}
								</div>
								<div class="text-right">
									<span class="px-3 py-1 text-xs font-semibold rounded-full {
										booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
										booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
										'bg-red-100 text-red-800'
									}">
										{booking.paymentStatus === 'paid' ? 'Paid' :
										 booking.paymentStatus === 'partial' ? 'Partial Payment' :
										 'Pending Payment'}
									</span>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4 mt-4">
								<div>
									<p class="text-sm text-gray-600">Total Amount</p>
									<p class="text-lg font-semibold">{formatCurrency(booking.totalAmount)}</p>
								</div>
								<div>
									<p class="text-sm text-gray-600">Amount Paid</p>
									<p class="text-lg font-semibold">{formatCurrency(booking.paidAmount || 0)}</p>
								</div>
							</div>

							{#if booking.paymentStatus === 'partial' || (booking.paidAmount && booking.paidAmount < booking.totalAmount)}
								<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
									<div class="flex justify-between items-center">
										<div>
											<p class="text-sm font-medium text-yellow-800">Balance Due</p>
											<p class="text-2xl font-bold text-yellow-900 mt-1">
												{formatCurrency(booking.totalAmount - (booking.paidAmount || 0))}
											</p>
										</div>
										<div class="flex gap-2">
											<button
												on:click={() => openPaymentModal(booking)}
												disabled={loading}
												class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-semibold"
											>
												Pay Part
											</button>
											<button
												on:click={() => {
													paymentBooking = booking;
													handlePayment(booking.id);
												}}
												disabled={loading}
												class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 font-semibold"
											>
												{loading ? 'Processing...' : 'Pay Full Balance'}
											</button>
										</div>
									</div>
								</div>
							{/if}

							<div class="mt-4 pt-4 border-t flex gap-3">
								<button
									on:click={() => viewBookingDetails(booking)}
									class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
								>
									View Details
								</button>
								{#if booking.paymentStatus === 'unpaid'}
									<button
										on:click={() => handlePayment(booking.id)}
										disabled={loading}
										class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
									>
										{loading ? 'Processing...' : 'Pay Now'}
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="bg-white shadow rounded-lg p-8 text-center">
				<p class="text-gray-600">You don't have any bookings yet.</p>
			</div>
		{/if}
	</div>
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
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
									<p class="text-sm font-medium text-gray-900">{selectedBooking.conference?.title || 'N/A'}</p>
								</div>
								{#if selectedBooking.groupLeaderName}
									<div>
										<label class="text-xs font-semibold text-gray-500 uppercase">Group Leader</label>
										<p class="text-sm font-medium text-gray-900">{selectedBooking.groupLeaderName}</p>
										{#if selectedBooking.groupLeaderEmail}
											<p class="text-xs text-gray-500 mt-1">{selectedBooking.groupLeaderEmail}</p>
										{/if}
									</div>
								{/if}
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Payment Status</label>
									<div class="mt-1">
										<span class="px-3 py-1 text-xs rounded-full {
											selectedBooking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
											selectedBooking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
											'bg-red-100 text-red-800'
										}">
											{selectedBooking.paymentStatus === 'paid' ? 'Paid' :
											 selectedBooking.paymentStatus === 'partial' ? 'Partial Payment' :
											 'Pending Payment'}
										</span>
									</div>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Total Amount</label>
									<p class="text-lg font-bold text-gray-900">{formatCurrency(selectedBooking.totalAmount || 0)}</p>
								</div>
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Amount Paid</label>
									<p class="text-sm font-medium text-gray-900">{formatCurrency(selectedBooking.paidAmount || 0)}</p>
								</div>
								{#if selectedBooking.paymentStatus === 'partial' || (selectedBooking.paidAmount && selectedBooking.totalAmount && selectedBooking.paidAmount < selectedBooking.totalAmount)}
									<div>
										<label class="text-xs font-semibold text-gray-500 uppercase">Balance Due</label>
										<p class="text-xl font-bold text-yellow-600">
											{formatCurrency(selectedBooking.totalAmount - (selectedBooking.paidAmount || 0))}
										</p>
										<div class="flex gap-2 mt-2">
											<button
												on:click={() => {
													closeBookingDetails();
													openPaymentModal(selectedBooking);
												}}
												disabled={loading}
												class="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
											>
												Pay Part
											</button>
											<button
												on:click={() => {
													closeBookingDetails();
													paymentBooking = selectedBooking;
													handlePayment(selectedBooking.id);
												}}
												disabled={loading}
												class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 text-sm"
											>
												{loading ? 'Processing...' : 'Pay Full Balance'}
											</button>
										</div>
									</div>
								{/if}
								<div>
									<label class="text-xs font-semibold text-gray-500 uppercase">Booking Date</label>
									<p class="text-sm font-medium text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
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

<!-- Payment Amount Modal -->
{#if showPaymentModal && paymentBooking}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg max-w-md w-full p-6">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-bold text-gray-900">Pay Balance</h2>
				<button
					on:click={closePaymentModal}
					class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
					aria-label="Close"
				>
					×
				</button>
			</div>

			<div class="mb-4">
				<p class="text-sm text-gray-600 mb-2">
					Total Balance Due: <strong>{formatCurrency(paymentBooking.totalAmount - (paymentBooking.paidAmount || 0))}</strong>
				</p>
				<p class="text-sm text-gray-600 mb-4">
					Enter the amount you would like to pay:
				</p>

				{#if paymentAmountError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
						{paymentAmountError}
					</div>
				{/if}

				<div class="relative">
					<span class="absolute left-3 top-2.5 text-gray-500">£</span>
					<input
						type="number"
						bind:value={paymentAmount}
						min="0.01"
						step="0.01"
						max={paymentBooking.totalAmount - (paymentBooking.paidAmount || 0)}
						class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="0.00"
					/>
				</div>
				<p class="text-xs text-gray-500 mt-1">
					Maximum: {formatCurrency(paymentBooking.totalAmount - (paymentBooking.paidAmount || 0))}
				</p>
			</div>

			<div class="flex gap-3">
				<button
					on:click={closePaymentModal}
					class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
				>
					Cancel
				</button>
				<button
					on:click={() => handlePayment(paymentBooking.id, paymentAmount)}
					disabled={loading || !paymentAmount}
					class="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
				>
					{loading ? 'Processing...' : `Pay ${paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : ''}`}
				</button>
			</div>
		</div>
	</div>
{/if}


