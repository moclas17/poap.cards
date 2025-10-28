# Database Migrations

This folder contains SQL migration scripts for the POAP Cards database.

## How to Apply Migrations

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file
4. Paste and execute in the SQL Editor

## Migration 001: Add Admin Users

**File**: `001_add_admin_users.sql`

**What it does**:
- Adds `is_admin` boolean field to the `users` table
- Creates an index on `is_admin` for performance
- Marks wallet `0x0e88ac34917a6bf5e36bfdc2c6c658e58078a1e6` as admin
- Adds RLS policy for admins to read all users

**To apply**: Run the SQL in Supabase SQL Editor

**Default Admin Wallet**: `0x0e88ac34917a6bf5e36bfdc2c6c658e58078a1e6`

## Admin Features

Once the migration is applied, the admin user can:
- Access the admin panel at `/admin`
- View all registered users
- See user statistics (total users, admin count)
- See ENS names, wallet addresses, and join dates
- **Promote/demote users to admin** with a single click (UI-based)
- **View detailed user information** by clicking on any user:
  - User statistics (drops created, cards owned, total taps, POAPs claimed)
  - All drops owned by the user with code counts (total, available, used)
  - All NFC cards owned by the user with assignment status
  - Complete activity overview per user

## Adding More Admins

### Method 1: From the Admin Panel (Recommended)
1. Log in as an admin user
2. Go to `/admin`
3. Click on the user you want to promote
4. Click the "Make Admin" button
5. Confirm the action

### Method 2: Using SQL
To add more admin users manually, run this SQL in Supabase:

```sql
-- Replace with the wallet address you want to make admin
UPDATE users
SET is_admin = true
WHERE address = '0xYOUR_WALLET_ADDRESS_HERE';
```

## Security Notes

- Admin access is protected by the `requireAdmin()` middleware
- The `/api/admin/users` endpoint requires admin authentication
- RLS policies ensure only admins can read all user data
- Regular users can only read their own profile
