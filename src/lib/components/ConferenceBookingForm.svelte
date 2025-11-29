<script lang="js">
	import { createEventDispatcher, onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { notifyError, notifyWarning } from '$lib/utils/notify';
	import ConfirmationDialog from './ConfirmationDialog.svelte';

	export let conference;
	export let ticketTypes;

	const dispatch = createEventDispatcher();

	let currentStep = 1;
	let totalSteps = 4; // Will be adjusted based on whether Teen/Child forms are needed

	// Booking data
	let selectedTickets = [];
	let attendees = [];
	let discountCode = '';
	let discountCodeData = null;
	let discountError = '';
	let groupLeaderIndex = 0;
	let paymentMethod = 'full';
	let orderSummary = null;
	let paypalOrderId = null;
	let processingPayment = false;

	// Form validation
	let errors = {};
	let paypalSDKLoaded = false;
	let lastSaved = null;
	let autoSaveTimer = null;
	let churches = [];
	let showDraftDialog = false;

	// Auto-save draft when data changes (debounced)
	$: if (currentStep < 5 && (selectedTickets.length > 0 || attendees.length > 0)) {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}
		autoSaveTimer = setTimeout(() => {
			saveDraft();
			lastSaved = new Date().toLocaleTimeString();
		}, 1000); // Debounce for 1 second
	}

	// Calculate if we have teen/child attendees and total steps
	let hasTeenOrChild = false;
	let actualSteps = 4;
	$: {
		hasTeenOrChild = attendees.some(a => {
			const tt = ticketTypes.find(t => t.id === a.ticketTypeId);
			return tt && (tt.type === 'teen' || tt.type === 'child');
		});
		actualSteps = hasTeenOrChild ? 5 : 4;
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

	function getCurrentPrice(ticketType) {
		const now = new Date();
		if (ticketType.earlyBirdEndDate && new Date(ticketType.earlyBirdEndDate) > now && ticketType.earlyBirdPrice > 0) {
			return ticketType.earlyBirdPrice;
		}
		if (ticketType.latePriceStartDate && new Date(ticketType.latePriceStartDate) <= now && ticketType.latePrice > 0) {
			return ticketType.latePrice;
		}
		return ticketType.price;
	}

	function calculateSubtotal() {
		return selectedTickets.reduce((sum, ticket) => {
			const price = getCurrentPrice(ticket.ticketType);
			return sum + (price * ticket.quantity);
		}, 0);
	}

	function calculateDiscount() {
		if (!discountCodeData) return 0;
		const subtotal = calculateSubtotal();
		if (discountCodeData.type === 'percentage') {
			return subtotal * (discountCodeData.value / 100);
		} else {
			return discountCodeData.value;
		}
	}

	function calculateTotal() {
		return Math.max(0, calculateSubtotal() - calculateDiscount());
	}

	async function validateDiscountCode() {
		if (!discountCode.trim()) {
			discountCodeData = null;
			discountError = '';
			return;
		}

		try {
			const response = await fetch(`/api/conference/discount-code?code=${encodeURIComponent(discountCode)}&conferenceId=${conference.id}`);
			
			if (response.ok) {
				const code = await response.json();
				discountCodeData = code;
				discountError = '';
			} else {
				const error = await response.json();
				discountError = error.error || 'Invalid or disabled discount code';
				discountCodeData = null;
			}
		} catch (error) {
			console.error('Failed to validate discount code:', error);
			discountError = 'Failed to validate discount code';
			discountCodeData = null;
		}
	}

	function nextStep() {
		if (currentStep === 1) {
			// Validate ticket selection
			if (selectedTickets.length === 0) {
				errors.tickets = 'Please select at least one ticket';
				return;
			}
			// Initialize attendees with auto-assigned ticket types
			let attendeeIndex = 0;
			let groupLeaderAssigned = false;
			
			// Sort tickets by priority: Adult > Teen > Other
			const sortedTickets = [...selectedTickets].sort((a, b) => {
				const priority = { 'adult': 1, 'teen': 2, 'child': 3, 'under-2s': 4 };
				const aPriority = priority[a.ticketType.type] || 99;
				const bPriority = priority[b.ticketType.type] || 99;
				return aPriority - bPriority;
			});
			
			attendees = [];
			sortedTickets.forEach(ticket => {
				for (let i = 0; i < ticket.quantity; i++) {
					const isGroupLeader = !groupLeaderAssigned && 
						(ticket.ticketType.type === 'adult' || 
						 ticket.ticketType.type === 'teen' || 
						 !groupLeaderAssigned);
					
					if (isGroupLeader) {
						groupLeaderAssigned = true;
					}
					
					attendees.push({
						id: `attendee-${attendeeIndex}`,
						ticketTypeId: ticket.ticketTypeId,
						fullName: '',
						email: '',
						phone: '',
						dateOfBirth: '',
						address: {
							line1: '',
							line2: '',
							city: '',
							postcode: '',
							country: 'UK'
						},
						homeChurch: '',
						homeChurchOther: '',
						isGroupLeader: isGroupLeader,
						// Child-specific fields
						emergencyContact: {
							name: '',
							phone: '',
							relationship: ''
						},
						medicalHistory: '',
						allergies: '',
						dietaryRestrictions: '',
						consentWaivers: {
							medical: false,
							photo: false,
							activities: false
						}
					});
					attendeeIndex++;
				}
			});
		} else if (currentStep === 2) {
			// Validate attendees
			errors = {};
			let hasErrors = false;
			attendees.forEach((attendee, index) => {
				if (!attendee.fullName.trim()) {
					errors[`attendee-${index}-name`] = 'Full name is required';
					hasErrors = true;
				}
				// Email is optional for all attendees
				if (attendee.email.trim() && !attendee.email.includes('@')) {
					errors[`attendee-${index}-email`] = 'Please enter a valid email address';
					hasErrors = true;
				}
				// Only require DOB for Teen or Child tickets
				if (isTeenOrChildTicket(attendee.ticketTypeId) && !attendee.dateOfBirth) {
					errors[`attendee-${index}-dob`] = 'Date of birth is required for Teen and Child tickets';
					hasErrors = true;
				}
				// Group leader must have email, address, and church
				if (attendee.isGroupLeader) {
					if (!attendee.email.trim() || !attendee.email.includes('@')) {
						errors[`attendee-${index}-email`] = 'Email is required for the group leader';
						hasErrors = true;
					}
					if (!attendee.address.line1.trim()) {
						errors[`attendee-${index}-address`] = 'Address is required for the group leader';
						hasErrors = true;
					}
					if (!attendee.homeChurch || attendee.homeChurch.trim() === '') {
						errors[`attendee-${index}-church`] = 'Home Church/Group is required for the group leader';
						hasErrors = true;
					} else if (attendee.homeChurch === '__OTHER__' && (!attendee.homeChurchOther || !attendee.homeChurchOther.trim())) {
						errors[`attendee-${index}-church`] = 'Please enter the church/group name';
						hasErrors = true;
					}
				}
			});
			if (hasErrors) return;
			// Group leader is auto-assigned, no need to validate
			// Check if we need Teen/Child forms
			const hasTeenOrChild = attendees.some(a => {
				const ticketType = ticketTypes.find(t => t.id === a.ticketTypeId);
				return ticketType && (ticketType.type === 'teen' || ticketType.type === 'child');
			});
			if (!hasTeenOrChild) {
				// Skip Teen/Child forms, go directly to payment summary
				currentStep = 4; // Will be adjusted to step 3 if no payment needed
			}
		} else if (currentStep === 3) {
			// Validate Teen/Child specific fields
			errors = {};
			let hasErrors = false;
			attendees.forEach((attendee, index) => {
				const ticketType = ticketTypes.find(t => t.id === attendee.ticketTypeId);
				if (ticketType && ticketType.type === 'teen') {
					// Validate teen-specific fields if needed
					// For now, we'll just check required fields
				} else if (ticketType && ticketType.type === 'child') {
					if (!attendee.emergencyContact.name.trim()) {
						errors[`attendee-${index}-emergency-name`] = 'Emergency contact name is required';
						hasErrors = true;
					}
					if (!attendee.emergencyContact.phone.trim()) {
						errors[`attendee-${index}-emergency-phone`] = 'Emergency contact phone is required';
						hasErrors = true;
					}
				}
			});
			if (hasErrors) return;
		} else if (currentStep === 4) {
			// Validate child-specific fields for child tickets
			errors = {};
			let hasErrors = false;
			attendees.forEach((attendee, index) => {
				const ticketType = ticketTypes.find(t => t.id === attendee.ticketTypeId);
				if (ticketType && ticketType.type === 'child') {
					if (!attendee.emergencyContact.name.trim()) {
						errors[`attendee-${index}-emergency-name`] = 'Emergency contact name is required';
						hasErrors = true;
					}
					if (!attendee.emergencyContact.phone.trim()) {
						errors[`attendee-${index}-emergency-phone`] = 'Emergency contact phone is required';
						hasErrors = true;
					}
				}
			});
			if (hasErrors) return;
		}
		currentStep += 1;
		// Save draft after moving to next step
		saveDraft();
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep -= 1;
			// Save draft when going back
			saveDraft();
		}
	}

	function isChildTicket(ticketTypeId) {
		const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
		return ticketType && ticketType.type === 'child';
	}

	function isTeenOrChildTicket(ticketTypeId) {
		const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
		return ticketType && (ticketType.type === 'teen' || ticketType.type === 'child');
	}

	// Get available ticket types for a specific attendee (excluding already assigned ones)
	function getAvailableTicketTypes(attendeeIndex) {
		// Count how many times each ticket type has been assigned
		const assignedCounts = {};
		attendees.forEach((a, idx) => {
			if (idx !== attendeeIndex && a.ticketTypeId) {
				assignedCounts[a.ticketTypeId] = (assignedCounts[a.ticketTypeId] || 0) + 1;
			}
		});

		// Build list of available ticket types
		const available = [];
		selectedTickets.forEach(ticket => {
			const assigned = assignedCounts[ticket.ticketTypeId] || 0;
			const remaining = ticket.quantity - assigned;
			// Always include at least one if this attendee already has it selected
			if (attendees[attendeeIndex]?.ticketTypeId === ticket.ticketTypeId) {
				available.push({ ticketTypeId: ticket.ticketTypeId, ticketType: ticket.ticketType });
			} else if (remaining > 0) {
				available.push({ ticketTypeId: ticket.ticketTypeId, ticketType: ticket.ticketType });
			}
		});

		return available;
	}

	// Draft booking save/load functions
	function getDraftKey() {
		return `conference-booking-draft-${conference.id}`;
	}

	function saveDraft() {
		try {
			const draft = {
				currentStep,
				selectedTickets,
				attendees,
				discountCode,
				discountCodeData,
				groupLeaderIndex,
				paymentMethod,
				lastSaved: new Date().toISOString()
			};
			localStorage.setItem(getDraftKey(), JSON.stringify(draft));
		} catch (error) {
			console.error('Failed to save draft:', error);
		}
	}

	function loadDraft() {
		try {
			const draftJson = localStorage.getItem(getDraftKey());
			if (draftJson) {
				const draft = JSON.parse(draftJson);
				// Check if draft is recent (within 30 days)
				const lastSaved = new Date(draft.lastSaved);
				const daysSince = (new Date() - lastSaved) / (1000 * 60 * 60 * 24);
				if (daysSince < 30) {
					showDraftDialog = true;
					return true; // Return true to indicate draft exists, but wait for user confirmation
				} else {
					// Draft is too old, remove it
					localStorage.removeItem(getDraftKey());
				}
			}
		} catch (error) {
			console.error('Failed to load draft:', error);
		}
		return false;
	}

	function handleDraftConfirm() {
		try {
			const draftJson = localStorage.getItem(getDraftKey());
			if (draftJson) {
				const draft = JSON.parse(draftJson);
				currentStep = draft.currentStep || 1;
				selectedTickets = draft.selectedTickets || [];
				attendees = draft.attendees || [];
				discountCode = draft.discountCode || '';
				discountCodeData = draft.discountCodeData || null;
				groupLeaderIndex = draft.groupLeaderIndex || 0;
				paymentMethod = draft.paymentMethod || 'full';
				// Re-validate discount code if present
				if (discountCode) {
					validateDiscountCode();
				}
			}
		} catch (error) {
			console.error('Failed to load draft:', error);
		}
		showDraftDialog = false;
	}

	function handleDraftCancel() {
		// Clear the draft if user chooses not to continue
		localStorage.removeItem(getDraftKey());
		showDraftDialog = false;
	}

	function clearDraft() {
		try {
			localStorage.removeItem(getDraftKey());
		} catch (error) {
			console.error('Failed to clear draft:', error);
		}
	}

	function getAge(dateOfBirth) {
		if (!dateOfBirth) return null;
		const today = new Date();
		const birth = new Date(dateOfBirth);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	async function submitBooking() {
		// Create booking
		const groupLeader = attendees.find(a => a.isGroupLeader);
		const booking = {
			id: `booking-${Date.now()}`,
			conferenceId: conference.id,
			bookingReference: `CONF-${Date.now().toString(36).toUpperCase()}`,
			groupLeaderName: groupLeader.fullName,
			groupLeaderEmail: groupLeader.email,
			groupLeaderPhone: groupLeader.phone,
			attendeeCount: attendees.length,
			subtotal: calculateSubtotal(),
			discountAmount: calculateDiscount(),
			discountCode: discountCodeData ? discountCodeData.code : null,
			totalAmount: calculateTotal(),
			paymentMethod: paymentMethod,
			paymentStatus: 'unpaid',
			createdAt: new Date().toISOString()
		};

		try {
			// Submit booking via public API
			const response = await fetch('/api/conference/booking', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					booking,
					attendees: attendees.map(a => ({
						...a,
						age: getAge(a.dateOfBirth),
						homeChurch: a.homeChurch === '__OTHER__' ? a.homeChurchOther : a.homeChurch
					})),
					discountCode: discountCodeData ? discountCodeData.code : null
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create booking');
			}

			const result = await response.json();
			orderSummary = { ...booking, ...result };
			
			// Clear draft since booking is now submitted
			clearDraft();
			
			// Store booking ID for PayPal return
			sessionStorage.setItem('pendingBookingId', result.bookingId);
			
			// If PayPal is enabled, create PayPal order
			if (conference.paymentSettings?.paypalEnabled && calculateTotal() > 0) {
				await createPayPalOrder(result.bookingId);
			} else {
				currentStep = 5; // Show confirmation
			}
		} catch (error) {
			console.error('Failed to submit booking:', error);
			notifyError(error.message || 'Failed to submit booking. Please try again.');
		}
	}

	async function createPayPalOrder(bookingId) {
		try {
			processingPayment = true;
			const response = await fetch('/api/conference/paypal/create-order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookingId,
					paymentMethod
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create PayPal order');
			}

			const { orderId, links } = await response.json();
			paypalOrderId = orderId;

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
			currentStep = 5; // Show confirmation anyway
		} finally {
			processingPayment = false;
		}
	}

	onMount(async () => {
		// Load churches for conference
		try {
			const response = await fetch('/api/content?type=churches-for-conference');
			if (response.ok) {
				churches = await response.json();
			}
		} catch (error) {
			console.error('Failed to load churches:', error);
		}
		
		// Try to load draft booking first
		const draftExists = loadDraft();
		
		// Check if we're returning from PayPal
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token'); // This is the PayPal order ID
		
		if (token) {
			// We're returning from PayPal, capture the payment
			await capturePayPalPayment(token);
		} else if (!draftExists) {
			// Auto-save draft periodically if no draft exists
			setInterval(() => {
				if (currentStep < 5) {
					saveDraft();
				}
			}, 30000); // Save every 30 seconds
		}
	});

	async function capturePayPalPayment(orderId) {
		try {
			processingPayment = true;
			const response = await fetch('/api/conference/paypal/capture', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderId })
			});

			if (!response.ok) {
				throw new Error('Payment capture failed');
			}

			const result = await response.json();
			
			// Update order summary with payment status
			if (orderSummary) {
				orderSummary.paymentStatus = result.status;
				orderSummary.paidAmount = result.amountPaid;
			}

			// Clean URL
			window.history.replaceState({}, document.title, window.location.pathname);
			
			currentStep = 5; // Show confirmation
		} catch (error) {
			console.error('Payment capture failed:', error);
			notifyError('Payment processing failed. Please contact us.');
			currentStep = 5; // Show confirmation anyway
		} finally {
			processingPayment = false;
		}
	}
</script>

<div class="conference-booking-form">
	<!-- Draft Save Indicator -->
	{#if currentStep < 5 && lastSaved}
		<div class="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
			<span>✓ Progress saved automatically</span>
			{#if lastSaved}
				<span class="text-blue-600 ml-2">(Last saved: {lastSaved})</span>
			{/if}
		</div>
	{/if}
	
	<!-- Step Indicator -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			{#each Array(actualSteps) as _, i}
				<div class="flex items-center flex-1">
					<div class="flex flex-col items-center flex-1">
						<div class="w-10 h-10 rounded-full flex items-center justify-center {i + 1 <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}">
							{i + 1}
						</div>
						<div class="mt-2 text-xs text-center">
							{#if i === 0}Select Tickets
							{:else if i === 1}Attendee Details
							{:else if i === 2 && hasTeenOrChild}Teen/Child Info
							{:else if (i === 2 && !hasTeenOrChild)}Payment
							{:else if i === 3 && hasTeenOrChild}Payment
							{:else}Confirmation{/if}
						</div>
					</div>
					{#if i < actualSteps - 1}
						<div class="flex-1 h-1 mx-2 {i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'}"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Step 1: Ticket Selection -->
	{#if currentStep === 1}
		<div>
			<h3 class="text-2xl font-bold mb-4">Select Tickets</h3>
			<div class="space-y-4 mb-6">
				{#each ticketTypes.filter(t => t.enabled) as ticketType}
					<div class="border rounded p-4">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h4 class="font-semibold text-lg">{ticketType.name}</h4>
								<p class="text-sm text-gray-600 capitalize">{ticketType.type}</p>
								{#if ticketType.description}
									<p class="text-sm text-gray-700 mt-1">{ticketType.description}</p>
								{/if}
								{#if ticketType.camping}
									<span class="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Camping</span>
								{/if}
							</div>
							<div class="text-right ml-4">
								<p class="font-bold text-lg">£{getCurrentPrice(ticketType).toFixed(2)}</p>
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
							<div class="flex justify-between">
								<span>{ticket.ticketType.name} × {ticket.quantity}</span>
								<span>£{(getCurrentPrice(ticket.ticketType) * ticket.quantity).toFixed(2)}</span>
							</div>
						{/each}
						<div class="border-t pt-2 mt-2 flex justify-between font-bold">
							<span>Subtotal:</span>
							<span>£{calculateSubtotal().toFixed(2)}</span>
						</div>
					</div>
				</div>
			{/if}

			<div class="mb-4">
				<label class="block text-sm font-medium mb-1">Discount Code (optional)</label>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={discountCode}
						on:input={validateDiscountCode}
						class="flex-1 px-3 py-2 border rounded"
						placeholder="Enter code"
					/>
					<button
						on:click={validateDiscountCode}
						class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
					>
						Apply
					</button>
				</div>
				{#if discountError}
					<p class="text-red-600 text-sm mt-1">{discountError}</p>
				{:else if discountCodeData}
					<p class="text-green-600 text-sm mt-1">Discount code applied!</p>
				{/if}
			</div>

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
		</div>
	{/if}

	<!-- Step 2: Attendee Details -->
	{#if currentStep === 2}
		<div class="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
			<h3 class="text-2xl font-bold mb-4 text-blue-900">Step 2: Attendee Details</h3>
			<p class="text-sm text-blue-800 mb-6 bg-blue-200 border border-blue-400 rounded p-3">
				The first adult ticket (or first teen/other if no adult) is automatically set as the Group Leader. All communications will be sent to the Group Leader.
			</p>
			<div class="space-y-6">
				{#each attendees as attendee, index}
					{@const ticketType = ticketTypes.find(t => t.id === attendee.ticketTypeId)}
					{@const isGroupLeader = attendee.isGroupLeader}
					<div class="border-2 rounded-lg p-4 {isGroupLeader ? 'bg-blue-50 border-blue-300' : ticketType?.type === 'adult' ? 'bg-gray-50 border-gray-300' : ticketType?.type === 'teen' ? 'bg-purple-50 border-purple-300' : ticketType?.type === 'child' ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}">
						<h4 class="font-semibold mb-4 text-lg">
							{#if isGroupLeader}
								<span class="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold mr-2">Group Leader</span>
							{/if}
							Attendee {index + 1} - {ticketType?.name || 'Unknown Ticket Type'}
						</h4>
						<div class="space-y-4">
							{#if isGroupLeader}
								<div class="bg-blue-100 border border-blue-300 rounded p-3 mb-4">
									<p class="text-sm text-blue-800 font-medium">
										✓ This attendee is automatically set as the Group Leader. All communications will be sent to this person.
									</p>
								</div>
							{/if}
							<div>
								<label class="block text-sm font-medium mb-1">Full Name *</label>
								<input
									type="text"
									bind:value={attendee.fullName}
									class="w-full px-3 py-2 border rounded"
								/>
								{#if errors[`attendee-${index}-name`]}
									<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-name`]}</p>
								{/if}
							</div>
							{#if attendee.ticketTypeId && isTeenOrChildTicket(attendee.ticketTypeId)}
								<div>
									<label class="block text-sm font-medium mb-1">Date of Birth *</label>
									<input
										type="date"
										bind:value={attendee.dateOfBirth}
										class="w-full px-3 py-2 border rounded"
									/>
									{#if errors[`attendee-${index}-dob`]}
										<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-dob`]}</p>
									{/if}
								</div>
							{/if}
							<div>
								<label class="block text-sm font-medium mb-1">Email {attendee.isGroupLeader ? '*' : '(optional)'}</label>
								<input
									type="email"
									bind:value={attendee.email}
									class="w-full px-3 py-2 border rounded"
									placeholder="email@example.com"
								/>
								{#if errors[`attendee-${index}-email`]}
									<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-email`]}</p>
								{/if}
							</div>
							
							{#if isGroupLeader}
								<!-- Group Leader specific fields -->
								<div class="bg-white rounded p-3 border border-blue-200">
									<h5 class="font-semibold text-blue-900 mb-3">Group Leader Contact Information</h5>
									<div>
										<label class="block text-sm font-medium mb-1">Phone *</label>
										<input
											type="tel"
											bind:value={attendee.phone}
											class="w-full px-3 py-2 border rounded"
										/>
									</div>
									<div class="mt-3">
										<label class="block text-sm font-medium mb-1">Address *</label>
										<input
											type="text"
											bind:value={attendee.address.line1}
											class="w-full px-3 py-2 border rounded mb-2"
											placeholder="Address Line 1"
										/>
										<input
											type="text"
											bind:value={attendee.address.line2}
											class="w-full px-3 py-2 border rounded mb-2"
											placeholder="Address Line 2"
										/>
										<div class="grid grid-cols-2 gap-2">
											<input
												type="text"
												bind:value={attendee.address.city}
												class="px-3 py-2 border rounded"
												placeholder="City"
											/>
											<input
												type="text"
												bind:value={attendee.address.postcode}
												class="px-3 py-2 border rounded"
												placeholder="Postcode"
											/>
										</div>
										{#if errors[`attendee-${index}-address`]}
											<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-address`]}</p>
										{/if}
									</div>
									<div class="mt-3">
										<label class="block text-sm font-medium mb-1">Home Church/Group *</label>
										<select
											bind:value={attendee.homeChurch}
											class="w-full px-3 py-2 border rounded {errors[`attendee-${index}-church`] ? 'border-red-500' : ''}"
										>
											<option value="">Select a church</option>
											{#each churches as church}
												<option value={church.title}>{church.title}</option>
											{/each}
											<option value="__OTHER__">Other</option>
										</select>
										{#if attendee.homeChurch === '__OTHER__'}
											<input
												type="text"
												bind:value={attendee.homeChurchOther}
												class="w-full px-3 py-2 border rounded mt-2 {errors[`attendee-${index}-church`] ? 'border-red-500' : ''}"
												placeholder="Enter church/group name"
											/>
										{/if}
										{#if errors[`attendee-${index}-church`]}
											<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-church`]}</p>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>


			<div class="flex justify-between mt-6">
				<button
					on:click={prevStep}
					class="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400"
				>
					Back
				</button>
				<button
					on:click={nextStep}
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
				>
					Continue
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Teen/Child Forms -->
	{#if currentStep === 3}
		<div class="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6">
			<h3 class="text-2xl font-bold mb-4 text-yellow-900">Step 3: Teen & Child Information</h3>
			<p class="text-sm text-yellow-800 mb-6 bg-yellow-200 border border-yellow-400 rounded p-3">
				Please provide additional information for Teen and Child attendees, including emergency contacts and medical details.
			</p>
			<div class="space-y-6">
				{#each attendees as attendee, index}
					{@const ticketType = ticketTypes.find(t => t.id === attendee.ticketTypeId)}
					{#if ticketType && (ticketType.type === 'teen' || ticketType.type === 'child')}
						{#if ticketType.type === 'teen'}
							<!-- Teen Form -->
							<div class="border-2 border-purple-400 bg-purple-50 rounded-lg p-4">
								<h4 class="font-semibold mb-4 text-lg text-purple-900">{attendee.fullName || `Attendee ${index + 1}`} - Teen Information</h4>
								<p class="text-sm text-purple-800 mb-4 bg-purple-100 border border-purple-300 rounded p-2">
									This section is for teen-specific information.
								</p>
								<div class="space-y-4">
									<div>
										<label class="block text-sm font-medium mb-1">Emergency Contact Name *</label>
										<input
											type="text"
											bind:value={attendee.emergencyContact.name}
											class="w-full px-3 py-2 border rounded"
										/>
										{#if errors[`attendee-${index}-emergency-name`]}
											<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-name`]}</p>
										{/if}
									</div>
									<div>
										<label class="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
										<input
											type="tel"
											bind:value={attendee.emergencyContact.phone}
											class="w-full px-3 py-2 border rounded"
										/>
										{#if errors[`attendee-${index}-emergency-phone`]}
											<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-phone`]}</p>
										{/if}
									</div>
									<div>
										<label class="block text-sm font-medium mb-1">Emergency Contact Relationship</label>
										<input
											type="text"
											bind:value={attendee.emergencyContact.relationship}
											class="w-full px-3 py-2 border rounded"
											placeholder="e.g., Parent, Guardian"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium mb-1">Medical History</label>
										<textarea
											bind:value={attendee.medicalHistory}
											class="w-full px-3 py-2 border rounded"
											rows="3"
										></textarea>
									</div>
									<div>
										<label class="block text-sm font-medium mb-1">Allergies</label>
										<input
											type="text"
											bind:value={attendee.allergies}
											class="w-full px-3 py-2 border rounded"
										/>
									</div>
									<div>
										<label class="block text-sm font-medium mb-1">Dietary Restrictions</label>
										<input
											type="text"
											bind:value={attendee.dietaryRestrictions}
											class="w-full px-3 py-2 border rounded"
										/>
									</div>
								</div>
							</div>
						{:else if ticketType.type === 'child'}
							<!-- Child Form -->
							<div class="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-4">
								<h4 class="font-semibold mb-4 text-lg text-yellow-900">{attendee.fullName || `Attendee ${index + 1}`} - Child Information</h4>
								<p class="text-sm text-yellow-800 mb-4 bg-yellow-100 border border-yellow-300 rounded p-2">
									This section is for child-specific information including emergency contacts and medical details.
								</p>
							<div class="space-y-4">
								<div>
									<label class="block text-sm font-medium mb-1">Emergency Contact Name *</label>
									<input
										type="text"
										bind:value={attendee.emergencyContact.name}
										class="w-full px-3 py-2 border rounded"
									/>
									{#if errors[`attendee-${index}-emergency-name`]}
										<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-name`]}</p>
									{/if}
								</div>
								<div>
									<label class="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
									<input
										type="tel"
										bind:value={attendee.emergencyContact.phone}
										class="w-full px-3 py-2 border rounded"
									/>
									{#if errors[`attendee-${index}-emergency-phone`]}
										<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-phone`]}</p>
									{/if}
								</div>
								<div>
									<label class="block text-sm font-medium mb-1">Emergency Contact Relationship</label>
									<input
										type="text"
										bind:value={attendee.emergencyContact.relationship}
										class="w-full px-3 py-2 border rounded"
										placeholder="e.g., Parent, Guardian"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium mb-1">Medical History</label>
									<textarea
										bind:value={attendee.medicalHistory}
										class="w-full px-3 py-2 border rounded"
										rows="3"
									></textarea>
								</div>
								<div>
									<label class="block text-sm font-medium mb-1">Allergies</label>
									<input
										type="text"
										bind:value={attendee.allergies}
										class="w-full px-3 py-2 border rounded"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium mb-1">Dietary Restrictions</label>
									<input
										type="text"
										bind:value={attendee.dietaryRestrictions}
										class="w-full px-3 py-2 border rounded"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium mb-2">Consent Waivers</label>
									<div class="space-y-2">
										<div class="flex items-center">
											<input
												type="checkbox"
												bind:checked={attendee.consentWaivers.medical}
												class="mr-2"
											/>
											<label>Medical treatment consent</label>
										</div>
										<div class="flex items-center">
											<input
												type="checkbox"
												bind:checked={attendee.consentWaivers.photo}
												class="mr-2"
											/>
											<label>Photo/video consent</label>
										</div>
										<div class="flex items-center">
											<input
												type="checkbox"
												bind:checked={attendee.consentWaivers.activities}
												class="mr-2"
											/>
											<label>Activities consent</label>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/if}
					{/if}
				{/each}
			</div>

			<div class="flex justify-between mt-6">
				<button
					on:click={prevStep}
					class="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400"
				>
					Back
				</button>
				<button
					on:click={nextStep}
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
				>
					Continue
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 4: Payment Summary -->
	{#if currentStep === 4}
		<div class="bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-lg p-6">
			<h3 class="text-2xl font-bold mb-4 text-indigo-900">Step 4: Payment Summary</h3>
			<div class="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 p-6 rounded-lg">
				<h4 class="font-semibold mb-4 text-lg text-gray-900">Order Summary</h4>
				<div class="space-y-2">
					{#each selectedTickets as ticket}
						<div class="flex justify-between">
							<span>{ticket.ticketType.name} × {ticket.quantity}</span>
							<span>£{(getCurrentPrice(ticket.ticketType) * ticket.quantity).toFixed(2)}</span>
						</div>
					{/each}
					{#if discountCodeData}
						<div class="flex justify-between text-green-600">
							<span>Discount ({discountCodeData.code})</span>
							<span>-£{calculateDiscount().toFixed(2)}</span>
						</div>
					{/if}
					<div class="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
						<span>Total:</span>
						<span>£{calculateTotal().toFixed(2)}</span>
					</div>
				</div>
			</div>

			<div class="mt-6 bg-white border-2 border-indigo-300 p-6 rounded-lg">
				<label class="block text-sm font-medium mb-4 text-lg text-indigo-900">Payment Method</label>
				<div class="space-y-2">
					<div class="flex items-center">
						<input
							type="radio"
							bind:group={paymentMethod}
							value="full"
							class="mr-2"
						/>
						<label>Pay in Full</label>
					</div>
					{#if conference.paymentSettings && conference.paymentSettings.payLaterEnabled}
						<div class="flex items-center">
							<input
								type="radio"
								bind:group={paymentMethod}
								value="deposit"
								class="mr-2"
							/>
							<label>Pay Deposit + Installments</label>
						</div>
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
					on:click={submitBooking}
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
				>
					Complete Booking
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 5: Confirmation -->
	{#if currentStep === 5 && orderSummary}
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
					<h3 class="text-2xl font-bold mb-2">Booking {orderSummary.paymentStatus === 'paid' ? 'Confirmed' : orderSummary.paymentStatus === 'partial' ? 'Partially Paid' : 'Created'}!</h3>
					<p class="text-gray-600">Your booking reference is: <strong>{orderSummary.bookingReference}</strong></p>
				{/if}
			</div>
			{#if !processingPayment}
				<div class="bg-gray-50 p-6 rounded mb-6 text-left">
					<h4 class="font-semibold mb-4">Booking Details</h4>
					<div class="space-y-2">
						<p><strong>Conference:</strong> {conference.title}</p>
						<p><strong>Total Amount:</strong> £{orderSummary.totalAmount.toFixed(2)}</p>
						<p><strong>Payment Status:</strong> 
							<span class="px-2 py-1 rounded text-sm {
								orderSummary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
								orderSummary.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
								'bg-red-100 text-red-800'
							}">
								{orderSummary.paymentStatus === 'paid' ? 'Paid' :
								 orderSummary.paymentStatus === 'partial' ? 'Partial Payment' : 'Pending Payment'}
							</span>
						</p>
						{#if orderSummary.paidAmount}
							<p><strong>Amount Paid:</strong> £{orderSummary.paidAmount.toFixed(2)}</p>
						{/if}
						<p><strong>Payment Method:</strong> {orderSummary.paymentMethod === 'full' ? 'Pay in Full' : 'Deposit + Installments'}</p>
						<p><strong>Attendees:</strong> {orderSummary.attendeeCount}</p>
					</div>
				</div>
				<p class="text-gray-600 mb-4">A confirmation email has been sent to {orderSummary.groupLeaderEmail}</p>
				{#if orderSummary.paymentStatus === 'unpaid' && conference.paymentSettings?.paypalEnabled}
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
				<button
					on:click={() => {
						sessionStorage.removeItem('pendingBookingId');
						dispatch('close');
					}}
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
				>
					Close
				</button>
			{/if}
		</div>
	{/if}
</div>

<!-- Draft Confirmation Dialog -->
<ConfirmationDialog
	open={showDraftDialog}
	title="Continue Saved Booking?"
	message="You have a saved booking. Would you like to continue where you left off?"
	confirmText="Yes, Continue"
	cancelText="No, Start New"
	on:confirm={handleDraftConfirm}
	on:cancel={handleDraftCancel}
/>

<style>
	.conference-booking-form {
		max-width: 800px;
		margin: 0 auto;
	}
</style>

