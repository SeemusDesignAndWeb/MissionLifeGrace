#!/usr/bin/env node

/**
 * Script to create the first admin user
 * Usage: node scripts/create-admin-user.js
 * 
 * This will prompt for user details and create an admin user with full access
 */

import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { hashPassword } from '../src/lib/server/password-encryption.js';
import { getAdminUsers, saveAdminUser } from '../src/lib/server/database.js';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function question(query) {
	return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
	console.log('\n=== Create Admin User ===\n');

	// Check if admin users already exist
	const existingUsers = getAdminUsers();
	if (existingUsers.length > 0) {
		console.log(`⚠️  Warning: ${existingUsers.length} admin user(s) already exist(s).`);
		const continueCreate = await question('Do you want to create another admin user? (y/n): ');
		if (continueCreate.toLowerCase() !== 'y') {
			console.log('Cancelled.');
			rl.close();
			return;
		}
	}

	// Get user details
	const email = await question('Email (optional, press Enter to skip): ');
	const username = await question('Username (optional, press Enter to skip): ');
	
	if (!email && !username) {
		console.log('❌ Error: At least one of email or username is required.');
		rl.close();
		return;
	}

	const name = await question('Full Name: ');
	if (!name) {
		console.log('❌ Error: Name is required.');
		rl.close();
		return;
	}

	const password = await question('Password (min 8 characters): ');
	if (!password || password.length < 8) {
		console.log('❌ Error: Password must be at least 8 characters.');
		rl.close();
		return;
	}

	const confirmPassword = await question('Confirm Password: ');
	if (password !== confirmPassword) {
		console.log('❌ Error: Passwords do not match.');
		rl.close();
		return;
	}

	console.log('\nAccess Levels:');
	console.log('1. Full Access (all content, conference and admin user setup)');
	console.log('2. Editor Access (all content and front end website updates excluding Conference)');
	console.log('3. Conference Access (just conference access)');
	
	const accessLevelChoice = await question('Select access level (1-3, default: 1): ');
	
	let accessLevel;
	switch (accessLevelChoice) {
		case '2':
			accessLevel = 'editor_access';
			break;
		case '3':
			accessLevel = 'conference_access';
			break;
		case '1':
		default:
			accessLevel = 'full_access';
			break;
	}

	// Create admin user
	const adminUser = {
		id: `admin-${Date.now()}`,
		email: email ? email.toLowerCase() : null,
		username: username ? username.toLowerCase() : null,
		name: name,
		passwordHash: hashPassword(password),
		accessLevel: accessLevel,
		active: true,
		createdAt: new Date().toISOString(),
		createdBy: 'system',
		lastLogin: null
	};

	saveAdminUser(adminUser);

	console.log('\n✅ Admin user created successfully!');
	console.log(`   Name: ${adminUser.name}`);
	console.log(`   Email: ${adminUser.email || 'N/A'}`);
	console.log(`   Username: ${adminUser.username || 'N/A'}`);
	console.log(`   Access Level: ${accessLevel}`);
	console.log('\nYou can now log in at /admin/login');

	rl.close();
}

createAdminUser().catch(error => {
	console.error('❌ Error:', error);
	rl.close();
	process.exit(1);
});

