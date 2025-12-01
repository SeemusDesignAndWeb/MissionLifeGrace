# Admin Users System Setup

## Overview

The admin user system provides role-based access control with three access levels:

1. **Full Access** - All content, conference and admin user setup
2. **Editor Access** - All content and front end website updates excluding Conference
3. **Conference Access** - Just conference access

## Password Encryption

All passwords (both admin and regular user accounts) are now encrypted using PBKDF2 with SHA-256, which is a secure one-way hashing algorithm. The encryption key is stored in the `.env` file.

## Environment Variables

Add the following to your `.env` file:

```env
# Password Encryption Key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PASSWORD_ENCRYPTION_KEY=your-32-byte-hex-key-here

# Session Secret (optional, for additional session security)
SESSION_SECRET=your-session-secret-here
```

### Generating the Encryption Key

Run this command to generate a secure 32-byte key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to your `.env` file as `PASSWORD_ENCRYPTION_KEY`.

## Creating the First Admin User

Use the provided script to create your first admin user:

```bash
node scripts/create-admin-user.js
```

The script will prompt you for:
- Email (optional) or Username (optional) - at least one is required
- Full Name
- Password (minimum 8 characters)
- Access Level (1-3)

## Admin User Management

Once logged in with Full Access, you can manage admin users at:

`/admin/users`

From this page you can:
- Create new admin users
- Edit existing admin users
- Change passwords
- Modify access levels
- Activate/deactivate users
- Delete users (cannot delete your own account)

## Access Level Permissions

### Full Access
- All content management (pages, team, services, etc.)
- Conference management
- Admin user management
- Settings

### Editor Access
- All content management (pages, team, services, etc.)
- Front end website updates
- **Cannot** access conference management
- **Cannot** manage admin users

### Conference Access
- Conference management only
- View conference bookings
- Manage conference settings
- **Cannot** access other content management
- **Cannot** manage admin users

## Migration from Old System

If you're migrating from the old single-password admin system:

1. The old `ADMIN_PASSWORD` environment variable is no longer used
2. Create your first admin user using the script above
3. All existing user account passwords will continue to work (they're automatically using the new hashing system)

## Security Notes

- Passwords are hashed using PBKDF2 with 100,000 iterations
- Each password hash includes a unique salt
- Session tokens are cryptographically secure
- Admin sessions expire after 7 days
- User sessions expire after 30 days

