import { redirect } from '@sveltejs/kit';
import { getAdminUserByEmail, getAdminUserByUsername, getAdminUser } from '$lib/server/database';
import { verifyPassword } from './password-encryption';
import crypto from 'crypto';

const ADMIN_SESSION_KEY = 'admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Access levels
export const ACCESS_LEVELS = {
	FULL_ACCESS: 'full_access', // All content, conference and admin user setup
	EDITOR_ACCESS: 'editor_access', // All content and front end website updates excluding Conference
	CONFERENCE_ACCESS: 'conference_access' // Just conference access
};

/**
 * Check if user is authenticated
 */
export function isAuthenticated(cookies) {
	const session = cookies.get(ADMIN_SESSION_KEY);
	if (!session) return false;

	try {
		const { userId, timestamp, hash } = JSON.parse(session);
		const now = Date.now();

		// Check if session expired
		if (now - timestamp > SESSION_DURATION) {
			cookies.delete(ADMIN_SESSION_KEY, { path: '/' });
			return false;
		}

		// Verify session hash
		const adminUser = getAdminUserByEmail(userId);
		if (!adminUser) {
			return false;
		}

		// Verify session hash matches
		const expectedHash = createSessionHash(adminUser.id, timestamp);
		return hash === expectedHash;
	} catch {
		return false;
	}
}

/**
 * Get current admin user
 */
export function getCurrentAdminUser(cookies) {
	const session = cookies.get(ADMIN_SESSION_KEY);
	if (!session) return null;

	try {
		const { userId } = JSON.parse(session);
		return getAdminUserByEmail(userId);
	} catch {
		return null;
	}
}

/**
 * Get current admin user's access level
 */
export function getCurrentAccessLevel(cookies) {
	const adminUser = getCurrentAdminUser(cookies);
	return adminUser?.accessLevel || null;
}

/**
 * Check if user has required access level
 */
export function hasAccessLevel(cookies, requiredLevel) {
	const currentLevel = getCurrentAccessLevel(cookies);
	if (!currentLevel) return false;

	const levels = {
		[ACCESS_LEVELS.FULL_ACCESS]: 3,
		[ACCESS_LEVELS.EDITOR_ACCESS]: 2,
		[ACCESS_LEVELS.CONFERENCE_ACCESS]: 1
	};

	return levels[currentLevel] >= levels[requiredLevel];
}

/**
 * Create admin session
 */
export function createSession(cookies, email, password) {
	const adminUser = getAdminUserByEmail(email);
	
	if (!adminUser) {
		return { success: false, error: 'Invalid credentials' };
	}

	// Verify password
	if (!verifyPassword(password, adminUser.passwordHash)) {
		return { success: false, error: 'Invalid credentials' };
	}

	// Check if user is active
	if (adminUser.active === false) {
		return { success: false, error: 'Account is disabled' };
	}

	const timestamp = Date.now();
	const hash = createSessionHash(adminUser.id, timestamp);
	
	const session = JSON.stringify({
		userId: adminUser.email,
		timestamp,
		hash
	});

	cookies.set(ADMIN_SESSION_KEY, session, {
		path: '/',
		maxAge: SESSION_DURATION / 1000,
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	});

	return { success: true, adminUser };
}

/**
 * Destroy admin session
 */
export function destroySession(cookies) {
	cookies.delete(ADMIN_SESSION_KEY, { path: '/' });
}

/**
 * Require authentication middleware
 */
export function requireAuth(event) {
	if (!isAuthenticated(event.cookies)) {
		throw redirect(302, '/admin/login');
	}
}

/**
 * Require specific access level middleware
 */
export function requireAccessLevel(event, requiredLevel) {
	requireAuth(event);
	
	if (!hasAccessLevel(event.cookies, requiredLevel)) {
		throw redirect(302, '/admin?error=insufficient_permissions');
	}
}

/**
 * Create session hash for verification
 */
function createSessionHash(userId, timestamp) {
	return crypto.createHash('sha256').update(`${userId}-${timestamp}-${process.env.SESSION_SECRET || 'default-secret'}`).digest('hex');
}

