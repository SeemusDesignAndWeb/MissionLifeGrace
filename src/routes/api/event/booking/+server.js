import { json } from '@sveltejs/kit';
import {
	saveEventBooking,
	saveEventAttendee,
	getEvent,
	getEventTicketType,
	getEventAttendees
} from '$lib/server/database';
import { sendEventBookingConfirmationEmail } from '$lib/server/conference-emails';

export const POST = async ({ request }) => {
	try {
		const { booking, attendees } = await request.json();

		// Validate event exists
		const event = getEvent(booking.eventId);
		if (!event || !event.published) {
			return json({ error: 'Event not available for booking' }, { status: 400 });
		}

		// Validate ticket types and capacity
		let calculatedSubtotal = 0;
		
		for (const attendee of attendees) {
			const ticketType = getEventTicketType(attendee.ticketTypeId);
			if (!ticketType || !ticketType.enabled) {
				return json({ error: `Invalid ticket type: ${attendee.ticketTypeId}` }, { status: 400 });
			}

			// Check capacity
			if (ticketType.capacity) {
				const sold = ticketType.sold || 0;
				if (sold >= ticketType.capacity) {
					return json({ error: `Ticket type "${ticketType.name}" is sold out` }, { status: 400 });
				}
			}

			calculatedSubtotal += ticketType.price;
		}

		// Validate amounts match
		if (Math.abs(calculatedSubtotal - booking.subtotal) > 0.01) {
			return json({ error: 'Subtotal mismatch' }, { status: 400 });
		}

		// Generate unique booking ID if not provided
		if (!booking.id) {
			booking.id = `event-booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		}

		// Generate booking reference if not provided
		if (!booking.bookingReference) {
			booking.bookingReference = `EVT-${Date.now().toString(36).toUpperCase()}`;
		}

		// Save booking
		const savedBooking = {
			...booking,
			subtotal: calculatedSubtotal,
			totalAmount: calculatedSubtotal, // Events only support full payment
			paymentStatus: 'unpaid',
			paidAmount: 0,
			createdAt: new Date().toISOString()
		};
		saveEventBooking(savedBooking);

		// Save attendees
		for (const attendee of attendees) {
			const attendeeData = {
				...attendee,
				bookingId: savedBooking.id,
				id: attendee.id || `event-attendee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
			};
			saveEventAttendee(attendeeData);
		}

		// Update ticket type sold counts
		const ticketTypeCounts = {};
		attendees.forEach(a => {
			ticketTypeCounts[a.ticketTypeId] = (ticketTypeCounts[a.ticketTypeId] || 0) + 1;
		});

		for (const [ticketTypeId, count] of Object.entries(ticketTypeCounts)) {
			const ticketType = getEventTicketType(ticketTypeId);
			if (ticketType) {
				ticketType.sold = (ticketType.sold || 0) + count;
				const { saveEventTicketType } = await import('$lib/server/database');
				saveEventTicketType(ticketType);
			}
		}

		// Send confirmation email (async, don't wait for completion)
		try {
			const savedAttendees = getEventAttendees(savedBooking.id);
			
			// Send booking confirmation email
			await sendEventBookingConfirmationEmail({
				booking: savedBooking,
				event,
				attendees: savedAttendees
			});
		} catch (emailError) {
			// Log but don't fail the booking if email fails
			console.error('Failed to send confirmation email:', emailError);
		}

		return json({ 
			success: true, 
			bookingId: savedBooking.id, 
			bookingReference: savedBooking.bookingReference
		});
	} catch (error) {
		console.error('Failed to process event booking:', error);
		return json({ error: 'Failed to process booking' }, { status: 500 });
	}
};

