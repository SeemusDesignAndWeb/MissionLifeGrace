import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = process.env.DATABASE_PATH || './data/database.json';

function getDbPath() {
	if (DB_PATH.startsWith('./') || DB_PATH.startsWith('../')) {
		return join(process.cwd(), DB_PATH);
	}
	return DB_PATH;
}

// Default Teen form fields
const teenFields = [
	{
		id: 'teen-emergency-name',
		formType: 'teen',
		label: 'Emergency Contact Name',
		name: 'emergency_contact_name',
		type: 'text',
		required: true,
		placeholder: '',
		helpText: 'Name of the emergency contact person',
		order: 1
	},
	{
		id: 'teen-emergency-phone',
		formType: 'teen',
		label: 'Emergency Contact Phone',
		name: 'emergency_contact_phone',
		type: 'tel',
		required: true,
		placeholder: '',
		helpText: 'Phone number of the emergency contact',
		order: 2
	},
	{
		id: 'teen-emergency-relationship',
		formType: 'teen',
		label: 'Emergency Contact Relationship',
		name: 'emergency_contact_relationship',
		type: 'text',
		required: false,
		placeholder: 'e.g., Parent, Guardian',
		helpText: 'Relationship to the emergency contact',
		order: 3
	},
	{
		id: 'teen-medical-history',
		formType: 'teen',
		label: 'Medical History',
		name: 'medical_history',
		type: 'textarea',
		required: false,
		placeholder: '',
		helpText: 'Any relevant medical history',
		order: 4
	},
	{
		id: 'teen-allergies',
		formType: 'teen',
		label: 'Allergies',
		name: 'allergies',
		type: 'text',
		required: false,
		placeholder: '',
		helpText: 'List any allergies',
		order: 5
	},
	{
		id: 'teen-dietary-restrictions',
		formType: 'teen',
		label: 'Dietary Restrictions',
		name: 'dietary_restrictions',
		type: 'text',
		required: false,
		placeholder: '',
		helpText: 'Any dietary restrictions or requirements',
		order: 6
	}
];

// Default Child form fields
const childFields = [
	{
		id: 'child-emergency-name',
		formType: 'child',
		label: 'Emergency Contact Name',
		name: 'emergency_contact_name',
		type: 'text',
		required: true,
		placeholder: '',
		helpText: 'Name of the emergency contact person',
		order: 1
	},
	{
		id: 'child-emergency-phone',
		formType: 'child',
		label: 'Emergency Contact Phone',
		name: 'emergency_contact_phone',
		type: 'tel',
		required: true,
		placeholder: '',
		helpText: 'Phone number of the emergency contact',
		order: 2
	},
	{
		id: 'child-emergency-relationship',
		formType: 'child',
		label: 'Emergency Contact Relationship',
		name: 'emergency_contact_relationship',
		type: 'text',
		required: false,
		placeholder: 'e.g., Parent, Guardian',
		helpText: 'Relationship to the emergency contact',
		order: 3
	},
	{
		id: 'child-medical-history',
		formType: 'child',
		label: 'Medical History',
		name: 'medical_history',
		type: 'textarea',
		required: false,
		placeholder: '',
		helpText: 'Any relevant medical history',
		order: 4
	},
	{
		id: 'child-allergies',
		formType: 'child',
		label: 'Allergies',
		name: 'allergies',
		type: 'text',
		required: false,
		placeholder: '',
		helpText: 'List any allergies',
		order: 5
	},
	{
		id: 'child-dietary-restrictions',
		formType: 'child',
		label: 'Dietary Restrictions',
		name: 'dietary_restrictions',
		type: 'text',
		required: false,
		placeholder: '',
		helpText: 'Any dietary restrictions or requirements',
		order: 6
	},
	{
		id: 'child-consent-medical',
		formType: 'child',
		label: 'Medical Treatment Consent',
		name: 'consent_medical',
		type: 'checkbox',
		required: false,
		placeholder: '',
		helpText: 'Consent for medical treatment if needed',
		order: 7
	},
	{
		id: 'child-consent-photo',
		formType: 'child',
		label: 'Photo/Video Consent',
		name: 'consent_photo',
		type: 'checkbox',
		required: false,
		placeholder: '',
		helpText: 'Consent for photos and videos to be taken',
		order: 8
	},
	{
		id: 'child-consent-activities',
		formType: 'child',
		label: 'Activities Consent',
		name: 'consent_activities',
		type: 'checkbox',
		required: false,
		placeholder: '',
		helpText: 'Consent for participation in activities',
		order: 9
	}
];

try {
	const dbPath = getDbPath();
	let db;
	
	try {
		const data = readFileSync(dbPath, 'utf-8');
		db = JSON.parse(data);
	} catch (error) {
		console.error('Failed to read database:', error);
		process.exit(1);
	}

	// Initialize conferenceFormFields if it doesn't exist
	if (!db.conferenceFormFields) {
		db.conferenceFormFields = [];
	}

	// Check if fields already exist
	const existingTeenFields = db.conferenceFormFields.filter(f => f.formType === 'teen');
	const existingChildFields = db.conferenceFormFields.filter(f => f.formType === 'child');

	if (existingTeenFields.length > 0 || existingChildFields.length > 0) {
		console.log('Form fields already exist. Skipping...');
		console.log(`Teen fields: ${existingTeenFields.length}, Child fields: ${existingChildFields.length}`);
	} else {
		// Add all fields
		db.conferenceFormFields = [...teenFields, ...childFields];
		writeFileSync(dbPath, JSON.stringify(db, null, 2));
		console.log('✓ Added default Teen form fields:', teenFields.length);
		console.log('✓ Added default Child form fields:', childFields.length);
		console.log('Total form fields:', db.conferenceFormFields.length);
	}
} catch (error) {
	console.error('Error:', error);
	process.exit(1);
}

