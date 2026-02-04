# ADR 0001: Admin Authorization Model

## Status

Accepted

## Context

The admin portal requires secure access control to ensure only authorized hotel staff can view and modify sensitive operational data (bookings, payments, customer information). We need a consistent authorization model that:

- Authenticates users reliably
- Enforces role-based access within the UI
- Integrates with the existing Supabase infrastructure
- Supports multiple staff roles with different permissions

## Decision

We will use **Supabase Auth + admin_users table** for authorization:

### Authentication
- Users authenticate via Supabase Auth (email/password)
- Session managed by Supabase client SDK

### Authorization
- A dedicated `admin_users` table contains authorized staff
- Required fields:
  - `email` (text, primary key): matches Supabase Auth user email
  - `role` (text): one of `admin`, `manager`, or `staff`
  - `created_at` (timestamp): audit trail
  - `updated_at` (timestamp): audit trail

### Required Claims/Fields
- After successful Supabase authentication, the app queries `admin_users` by email
- If no matching record exists, access is denied
- The `role` field determines UI permissions and menu visibility

### Expected Behavior
1. User enters credentials on login page
2. Supabase Auth validates credentials and creates session
3. App queries `admin_users` for user's email
4. If record exists, user gains access with specified role
5. If no record, user sees "Access Denied" message
6. UI adapts menu and features based on role

### Role Hierarchy
- **admin**: Full access to all features, can manage users and settings
- **manager**: Can manage bookings, view reports, no user management
- **staff**: Can view bookings and process check-ins, limited modifications

## Consequences

### Positive
- Simple, maintainable authorization model
- Leverages existing Supabase Auth infrastructure
- Easy to add/remove admin users via database operations
- Role-based UI provides clear access control feedback
- No custom authentication logic required

### Negative
- Requires manual database updates to add new admin users (no self-service)
- Role changes require database updates (no UI for admin management yet)
- Authorization check happens after authentication (extra database query)
- No fine-grained permissions within roles (role-level only)

### Risks
- If `admin_users` table is accidentally truncated, all access is lost
- RLS policies on `admin_users` must be correctly configured
- Email changes in Supabase Auth require corresponding updates in `admin_users`

### Mitigations
- Implement database backups and point-in-time recovery
- Document process for adding admin users in runbook
- Add monitoring/alerts for empty `admin_users` table
- Create migration scripts to sync auth emails with admin_users

## Implementation Notes

The `admin_users` table should be created with:

```sql
CREATE TABLE admin_users (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: admins can read all, only superuser/service role can write
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read their own row"
  ON admin_users FOR SELECT
  USING (auth.email() = email);

CREATE POLICY "Admin users can read all if admin role"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.email() AND role = 'admin'
    )
  );
```

Frontend authorization check in `AuthProvider.tsx`:
```typescript
const { data: { user } } = await supabase.auth.getUser();
const { data: adminUser } = await supabase
  .from('admin_users')
  .select('role')
  .eq('email', user.email)
  .single();

if (!adminUser) {
  // Redirect to access denied
}
```
