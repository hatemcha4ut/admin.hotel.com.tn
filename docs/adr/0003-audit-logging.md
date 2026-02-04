# ADR 0003: Audit Logging for Admin Actions

## Status

Accepted

## Context

Admin staff perform critical operations that affect bookings, payments, and customer data. For security, compliance, and debugging purposes, we need to track:

- Who performed an action
- What action was performed
- When it occurred
- What data was affected
- The outcome (success/failure)

This audit trail enables:
- Compliance with data protection regulations (GDPR, PCI-DSS)
- Forensic investigation of incidents or disputes
- Performance monitoring and debugging
- User behavior analytics

## Decision

### Audit Logging Strategy

Implement an **audit_logs** table in the Supabase database to track all significant admin actions.

### Minimal Required Fields

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

-- Index for common queries
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_admin_email ON audit_logs (admin_email);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
```

### Field Definitions

- **id**: Unique identifier for the log entry
- **timestamp**: When the action occurred (UTC)
- **admin_email**: Email of the admin who performed the action
- **action_type**: Type of action (e.g., `booking.update`, `payment.refund`, `user.create`)
- **resource_type**: Type of resource affected (e.g., `booking`, `payment`, `hotel`)
- **resource_id**: ID of the specific resource (e.g., booking ID, payment ID)
- **details**: Additional context as JSON (e.g., `{"status_changed": "confirmed -> cancelled", "reason": "customer request"}`)
- **ip_address**: IP address of the admin (from request headers)
- **user_agent**: Browser/client user agent
- **success**: Whether the action succeeded
- **error_message**: Error details if action failed

### Actions to Log

**Critical actions (always log):**
- Booking modifications (status changes, cancellations, refunds)
- Payment operations (refunds, adjustments, voids)
- User management (adding/removing admin access, role changes)
- Bulk operations (mass updates, exports)

**Optional actions (log for analytics):**
- Page views and navigation
- Search queries
- Report generations
- Data exports

### Implementation Approach

**Option A: Database Triggers (Recommended for critical tables)**
```sql
CREATE FUNCTION log_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Extract email from JWT claims if available
  user_email := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'email',
    'system'
  );
  
  INSERT INTO audit_logs (admin_email, action_type, resource_type, resource_id, details)
  VALUES (
    user_email,
    TG_OP || ' booking',
    'booking',
    NEW.id::TEXT,
    jsonb_build_object('old', OLD, 'new', NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_booking_updates
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_changes();
```

**Option B: Application-Level Logging (For frontend actions)**
```typescript
async function logAction(action: AuditAction) {
  await supabase.from('audit_logs').insert({
    admin_email: currentUser.email,
    action_type: action.type,
    resource_type: action.resourceType,
    resource_id: action.resourceId,
    details: action.details,
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent,
  });
}

// Usage
await updateBookingStatus(bookingId, 'cancelled');
await logAction({
  type: 'booking.cancel',
  resourceType: 'booking',
  resourceId: bookingId,
  details: { reason: 'customer request', cancelled_by: 'admin' }
});
```

### RLS Policies for Audit Logs

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.email() AND role IN ('admin', 'manager')
    )
  );

-- Allow inserts from authenticated admins (for application-level logging)
-- Database triggers run with SECURITY DEFINER and bypass RLS
CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.email()
    )
  );
```

## Consequences

### Positive
- Complete audit trail for all critical operations
- Compliance with regulatory requirements (audit logs required for PCI-DSS, GDPR)
- Faster incident investigation and debugging
- Accountability for admin actions
- Analytics on admin behavior and system usage
- Tamper-evident (logs are immutable)

### Negative
- Storage overhead (audit logs grow continuously)
- Performance impact of logging every action
- Privacy concerns (PII in logs must be protected)
- Requires log retention and archival strategy
- Potential for sensitive data in `details` JSON field

### Risks
- Logs could be used to track employee behavior (privacy concern)
- Large log volume could impact database performance
- Missing logs if application crashes before writing
- Logs themselves could contain security vulnerabilities (e.g., SQL injection in logged data)

### Mitigations
- Implement log rotation and archival (keep last 90 days hot, archive older)
- Redact or hash PII in logs where possible
- Use database triggers for critical actions to ensure logs even if app crashes
- Monitor audit log table size and set alerts
- Apply RLS to audit logs (admin-read-only)
- Regular reviews of logged data to ensure compliance with privacy policies

## Implementation Notes

### Log Retention Policy

- **Hot logs**: Last 90 days in primary database
- **Archive**: 90 days to 7 years in cold storage (S3, data warehouse)
- **Deletion**: Logs older than 7 years purged (unless required for legal holds)

### Automated Archival

```sql
-- Scheduled job (run monthly)
-- Move logs older than 90 days to archive table
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '90 days';

DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '90 days';
```

### Viewing Audit Logs in Admin UI

Create an "Audit Trail" page accessible only to admins:
- Filter by date range, admin user, action type, resource
- Export to CSV for external analysis
- Highlight failed actions and errors
- Link to affected resources (e.g., click booking ID to view booking)

### Privacy Considerations

- Inform admin users that their actions are logged
- Redact customer PII in `details` field (hash or mask sensitive data)
- Apply strict RLS to audit logs (admin role only)
- Comply with employee monitoring regulations (notify staff)
- Allow admins to request their own audit trail (transparency)

### Testing Audit Logging

```typescript
// Test helper
async function assertActionLogged(actionType: string, resourceId: string) {
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action_type', actionType)
    .eq('resource_id', resourceId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  expect(data).toBeDefined();
  expect(data.success).toBe(true);
}

// In test
await cancelBooking(bookingId);
await assertActionLogged('booking.cancel', bookingId);
```
