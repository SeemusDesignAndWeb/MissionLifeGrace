import { json } from '@sveltejs/kit';
import { createSession } from '$lib/server/admin-auth';

export const POST = async ({ request, cookies }) => {
	const { email, password } = await request.json();

	if (!email || !password) {
		return json({ error: 'Email and password are required' }, { status: 400 });
	}

	const result = createSession(cookies, email, password);
	
	if (result.success) {
		return json({ success: true, accessLevel: result.adminUser.accessLevel });
	} else {
		return json({ error: result.error || 'Invalid credentials' }, { status: 401 });
	}
};
