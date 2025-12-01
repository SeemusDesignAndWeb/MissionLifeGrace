import { getConferences, getConferenceBookings, getConferenceAttendees, getConferenceTicketTypes } from '$lib/server/database';

export const load = async () => {
	const conferences = getConferences();
	const bookings = getConferenceBookings();
	const attendees = getConferenceAttendees();

	// Get latest conference (most recent start date) - show all conferences for admin, not just published
	const latestConference = conferences
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

		// Calculate payment stats
		const paidBookings = conferenceBookings.filter(b => b.paymentStatus === 'paid');
		const partialBookings = conferenceBookings.filter(b => b.paymentStatus === 'partial');
		const unpaidBookings = conferenceBookings.filter(b => b.paymentStatus === 'unpaid' || !b.paymentStatus);
		
		// Calculate revenue stats
		const totalPaid = conferenceBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
		const totalOutstanding = conferenceBookings.reduce((sum, b) => {
			const balance = (b.totalAmount || 0) - (b.paidAmount || 0);
			return sum + (balance > 0 ? balance : 0);
		}, 0);

		// Today's stats
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayBookings = conferenceBookings.filter(b => {
			if (!b.createdAt) return false;
			const bookingDate = new Date(b.createdAt);
			bookingDate.setHours(0, 0, 0, 0);
			return bookingDate.getTime() === today.getTime();
		});
		const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

		// This week's stats
		const weekAgo = new Date(today);
		weekAgo.setDate(weekAgo.getDate() - 7);
		const weekBookings = conferenceBookings.filter(b => {
			if (!b.createdAt) return false;
			const bookingDate = new Date(b.createdAt);
			return bookingDate >= weekAgo;
		});
		const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

		// Recent bookings (last 5, excluding archived)
		const recentBookings = conferenceBookings
			.filter(b => !b.archived)
			.sort((a, b) => {
				const dateA = new Date(a.createdAt || 0);
				const dateB = new Date(b.createdAt || 0);
				return dateB.getTime() - dateA.getTime();
			})
			.slice(0, 5)
			.map(b => ({
				id: b.id,
				bookingReference: b.bookingReference,
				groupLeaderName: b.groupLeaderName,
				totalAmount: b.totalAmount,
				paymentStatus: b.paymentStatus,
				createdAt: b.createdAt
			}));

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
			totalPaid: totalPaid,
			totalOutstanding: totalOutstanding,
			paidBookings: paidBookings.length,
			partialBookings: partialBookings.length,
			unpaidBookings: unpaidBookings.length,
			todayBookings: todayBookings.length,
			todayRevenue: todayRevenue,
			weekBookings: weekBookings.length,
			weekRevenue: weekRevenue,
			recentBookings: recentBookings
		};
	}

	return {
		latestConferenceStats,
		hasConferences: conferences.length > 0
	};
};

