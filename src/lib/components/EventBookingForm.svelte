<script lang="js">
	import { onMount, createEventDispatcher } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { notifyError, notifyWarning, notifySuccess } from '$lib/utils/notify';

	export let event;
	export let ticketTypes = [];

	const dispatch = createEventDispatcher();

	let currentStep = 1;
	let selectedTickets = [];
	let customerDetails = {
		fullName: '',
		email: '',
		phone: ''
	};
	let orderSummary = null;
	let paypalOrderId = null;
	let processingPayment = false;
	let errors = {};

	// Step 1: Ticket Selection
	let availableTickets = [];
	$: if (ticketTypes) {
		try {
			availableTickets = Array.isArray(ticketTypes) 
				? ticketTypes.filter(t => t && t.enabled !== false) 
				: [];
		} catch (e) {
			console.error('Error filtering tickets:', e);
			availableTickets = [];
		}
	}

	function addTicket(ticketType) {
		const existing = selectedTickets.find(t => t.ticketTypeId === ticketType.id);
		if (existing) {
			existing.quantity += 1;
		} else {
			selectedTickets.push({
				ticketTypeId: ticketType.id,
				ticketType: ticketType,
				quantity: 1
			});
		}
		selectedTickets = [...selectedTickets];
	}

	function removeTicket(ticketTypeId) {
		selectedTickets = selectedTickets.filter(t => t.ticketTypeId !== ticketTypeId);
		updateQuantity(ticketTypeId, 0);
	}

	function updateQuantity(ticketTypeId, quantity) {
		if (quantity <= 0) {
			removeTicket(ticketTypeId);
			return;
		}
		const ticket = selectedTickets.find(t => t.ticketTypeId === ticketTypeId);
		if (ticket) {
			ticket.quantity = quantity;
			selectedTickets = [...selectedTickets];
		}
	}

	function calculateSubtotal() {
		return selectedTickets.reduce((sum, ticket) => {
			return sum + (ticket.ticketType.price * ticket.quantity);
		}, 0);
	}

	function formatCurrency(amount) {
		if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
		return Number(amount).toFixed(2);
	}

	function calculateTotal() {
		return calculateSubtotal();
	}

	async function nextStep() {
		if (currentStep === 1) {
			// Validate ticket selection
			if (selectedTickets.length === 0) {
				errors.tickets = 'Please select at least one ticket';
				return;
			}
			errors = {};
			currentStep += 1;
		}
		// Note: Step 2 doesn't use nextStep() - it calls submitBooking() directly
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep -= 1;
		}
	}

	async function submitBooking() {
		try {
			processingPayment = true;

			// Create booking
			const booking = {
				id: `event-booking-${Date.now()}`,
				eventId: event.id,
				bookingReference: `EVT-${Date.now().toString(36).toUpperCase()}`,
				customerName: customerDetails.fullName,
				customerEmail: customerDetails.email,
				customerPhone: customerDetails.phone,
				ticketCount: selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
				subtotal: calculateSubtotal(),
				totalAmount: calculateTotal(),
				paymentStatus: 'unpaid',
				paidAmount: 0,
				createdAt: new Date().toISOString()
			};

			// Create attendees from selected tickets
			const attendees = [];
			selectedTickets.forEach(ticket => {
				for (let i = 0; i < ticket.quantity; i++) {
					attendees.push({
						id: `attendee-${Date.now()}-${i}`,
						ticketTypeId: ticket.ticketTypeId,
						ticketType: ticket.ticketType,
						fullName: customerDetails.fullName // For events, we'll use customer name for all tickets
					});
				}
			});

			// Submit booking via API
			const response = await fetch('/api/event/booking', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					booking,
					attendees
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create booking');
			}

			const result = await response.json();
			orderSummary = { ...booking, ...result };
			
			// If PayPal is enabled, create PayPal order (unless in TEST mode)
			if (event.paymentSettings?.paypalEnabled && calculateTotal() > 0 && !env.PUBLIC_TEST) {
				await createPayPalOrder(result.bookingId);
			} else if (env.PUBLIC_TEST && calculateTotal() > 0) {
				// TEST mode: Simulate successful payment
				console.log('🧪 TEST MODE: Bypassing PayPal payment');
				await simulateTestPayment(result.bookingId);
			} else {
				currentStep = 3; // Show confirmation
			}
		} catch (error) {
			console.error('Failed to submit booking:', error);
			notifyError(error.message || 'Failed to submit booking. Please try again.');
		} finally {
			processingPayment = false;
		}
	}

	async function simulateTestPayment(bookingId) {
		try {
			processingPayment = true;
			console.log('🧪 TEST MODE: Simulating payment for booking', bookingId);
			
			const response = await fetch('/api/event/paypal/capture', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					orderId: `TEST-${bookingId}`,
					testMode: true
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to simulate test payment');
			}

			const result = await response.json();
			
			if (orderSummary) {
				orderSummary.paymentStatus = result.status || 'paid';
				orderSummary.paidAmount = result.amountPaid || orderSummary.totalAmount;
			}

			processingPayment = false;
			currentStep = 3; // Show confirmation
			notifySuccess('🧪 TEST MODE: Payment simulated successfully');
		} catch (error) {
			console.error('Test payment simulation failed:', error);
			notifyWarning('Test payment failed. Your booking has been created.');
			processingPayment = false;
			currentStep = 3; // Show confirmation anyway
		}
	}

	async function createPayPalOrder(bookingId) {
		try {
			processingPayment = true;
			const response = await fetch('/api/event/paypal/create-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookingId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create PayPal order');
			}

			const { orderId, links } = await response.json();
			paypalOrderId = orderId;

			// In TEST mode, simulate payment capture instead of redirecting
			if (env.PUBLIC_TEST) {
				console.log('🧪 TEST MODE: Simulating payment capture instead of redirecting to PayPal');
				await capturePayPalPayment(orderId);
				return;
			}

			// Find approval link
			const approvalLink = links.find(link => link.rel === 'approve');
			if (approvalLink) {
				// Redirect to PayPal
				window.location.href = approvalLink.href;
			} else {
				throw new Error('PayPal approval link not found');
			}
		} catch (error) {
			console.error('PayPal order creation failed:', error);
			notifyWarning('Payment setup failed. Your booking has been created. Please contact us to complete payment.');
			currentStep = 3; // Show confirmation anyway
		} finally {
			processingPayment = false;
		}
	}

	async function capturePayPalPayment(orderId) {
		try {
			processingPayment = true;
			
			const response = await fetch('/api/event/paypal/capture', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					orderId,
					testMode: env.PUBLIC_TEST || orderId.startsWith('TEST-')
				})
			});

			if (!response.ok) {
				throw new Error('Payment capture failed');
			}

			const result = await response.json();
			
			if (orderSummary) {
				orderSummary.paymentStatus = result.status;
				orderSummary.paidAmount = result.amountPaid;
			}

			// Clean URL
			window.history.replaceState({}, document.title, window.location.pathname);
			
			currentStep = 3; // Show confirmation
		} catch (error) {
			console.error('Payment capture failed:', error);
			notifyError('Payment processing failed. Please contact us.');
			currentStep = 3; // Show confirmation anyway
		} finally {
			processingPayment = false;
		}
	}

	onMount(async () => {
		// Check if we're returning from PayPal
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token'); // This is the PayPal order ID
		
		// Only process PayPal return if we have a valid token
		if (token) {
			// We're returning from PayPal, capture the payment
			await capturePayPalPayment(token);
		} else {
			// Ensure we start at step 1 if no booking exists and we're somehow on step 3
			if (!orderSummary && currentStep === 3) {
				currentStep = 1;
			}
		}
	});
</script>

<div class="event-booking-form">
	<!-- Step Indicator -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			{#each [1, 2, 3] as step}
				<div class="flex items-center flex-1">
					<div class="flex flex-col items-center flex-1">
						<div class="w-10 h-10 rounded-full flex items-center justify-center {step <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}">
							{step}
						</div>
						<div class="mt-2 text-xs text-center">
							{#if step === 1}Select Tickets
							{:else if step === 2}Your Details
							{:else}Confirmation{/if}
						</div>
					</div>
					{#if step < 3}
						<div class="flex-1 h-1 mx-2 {step < currentStep ? 'bg-primary' : 'bg-gray-200'}"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	
	<!-- Step 1: Ticket Selection -->
	{#if currentStep === 1}
		<div>
			<h3 class="text-2xl font-bold mb-4">Select Tickets</h3>
			{#if availableTickets.length === 0}
				<div class="p-4 bg-yellow-50 border border-yellow-200 rounded">
					<p class="text-yellow-800">No tickets available for this event.</p>
				</div>
			{:else}
			<div class="space-y-4 mb-6">
				{#each availableTickets as ticketType (ticketType.id)}
					<div class="border rounded p-4">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h4 class="font-semibold text-lg">{ticketType.name}</h4>
								{#if ticketType.description}
									<p class="text-sm text-gray-700 mt-1">{ticketType.description}</p>
								{/if}
							</div>
							<div class="text-right ml-4">
								<p class="font-bold text-lg">£{formatCurrency(ticketType.price)}</p>
								{#if ticketType.capacity}
									<p class="text-xs text-gray-500">{ticketType.capacity - (ticketType.sold || 0)} remaining</p>
								{/if}
							</div>
						</div>
						<div class="mt-4 flex items-center gap-4">
							<button
								on:click={() => addTicket(ticketType)}
								class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
							>
								Add
							</button>
							{#if selectedTickets.find(t => t.ticketTypeId === ticketType.id)}
								{#each [selectedTickets.find(t => t.ticketTypeId === ticketType.id)] as selected}
									<div class="flex items-center gap-2">
									<button
										on:click={() => updateQuantity(ticketType.id, selected.quantity - 1)}
										class="w-8 h-8 rounded border flex items-center justify-center"
									>
										−
									</button>
									<span class="w-12 text-center">{selected.quantity}</span>
									<button
										on:click={() => updateQuantity(ticketType.id, selected.quantity + 1)}
										class="w-8 h-8 rounded border flex items-center justify-center"
									>
										+
									</button>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			{#if selectedTickets.length > 0}
				<div class="bg-gray-50 p-4 rounded mb-4">
					<h4 class="font-semibold mb-2">Selected Tickets</h4>
					<div class="space-y-2">
						{#each selectedTickets as ticket}
							{#if ticket.ticketType}
							<div class="flex justify-between">
								<span>{ticket.ticketType.name} × {ticket.quantity}</span>
								<span>£{formatCurrency(ticket.ticketType.price * ticket.quantity)}</span>
							</div>
						{/if}
					{/each}
					<div class="border-t pt-2 mt-2 flex justify-between font-bold">
						<span>Total:</span>
						<span>£{formatCurrency(calculateTotal())}</span>
					</div>
				</div>
			</div>
		{/if}

			{#if errors.tickets}
				<p class="text-red-600 text-sm mb-4">{errors.tickets}</p>
			{/if}

			<div class="flex justify-end">
				<button
					on:click={nextStep}
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
				>
					Continue
				</button>
			</div>
			{/if}
		</div>
	{/if}

	<!-- Step 2: Customer Details -->
	{#if currentStep === 2}
		<div>
			<h3 class="text-2xl font-bold mb-4">Your Details</h3>
			
			<div class="space-y-4">
				<div>
					<label for="customer-name" class="block text-sm font-medium mb-1">Full Name *</label>
					<input
						id="customer-name"
						type="text"
						bind:value={customerDetails.fullName}
						class="w-full px-3 py-2 border rounded"
					/>
					{#if errors.fullName}
						<p class="text-red-600 text-xs mt-1">{errors.fullName}</p>
					{/if}
				</div>
				
				<div>
					<label for="customer-email" class="block text-sm font-medium mb-1">Email *</label>
					<input
						id="customer-email"
						type="email"
						bind:value={customerDetails.email}
						class="w-full px-3 py-2 border rounded"
						placeholder="email@example.com"
					/>
					{#if errors.email}
						<p class="text-red-600 text-xs mt-1">{errors.email}</p>
					{/if}
				</div>
				
				<div>
					<label for="customer-phone" class="block text-sm font-medium mb-1">Phone *</label>
					<input
						id="customer-phone"
						type="tel"
						bind:value={customerDetails.phone}
						class="w-full px-3 py-2 border rounded"
					/>
					{#if errors.phone}
						<p class="text-red-600 text-xs mt-1">{errors.phone}</p>
					{/if}
				</div>
			</div>

			<div class="flex justify-between mt-6">
				<button
					on:click={prevStep}
					class="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400"
				>
					Back
				</button>
				<button
					on:click={async () => {
						// Validate first
						errors = {};
						let hasErrors = false;
						
						if (!customerDetails.fullName.trim()) {
							errors.fullName = 'Full name is required';
							hasErrors = true;
						}
						if (!customerDetails.email.trim() || !customerDetails.email.includes('@')) {
							errors.email = 'Valid email is required';
							hasErrors = true;
						}
						if (!customerDetails.phone.trim()) {
							errors.phone = 'Phone number is required';
							hasErrors = true;
						}
						
						if (!hasErrors) {
							// Submit booking instead of just going to next step
							await submitBooking();
						}
					}}
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
					disabled={processingPayment}
				>
					{processingPayment ? 'Processing...' : 'Complete Booking'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Payment & Confirmation -->
	{#if currentStep === 3}
		{#if !orderSummary}
			<div class="p-4 bg-yellow-50 border border-yellow-200 rounded">
				<p class="text-yellow-800 mb-4">No booking found. Please start a new booking.</p>
				<button
					on:click={() => {
						currentStep = 1;
						orderSummary = null;
						selectedTickets = [];
						customerDetails = { fullName: '', email: '', phone: '' };
					}}
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
				>
					Select Tickets
				</button>
			</div>
		{:else}
		<div class="text-center">
			<div class="mb-6">
				{#if processingPayment}
					<div class="mb-4">
						<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
						<p class="text-gray-600">Processing payment...</p>
					</div>
				{:else}
					<svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<h3 class="text-2xl font-bold mb-2">Booking {orderSummary.paymentStatus === 'paid' ? 'Confirmed' : 'Created'}!</h3>
					<p class="text-gray-600">Your booking reference is: <strong>{orderSummary.bookingReference}</strong></p>
				{/if}
			</div>
			{#if !processingPayment}
				<div class="bg-gray-50 p-6 rounded mb-6 text-left">
					<h4 class="font-semibold mb-4">Booking Details</h4>
					<div class="space-y-2">
						<p><strong>Event:</strong> {event.title}</p>
						<p><strong>Total Amount:</strong> £{formatCurrency(orderSummary.totalAmount)}</p>
						<p><strong>Payment Status:</strong> 
							<span class="px-2 py-1 rounded text-sm {
								orderSummary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
								'bg-red-100 text-red-800'
							}">
								{orderSummary.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
							</span>
						</p>
						{#if orderSummary.paidAmount}
							<p><strong>Amount Paid:</strong> £{formatCurrency(orderSummary.paidAmount)}</p>
						{/if}
						<p><strong>Tickets:</strong> {orderSummary.ticketCount}</p>
					</div>
				</div>
				<p class="text-gray-600 mb-4">A confirmation email has been sent to {orderSummary.customerEmail}</p>
				
				{#if orderSummary.paymentStatus === 'unpaid' && event.paymentSettings?.paypalEnabled && !env.PUBLIC_TEST}
					<div class="mb-4">
						<p class="text-sm text-gray-600 mb-2">Complete your payment:</p>
						<button
							on:click={() => createPayPalOrder(orderSummary.bookingId || orderSummary.id)}
							class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
							disabled={processingPayment}
						>
							{processingPayment ? 'Processing...' : 'Pay with PayPal'}
						</button>
					</div>
				{/if}
				{#if env.PUBLIC_TEST && orderSummary.paymentStatus === 'unpaid'}
					<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
						<p class="text-sm text-yellow-800">
							🧪 <strong>TEST MODE:</strong> PayPal payment bypassed. Payment status: {orderSummary.paymentStatus}
						</p>
					</div>
				{/if}
			{/if}
		</div>
		{/if}
	{/if}
</div>

<style>
	.event-booking-form {
		max-width: 800px;
		margin: 0 auto;
	}
</style>

