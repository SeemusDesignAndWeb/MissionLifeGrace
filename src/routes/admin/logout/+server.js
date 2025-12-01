import { json } from '@sveltejs/kit';
import { destroySession } from '$lib/server/admin-auth';

export const POST = async ({ cookies }) => {
	destroySession(cookies);
	return json({ success: true });
};
