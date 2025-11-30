import { getUserId } from '$lib/server/user-auth';
import { getUserAccount, getConferenceBookings, getConference } from '$lib/server/database';

export const load = async ({ cookies }) => {
	const userId = getUserId(cookies);
	if (!userId) {
		return { bookings: [] };
	}

	const userAccount = getUserAccount(userId);
	if (!userAccount) {
		return { bookings: [] };
	}

	// Get all bookings for this user (exclude archived)
	const allBookings = getConferenceBookings();
	const userBookings = allBookings.filter(b => 
		userAccount.bookingIds?.includes(b.id) && !b.archived
	);

	// Enrich bookings with conference details
	const bookingsWithDetails = userBookings.map(booking => {
		const conference = getConference(booking.conferenceId);
		return {
			...booking,
			conference: conference || null
		};
	});

	// Get group leader name from the first booking (or any booking)
	const groupLeaderName = userBookings.length > 0 
		? userBookings[0].groupLeaderName 
		: null;

	return {
		bookings: bookingsWithDetails,
		userAccount,
		groupLeaderName
	};
};


