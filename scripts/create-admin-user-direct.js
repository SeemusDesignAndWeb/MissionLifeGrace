#!/usr/bin/env node

/**
 * Script to create an admin user directly with provided credentials
 * Usage: node scripts/create-admin-user-direct.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Hash password function (same as in password-encryption.js)
function hashPassword(password) {
	if (!password) {
		throw new Error('Password cannot be empty');
	}
	
	// Use PBKDF2 with SHA-256 for secure hashing
	const salt = crypto.randomBytes(16);
	const iterations = 100000;
	const keyLength = 64; // 512 bits
	
	const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
	
	// Return: salt:iterations:hash (all base64)
	return `${salt.toString('base64')}:${iterations}:${hash.toString('base64')}`;
}

// Database functions (simplified for script)
const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data/database.json');

function getDbPath() {
	let finalPath;
	if (DB_PATH.startsWith('./') || DB_PATH.startsWith('../')) {
		finalPath = join(process.cwd(), DB_PATH);
	} else {
		finalPath = DB_PATH;
	}
	
	const dir = dirname(finalPath);
	try {
		mkdirSync(dir, { recursive: true });
	} catch (error) {
		// Directory might already exist
	}
	
	return finalPath;
}

function readDatabase() {
	const dbPath = getDbPath();
	try {
		const data = readFileSync(dbPath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Failed to read database:', error.message);
		process.exit(1);
	}
}

function writeDatabase(data) {
	const dbPath = getDbPath();
	try {
		const jsonData = JSON.stringify(data, null, 2);
		writeFileSync(dbPath, jsonData, 'utf-8');
	} catch (error) {
		console.error('Failed to write database:', error);
		throw error;
	}
}

function getAdminUserByEmail(email) {
	const db = readDatabase();
	if (!db.adminUsers) {
		db.adminUsers = [];
	}
	return db.adminUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

function saveAdminUser(adminUser) {
	const db = readDatabase();
	if (!db.adminUsers) {
		db.adminUsers = [];
	}
	const index = db.adminUsers.findIndex((u) => u.id === adminUser.id);
	if (index >= 0) {
		db.adminUsers[index] = adminUser;
	} else {
		db.adminUsers.push(adminUser);
	}
	writeDatabase(db);
}

// Main execution
const email = 'johnwatson@seemus.co.uk';
const password = 'psalm139';
const name = 'John Watson';
const accessLevel = 'full_access';

console.log('\n=== Creating Admin User ===\n');

// Check if user already exists
const existingUser = getAdminUserByEmail(email);
if (existingUser) {
	console.log(`❌ Admin user with email ${email} already exists.`);
	console.log(`   User ID: ${existingUser.id}`);
	console.log(`   Access Level: ${existingUser.accessLevel}`);
	process.exit(1);
}

// Create admin user
const adminUser = {
	id: `admin-${Date.now()}`,
	email: email.toLowerCase(),
	username: null,
	name: name,
	passwordHash: hashPassword(password),
	accessLevel: accessLevel,
	active: true,
	createdAt: new Date().toISOString(),
	createdBy: 'system',
	lastLogin: null
};

saveAdminUser(adminUser);

console.log('✅ Admin user created successfully!');
console.log(`   Email: ${adminUser.email}`);
console.log(`   Name: ${adminUser.name}`);
console.log(`   Access Level: ${adminUser.accessLevel}`);
console.log(`   User ID: ${adminUser.id}`);
console.log('\nYou can now log in at /admin/login');
console.log('');
