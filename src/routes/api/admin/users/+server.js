import { json } from '@sveltejs/kit';
import { 
	getAdminUsers, 
	getAdminUser, 
	saveAdminUser, 
	deleteAdminUser,
	getAdminUserByEmail
} from '$lib/server/database';
import { requireAccessLevel, getCurrentAdminUser, ACCESS_LEVELS } from '$lib/server/admin-auth';
import { hashPassword } from '$lib/server/password-encryption';

// GET - List all admin users (Full Access only)
export const GET = async (event) => {
	requireAccessLevel(event, ACCESS_LEVELS.FULL_ACCESS);
	
	const adminUsers = getAdminUsers();
	// Don't return password hashes
	const sanitizedUsers = adminUsers.map(u => ({
		id: u.id,
		email: u.email,
		name: u.name,
		accessLevel: u.accessLevel,
		active: u.active !== false,
		createdAt: u.createdAt,
		lastLogin: u.lastLogin
	}));
	
	return json({ users: sanitizedUsers });
};

// POST - Create new admin user (Full Access only)
export const POST = async (event) => {
	const { request, cookies } = event;
	requireAccessLevel(event, ACCESS_LEVELS.FULL_ACCESS);
	
	const { email, password, name, accessLevel, active } = await request.json();
	
	if (!email) {
		return json({ error: 'Email is required' }, { status: 400 });
	}
	
	if (!password || password.length < 8) {
		return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
	}
	
	if (!accessLevel || !Object.values(ACCESS_LEVELS).includes(accessLevel)) {
		return json({ error: 'Valid access level is required' }, { status: 400 });
	}
	
	// Check if email already exists
	if (getAdminUserByEmail(email)) {
		return json({ error: 'Email already in use' }, { status: 400 });
	}
	
	// Create new admin user
	const newUser = {
		id: `admin-${Date.now()}`,
		email: email.toLowerCase(),
		name: name || email,
		passwordHash: hashPassword(password),
		accessLevel: accessLevel,
		active: active !== false,
		createdAt: new Date().toISOString(),
		createdBy: getCurrentAdminUser(event.cookies)?.id || null,
		lastLogin: null
	};
	
	saveAdminUser(newUser);
	
	// Return sanitized user
	const sanitized = {
		id: newUser.id,
		email: newUser.email,
		name: newUser.name,
		accessLevel: newUser.accessLevel,
		active: newUser.active,
		createdAt: newUser.createdAt
	};
	
	return json({ success: true, user: sanitized }, { status: 201 });
};

// PUT - Update admin user (Full Access only)
export const PUT = async (event) => {
	const { request, cookies } = event;
	requireAccessLevel(event, ACCESS_LEVELS.FULL_ACCESS);
	
	const { id, email, password, name, accessLevel, active } = await request.json();
	
	if (!id) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}
	
	if (!email) {
		return json({ error: 'Email is required' }, { status: 400 });
	}
	
	const existingUser = getAdminUser(id);
	if (!existingUser) {
		return json({ error: 'User not found' }, { status: 404 });
	}
	
	// Check if email is being changed and already exists
	if (email.toLowerCase() !== existingUser.email?.toLowerCase()) {
		if (getAdminUserByEmail(email)) {
			return json({ error: 'Email already in use' }, { status: 400 });
		}
	}
	
	// Update user
	const updatedUser = {
		...existingUser,
		email: email.toLowerCase(),
		name: name || existingUser.name,
		accessLevel: accessLevel || existingUser.accessLevel,
		active: active !== undefined ? active : existingUser.active !== false,
		updatedAt: new Date().toISOString(),
		updatedBy: getCurrentAdminUser(event.cookies)?.id || null
	};
	
	// Update password if provided
	if (password) {
		if (password.length < 8) {
			return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
		}
		updatedUser.passwordHash = hashPassword(password);
	}
	
	saveAdminUser(updatedUser);
	
	// Return sanitized user
	const sanitized = {
		id: updatedUser.id,
		email: updatedUser.email,
		name: updatedUser.name,
		accessLevel: updatedUser.accessLevel,
		active: updatedUser.active,
		createdAt: updatedUser.createdAt,
		lastLogin: updatedUser.lastLogin
	};
	
	return json({ success: true, user: sanitized });
};

// DELETE - Delete admin user (Full Access only)
export const DELETE = async (event) => {
	const { cookies, url } = event;
	requireAccessLevel(event, ACCESS_LEVELS.FULL_ACCESS);
	
	const id = url.searchParams.get('id');
	
	if (!id) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}
	
	const currentUser = getCurrentAdminUser(event.cookies);
	if (currentUser.id === id) {
		return json({ error: 'Cannot delete your own account' }, { status: 400 });
	}
	
	const user = getAdminUser(id);
	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}
	
	deleteAdminUser(id);
	
	return json({ success: true });
};

