import { env } from '$env/dynamic/private';
import crypto from 'crypto';

const USER_SESSION_KEY = 'user_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Hash password using crypto (better than simple hash)
function hashPassword(password) {
	return crypto.createHash('sha256').update(password).digest('hex');
}

export function isUserAuthenticated(cookies) {
	const session = cookies.get(USER_SESSION_KEY);
	if (!session) return false;

	try {
		const { userId, timestamp, hash } = JSON.parse(session);
		const now = Date.now();

		// Check if session expired
		if (now - timestamp > SESSION_DURATION) {
			cookies.delete(USER_SESSION_KEY, { path: '/' });
			return false;
		}

		// Verify session hash
		const expectedHash = crypto.createHash('sha256').update(`${userId}-${timestamp}`).digest('hex');
		return hash === expectedHash;
	} catch {
		return false;
	}
}

export function getUserId(cookies) {
	const session = cookies.get(USER_SESSION_KEY);
	if (!session) return null;

	try {
		const { userId } = JSON.parse(session);
		return userId;
	} catch {
		return null;
	}
}

export function createUserSession(cookies, userId) {
	const timestamp = Date.now();
	const hash = crypto.createHash('sha256').update(`${userId}-${timestamp}`).digest('hex');
	
	const session = JSON.stringify({
		userId,
		timestamp,
		hash
	});

	cookies.set(USER_SESSION_KEY, session, {
		path: '/',
		maxAge: SESSION_DURATION / 1000,
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	});

	return true;
}

export function destroyUserSession(cookies) {
	cookies.delete(USER_SESSION_KEY, { path: '/' });
}

export function hashUserPassword(password) {
	return hashPassword(password);
}

export function verifyPassword(password, hashedPassword) {
	return hashPassword(password) === hashedPassword;
}

// Generate a 6-digit verification code
export function generateVerificationCode() {
	return Math.floor(100000 + Math.random() * 900000).toString();
}


