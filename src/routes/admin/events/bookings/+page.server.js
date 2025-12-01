import { getEventBookings } from '$lib/server/database';

export const load = async () => {
	const bookings = getEventBookings();

	return {
		bookings
	};
};

