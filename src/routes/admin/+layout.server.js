import { redirect } from '@sveltejs/kit';
import { isAuthenticated, getCurrentAdminUser, getCurrentAccessLevel, ACCESS_LEVELS } from '$lib/server/admin-auth';

export const load = async ({ cookies, url }) => {
	// Allow access to login page without authentication
	if (url.pathname === '/admin/login') {
		return {};
	}

	// Require authentication for all other admin pages
	if (!isAuthenticated(cookies)) {
		throw redirect(302, '/admin/login');
	}

	const adminUser = getCurrentAdminUser(cookies);
	const accessLevel = getCurrentAccessLevel(cookies);

	// Safety check - if adminUser is null, redirect to login
	if (!adminUser) {
		throw redirect(302, '/admin/login');
	}

	// Check access level for specific routes
	const pathname = url.pathname;
	
	// Full Access required routes
	const fullAccessRoutes = [
		'/admin/users',
		'/admin/settings'
	];
	
	// Editor Access or higher required (excludes conference routes)
	const editorAccessRoutes = [
		'/admin/pages',
		'/admin/navigation',
		'/admin/team',
		'/admin/services',
		'/admin/hero-slides',
		'/admin/images',
		'/admin/podcasts',
		'/admin/community-groups',
		'/admin/events',
		'/admin/home',
		'/admin/policies'
	];
	
	// Conference Access or higher required
	const conferenceAccessRoutes = [
		'/admin/conferences'
	];

	// Check route access
	if (fullAccessRoutes.some(route => pathname.startsWith(route))) {
		if (accessLevel !== ACCESS_LEVELS.FULL_ACCESS) {
			throw redirect(302, '/admin?error=insufficient_permissions');
		}
	} else if (editorAccessRoutes.some(route => pathname.startsWith(route))) {
		if (accessLevel !== ACCESS_LEVELS.FULL_ACCESS && accessLevel !== ACCESS_LEVELS.EDITOR_ACCESS) {
			throw redirect(302, '/admin?error=insufficient_permissions');
		}
	} else if (conferenceAccessRoutes.some(route => pathname.startsWith(route))) {
		// Conference access or higher
		if (!accessLevel || accessLevel === '') {
			throw redirect(302, '/admin?error=insufficient_permissions');
		}
	}

	return {
		adminUser: {
			id: adminUser.id,
			email: adminUser.email,
			name: adminUser.name,
			accessLevel: adminUser.accessLevel
		},
		accessLevel
	};
};
