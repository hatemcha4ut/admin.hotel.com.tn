# ADR 0002: Row-Level Security (RLS) Contract

## Status

Accepted

## Context

The admin portal runs entirely in the browser and uses the Supabase JavaScript client with the **anon key** to access the database. This means all database access is subject to Row-Level Security (RLS) policies. We need a clear contract for:

- Which tables are accessible to admin users
- Which operations are permitted (read, write, delete)
- How to avoid using the service role key in the browser (critical security requirement)

## Decision

### Core Principle: Service Role Never in Browser

The Supabase **service role key** bypasses all RLS policies and grants full database access. This key must **never** be exposed in the admin portal frontend code, environment variables, or build artifacts.

**All database access from the admin portal uses the anon key + RLS policies.**

### Table Access Contract

#### Admin-Writable Tables
Tables where admin users can INSERT, UPDATE, and DELETE:
- `admin_users` (admins only, via RLS policy)
- `bookings` (status updates, notes, cancellations)
- `rooms` (inventory management)
- `hotels` (property details, settings)
- `payments` (manual adjustments, refunds via API calls)

#### Admin-Readable Tables
Tables where admin users can SELECT only:
- `customers` (PII, read-only for privacy)
- `audit_logs` (historical record, immutable)
- `booking_history` (immutable snapshots)

#### No Direct Access
Tables not exposed to admin portal (accessed via api.hotel.com.tn):
- `payment_gateway_credentials` (secrets)
- `api_keys` (secrets)
- `internal_configurations` (system-level settings)

### RLS Policy Structure

Each admin-accessible table must have RLS enabled with policies like:

```sql
-- Example for bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Admins can read all bookings
CREATE POLICY "Admins can read bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.email()
    )
  );

-- Admins can update bookings
CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.email()
    )
  );
```

### Enforcement Checklist

- [ ] All tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policies check `admin_users` table for authorization
- [ ] Service role key never appears in frontend code or `.env` files
- [ ] Admin portal uses only `VITE_SUPABASE_ANON_KEY`
- [ ] Sensitive operations (payments, refunds) proxied through api.hotel.com.tn
- [ ] Policies tested in staging with real admin and non-admin users

## Consequences

### Positive
- Strong security boundary: even compromised frontend can't bypass RLS
- Clear separation of concerns: business logic in API, data access in DB
- Auditable: all policies defined in SQL migrations
- No secrets in browser code
- Defense in depth: multiple layers prevent data leaks

### Negative
- Complex policy logic can be hard to debug
- Performance overhead for policy evaluation on each query
- Requires careful coordination between frontend queries and policies
- Developers must understand RLS to write correct queries

### Risks
- Overly permissive policies could leak data
- Missing policies could block legitimate admin access
- Policy changes require database migrations and coordination with frontend

### Mitigations
- Peer review all RLS policy changes
- Automated tests for RLS policies (e.g., using `SET ROLE`)
- Staging environment mirrors production policies exactly
- Document policy rationale inline with SQL
- Regular security audits of all policies

## Implementation Notes

### How to Test RLS Policies

Use Supabase testing with actual user sessions:

```typescript
// Test with admin user
const adminSupabase = createClient(url, anonKey);
await adminSupabase.auth.signInWithPassword({
  email: 'admin@hotel.com',
  password: 'test'
});

const { data: bookings } = await adminSupabase
  .from('bookings')
  .select('*');
// Should succeed and return bookings

// Test with non-admin user
const guestSupabase = createClient(url, anonKey);
await guestSupabase.auth.signInWithPassword({
  email: 'guest@example.com',
  password: 'test'
});

const { data: noBookings } = await guestSupabase
  .from('bookings')
  .select('*');
// Should return empty (no access)
```

### How to Debug Policy Failures

When a query fails unexpectedly:

1. Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'your_table';`
2. List policies: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
3. Test policy in isolation using `SET ROLE`
4. Verify `admin_users` has correct email
5. Check Supabase logs for policy evaluation errors

### Service Role API Calls

For operations requiring service role (e.g., refunds, bulk updates), use this pattern:

```typescript
// Frontend calls API endpoint
const response = await fetch('https://api.hotel.com.tn/admin/refund', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseSession.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ bookingId, amount })
});

// API validates admin user, then uses service role for database operations
```

Never pass service role key to frontend, even in API responses.
