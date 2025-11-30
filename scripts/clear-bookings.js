#!/usr/bin/env node

/**
 * Script to clear all conference bookings and attendees from the database
 * Usage: node scripts/clear-bookings.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data/database.json');

// Read existing database
let db;
try {
	const dbContent = readFileSync(DB_PATH, 'utf-8');
	db = JSON.parse(dbContent);
	console.log('✓ Database loaded successfully');
} catch (error) {
	console.error('✗ Failed to read database:', error.message);
	process.exit(1);
}

// Initialize arrays if they don't exist
if (!db.conferenceBookings) db.conferenceBookings = [];
if (!db.conferenceAttendees) db.conferenceAttendees = [];
if (!db.conferencePaymentSchedules) db.conferencePaymentSchedules = [];
if (!db.userAccounts) db.userAccounts = [];
if (!db.emailVerificationCodes) db.emailVerificationCodes = [];
if (!db.passwordResetTokens) db.passwordResetTokens = [];

// Count existing bookings
const bookingCount = db.conferenceBookings.length;
const attendeeCount = db.conferenceAttendees.length;
const scheduleCount = db.conferencePaymentSchedules.length;
const accountCount = db.userAccounts.length;

console.log(`\nCurrent database state:`);
console.log(`  - Bookings: ${bookingCount}`);
console.log(`  - Attendees: ${attendeeCount}`);
console.log(`  - Payment Schedules: ${scheduleCount}`);
console.log(`  - User Accounts: ${accountCount}`);

// Clear all bookings and related data
db.conferenceBookings = [];
db.conferenceAttendees = [];
db.conferencePaymentSchedules = [];
db.userAccounts = [];
db.emailVerificationCodes = [];
db.passwordResetTokens = [];

// Write updated database
try {
	const jsonData = JSON.stringify(db, null, 2);
	writeFileSync(DB_PATH, jsonData, 'utf-8');
	console.log('\n✓ Successfully cleared all bookings and user accounts from database');
	console.log(`  - Removed ${bookingCount} bookings`);
	console.log(`  - Removed ${attendeeCount} attendees`);
	console.log(`  - Removed ${scheduleCount} payment schedules`);
	console.log(`  - Removed ${accountCount} user accounts`);
	console.log(`\nDatabase saved to: ${DB_PATH}`);
} catch (error) {
	console.error('✗ Failed to write database:', error.message);
	process.exit(1);
}

