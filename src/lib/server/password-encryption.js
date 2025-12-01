import crypto from 'crypto';
import { env } from '$env/dynamic/private';

// Get encryption key from environment variable
// This should be a 32-byte (256-bit) key for AES-256
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const ENCRYPTION_KEY = env.PASSWORD_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // For GCM, recommended IV length is 12 bytes
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

/**
 * Encrypt a password using AES-256-GCM
 * Returns a base64-encoded string containing: salt + iv + encrypted data + auth tag
 */
export function encryptPassword(password) {
	if (!password) {
		throw new Error('Password cannot be empty');
	}

	// Ensure we have a valid key
	const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
	
	// Generate random salt and IV
	const salt = crypto.randomBytes(SALT_LENGTH);
	const iv = crypto.randomBytes(IV_LENGTH);
	
	// Create cipher
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	
	// Encrypt the password
	let encrypted = cipher.update(password, 'utf8', 'base64');
	encrypted += cipher.final('base64');
	
	// Get authentication tag
	const tag = cipher.getAuthTag();
	
	// Combine: salt + iv + encrypted + tag
	const combined = Buffer.concat([
		salt,
		iv,
		Buffer.from(encrypted, 'base64'),
		tag
	]);
	
	return combined.toString('base64');
}

/**
 * Decrypt a password using AES-256-GCM
 * Takes a base64-encoded string containing: salt + iv + encrypted data + auth tag
 */
export function decryptPassword(encryptedPassword) {
	if (!encryptedPassword) {
		throw new Error('Encrypted password cannot be empty');
	}

	try {
		// Ensure we have a valid key
		const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
		
		// Decode from base64
		const combined = Buffer.from(encryptedPassword, 'base64');
		
		// Extract components
		const salt = combined.slice(0, SALT_LENGTH);
		const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
		const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH, combined.length - TAG_LENGTH);
		const tag = combined.slice(combined.length - TAG_LENGTH);
		
		// Create decipher
		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(tag);
		
		// Decrypt
		let decrypted = decipher.update(encrypted, null, 'utf8');
		decrypted += decipher.final('utf8');
		
		return decrypted;
	} catch (error) {
		throw new Error('Failed to decrypt password: ' + error.message);
	}
}

/**
 * Hash a password for comparison (one-way hash, cannot decrypt)
 * This is used for password verification without storing plaintext
 */
export function hashPassword(password) {
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

/**
 * Verify a password against a hash
 */
export function verifyPassword(password, hashedPassword) {
	if (!password || !hashedPassword) {
		return false;
	}
	
	try {
		const [saltBase64, iterationsStr, hashBase64] = hashedPassword.split(':');
		if (!saltBase64 || !iterationsStr || !hashBase64) {
			return false;
		}
		
		const salt = Buffer.from(saltBase64, 'base64');
		const iterations = parseInt(iterationsStr, 10);
		const storedHash = Buffer.from(hashBase64, 'base64');
		const keyLength = storedHash.length;
		
		const computedHash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
		
		// Use timing-safe comparison
		return crypto.timingSafeEqual(storedHash, computedHash);
	} catch (error) {
		console.error('Password verification error:', error);
		return false;
	}
}

