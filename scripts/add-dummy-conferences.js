#!/usr/bin/env node

/**
 * Script to add dummy conference data to the database
 * Usage: node scripts/add-dummy-conferences.js
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

// Initialize conference arrays if they don't exist
if (!db.conferences) db.conferences = [];
if (!db.conferenceTicketTypes) db.conferenceTicketTypes = [];
if (!db.conferenceDiscountCodes) db.conferenceDiscountCodes = [];
if (!db.conferenceBookings) db.conferenceBookings = [];
if (!db.conferenceAttendees) db.conferenceAttendees = [];

// Check if dummy data already exists
const existingConference = db.conferences.find(c => c.id === 'conf-2024-annual');
if (existingConference) {
	console.log('Dummy conference data already exists. Updating with early bird settings...');
	let updated = false;
	
	// Update existing conference with supporting pages if missing
	if (!existingConference.supportingPages) {
		existingConference.supportingPages = {
			worshipAndMinistry: '<h3>Worship and Ministry</h3><p>Join us for powerful times of worship and ministry throughout the conference. We will have dedicated worship sessions led by our worship team, and opportunities for prayer and ministry.</p><ul><li>Morning worship sessions</li><li>Evening worship and ministry times</li><li>Prayer ministry available</li></ul>',
			kidsActivities: '<h3>Kids Activities</h3><p>We have a fantastic program for children aged 0-12 years old. All activities are supervised by DBS-checked volunteers.</p><ul><li>Age-appropriate teaching and activities</li><li>Games and crafts</li><li>Supervised play areas</li><li>Meal times together</li></ul>',
			youthActivities: '<h3>Youth Activities</h3><p>Teens (13-17 years) will have their own dedicated program with relevant teaching, activities, and social time.</p><ul><li>Youth-focused sessions</li><li>Team building activities</li><li>Social events</li><li>Mentorship opportunities</li></ul>',
			socialActivities: '<h3>Social Activities</h3><p>There will be plenty of opportunities to connect and socialize throughout the conference.</p><ul><li>Welcome reception</li><li>Networking breaks</li><li>Evening social events</li><li>Optional group outings</li></ul>',
			accommodation: '<h3>Accommodation</h3><p>We offer on-site camping facilities for those who want to stay close to the action. Alternatively, we have a list of recommended local hotels and B&Bs.</p><ul><li>On-site camping available</li><li>Local hotel recommendations</li><li>B&B options nearby</li><li>Contact us for more information</li></ul>',
			whatYouNeed: '<h3>What You Need</h3><p>Here\'s what to bring with you to the conference:</p><ul><li>Bible and notebook</li><li>Comfortable clothing</li><li>Weather-appropriate items</li><li>Any dietary requirements information</li><li>Camping gear (if camping)</li></ul>'
		};
		updated = true;
	}
	
	// Add early bird settings for testing
	// Set dates so early bird is currently active (or will be soon)
	const today = new Date();
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - 30); // Started 30 days ago
	
	const endDate = new Date(today);
	endDate.setDate(today.getDate() + 5); // Ends in 5 days (to test "ending soon" label)
	
	if (!existingConference.earlyBirdStartDate || !existingConference.earlyBirdEndDate || !existingConference.earlyBirdDiscountAmount) {
		existingConference.earlyBirdStartDate = startDate.toISOString().split('T')[0];
		existingConference.earlyBirdEndDate = endDate.toISOString().split('T')[0];
		existingConference.earlyBirdDiscountAmount = 25; // £25 discount for testing
		updated = true;
		console.log('✅ Added early bird settings:');
		console.log(`   Start Date: ${existingConference.earlyBirdStartDate}`);
		console.log(`   End Date: ${existingConference.earlyBirdEndDate}`);
		console.log(`   Discount: £${existingConference.earlyBirdDiscountAmount}`);
	}
	
	if (updated) {
		// Write back to database
		try {
			writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
			console.log('✅ Successfully updated conference!');
		} catch (error) {
			console.error('❌ Failed to update database:', error.message);
			process.exit(1);
		}
	} else {
		console.log('Conference already has all settings. Skipping update...');
	}
	process.exit(0);
}

// Create dummy conference
const conference = {
	id: 'conf-2024-annual',
	slug: 'annual-conference-2024',
	title: 'Annual Network Conference 2024',
	description: '<h2>Join Us for an Inspiring Weekend</h2><p>We are excited to invite you to our Annual Network Conference 2024! This year\'s theme is "Building Together in Faith" and we have an amazing lineup of speakers, workshops, and fellowship opportunities.</p><p>This conference is designed for the whole family, with programs for adults, teens, and children. We\'ll have worship sessions, teaching from the Word, practical workshops, and plenty of time for community and connection.</p><h3>What to Expect</h3><ul><li>Inspiring keynote sessions</li><li>Practical workshops for personal growth</li><li>Worship and prayer times</li><li>Activities for children and youth</li><li>Networking opportunities</li><li>Delicious meals and refreshments</li></ul>',
	schedule: '<h3>Conference Schedule</h3><h4>Friday Evening</h4><ul><li>6:00 PM - Registration & Welcome</li><li>7:00 PM - Opening Session & Worship</li><li>8:30 PM - Fellowship & Refreshments</li></ul><h4>Saturday</h4><ul><li>9:00 AM - Morning Worship</li><li>10:00 AM - Keynote Session 1</li><li>11:30 AM - Workshop Sessions</li><li>1:00 PM - Lunch</li><li>2:30 PM - Keynote Session 2</li><li>4:00 PM - Afternoon Activities</li><li>6:00 PM - Dinner</li><li>7:30 PM - Evening Session</li></ul><h4>Sunday</h4><ul><li>9:00 AM - Breakfast</li><li>10:00 AM - Final Session & Commissioning</li><li>12:00 PM - Conference Ends</li></ul>',
	faqs: [
		{
			question: 'What is included in the conference fee?',
			answer: '<p>The conference fee includes all sessions, materials, meals (Friday dinner through Sunday breakfast), and access to all activities. Accommodation is separate - see camping options or local hotel recommendations.</p>'
		},
		{
			question: 'Is there accommodation available?',
			answer: '<p>Yes! We offer camping facilities on-site for those who want to stay. Alternatively, we have a list of recommended local hotels and B&Bs available upon request.</p>'
		},
		{
			question: 'What about children and youth?',
			answer: '<p>We have dedicated programs for children (ages 0-12) and youth (ages 13-17) running throughout the conference. All children\'s workers are DBS checked and experienced in working with young people.</p>'
		},
		{
			question: 'Can I register on the day?',
			answer: '<p>While we prefer advance registration, we do accept on-the-day registrations subject to availability. However, early bird pricing and meal guarantees are only available for advance bookings.</p>'
		},
		{
			question: 'What if I need to cancel?',
			answer: '<p>Full refunds are available up to 30 days before the conference. After that, 50% refunds are available up to 14 days before. Unfortunately, we cannot offer refunds within 14 days of the conference.</p>'
		}
	],
	venue: {
		name: 'The King\'s Centre',
		address: '123 Conference Way',
		city: 'London',
		postcode: 'SW1A 1AA',
		country: 'United Kingdom'
	},
	startDate: '2024-09-20',
	endDate: '2024-09-22',
	startTime: '18:00',
	endTime: '12:00',
	images: [
		'https://res.cloudinary.com/dsnceqtza/image/upload/v1763390998/mission-life-grace/375d5fb3-6856-49be-a8d1-48859a442bca.jpg'
	],
	registrationOpen: true,
	published: true,
	paymentSettings: {
		paypalEnabled: true,
		payLaterEnabled: true,
		depositAmount: 50,
		depositPercentage: 25,
		installmentCount: 3,
		installmentInterval: 30
	},
	// Early bird settings for testing
	// Set dates so early bird is currently active
	earlyBirdStartDate: (() => {
		const date = new Date();
		date.setDate(date.getDate() - 30); // Started 30 days ago
		return date.toISOString().split('T')[0];
	})(),
	earlyBirdEndDate: (() => {
		const date = new Date();
		date.setDate(date.getDate() + 5); // Ends in 5 days (to test "ending soon" label)
		return date.toISOString().split('T')[0];
	})(),
	earlyBirdDiscountAmount: 25, // £25 discount for testing
	supportingPages: {
		worshipAndMinistry: '<h3>Worship and Ministry</h3><p>Join us for powerful times of worship and ministry throughout the conference. We will have dedicated worship sessions led by our worship team, and opportunities for prayer and ministry.</p><ul><li>Morning worship sessions</li><li>Evening worship and ministry times</li><li>Prayer ministry available</li></ul>',
		kidsActivities: '<h3>Kids Activities</h3><p>We have a fantastic program for children aged 0-12 years old. All activities are supervised by DBS-checked volunteers.</p><ul><li>Age-appropriate teaching and activities</li><li>Games and crafts</li><li>Supervised play areas</li><li>Meal times together</li></ul>',
		youthActivities: '<h3>Youth Activities</h3><p>Teens (13-17 years) will have their own dedicated program with relevant teaching, activities, and social time.</p><ul><li>Youth-focused sessions</li><li>Team building activities</li><li>Social events</li><li>Mentorship opportunities</li></ul>',
		socialActivities: '<h3>Social Activities</h3><p>There will be plenty of opportunities to connect and socialize throughout the conference.</p><ul><li>Welcome reception</li><li>Networking breaks</li><li>Evening social events</li><li>Optional group outings</li></ul>',
		accommodation: '<h3>Accommodation</h3><p>We offer on-site camping facilities for those who want to stay close to the action. Alternatively, we have a list of recommended local hotels and B&Bs.</p><ul><li>On-site camping available</li><li>Local hotel recommendations</li><li>B&B options nearby</li><li>Contact us for more information</li></ul>',
		whatYouNeed: '<h3>What You Need</h3><p>Here\'s what to bring with you to the conference:</p><ul><li>Bible and notebook</li><li>Comfortable clothing</li><li>Weather-appropriate items</li><li>Any dietary requirements information</li><li>Camping gear (if camping)</li></ul>'
	}
};

// Create ticket types
const ticketTypes = [
	{
		id: 'ticket-adult-regular',
		conferenceId: 'conf-2024-annual',
		name: 'Adult - Non-Camping',
		type: 'adult',
		camping: false,
		price: 120,
		earlyBirdPrice: 95,
		latePrice: 145,
		capacity: 200,
		sold: 0,
		ageMin: 18,
		ageMax: 999,
		earlyBirdEndDate: '2024-07-31',
		latePriceStartDate: '2024-08-31',
		description: 'Full conference access for adults. Includes all sessions, meals, and materials.',
		enabled: true
	},
	{
		id: 'ticket-adult-camping',
		conferenceId: 'conf-2024-annual',
		name: 'Adult - Camping',
		type: 'adult',
		camping: true,
		price: 140,
		earlyBirdPrice: 115,
		latePrice: 165,
		capacity: 100,
		sold: 0,
		ageMin: 18,
		ageMax: 999,
		earlyBirdEndDate: '2024-07-31',
		latePriceStartDate: '2024-08-31',
		description: 'Full conference access for adults with on-site camping included.',
		enabled: true
	},
	{
		id: 'ticket-teen-regular',
		conferenceId: 'conf-2024-annual',
		name: 'Teen - Non-Camping',
		type: 'teen',
		camping: false,
		price: 80,
		earlyBirdPrice: 65,
		latePrice: 95,
		capacity: 50,
		sold: 0,
		ageMin: 13,
		ageMax: 17,
		earlyBirdEndDate: '2024-07-31',
		latePriceStartDate: '2024-08-31',
		description: 'Conference access for teens (13-17 years). Includes youth program, meals, and activities.',
		enabled: true
	},
	{
		id: 'ticket-teen-camping',
		conferenceId: 'conf-2024-annual',
		name: 'Teen - Camping',
		type: 'teen',
		camping: true,
		price: 95,
		earlyBirdPrice: 80,
		latePrice: 110,
		capacity: 30,
		sold: 0,
		ageMin: 13,
		ageMax: 17,
		earlyBirdEndDate: '2024-07-31',
		latePriceStartDate: '2024-08-31',
		description: 'Conference access for teens with camping included.',
		enabled: true
	},
	{
		id: 'ticket-child-regular',
		conferenceId: 'conf-2024-annual',
		name: 'Child - Non-Camping',
		type: 'child',
		camping: false,
		price: 50,
		earlyBirdPrice: 40,
		latePrice: 60,
		capacity: 75,
		sold: 0,
		ageMin: 0,
		ageMax: 12,
		earlyBirdEndDate: '2024-07-31',
		latePriceStartDate: '2024-08-31',
		description: 'Conference access for children (0-12 years). Includes children\'s program, meals, and activities.',
		enabled: true
	},
	{
		id: 'ticket-child-camping',
		conferenceId: 'conf-2024-annual',
		name: 'Child - Camping',
		type: 'child',
		camping: true,
		price: 60,
		earlyBirdPrice: 50,
		latePrice: 70,
		capacity: 50,
		sold: 0,
		ageMin: 0,
		ageMax: 12,
		earlyBirdEndDate: '2024-07-31',
		latePriceStartDate: '2024-08-31',
		description: 'Conference access for children with camping included.',
		enabled: true
	},
	{
		id: 'ticket-under-2s',
		conferenceId: 'conf-2024-annual',
		name: 'Under 2s',
		type: 'under-2s',
		camping: false,
		price: 0,
		earlyBirdPrice: 0,
		latePrice: 0,
		capacity: 25,
		sold: 0,
		ageMin: 0,
		ageMax: 1,
		earlyBirdEndDate: '',
		latePriceStartDate: '',
		description: 'Free ticket for children under 2 years old.',
		enabled: true
	}
];

// Create discount codes
const discountCodes = [
	{
		id: 'discount-earlybird',
		conferenceId: 'conf-2024-annual',
		code: 'EARLYBIRD2024',
		type: 'percentage',
		value: 10,
		applicableTicketTypes: [],
		maxUsage: 50,
		usedCount: 0,
		expiryDate: '2024-07-31',
		enabled: true
	},
	{
		id: 'discount-family',
		conferenceId: 'conf-2024-annual',
		code: 'FAMILY2024',
		type: 'percentage',
		value: 15,
		applicableTicketTypes: [],
		maxUsage: 30,
		usedCount: 0,
		expiryDate: '2024-09-15',
		enabled: true
	},
	{
		id: 'discount-student',
		conferenceId: 'conf-2024-annual',
		code: 'STUDENT20',
		type: 'fixed',
		value: 20,
		applicableTicketTypes: ['ticket-adult-regular', 'ticket-adult-camping'],
		maxUsage: 20,
		usedCount: 0,
		expiryDate: '2024-09-15',
		enabled: true
	}
];

// Add to database
db.conferences.push(conference);
ticketTypes.forEach(ticket => db.conferenceTicketTypes.push(ticket));
discountCodes.forEach(code => db.conferenceDiscountCodes.push(code));

// Write back to database
try {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
	console.log('✅ Successfully added dummy conference data!');
	console.log(`   Conference: ${conference.title}`);
	console.log(`   Ticket Types: ${ticketTypes.length}`);
	console.log(`   Discount Codes: ${discountCodes.length}`);
	console.log(`   Database saved to: ${DB_PATH}`);
} catch (error) {
	console.error('❌ Failed to write database:', error.message);
	process.exit(1);
}

