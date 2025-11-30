import { redirect } from '@sveltejs/kit';
import { isUserAuthenticated } from '$lib/server/user-auth';

export const load = async ({ cookies, url }) => {
	// Allow access to login, register, and verify pages without authentication
	if (url.pathname === '/my-account/login' || 
		url.pathname === '/my-account/register' || 
		url.pathname === '/my-account/verify') {
		return {};
	}

	// Require authentication for all other my-account pages
	if (!isUserAuthenticated(cookies)) {
		throw redirect(302, '/my-account/login');
	}

	return {};
};


