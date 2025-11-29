import { getConferences, getConferenceBookings, getConferenceAttendees, getConferenceTicketTypes } from '$lib/server/database';

export const load = async () => {
	const conferences = getConferences();
	const bookings = getConferenceBookings();
	const attendees = getConferenceAttendees();

	// Get latest conference (most recent start date)
	const latestConference = conferences
		.filter(c => c.published)
		.sort((a, b) => {
			const dateA = new Date(a.startDate || '9999-12-31');
			const dateB = new Date(b.startDate || '9999-12-31');
			return dateB.getTime() - dateA.getTime();
		})[0];

	// Get stats for latest conference
	let latestConferenceStats = null;
	if (latestConference) {
		const conferenceBookings = bookings.filter(b => b.conferenceId === latestConference.id);
		const conferenceAttendees = attendees.filter(a => {
			return conferenceBookings.some(b => b.id === a.bookingId);
		});
		
		const revenue = conferenceBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
		
		// Get ticket types for this conference
		const conferenceTicketTypes = getConferenceTicketTypes(latestConference.id);
		
		// Count attendees by ticket type and camping status
		const adultAttendees = conferenceAttendees.filter(a => {
			const ticketType = conferenceTicketTypes.find(t => t.id === a.ticketTypeId);
			return ticketType && ticketType.type === 'adult';
		});
		
		const teenAttendees = conferenceAttendees.filter(a => {
			const ticketType = conferenceTicketTypes.find(t => t.id === a.ticketTypeId);
			return ticketType && ticketType.type === 'teen';
		});
		
		const childAttendees = conferenceAttendees.filter(a => {
			const ticketType = conferenceTicketTypes.find(t => t.id === a.ticketTypeId);
			return ticketType && ticketType.type === 'child';
		});

		// Count camping vs non-camping
		const campingAttendees = conferenceAttendees.filter(a => {
			const ticketType = conferenceTicketTypes.find(t => t.id === a.ticketTypeId);
			return ticketType && ticketType.camping === true;
		});

		const nonCampingAttendees = conferenceAttendees.filter(a => {
			const ticketType = conferenceTicketTypes.find(t => t.id === a.ticketTypeId);
			return ticketType && ticketType.camping === false;
		});

		latestConferenceStats = {
			conference: latestConference,
			totalBookings: conferenceBookings.length,
			totalAttendees: conferenceAttendees.length,
			totalTicketHolders: conferenceAttendees.length, // All attendees are ticket holders
			adultAttendees: adultAttendees.length,
			teenAttendees: teenAttendees.length,
			childAttendees: childAttendees.length,
			campingAttendees: campingAttendees.length,
			nonCampingAttendees: nonCampingAttendees.length,
			totalRevenue: revenue,
			paidBookings: conferenceBookings.filter(b => b.paymentStatus === 'paid').length,
			partialBookings: conferenceBookings.filter(b => b.paymentStatus === 'partial').length,
			unpaidBookings: conferenceBookings.filter(b => b.paymentStatus === 'unpaid' || !b.paymentStatus).length
		};
	}

	return {
		latestConferenceStats
	};
};

