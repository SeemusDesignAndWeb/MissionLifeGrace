#!/usr/bin/env node

/**
 * Script to add test conference bookings to the database
 * Usage: node scripts/add-test-bookings.js
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
} catch (error) {
	console.error('Failed to read database:', error.message);
	process.exit(1);
}

// Initialize arrays if they don't exist
if (!db.conferenceBookings) db.conferenceBookings = [];
if (!db.conferenceAttendees) db.conferenceAttendees = [];
if (!db.conferenceTicketTypes) db.conferenceTicketTypes = [];
if (!db.conferenceDiscountCodes) db.conferenceDiscountCodes = [];

// Find the conference
const conference = db.conferences?.find(c => c.id === 'conf-2024-annual');
if (!conference) {
	console.error('❌ Conference "conf-2024-annual" not found. Please run add-dummy-conferences.js first.');
	process.exit(1);
}

// Get ticket types
const ticketTypes = db.conferenceTicketTypes.filter(t => t.conferenceId === conference.id);
if (ticketTypes.length === 0) {
	console.error('❌ No ticket types found for conference. Please run add-dummy-conferences.js first.');
	process.exit(1);
}

const adultRegular = ticketTypes.find(t => t.id === 'ticket-adult-regular');
const adultCamping = ticketTypes.find(t => t.id === 'ticket-adult-camping');
const teenRegular = ticketTypes.find(t => t.id === 'ticket-teen-regular');
const childRegular = ticketTypes.find(t => t.id === 'ticket-child-regular');
const childCamping = ticketTypes.find(t => t.id === 'ticket-child-camping');

// Get discount codes
const discountCodes = db.conferenceDiscountCodes.filter(d => d.conferenceId === conference.id);
const earlyBirdCode = discountCodes.find(d => d.code === 'EARLYBIRD2024');
const familyCode = discountCodes.find(d => d.code === 'FAMILY2024');

// Helper function to generate booking reference
function generateBookingRef() {
	return `CONF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

// Helper function to generate ticket ID
function generateTicketId() {
	return `TICKET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

// Helper function to calculate age from date of birth
function calculateAge(dob) {
	const today = new Date();
	const birth = new Date(dob);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

// Booking 1: Family booking with 2 adults, 1 teen, 1 child - PAID
const booking1 = {
	id: 'booking-test-1',
	conferenceId: conference.id,
	bookingReference: generateBookingRef(),
	groupLeaderName: 'John Smith',
	groupLeaderEmail: 'john.smith@example.com',
	groupLeaderPhone: '+44 7700 900123',
	attendeeCount: 4,
	subtotal: (adultRegular.price * 2) + teenRegular.price + childRegular.price,
	discountAmount: 0,
	discountCode: null,
	totalAmount: (adultRegular.price * 2) + teenRegular.price + childRegular.price,
	paymentMethod: 'paypal',
	paymentStatus: 'paid',
	createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
};

const attendees1 = [
	{
		id: 'attendee-1-1',
		bookingId: booking1.id,
		ticketId: generateTicketId(),
		ticketTypeId: adultRegular.id,
		fullName: 'John Smith',
		dateOfBirth: '1985-03-15',
		age: calculateAge('1985-03-15'),
		email: 'john.smith@example.com',
		phone: '+44 7700 900123',
		address: '123 Main Street',
		city: 'London',
		postcode: 'SW1A 1AA',
		country: 'United Kingdom',
		homeChurch: 'Grace Community Church',
		groupName: null,
		isGroupLeader: true,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: 'Vegetarian',
		consentWaiver: null
	},
	{
		id: 'attendee-1-2',
		bookingId: booking1.id,
		ticketId: generateTicketId(),
		ticketTypeId: adultRegular.id,
		fullName: 'Sarah Smith',
		dateOfBirth: '1987-07-22',
		age: calculateAge('1987-07-22'),
		email: 'sarah.smith@example.com',
		phone: '+44 7700 900124',
		address: '123 Main Street',
		city: 'London',
		postcode: 'SW1A 1AA',
		country: 'United Kingdom',
		homeChurch: 'Grace Community Church',
		groupName: null,
		isGroupLeader: false,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: null,
		consentWaiver: null
	},
	{
		id: 'attendee-1-3',
		bookingId: booking1.id,
		ticketId: generateTicketId(),
		ticketTypeId: teenRegular.id,
		fullName: 'Emma Smith',
		dateOfBirth: '2008-11-10',
		age: calculateAge('2008-11-10'),
		email: 'emma.smith@example.com',
		phone: '+44 7700 900125',
		address: '123 Main Street',
		city: 'London',
		postcode: 'SW1A 1AA',
		country: 'United Kingdom',
		homeChurch: 'Grace Community Church',
		groupName: 'Youth Group',
		isGroupLeader: false,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: null,
		consentWaiver: null
	},
	{
		id: 'attendee-1-4',
		bookingId: booking1.id,
		ticketId: generateTicketId(),
		ticketTypeId: childRegular.id,
		fullName: 'Oliver Smith',
		dateOfBirth: '2015-05-18',
		age: calculateAge('2015-05-18'),
		email: 'oliver.smith@example.com',
		phone: '+44 7700 900126',
		address: '123 Main Street',
		city: 'London',
		postcode: 'SW1A 1AA',
		country: 'United Kingdom',
		homeChurch: 'Grace Community Church',
		groupName: 'Kids Club',
		isGroupLeader: false,
		emergencyContact: {
			name: 'John Smith',
			relationship: 'Father',
			phone: '+44 7700 900123'
		},
		medicalHistory: 'Asthma - uses inhaler',
		allergies: 'Peanuts',
		dietaryRestrictions: 'No dairy',
		consentWaiver: true
	}
];

// Booking 2: Single adult with camping - PARTIAL PAYMENT
const booking2 = {
	id: 'booking-test-2',
	conferenceId: conference.id,
	bookingReference: generateBookingRef(),
	groupLeaderName: 'Michael Johnson',
	groupLeaderEmail: 'michael.j@example.com',
	groupLeaderPhone: '+44 7700 900200',
	attendeeCount: 1,
	subtotal: adultCamping.price,
	discountAmount: earlyBirdCode ? (adultCamping.price * earlyBirdCode.value / 100) : 0,
	discountCode: earlyBirdCode ? earlyBirdCode.code : null,
	totalAmount: adultCamping.price - (earlyBirdCode ? (adultCamping.price * earlyBirdCode.value / 100) : 0),
	paymentMethod: 'paypal',
	paymentStatus: 'partial',
	createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
};

const attendees2 = [
	{
		id: 'attendee-2-1',
		bookingId: booking2.id,
		ticketId: generateTicketId(),
		ticketTypeId: adultCamping.id,
		fullName: 'Michael Johnson',
		dateOfBirth: '1990-09-12',
		age: calculateAge('1990-09-12'),
		email: 'michael.j@example.com',
		phone: '+44 7700 900200',
		address: '456 Oak Avenue',
		city: 'Manchester',
		postcode: 'M1 1AA',
		country: 'United Kingdom',
		homeChurch: 'Hope Church',
		groupName: null,
		isGroupLeader: true,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: null,
		consentWaiver: null
	}
];

// Booking 3: Family with discount code - UNPAID
const booking3 = {
	id: 'booking-test-3',
	conferenceId: conference.id,
	bookingReference: generateBookingRef(),
	groupLeaderName: 'David Williams',
	groupLeaderEmail: 'david.w@example.com',
	groupLeaderPhone: '+44 7700 900300',
	attendeeCount: 3,
	subtotal: (adultRegular.price * 2) + childCamping.price,
	discountAmount: familyCode ? ((adultRegular.price * 2) + childCamping.price) * familyCode.value / 100 : 0,
	discountCode: familyCode ? familyCode.code : null,
	totalAmount: ((adultRegular.price * 2) + childCamping.price) - (familyCode ? ((adultRegular.price * 2) + childCamping.price) * familyCode.value / 100 : 0),
	paymentMethod: 'paypal',
	paymentStatus: 'unpaid',
	createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
};

const attendees3 = [
	{
		id: 'attendee-3-1',
		bookingId: booking3.id,
		ticketId: generateTicketId(),
		ticketTypeId: adultRegular.id,
		fullName: 'David Williams',
		dateOfBirth: '1982-01-20',
		age: calculateAge('1982-01-20'),
		email: 'david.w@example.com',
		phone: '+44 7700 900300',
		address: '789 Elm Road',
		city: 'Birmingham',
		postcode: 'B1 1AA',
		country: 'United Kingdom',
		homeChurch: 'Faith Community',
		groupName: null,
		isGroupLeader: true,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: null,
		consentWaiver: null
	},
	{
		id: 'attendee-3-2',
		bookingId: booking3.id,
		ticketId: generateTicketId(),
		ticketTypeId: adultRegular.id,
		fullName: 'Lisa Williams',
		dateOfBirth: '1984-06-14',
		age: calculateAge('1984-06-14'),
		email: 'lisa.w@example.com',
		phone: '+44 7700 900301',
		address: '789 Elm Road',
		city: 'Birmingham',
		postcode: 'B1 1AA',
		country: 'United Kingdom',
		homeChurch: 'Faith Community',
		groupName: null,
		isGroupLeader: false,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: 'Gluten-free',
		consentWaiver: null
	},
	{
		id: 'attendee-3-3',
		bookingId: booking3.id,
		ticketId: generateTicketId(),
		ticketTypeId: childCamping.id,
		fullName: 'Sophie Williams',
		dateOfBirth: '2017-03-25',
		age: calculateAge('2017-03-25'),
		email: 'sophie.w@example.com',
		phone: '+44 7700 900302',
		address: '789 Elm Road',
		city: 'Birmingham',
		postcode: 'B1 1AA',
		country: 'United Kingdom',
		homeChurch: 'Faith Community',
		groupName: 'Kids Club',
		isGroupLeader: false,
		emergencyContact: {
			name: 'David Williams',
			relationship: 'Father',
			phone: '+44 7700 900300'
		},
		medicalHistory: null,
		allergies: 'Eggs',
		dietaryRestrictions: 'No eggs',
		consentWaiver: true
	}
];

// Booking 4: Two adults with camping - PAID
const booking4 = {
	id: 'booking-test-4',
	conferenceId: conference.id,
	bookingReference: generateBookingRef(),
	groupLeaderName: 'Robert Brown',
	groupLeaderEmail: 'robert.b@example.com',
	groupLeaderPhone: '+44 7700 900400',
	attendeeCount: 2,
	subtotal: adultCamping.price * 2,
	discountAmount: 0,
	discountCode: null,
	totalAmount: adultCamping.price * 2,
	paymentMethod: 'paypal',
	paymentStatus: 'paid',
	createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
};

const attendees4 = [
	{
		id: 'attendee-4-1',
		bookingId: booking4.id,
		ticketId: generateTicketId(),
		ticketTypeId: adultCamping.id,
		fullName: 'Robert Brown',
		dateOfBirth: '1978-12-05',
		age: calculateAge('1978-12-05'),
		email: 'robert.b@example.com',
		phone: '+44 7700 900400',
		address: '321 Pine Street',
		city: 'Leeds',
		postcode: 'LS1 1AA',
		country: 'United Kingdom',
		homeChurch: 'City Church',
		groupName: null,
		isGroupLeader: true,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: null,
		consentWaiver: null
	},
	{
		id: 'attendee-4-2',
		bookingId: booking4.id,
		ticketId: generateTicketId(),
		ticketTypeId: adultCamping.id,
		fullName: 'Jennifer Brown',
		dateOfBirth: '1980-04-18',
		age: calculateAge('1980-04-18'),
		email: 'jennifer.b@example.com',
		phone: '+44 7700 900401',
		address: '321 Pine Street',
		city: 'Leeds',
		postcode: 'LS1 1AA',
		country: 'United Kingdom',
		homeChurch: 'City Church',
		groupName: null,
		isGroupLeader: false,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: 'Vegan',
		consentWaiver: null
	}
];

// Booking 5: Single teen - PAID
const booking5 = {
	id: 'booking-test-5',
	conferenceId: conference.id,
	bookingReference: generateBookingRef(),
	groupLeaderName: 'Patricia Taylor',
	groupLeaderEmail: 'patricia.t@example.com',
	groupLeaderPhone: '+44 7700 900500',
	attendeeCount: 1,
	subtotal: teenRegular.price,
	discountAmount: 0,
	discountCode: null,
	totalAmount: teenRegular.price,
	paymentMethod: 'paypal',
	paymentStatus: 'paid',
	createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
};

const attendees5 = [
	{
		id: 'attendee-5-1',
		bookingId: booking5.id,
		ticketId: generateTicketId(),
		ticketTypeId: teenRegular.id,
		fullName: 'James Taylor',
		dateOfBirth: '2009-08-30',
		age: calculateAge('2009-08-30'),
		email: 'james.t@example.com',
		phone: '+44 7700 900501',
		address: '654 Maple Drive',
		city: 'Sheffield',
		postcode: 'S1 1AA',
		country: 'United Kingdom',
		homeChurch: 'New Life Church',
		groupName: 'Youth Group',
		isGroupLeader: false,
		emergencyContact: null,
		medicalHistory: null,
		allergies: null,
		dietaryRestrictions: null,
		consentWaiver: null
	}
];

// Check if bookings already exist
const existingBookings = db.conferenceBookings.filter(b => 
	b.id.startsWith('booking-test-')
);
if (existingBookings.length > 0) {
	console.log('⚠️  Test bookings already exist. Removing old test bookings...');
	// Remove old test bookings and their attendees
	db.conferenceBookings = db.conferenceBookings.filter(b => !b.id.startsWith('booking-test-'));
	db.conferenceAttendees = db.conferenceAttendees.filter(a => !a.bookingId.startsWith('booking-test-'));
	
	// Reset ticket type sold counts (we'll recalculate)
	ticketTypes.forEach(ticket => {
		const soldCount = db.conferenceAttendees.filter(a => a.ticketTypeId === ticket.id).length;
		ticket.sold = soldCount;
	});
	
	// Reset discount code usage
	if (earlyBirdCode) {
		earlyBirdCode.usedCount = db.conferenceBookings.filter(b => b.discountCode === earlyBirdCode.code).length;
	}
	if (familyCode) {
		familyCode.usedCount = db.conferenceBookings.filter(b => b.discountCode === familyCode.code).length;
	}
}

// Add bookings
const allBookings = [booking1, booking2, booking3, booking4, booking5];
const allAttendees = [...attendees1, ...attendees2, ...attendees3, ...attendees4, ...attendees5];

allBookings.forEach(booking => {
	db.conferenceBookings.push(booking);
});

allAttendees.forEach(attendee => {
	db.conferenceAttendees.push(attendee);
	
	// Update ticket type sold count
	const ticketType = ticketTypes.find(t => t.id === attendee.ticketTypeId);
	if (ticketType) {
		ticketType.sold = (ticketType.sold || 0) + 1;
	}
});

// Update discount code usage
if (earlyBirdCode && booking2.discountCode === earlyBirdCode.code) {
	earlyBirdCode.usedCount = (earlyBirdCode.usedCount || 0) + 1;
}
if (familyCode && booking3.discountCode === familyCode.code) {
	familyCode.usedCount = (familyCode.usedCount || 0) + 1;
}

// Write back to database
try {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
	console.log('✅ Successfully added test bookings!');
	console.log(`   Bookings: ${allBookings.length}`);
	console.log(`   Attendees: ${allAttendees.length}`);
	console.log(`   Payment Status:`);
	console.log(`     - Paid: ${allBookings.filter(b => b.paymentStatus === 'paid').length}`);
	console.log(`     - Partial: ${allBookings.filter(b => b.paymentStatus === 'partial').length}`);
	console.log(`     - Unpaid: ${allBookings.filter(b => b.paymentStatus === 'unpaid').length}`);
	console.log(`   Database saved to: ${DB_PATH}`);
} catch (error) {
	console.error('❌ Failed to write database:', error.message);
	process.exit(1);
}

