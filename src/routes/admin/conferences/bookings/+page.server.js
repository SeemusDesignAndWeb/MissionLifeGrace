import { getConferenceBookings, getUserAccountByBookingId, getUserAccounts } from '$lib/server/database';

export const load = async () => {
	const bookings = getConferenceBookings();
	const userAccounts = getUserAccounts();

	// Enrich bookings with account information
	const bookingsWithAccounts = bookings.map(booking => {
		const userAccount = userAccounts.find(ua => 
			ua.bookingIds?.includes(booking.id)
		);
		
		return {
			...booking,
			hasAccount: !!userAccount,
			accountEmail: userAccount?.email || null,
			accountVerified: userAccount?.verified || false
		};
	});

	return {
		bookings: bookingsWithAccounts
	};
};


