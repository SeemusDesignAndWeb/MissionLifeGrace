<script lang="js">
	import { createEventDispatcher, onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { notifyError, notifyWarning, notifySuccess } from '$lib/utils/notify';
	import ConfirmationDialog from './ConfirmationDialog.svelte';
	import HelpIcon from '$lib/components/HelpIcon.svelte';
	import { getHelpContent } from '$lib/utils/helpContent.js';

	export let conference;
	export let ticketTypes = [];
	export let isAuthenticated = false;

	const dispatch = createEventDispatcher();

	let currentStep = 1;
	
	// Login Modal State
	let showLoginModal = false;
	let loginEmail = '';
	let loginPassword = '';
	let loginLoading = false;
	let loginError = '';
	let showForgotPassword = false;
	let forgotPasswordLoading = false;
	let forgotPasswordSuccess = false;
	let forgotPasswordError = '';
	
	// Immediately check and fix invalid currentStep whenever it changes
	$: {
		// Check if we're on confirmation step but orderSummary is missing or invalid
		// Confirmation step is 5 if we have teen/child forms, otherwise 4
		const confirmationStep = hasTeenOrChild ? 5 : 4;
		const isConfirmationStep = currentStep === confirmationStep;
		const isOrderInvalid = !orderSummary || !orderSummary.bookingReference || !orderSummary.id;
		
		if (isConfirmationStep && isOrderInvalid) {
			// Use a flag to prevent infinite loops
			if (typeof window !== 'undefined') {
				// Only reset if we're not already resetting
				const resetKey = `resetting-${conference?.id || 'default'}`;
				if (!sessionStorage.getItem(resetKey)) {
					sessionStorage.setItem(resetKey, 'true');
					currentStep = 1;
					clearDraft();
					setTimeout(() => sessionStorage.removeItem(resetKey), 100);
				}
			} else {
				currentStep = 1;
				clearDraft();
			}
		}
	}
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
	let showAccountSetup = false;
	let accountSetupEmail = '';
	let accountSetupPassword = '';
	let accountSetupConfirmPassword = '';
	let accountSetupCode = '';
	let accountSetupLoading = false;
	let accountSetupError = '';
	let accountSetupStep = 'verify'; // 'verify' (email verification) or 'setPassword' (create password after verification)

	// Separate Group Leader (if no adult attendee)
	let separateGroupLeader = {
		fullName: '',
		email: '',
		phone: '',
		address: {
			line1: '',
			line2: '',
			city: '',
			postcode: '',
			country: 'UK'
		},
		homeChurch: '',
		homeChurchOther: ''
	};

	// Form validation
	let errors = {};
	let paypalSDKLoaded = false;
	let lastSaved = null;
	let autoSaveTimer = null;
	let churches = [];
	let showDraftDialog = false;

	// Auto-save draft when data changes (debounced)
	// $: if (currentStep < 5 && (selectedTickets.length > 0 || attendees.length > 0)) {
	// 	if (autoSaveTimer) {
	// 		clearTimeout(autoSaveTimer);
	// 	}
	// 	autoSaveTimer = setTimeout(() => {
	// 		saveDraft();
	// 		lastSaved = new Date().toLocaleTimeString();
	// 	}, 1000); // Debounce for 1 second
	// }

	// Calculate if we have teen/child attendees and total steps
	let hasTeenOrChild = false;
	let actualSteps = 4;
	
	// Reactive calculation of hasTeenOrChild and actualSteps
	$: {
		const hasTeen = attendees.some(a => {
			if (!ticketTypes || !Array.isArray(ticketTypes)) return false;
			const tt = ticketTypes.find(t => t.id === a.ticketTypeId);
			return tt && (tt.type === 'teen' || tt.type === 'child');
		});
		
		if (hasTeen !== hasTeenOrChild) {
			hasTeenOrChild = hasTeen;
			actualSteps = hasTeenOrChild ? 5 : 4;
			// Validate step whenever actualSteps changes
			if (currentStep > actualSteps) {
				currentStep = actualSteps;
			}
		}
	}
	
	// Auto-populate group leader info in kids forms when entering step 3
	$: if (currentStep === 3 && hasTeenOrChild) {
		const groupLeader = attendees.find(a => a.isGroupLeader) || null;
		const glName = groupLeader?.fullName || separateGroupLeader.fullName || '';
		const glPhone = groupLeader?.phone || separateGroupLeader.phone || '';
		
		// Auto-populate emergency contact for all teen/child attendees if not already filled
		attendees.forEach(attendee => {
			const ticketType = ticketTypes?.find(t => t.id === attendee.ticketTypeId);
			if (ticketType && (ticketType.type === 'teen' || ticketType.type === 'child')) {
				if (!attendee.emergencyContact.name && glName) {
					attendee.emergencyContact.name = glName;
				}
				if (!attendee.emergencyContact.phone && glPhone) {
					attendee.emergencyContact.phone = glPhone;
				}
				if (!attendee.emergencyContact.relationship && glName) {
					attendee.emergencyContact.relationship = 'Parent/Guardian';
				}
			}
		});
	}
	
	// This reactive statement is handled above in the main $: block

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
		// Triggers reactive block above to update hasTeenOrChild/actualSteps
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

	function isEarlyBirdActive() {
		if (!conference) return false;
		const now = new Date();
		const startDate = conference.earlyBirdStartDate ? new Date(conference.earlyBirdStartDate) : null;
		const endDate = conference.earlyBirdEndDate ? new Date(conference.earlyBirdEndDate) : null;
		const discountAmount = conference.earlyBirdDiscountAmount || 0;

		if (!startDate || !endDate || discountAmount <= 0) return false;

		// Set time to start of day for comparison
		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
		const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
		end.setHours(23, 59, 59, 999); // End of day

		return nowDate >= start && nowDate <= end;
	}

	function isEarlyBirdEndingSoon() {
		if (!isEarlyBirdActive()) return false;
		const now = new Date();
		const endDate = conference.earlyBirdEndDate ? new Date(conference.earlyBirdEndDate) : null;
		if (!endDate) return false;

		const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
		const daysUntilEnd = Math.ceil((end - nowDate) / (1000 * 60 * 60 * 24));

		// Show "ending soon" if 7 days or less remaining
		return daysUntilEnd <= 7 && daysUntilEnd > 0;
	}

	function getCurrentPrice(ticketType) {
		const now = new Date();
		
		// Check conference-level early bird pricing first
		if (isEarlyBirdActive() && conference.earlyBirdDiscountAmount > 0) {
			const discount = conference.earlyBirdDiscountAmount || 0;
			return Math.max(0, ticketType.price - discount);
		}

		// Fall back to ticket-level early bird pricing (for backward compatibility)
		if (ticketType.earlyBirdEndDate && new Date(ticketType.earlyBirdEndDate) > now && ticketType.earlyBirdPrice > 0) {
			return ticketType.earlyBirdPrice;
		}
		
		// Check late pricing
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

	function formatCurrency(amount) {
		if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
		return Number(amount).toFixed(2);
	}

	function generateCalendarLink() {
		if (!conference || !conference.startDate) return '';
		
		const startDate = new Date(conference.startDate);
		const endDate = conference.endDate ? new Date(conference.endDate) : new Date(startDate);
		
		// Set default times if not specified
		if (!conference.startTime) {
			startDate.setHours(9, 0, 0);
		} else {
			const [hours, minutes] = conference.startTime.split(':');
			startDate.setHours(parseInt(hours), parseInt(minutes || 0), 0);
		}
		
		if (!conference.endTime) {
			endDate.setHours(17, 0, 0);
		} else {
			const [hours, minutes] = conference.endTime.split(':');
			endDate.setHours(parseInt(hours), parseInt(minutes || 0), 0);
		}

		// Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
		const formatDate = (date) => {
			return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
		};

		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: conference.title,
			dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
			details: conference.description || '',
			location: conference.venue?.name || conference.venue?.address || ''
		});

		return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

	// Check if volunteer/free tickets require discount code
	function hasVolunteerOrFreeTickets() {
		return selectedTickets.some(ticket => {
			const ticketType = ticketTypes?.find(t => t.id === ticket.ticketTypeId);
			return ticketType && (ticketType.type === 'free' || ticketType.price === 0);
		});
	}

	async function nextStep(skipLoginCheck = false) {
		if (currentStep === 1) {
			// Validate ticket selection
			if (selectedTickets.length === 0) {
				errors.tickets = 'Please select at least one ticket';
				return;
			}
			// Validate discount code for volunteer/free tickets
			if (hasVolunteerOrFreeTickets() && (!discountCode || !discountCode.trim() || !discountCodeData)) {
				discountError = 'A discount code/voucher is required for volunteer/free tickets. Please contact admin for access code.';
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
					// Only adults can be group leaders
					const isGroupLeader = !groupLeaderAssigned && 
						ticket.ticketType.type === 'adult';
					
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
			
			// Check if we have an internal group leader
			const hasInternalGroupLeader = attendees.some(a => a.isGroupLeader);

			// Validate separate group leader if needed
			if (!hasInternalGroupLeader) {
				if (!separateGroupLeader.fullName.trim()) {
					errors['group-leader-name'] = 'Group Leader Name is required';
					hasErrors = true;
				}
				if (!separateGroupLeader.email.trim() || !separateGroupLeader.email.includes('@')) {
					errors['group-leader-email'] = 'Valid Email is required for Group Leader';
					hasErrors = true;
				}
				if (!separateGroupLeader.phone.trim()) {
					errors['group-leader-phone'] = 'Phone is required for Group Leader';
					hasErrors = true;
				}
				if (!separateGroupLeader.address.line1.trim()) {
					errors['group-leader-address'] = 'Address is required for Group Leader';
					hasErrors = true;
				}
				if (!separateGroupLeader.homeChurch || separateGroupLeader.homeChurch.trim() === '') {
					errors['group-leader-church'] = 'Home Church/Group is required';
					hasErrors = true;
				} else if (separateGroupLeader.homeChurch === '__OTHER__' && (!separateGroupLeader.homeChurchOther || !separateGroupLeader.homeChurchOther.trim())) {
					errors['group-leader-church'] = 'Please enter the church/group name';
					hasErrors = true;
				}
			}

			attendees.forEach((attendee, index) => {
				if (!attendee.fullName.trim()) {
					errors[`attendee-${index}-name`] = 'Full name is required';
					hasErrors = true;
				}
				// Email is optional for all attendees unless they are group leader
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

			// Check for existing account before proceeding
			if (!skipLoginCheck && !isAuthenticated) {
				const groupLeaderEmail = hasInternalGroupLeader 
					? attendees.find(a => a.isGroupLeader)?.email 
					: separateGroupLeader.email;
					
				if (groupLeaderEmail) {
					const needsLogin = await checkAccountAndPromptLogin(groupLeaderEmail);
					if (needsLogin) return; // Stop here, show modal
				}
			}

			// Group leader is auto-assigned, no need to validate
			// Check if we need Teen/Child forms
			const hasTeenOrChild = attendees.some(a => {
				const ticketType = ticketTypes.find(t => t.id === a.ticketTypeId);
				return ticketType && (ticketType.type === 'teen' || ticketType.type === 'child');
			});
			if (!hasTeenOrChild) {
				// Skip Teen/Child forms, go directly to payment (step 3)
				// Don't set currentStep here, let it increment normally to step 3
			}
		} else if (currentStep === 3) {
			// If no teen/child, step 3 is payment, so skip validation
			if (hasTeenOrChild) {
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
			}
			// If no teen/child, step 3 is payment - no validation needed here
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
			// Don't save draft if we're on confirmation step without orderSummary
			if ((currentStep === 4 || currentStep === 5) && !orderSummary) {
				return; // Don't save invalid state
			}
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
				
				// Validate orderSummary if present
				const hasValidOrder = draft.orderSummary && draft.orderSummary.bookingReference && draft.orderSummary.id;
				const isConfirmationStep = draft.currentStep === 4 || draft.currentStep === 5;

				// If draft has step 4 or 5 but no valid orderSummary, it's invalid - clear it immediately
				if (isConfirmationStep && !hasValidOrder) {
					localStorage.removeItem(getDraftKey());
					currentStep = 1; // Reset to step 1
					return false;
				}
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
				// Validate and sanitize currentStep
				const savedStep = draft.currentStep || 1;
				let newStep = (savedStep >= 1 && savedStep <= 5) ? savedStep : 1;
				
				// If step is 4 or 5 (confirmation) but there's no orderSummary, reset to last valid step
				if ((newStep === 4 || newStep === 5) && !orderSummary) {
					// Go back to payment step (step 3 if no teen/child, step 4 if teen/child)
					newStep = hasTeenOrChild ? 4 : 3;
				}
				
				// Sanitize selectedTickets - ensure ticketType objects are valid and up to date
				const rawSelected = draft.selectedTickets || [];
				selectedTickets = rawSelected.map(t => {
					// Try to find the up-to-date ticket type object from props
					const upToDateType = ticketTypes.find(tt => tt.id === t.ticketTypeId);
					if (upToDateType) {
						return { ...t, ticketType: upToDateType };
					}
					return null; // Invalid ticket type (maybe removed from conference)
				}).filter(Boolean);
				
				// Sanitize attendees - ensure they map to valid ticket types
				const rawAttendees = draft.attendees || [];
				attendees = rawAttendees.filter(a => {
					return ticketTypes.some(tt => tt.id === a.ticketTypeId);
				});
				
				currentStep = newStep;
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
			// Reset to step 1 if draft is corrupted
			currentStep = 1;
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
	
	function resetToStep1() {
		currentStep = 1;
		clearDraft();
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.removeItem('pendingBookingId');
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
		let groupLeader = attendees.find(a => a.isGroupLeader);
		if (!groupLeader) {
			groupLeader = {
				...separateGroupLeader,
				isGroupLeader: true // Temporarily mark as leader for submission logic
			};
		}

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
			paymentStatus: paymentMethod === 'deposit20' ? 'partial' : 'unpaid',
			paidAmount: paymentMethod === 'deposit20' ? calculateTotal() * 0.2 : 0,
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
			
			// Check if account setup is needed (for partial/unpaid bookings)
			if (result.accountExists && result.accountVerified) {
				// Account exists and is verified - prompt for login instead of setup
				showAccountSetup = true;
				accountSetupEmail = booking.groupLeaderEmail;
				loginEmail = booking.groupLeaderEmail;
				accountSetupStep = 'login';
			} else if (result.accountNeedsSetup || (booking.paymentStatus !== 'paid' && booking.groupLeaderEmail)) {
				showAccountSetup = true;
				accountSetupEmail = booking.groupLeaderEmail;
				// Start with verification step - account should already be created and code sent by backend
				accountSetupStep = 'verify';
				// The backend should have already created the account and sent the verification code
				// If for some reason it didn't, the user can use the resend button
			}
			
			// If PayPal is enabled, create PayPal order (unless in TEST mode)
			if (conference.paymentSettings?.paypalEnabled && calculateTotal() > 0 && !env.PUBLIC_TEST) {
				await createPayPalOrder(result.bookingId);
			} else if (env.PUBLIC_TEST && calculateTotal() > 0) {
				// TEST mode: Simulate successful payment
				console.log('🧪 TEST MODE: Bypassing PayPal payment');
				await simulateTestPayment(result.bookingId);
			} else {
				currentStep = hasTeenOrChild ? 5 : 4; // Show confirmation
			}
		} catch (error) {
			console.error('Failed to submit booking:', error);
			notifyError(error.message || 'Failed to submit booking. Please try again.');
		}
	}

	async function simulateTestPayment(bookingId) {
		try {
			processingPayment = true;
			console.log('🧪 TEST MODE: Simulating payment for booking', bookingId);
			
			// Call the capture endpoint with test flag
			const response = await fetch('/api/conference/paypal/capture', {
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
			
			// Update order summary with payment status
			if (orderSummary) {
				orderSummary.paymentStatus = result.status || 'paid';
				orderSummary.paidAmount = result.amountPaid || orderSummary.totalAmount;
			} else {
				// If orderSummary doesn't exist yet, reload booking data
				const bookingResponse = await fetch(`/api/content?type=conference-bookings&id=${bookingId}`);
				if (bookingResponse.ok) {
					const booking = await bookingResponse.json();
					orderSummary = booking;
				}
			}

			processingPayment = false;
			currentStep = hasTeenOrChild ? 5 : 4; // Show confirmation
			notifySuccess('🧪 TEST MODE: Payment simulated successfully');
		} catch (error) {
			console.error('Test payment simulation failed:', error);
			notifyWarning('Test payment failed. Your booking has been created.');
			processingPayment = false;
			currentStep = hasTeenOrChild ? 5 : 4; // Show confirmation anyway
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
			currentStep = hasTeenOrChild ? 5 : 4; // Show confirmation anyway
		} finally {
			processingPayment = false;
		}
	}

	onMount(async () => {
		// FIRST: Check and fix invalid currentStep IMMEDIATELY before anything else
		if ((currentStep === 4 || currentStep === 5) && !orderSummary) {
			currentStep = 1;
			// Clear any invalid draft immediately
			try {
				localStorage.removeItem(getDraftKey());
			} catch (e) {
				console.error('Failed to clear draft:', e);
			}
		}
		
		// Load churches for conference
		try {
			const response = await fetch('/api/churches?type=conference');
			if (response.ok) {
				churches = await response.json();
			}
		} catch (error) {
			console.error('Failed to load churches:', error);
		}
		
		// Try to load draft booking (loadDraft will also check for invalid steps)
		const draftExists = loadDraft();
		
		// After draft loading, ensure currentStep is valid one more time
		if ((currentStep === 4 || currentStep === 5) && !orderSummary) {
			currentStep = 1;
			try {
				localStorage.removeItem(getDraftKey());
			} catch (e) {
				console.error('Failed to clear draft:', e);
			}
		}
		
		// Ensure currentStep is valid on mount
		if (currentStep < 1 || currentStep > 5) {
			currentStep = 1;
		}
		
		// Check if we're returning from PayPal (or test mode)
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token'); // This is the PayPal order ID
		
		if (token) {
			// We're returning from PayPal, capture the payment
			await capturePayPalPayment(token);
		} else if (env.PUBLIC_TEST && sessionStorage.getItem('pendingBookingId') && (currentStep === 3 || currentStep === 4)) {
			// TEST mode: Auto-complete payment if booking exists AND we are on payment step
			const bookingId = sessionStorage.getItem('pendingBookingId');
			console.log('🧪 TEST MODE: Auto-completing payment for booking', bookingId);
			await simulateTestPayment(bookingId);
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
			
			// In test mode, use test flag
			const response = await fetch('/api/conference/paypal/capture', {
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
			
			// Update order summary with payment status
			if (orderSummary) {
				orderSummary.paymentStatus = result.status;
				orderSummary.paidAmount = result.amountPaid;
			}

			// Check if account setup is needed after payment
			if (orderSummary && orderSummary.paymentStatus !== 'paid') {
				if (result.accountExists && result.accountVerified) {
					// Account exists and is verified - prompt for login
					showAccountSetup = true;
					accountSetupEmail = orderSummary.groupLeaderEmail;
					loginEmail = orderSummary.groupLeaderEmail;
					accountSetupStep = 'login';
				} else {
					showAccountSetup = true;
					accountSetupEmail = orderSummary.groupLeaderEmail;
					accountSetupStep = 'verify';
					
					// Automatically create account and send verification code
					try {
						const registerResponse = await fetch('/api/user/register', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								email: orderSummary.groupLeaderEmail,
								bookingId: orderSummary.bookingId || orderSummary.id,
								name: orderSummary.groupLeaderName || orderSummary.groupLeaderEmail.split('@')[0]
							})
						});
						if (!registerResponse.ok) {
							console.error('Failed to initiate account creation');
						}
					} catch (error) {
						console.error('Error initiating account creation:', error);
					}
				}
			}

			// Clean URL
			window.history.replaceState({}, document.title, window.location.pathname);
			
			currentStep = hasTeenOrChild ? 5 : 4; // Show confirmation
		} catch (error) {
			console.error('Payment capture failed:', error);
			notifyError('Payment processing failed. Please contact us.');
			currentStep = hasTeenOrChild ? 5 : 4; // Show confirmation anyway
		} finally {
			processingPayment = false;
		}
	}


	async function handleAccountVerify() {
		accountSetupError = '';
		accountSetupLoading = true;

		try {
			const response = await fetch('/api/user/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: accountSetupEmail,
					code: accountSetupCode
				})
			});

			const data = await response.json();

			if (response.ok) {
				// Move to password setup step
				if (data.needsPassword) {
					accountSetupStep = 'setPassword';
					accountSetupPassword = '';
					accountSetupConfirmPassword = '';
					notifySuccess('Email verified! Now please set your password.');
				} else {
					// Password already set, account complete
					notifySuccess('Email verified! Your account is now set up.');
					showAccountSetup = false;
					setTimeout(() => {
						window.location.href = '/my-account';
					}, 2000);
				}
			} else {
				accountSetupError = data.error || 'Verification failed';
				notifyError(accountSetupError);
			}
		} catch (error) {
			accountSetupError = 'An error occurred. Please try again.';
			notifyError(accountSetupError);
		} finally {
			accountSetupLoading = false;
		}
	}

	async function handleSetPassword() {
		accountSetupError = '';
		accountSetupLoading = true;

		if (accountSetupPassword !== accountSetupConfirmPassword) {
			accountSetupError = 'Passwords do not match';
			accountSetupLoading = false;
			notifyError(accountSetupError);
			return;
		}

		if (accountSetupPassword.length < 6) {
			accountSetupError = 'Password must be at least 6 characters';
			accountSetupLoading = false;
			notifyError(accountSetupError);
			return;
		}

		try {
			const response = await fetch('/api/user/set-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: accountSetupEmail,
					password: accountSetupPassword
				})
			});

			const data = await response.json();

			if (response.ok) {
				notifySuccess('Password set successfully! Redirecting to your account...');
				showAccountSetup = false;
				// Redirect to account page immediately
				window.location.href = '/my-account';
			} else {
				accountSetupError = data.error || 'Failed to set password';
				notifyError(accountSetupError);
			}
		} catch (error) {
			accountSetupError = 'An error occurred. Please try again.';
			notifyError(accountSetupError);
		} finally {
			accountSetupLoading = false;
		}
	}

	async function resendVerificationCode() {
		accountSetupError = '';
		accountSetupLoading = true;

		try {
			// First try to register/resend code
			const registerResponse = await fetch('/api/user/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: accountSetupEmail,
					bookingId: orderSummary?.bookingId || orderSummary?.id,
					name: orderSummary?.groupLeaderName || accountSetupEmail.split('@')[0]
				})
			});

			if (registerResponse.ok) {
				notifySuccess('Verification code sent to your email');
			} else {
				// If register fails, try resend endpoint
				const resendResponse = await fetch('/api/user/resend-code', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: accountSetupEmail })
				});

				const data = await resendResponse.json();

				if (resendResponse.ok) {
					notifySuccess('Verification code sent to your email');
				} else {
					accountSetupError = data.error || 'Failed to resend code';
					notifyError(accountSetupError);
				}
			}
		} catch (error) {
			accountSetupError = 'An error occurred. Please try again.';
			notifyError(accountSetupError);
		} finally {
			accountSetupLoading = false;
		}
	}

	async function checkAccountAndPromptLogin(email) {
		if (!email || isAuthenticated) return false;

		try {
			const response = await fetch(`/api/user/check-account?email=${encodeURIComponent(email)}`);
			const data = await response.json();

			if (data.exists) {
				loginEmail = email;
				showLoginModal = true;
				return true;
			}
		} catch (error) {
			console.error('Failed to check account:', error);
		}
		return false;
	}

	async function handleLogin() {
		loginLoading = true;
		loginError = '';

		try {
			const response = await fetch('/api/user/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: loginEmail, password: loginPassword })
			});

			const data = await response.json();

			if (response.ok) {
				isAuthenticated = true; // Update local state
				showLoginModal = false;
				notifySuccess('Logged in successfully!');
				
				// If we are on the confirmation step (account setup section), don't go to next step
				// Instead, hide the account setup section and maybe redirect
				if ((currentStep === 4 && !hasTeenOrChild) || (currentStep === 5 && hasTeenOrChild)) {
					showAccountSetup = false;
					// Redirect to account page after a short delay
					setTimeout(() => {
						window.location.href = '/my-account';
					}, 1500);
				} else {
					nextStep(true); // Proceed to next step, skipping checks if on earlier steps
				}
			} else {
				loginError = data.error || 'Login failed';
				if (data.needsVerification) {
					loginError += ' Please verify your email first.';
				}
			}
		} catch (error) {
			loginError = 'An error occurred. Please try again.';
		} finally {
			loginLoading = false;
		}
	}

	async function handleForgotPassword() {
		if (!loginEmail) {
			forgotPasswordError = 'Please enter your email address';
			return;
		}

		forgotPasswordLoading = true;
		forgotPasswordError = '';
		forgotPasswordSuccess = false;

		try {
			const response = await fetch('/api/user/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: loginEmail })
			});

			forgotPasswordSuccess = true;
		} catch (err) {
			forgotPasswordError = 'An error occurred. Please try again.';
		} finally {
			forgotPasswordLoading = false;
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
	<div class="mb-6 hidden md:block">
		<div class="max-w-4xl mx-auto px-4">
			<div class="flex items-start justify-between relative">
				{#each Array(actualSteps || 4) as _, i}
					<div class="flex items-center flex-1" style="min-width: 0;">
						<!-- Step Circle and Label -->
						<div class="flex flex-col items-center flex-1 relative z-10">
							<!-- Circle -->
							<div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold {i + 1 <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}">
								{i + 1}
							</div>
							<!-- Label -->
							<div class="mt-2 text-xs text-center leading-tight px-1 whitespace-nowrap">
								{#if i === 0}Select Tickets
								{:else if i === 1}Attendee Details
								{:else if i === 2 && hasTeenOrChild}Teen/Child Info
								{:else if (i === 2 && !hasTeenOrChild)}Payment
								{:else if i === 3 && hasTeenOrChild}Payment
								{:else}Confirmation{/if}
							</div>
						</div>
						<!-- Connecting Line -->
						{#if i < actualSteps - 1}
							<div class="flex-1 h-0.5 mx-3 {i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'}" style="margin-top: -20px;"></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
	
	<!-- Step 1: Ticket Selection -->
	{#if currentStep === 1}
		<div>
			<h3 class="text-2xl font-bold mb-4">Select Tickets</h3>
			{#if availableTickets.length === 0}
				<div class="p-4 bg-yellow-50 border border-yellow-200 rounded">
					<p class="text-yellow-800">No tickets available for this conference.</p>
				</div>
			{:else}
			<div class="space-y-4 mb-6">
				{#each availableTickets as ticketType (ticketType.id)}
					<div class="border rounded p-4">
						<div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
							<!-- Left Column: Name (1) and Description (2) -->
							<div class="flex-1">
								<!-- 1. Name & Type -->
								<div class="flex flex-wrap items-center gap-2 mb-2">
									<h4 class="font-semibold text-lg">{ticketType.name}</h4>
									<span class="text-xs text-gray-600 capitalize px-2 py-0.5 bg-gray-100 rounded">{ticketType.type}</span>
									{#if ticketType.camping}
										<span class="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Camping</span>
									{/if}
								</div>
								
								<!-- 2. Description -->
								{#if ticketType.description}
									<p class="text-sm text-gray-700">{ticketType.description}</p>
								{/if}
							</div>

							<!-- Right Column: Early Bird (3), Price (4), Button (5) -->
							<div class="flex flex-col md:items-end gap-2 md:min-w-[200px]">
								<!-- 3. Early Bird -->
								{#if isEarlyBirdActive()}
									<div class="mb-1 flex items-center gap-1">
										{#if isEarlyBirdEndingSoon()}
											<span class="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded">Early Bird Ending Soon</span>
										{:else}
											<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Early Bird</span>
										{/if}
										<HelpIcon helpId="conference-early-bird" position="right">
											{@html getHelpContent('conference-early-bird').content}
										</HelpIcon>
									</div>
								{/if}

								<!-- 4. Price -->
								<div class="flex items-baseline gap-2">
									{#if isEarlyBirdActive() && getCurrentPrice(ticketType) < ticketType.price}
										<p class="text-sm text-gray-400 line-through">£{formatCurrency(ticketType.price)}</p>
									{/if}
									<p class="font-bold text-lg">£{formatCurrency(getCurrentPrice(ticketType))}</p>
								</div>
								
								{#if ticketType.capacity}
									<p class="text-xs text-gray-500 -mt-1 mb-1">{ticketType.capacity - (ticketType.sold || 0)} remaining</p>
								{/if}

								<!-- 5. Button -->
								<div class="flex items-center gap-4">
									{#if !selectedTickets.find(t => t.ticketTypeId === ticketType.id)}
										<button
											on:click={() => addTicket(ticketType)}
											class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark w-full md:w-auto"
										>
											Add
										</button>
									{:else}
										{#each [selectedTickets.find(t => t.ticketTypeId === ticketType.id)] as selected}
											<div class="flex items-center gap-2">
												<button
													on:click={() => updateQuantity(ticketType.id, selected.quantity - 1)}
													class="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50"
												>
													−
												</button>
												<span class="w-12 text-center font-semibold">{selected.quantity}</span>
												<button
													on:click={() => updateQuantity(ticketType.id, selected.quantity + 1)}
													class="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50"
												>
													+
												</button>
											</div>
										{/each}
									{/if}
								</div>
							</div>
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
								<span>£{formatCurrency(getCurrentPrice(ticket.ticketType) * ticket.quantity)}</span>
							</div>
						{/if}
					{/each}
					<div class="border-t pt-2 mt-2 flex justify-between font-bold">
						<span>Subtotal:</span>
						<span>£{formatCurrency(calculateSubtotal())}</span>
					</div>
				</div>
			</div>
		{/if}

			<div class="mb-4">
				<div class="flex items-center gap-1 mb-1">
					<label for="discount-code" class="block text-sm font-medium">Discount Code (optional)</label>
					<HelpIcon helpId="conference-discount-code" position="right">
						{@html getHelpContent('conference-discount-code').content}
					</HelpIcon>
				</div>
				<div class="flex gap-2">
					<input
						id="discount-code"
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
			{/if}
		</div>
	{/if}

	<!-- Step 2: Attendee Details -->
	{#if currentStep === 2}
		<div class="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
			<div class="flex items-center gap-2 mb-4">
				<h3 class="text-2xl font-bold text-blue-900">Step 2: Attendee Details</h3>
				<HelpIcon helpId="booking-attendees" position="right">
					{@html getHelpContent('booking-attendees').content}
				</HelpIcon>
			</div>
			
			<!-- Check if any attendee is a group leader (adult) -->
			{#if !attendees.some(a => a.isGroupLeader)}
				<div class="bg-white rounded p-4 border-2 border-blue-400 mb-6 shadow-sm">
					<div class="flex items-center gap-2 mb-2">
						<h4 class="font-bold text-lg text-blue-900">Group Leader / Parent / Guardian Details</h4>
						<HelpIcon helpId="conference-group-leader" position="right">
							{@html getHelpContent('conference-group-leader').content}
						</HelpIcon>
					</div>
					<p class="text-sm text-blue-800 mb-4">
						Since there are no adult attendees, please provide details for the Group Leader or Parent/Guardian responsible for this booking.
					</p>
					
					<div class="space-y-4">
						<div>
							<label for="gl-fullname" class="block text-sm font-medium mb-1">Full Name *</label>
							<input
								id="gl-fullname"
								type="text"
								bind:value={separateGroupLeader.fullName}
								class="w-full px-3 py-2 border rounded"
							/>
							{#if errors['group-leader-name']}
								<p class="text-red-600 text-xs mt-1">{errors['group-leader-name']}</p>
							{/if}
						</div>
						
						<div>
							<label for="gl-email" class="block text-sm font-medium mb-1">Email *</label>
							<input
								id="gl-email"
								type="email"
								bind:value={separateGroupLeader.email}
								class="w-full px-3 py-2 border rounded"
								placeholder="email@example.com"
							/>
							{#if errors['group-leader-email']}
								<p class="text-red-600 text-xs mt-1">{errors['group-leader-email']}</p>
							{/if}
						</div>
						
						<div>
							<label for="gl-phone" class="block text-sm font-medium mb-1">Phone *</label>
							<input
								id="gl-phone"
								type="tel"
								bind:value={separateGroupLeader.phone}
								class="w-full px-3 py-2 border rounded"
							/>
							{#if errors['group-leader-phone']}
								<p class="text-red-600 text-xs mt-1">{errors['group-leader-phone']}</p>
							{/if}
						</div>
						
						<div>
							<label for="gl-address-line1" class="block text-sm font-medium mb-1">Address *</label>
							<input
								id="gl-address-line1"
								type="text"
								bind:value={separateGroupLeader.address.line1}
								class="w-full px-3 py-2 border rounded mb-2"
								placeholder="Address Line 1"
							/>
							<input
								type="text"
								bind:value={separateGroupLeader.address.line2}
								class="w-full px-3 py-2 border rounded mb-2"
								placeholder="Address Line 2"
								aria-label="Address Line 2"
							/>
							<div class="grid grid-cols-2 gap-2">
								<input
									type="text"
									bind:value={separateGroupLeader.address.city}
									class="px-3 py-2 border rounded"
									placeholder="City"
									aria-label="City"
								/>
								<input
									type="text"
									bind:value={separateGroupLeader.address.postcode}
									class="px-3 py-2 border rounded"
									placeholder="Postcode"
									aria-label="Postcode"
								/>
							</div>
							{#if errors['group-leader-address']}
								<p class="text-red-600 text-xs mt-1">{errors['group-leader-address']}</p>
							{/if}
						</div>
						
						<div>
							<label for="gl-church" class="block text-sm font-medium mb-1">Home Church/Group *</label>
							<select
								id="gl-church"
								bind:value={separateGroupLeader.homeChurch}
								class="w-full px-3 py-2 border rounded {errors['group-leader-church'] ? 'border-red-500' : ''}"
							>
								<option value="">Select a church</option>
								{#each churches as church}
									<option value={church.title}>{church.title}</option>
								{/each}
								<option value="__OTHER__">Other</option>
							</select>
							{#if separateGroupLeader.homeChurch === '__OTHER__'}
								<input
									type="text"
									bind:value={separateGroupLeader.homeChurchOther}
									class="w-full px-3 py-2 border rounded mt-2 {errors['group-leader-church'] ? 'border-red-500' : ''}"
									placeholder="Enter church/group name"
									aria-label="Other Church Name"
								/>
							{/if}
							{#if errors['group-leader-church']}
								<p class="text-red-600 text-xs mt-1">{errors['group-leader-church']}</p>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<p class="text-sm text-blue-800 mb-6 bg-blue-200 border border-blue-400 rounded p-3">
					The first adult ticket is automatically set as the Group Leader. All communications will be sent to the Group Leader.
				</p>
			{/if}

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
								<label for="attendee-{index}-name" class="block text-sm font-medium mb-1">Full Name *</label>
								<input
									id="attendee-{index}-name"
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
									<label for="attendee-{index}-dob" class="block text-sm font-medium mb-1">Date of Birth *</label>
									<input
										id="attendee-{index}-dob"
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
								<label for="attendee-{index}-email" class="block text-sm font-medium mb-1">Email {attendee.isGroupLeader ? '*' : '(optional)'}</label>
								<input
									id="attendee-{index}-email"
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
										<label for="attendee-{index}-phone" class="block text-sm font-medium mb-1">Phone *</label>
										<input
											id="attendee-{index}-phone"
											type="tel"
											bind:value={attendee.phone}
											class="w-full px-3 py-2 border rounded"
										/>
									</div>
									<div class="mt-3">
										<label for="attendee-{index}-address-line1" class="block text-sm font-medium mb-1">Address *</label>
										<input
											id="attendee-{index}-address-line1"
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
											aria-label="Address Line 2"
										/>
										<div class="grid grid-cols-2 gap-2">
											<input
												type="text"
												bind:value={attendee.address.city}
												class="px-3 py-2 border rounded"
												placeholder="City"
												aria-label="City"
											/>
											<input
												type="text"
												bind:value={attendee.address.postcode}
												class="px-3 py-2 border rounded"
												placeholder="Postcode"
												aria-label="Postcode"
											/>
										</div>
										{#if errors[`attendee-${index}-address`]}
											<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-address`]}</p>
										{/if}
									</div>
									<div class="mt-3">
										<label for="attendee-{index}-church" class="block text-sm font-medium mb-1">Home Church/Group *</label>
										<select
											id="attendee-{index}-church"
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
												aria-label="Other Church Name"
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
	{#if currentStep === 3 && hasTeenOrChild}
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
										<label for="attendee-{index}-emergency-name" class="block text-sm font-medium mb-1">Emergency Contact Name *</label>
										<input
											id="attendee-{index}-emergency-name"
											type="text"
											bind:value={attendee.emergencyContact.name}
											class="w-full px-3 py-2 border rounded"
										/>
										{#if errors[`attendee-${index}-emergency-name`]}
											<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-name`]}</p>
										{/if}
									</div>
									<div>
										<label for="attendee-{index}-emergency-phone" class="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
										<input
											id="attendee-{index}-emergency-phone"
											type="tel"
											bind:value={attendee.emergencyContact.phone}
											class="w-full px-3 py-2 border rounded"
										/>
										{#if errors[`attendee-${index}-emergency-phone`]}
											<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-phone`]}</p>
										{/if}
									</div>
									<div>
										<label for="attendee-{index}-emergency-rel" class="block text-sm font-medium mb-1">Emergency Contact Relationship</label>
										<input
											id="attendee-{index}-emergency-rel"
											type="text"
											bind:value={attendee.emergencyContact.relationship}
											class="w-full px-3 py-2 border rounded"
											placeholder="e.g., Parent, Guardian"
										/>
									</div>
									<div>
										<label for="attendee-{index}-medical" class="block text-sm font-medium mb-1">Medical History</label>
										<textarea
											id="attendee-{index}-medical"
											bind:value={attendee.medicalHistory}
											class="w-full px-3 py-2 border rounded"
											rows="3"
										></textarea>
									</div>
									<div>
										<label for="attendee-{index}-allergies" class="block text-sm font-medium mb-1">Allergies</label>
										<input
											id="attendee-{index}-allergies"
											type="text"
											bind:value={attendee.allergies}
											class="w-full px-3 py-2 border rounded"
										/>
									</div>
									<div>
										<label for="attendee-{index}-dietary" class="block text-sm font-medium mb-1">Dietary Restrictions</label>
										<input
											id="attendee-{index}-dietary"
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
									<label for="attendee-{index}-emergency-name" class="block text-sm font-medium mb-1">Emergency Contact Name *</label>
									<input
										id="attendee-{index}-emergency-name"
										type="text"
										bind:value={attendee.emergencyContact.name}
										class="w-full px-3 py-2 border rounded"
									/>
									{#if errors[`attendee-${index}-emergency-name`]}
										<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-name`]}</p>
									{/if}
								</div>
								<div>
									<label for="attendee-{index}-emergency-phone" class="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
									<input
										id="attendee-{index}-emergency-phone"
										type="tel"
										bind:value={attendee.emergencyContact.phone}
										class="w-full px-3 py-2 border rounded"
									/>
									{#if errors[`attendee-${index}-emergency-phone`]}
										<p class="text-red-600 text-xs mt-1">{errors[`attendee-${index}-emergency-phone`]}</p>
									{/if}
								</div>
								<div>
									<label for="attendee-{index}-emergency-rel" class="block text-sm font-medium mb-1">Emergency Contact Relationship</label>
									<input
										id="attendee-{index}-emergency-rel"
										type="text"
										bind:value={attendee.emergencyContact.relationship}
										class="w-full px-3 py-2 border rounded"
										placeholder="e.g., Parent, Guardian"
									/>
								</div>
								<div>
									<label for="attendee-{index}-medical" class="block text-sm font-medium mb-1">Medical History</label>
									<textarea
										id="attendee-{index}-medical"
										bind:value={attendee.medicalHistory}
										class="w-full px-3 py-2 border rounded"
										rows="3"
									></textarea>
								</div>
								<div>
									<label for="attendee-{index}-allergies" class="block text-sm font-medium mb-1">Allergies</label>
									<input
										id="attendee-{index}-allergies"
										type="text"
										bind:value={attendee.allergies}
										class="w-full px-3 py-2 border rounded"
									/>
								</div>
								<div>
									<label for="attendee-{index}-dietary" class="block text-sm font-medium mb-1">Dietary Restrictions</label>
									<input
										id="attendee-{index}-dietary"
										type="text"
										bind:value={attendee.dietaryRestrictions}
										class="w-full px-3 py-2 border rounded"
									/>
								</div>
								<div>
									<span class="block text-sm font-medium mb-2">Consent Waivers</span>
									<div class="space-y-2">
										<div class="flex items-center">
											<input
												id="attendee-{index}-consent-medical"
												type="checkbox"
												bind:checked={attendee.consentWaivers.medical}
												class="mr-2"
											/>
											<label for="attendee-{index}-consent-medical">Medical treatment consent</label>
										</div>
										<div class="flex items-center">
											<input
												id="attendee-{index}-consent-photo"
												type="checkbox"
												bind:checked={attendee.consentWaivers.photo}
												class="mr-2"
											/>
											<label for="attendee-{index}-consent-photo">Photo/video consent</label>
										</div>
										<div class="flex items-center">
											<input
												id="attendee-{index}-consent-activities"
												type="checkbox"
												bind:checked={attendee.consentWaivers.activities}
												class="mr-2"
											/>
											<label for="attendee-{index}-consent-activities">Activities consent</label>
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

	<!-- Step 3 or 4: Payment Summary (Step 3 if no teen/child, Step 4 if teen/child) -->
	{#if (currentStep === 3 && !hasTeenOrChild) || (currentStep === 4 && hasTeenOrChild)}
			<div class="bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-lg p-6">
			<div class="flex items-center gap-2 mb-4">
				<h3 class="text-2xl font-bold text-indigo-900">Step {hasTeenOrChild ? '4' : '3'}: Payment Summary</h3>
				<HelpIcon helpId="booking-payment" position="right">
					{@html getHelpContent('booking-payment').content}
				</HelpIcon>
			</div>
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
					{#if paymentMethod === 'deposit20'}
						<div class="border-t pt-2 mt-2 space-y-1">
							<div class="flex justify-between text-blue-600">
								<span>20% Deposit:</span>
								<span>£{(calculateTotal() * 0.2).toFixed(2)}</span>
							</div>
							<div class="flex justify-between text-gray-600 text-sm">
								<span>Balance Due:</span>
								<span>£{(calculateTotal() * 0.8).toFixed(2)}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="mt-6 bg-white border-2 border-indigo-300 p-6 rounded-lg">
				<div class="flex items-center gap-2 mb-4">
					<h5 class="block text-sm font-medium text-lg text-indigo-900">Payment Method</h5>
					<HelpIcon helpId="conference-payment-options" position="right">
						{@html getHelpContent('conference-payment-options').content}
					</HelpIcon>
				</div>
				<div class="space-y-2">
					<div class="flex items-center">
						<input
							id="payment-full"
							type="radio"
							bind:group={paymentMethod}
							value="full"
							class="mr-2"
						/>
						<label for="payment-full">Pay in Full</label>
					</div>
					<div class="flex items-center">
						<input
							id="payment-deposit20"
							type="radio"
							bind:group={paymentMethod}
							value="deposit20"
							class="mr-2"
						/>
						<label for="payment-deposit20">Pay 20% Deposit</label>
						<span class="ml-2 text-sm text-gray-600">(£{formatCurrency(calculateTotal() * 0.2)} today, balance due later)</span>
					</div>
					{#if conference.paymentSettings && conference.paymentSettings.payLaterEnabled}
						<div class="flex items-center">
							<input
								id="payment-deposit"
								type="radio"
								bind:group={paymentMethod}
								value="deposit"
								class="mr-2"
							/>
							<label for="payment-deposit">Pay Deposit + Installments</label>
						</div>
					{/if}
				</div>
				{#if paymentMethod === 'deposit20'}
					<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
						<p class="text-sm text-blue-800">
							<strong>Deposit Amount:</strong> £{formatCurrency(calculateTotal() * 0.2)}
						</p>
						<p class="text-sm text-blue-800 mt-1">
							<strong>Balance Due:</strong> £{formatCurrency(calculateTotal() * 0.8)} (to be paid before the conference)
						</p>
					</div>
				{/if}
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

	<!-- Step 4 or 5: Confirmation (Step 4 if no teen/child, Step 5 if teen/child) -->
	{#if ((currentStep === 4 && !hasTeenOrChild) || (currentStep === 5 && hasTeenOrChild))}
		{#if !orderSummary}
			<!-- Invalid state: on confirmation step without orderSummary - show fallback -->
			<div class="p-4 bg-yellow-50 border border-yellow-200 rounded">
				<p class="text-yellow-800 mb-4">No booking found. Please start a new booking.</p>
				<button
					on:click={resetToStep1}
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
					<h3 class="text-2xl font-bold mb-2">Booking {orderSummary.paymentStatus === 'paid' ? 'Confirmed' : orderSummary.paymentStatus === 'partial' ? 'Partially Paid' : 'Created'}!</h3>
					<p class="text-gray-600">Your booking reference is: <strong>{orderSummary.bookingReference}</strong></p>
				{/if}
			</div>
			{#if !processingPayment}
				<div class="bg-gray-50 p-6 rounded mb-6 text-left">
					<h4 class="font-semibold mb-4">Booking Details</h4>
					<div class="space-y-2">
						<p><strong>Conference:</strong> {conference.title}</p>
						<p><strong>Total Amount:</strong> £{formatCurrency(orderSummary.totalAmount)}</p>
						<p><strong>Payment Status:</strong> 
							<span class="px-2 py-1 rounded text-sm {
								orderSummary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
								orderSummary.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
								'bg-red-100 text-red-800'
							}">
								{orderSummary.paymentStatus === 'paid' ? 'Paid' :
								 orderSummary.paymentStatus === 'partial' ? 'Partial Payment (20% Deposit)' : 'Pending Payment'}
							</span>
						</p>
						{#if orderSummary.paidAmount}
							<p><strong>Amount Paid:</strong> £{formatCurrency(orderSummary.paidAmount)}</p>
						{/if}
						{#if orderSummary.paymentMethod === 'deposit20' && orderSummary.paymentStatus !== 'paid'}
							<p><strong>Balance Due:</strong> £{formatCurrency(orderSummary.totalAmount - (orderSummary.paidAmount || 0))}</p>
						{/if}
						<p><strong>Payment Method:</strong> {
							orderSummary.paymentMethod === 'full' ? 'Pay in Full' :
							orderSummary.paymentMethod === 'deposit20' ? 'Pay 20% Deposit' :
							'Deposit + Installments'
						}</p>
						<p><strong>Attendees:</strong> {orderSummary.attendeeCount}</p>
					</div>
				</div>
				<p class="text-gray-600 mb-4">A confirmation email has been sent to {orderSummary.groupLeaderEmail}</p>
				
				<!-- Next Steps -->
				<div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
					<h4 class="font-semibold text-lg mb-3 text-blue-900">Next Steps</h4>
					<ul class="space-y-2 text-left text-sm">
						<li class="flex items-start">
							<span class="text-blue-600 mr-2">✓</span>
							<span>Check your email for booking confirmation and important details</span>
						</li>
						{#if conference.startDate}
							<li class="flex items-start">
								<span class="text-blue-600 mr-2">✓</span>
								<span>Add the conference to your calendar using the link in your email</span>
							</li>
						{/if}
						{#if orderSummary.paymentStatus === 'partial' || orderSummary.paymentStatus === 'unpaid'}
							<li class="flex items-start">
								<span class="text-blue-600 mr-2">✓</span>
								<span>Complete your account setup below to manage your booking and payments</span>
							</li>
						{:else}
							<li class="flex items-start">
								<span class="text-blue-600 mr-2">✓</span>
								<span>Your booking is confirmed! We'll send you more information closer to the event</span>
							</li>
						{/if}
					</ul>
					{#if conference.startDate}
						<div class="mt-4">
							<a 
								href={generateCalendarLink()} 
								target="_blank" 
								rel="noopener noreferrer"
								class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold"
							>
								<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
								Add to Calendar
							</a>
						</div>
					{/if}
				</div>
				
				<!-- Account Setup Section -->
				{#if showAccountSetup && (orderSummary.paymentStatus === 'partial' || orderSummary.paymentStatus === 'unpaid')}
					<div class="mb-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
						<div class="flex items-center gap-2 mb-2">
							{#if accountSetupStep === 'login'}
								<h4 class="text-xl font-bold text-blue-900">Log In to Your Account</h4>
							{:else}
								<h4 class="text-xl font-bold text-blue-900">Set Up Your Account</h4>
							{/if}
							<HelpIcon helpId="conference-account-setup" position="right">
								{@html getHelpContent('conference-account-setup').content}
							</HelpIcon>
						</div>
						{#if accountSetupStep !== 'login'}
							<p class="text-sm text-blue-800 mb-4">
								Create an account to manage your booking, view payment status, and make additional payments online.
							</p>
						{/if}
						
						{#if accountSetupStep === 'verify'}
							<form on:submit|preventDefault={handleAccountVerify} class="space-y-4">
								{#if accountSetupError}
									<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
										{accountSetupError}
									</div>
								{/if}
								
								<div>
									<label for="account-email-verify" class="block text-sm font-medium mb-1">Email (Username)</label>
									<input
										id="account-email-verify"
										type="email"
										bind:value={accountSetupEmail}
										required
										readonly
										class="w-full px-3 py-2 border rounded bg-gray-100"
									/>
									<p class="text-xs text-gray-500 mt-1">This will be your username</p>
								</div>
								
								<p class="text-sm text-blue-800 mb-4">
									We've sent a verification code to <strong>{accountSetupEmail}</strong>. Please enter it below to verify your email address.
								</p>
								
								<div>
									<label for="account-code" class="block text-sm font-medium mb-1">Verification Code</label>
									<input
										id="account-code"
										type="text"
										bind:value={accountSetupCode}
										required
										maxlength="6"
										class="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest"
										placeholder="000000"
									/>
								</div>
								
								<div class="flex gap-2">
									<button
										type="submit"
										disabled={accountSetupLoading}
										class="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
									>
										{accountSetupLoading ? 'Verifying...' : 'Verify Email'}
									</button>
									<button
										type="button"
										on:click={resendVerificationCode}
										disabled={accountSetupLoading}
										class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
									>
										Resend
									</button>
								</div>
							</form>
						{:else if accountSetupStep === 'login'}
							<form on:submit|preventDefault={handleLogin} class="space-y-4">
								{#if loginError}
									<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
										{loginError}
									</div>
								{/if}
								
								<p class="text-sm text-blue-800 mb-4">
									It looks like you already have an account with <strong>{accountSetupEmail}</strong>. Please log in to manage your booking.
								</p>
								
								<div>
									<label for="account-login-email" class="block text-sm font-medium mb-1">Email</label>
									<input
										id="account-login-email"
										type="email"
										bind:value={loginEmail}
										readonly
										class="w-full px-3 py-2 border rounded bg-gray-100"
									/>
								</div>
								
								<div>
									<label for="account-login-password" class="block text-sm font-medium mb-1">Password</label>
									<input
										id="account-login-password"
										type="password"
										bind:value={loginPassword}
										required
										class="w-full px-3 py-2 border rounded"
										placeholder="Your password"
									/>
								</div>
								
								<button
									type="submit"
									disabled={loginLoading}
									class="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
								>
									{loginLoading ? 'Logging in...' : 'Login'}
								</button>
							</form>
						{:else if accountSetupStep === 'setPassword'}
							<form on:submit|preventDefault={handleSetPassword} class="space-y-4">
								{#if accountSetupError}
									<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
										{accountSetupError}
									</div>
								{/if}
								
								<p class="text-sm text-green-800 mb-4">
									✓ Email verified! Now please create a password for your account.
								</p>
								
								<div>
									<label for="account-password" class="block text-sm font-medium mb-1">Password</label>
									<input
										id="account-password"
										type="password"
										bind:value={accountSetupPassword}
										required
										minlength="6"
										class="w-full px-3 py-2 border rounded"
										placeholder="At least 6 characters"
									/>
								</div>
								
								<div>
									<label for="account-confirm-password" class="block text-sm font-medium mb-1">Confirm Password</label>
									<input
										id="account-confirm-password"
										type="password"
										bind:value={accountSetupConfirmPassword}
										required
										class="w-full px-3 py-2 border rounded"
										placeholder="Confirm your password"
									/>
								</div>
								
								<button
									type="submit"
									disabled={accountSetupLoading}
									class="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
								>
									{accountSetupLoading ? 'Setting Password...' : 'Set Password & Complete Setup'}
								</button>
							</form>
						{/if}
					</div>
				{/if}
				
				{#if orderSummary.paymentStatus === 'unpaid' && conference.paymentSettings?.paypalEnabled && !env.PUBLIC_TEST}
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
				<button
					on:click={() => {
						// Check if deposit payment is required before closing
						if (orderSummary && orderSummary.totalAmount > 0) {
							const balanceDue = orderSummary.totalAmount - (orderSummary.paidAmount || 0);
							// If deposit payment method was selected but no payment made yet
							if (orderSummary.paymentMethod === 'deposit20' && orderSummary.paymentStatus === 'unpaid' && balanceDue > 0) {
								alert('Please complete your deposit payment before closing. A 20% deposit is required to secure your booking.');
								return;
							}
							// If full payment is required but not paid
							if (orderSummary.paymentMethod !== 'deposit20' && orderSummary.paymentStatus === 'unpaid' && balanceDue > 0) {
								alert('Please complete your payment before closing.');
								return;
							}
						}
						clearDraft();
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
	{/if}
	
	<!-- Fallback: If no step matches, show error -->
	{#if currentStep !== 1 && currentStep !== 2 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5}
		<div class="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
			<h3 class="text-xl font-bold text-red-800 mb-2">Error: Invalid Step</h3>
			<p class="text-red-700">Current step is {currentStep}, which is not valid. Resetting to step 1...</p>
			<button
				on:click={() => currentStep = 1}
				class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
			>
				Reset to Step 1
			</button>
		</div>
	{/if}
</div>

<!-- Draft Confirmation Dialog -->
<!-- Login Modal -->
{#if showLoginModal}
	<div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
		<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" on:click={() => showLoginModal = false}></div>

			<span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

			<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
							{#if showForgotPassword}
								<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">Reset Password</h3>
								<div class="mt-2">
									<p class="text-sm text-gray-500 mb-4">
										Enter your email address and we'll send you a link to reset your password.
									</p>
									
									{#if forgotPasswordSuccess}
										<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
											Password reset link sent! Please check your email.
										</div>
									{:else}
										<form on:submit|preventDefault={handleForgotPassword} class="space-y-4">
											<div>
												<label for="forgot-email" class="block text-sm font-medium text-gray-700">Email address</label>
												<input
													id="forgot-email"
													type="email"
													bind:value={loginEmail}
													readonly={!!loginEmail}
													class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm {loginEmail ? 'bg-gray-100' : ''}"
												/>
											</div>
											
											{#if forgotPasswordError}
												<p class="text-red-600 text-sm">{forgotPasswordError}</p>
											{/if}
											
											<button
												type="submit"
												disabled={forgotPasswordLoading}
												class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
											>
												{forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
											</button>
										</form>
									{/if}
									
									<div class="mt-4 text-center">
										<button 
											type="button" 
											class="text-sm text-primary hover:text-primary-dark"
											on:click={() => {
												showForgotPassword = false;
												forgotPasswordSuccess = false;
												forgotPasswordError = '';
											}}
										>
											Back to Login
										</button>
									</div>
								</div>
							{:else}
								<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">Log in to continue</h3>
								<div class="mt-2">
									<p class="text-sm text-gray-500 mb-4">
										We found an account associated with <strong>{loginEmail}</strong>. Please log in to add this booking to your account.
									</p>
									
									<form on:submit|preventDefault={handleLogin} class="space-y-4">
										<div>
											<label for="login-email" class="block text-sm font-medium text-gray-700">Email address</label>
											<input
												id="login-email"
												type="email"
												bind:value={loginEmail}
												readonly
												class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
											/>
										</div>
										
										<div>
											<label for="login-password" class="block text-sm font-medium text-gray-700">Password</label>
											<input
												id="login-password"
												type="password"
												bind:value={loginPassword}
												required
												class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
											/>
										</div>

										<div class="flex items-center justify-between">
											<div class="text-sm">
												<button 
													type="button" 
													class="font-medium text-primary hover:text-primary-dark"
													on:click={() => showForgotPassword = true}
												>
													Forgot your password?
												</button>
											</div>
										</div>
										
										{#if loginError}
											<p class="text-red-600 text-sm">{loginError}</p>
										{/if}
										
										<button
											type="submit"
											disabled={loginLoading}
											class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
										>
											{loginLoading ? 'Logging in...' : 'Log in'}
										</button>
									</form>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					{#if !showForgotPassword && !forgotPasswordSuccess}
						<button
							type="button"
							class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
							on:click={() => {
								showLoginModal = false;
								showForgotPassword = false;
								// Allow continuing without login (as guest) if they choose to cancel login
								// But maybe we should force them? The requirement said "ask them to login... or create a new password".
								// It didn't strictly say force. But usually "ask" implies a block.
								// However, if they really can't remember, they might want to just proceed.
								// For now, let's treat cancel as "Cancel booking attempt" to be strict, or maybe just close modal and let them try again.
								// Actually, if they close, they are still on step 2. They can't proceed without logging in because `nextStep` checks again.
								// So closing just keeps them on step 2.
							}}
						>
							Cancel
						</button>
					{:else if showForgotPassword}
						<button
							type="button"
							class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
							on:click={() => {
								showLoginModal = false;
								showForgotPassword = false;
							}}
						>
							Close
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

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

