import { json } from '@sveltejs/kit';
import { destroyUserSession } from '$lib/server/user-auth';

export const POST = async ({ cookies }) => {
	destroyUserSession(cookies);
	return json({ success: true, message: 'Logged out successfully' });
};


