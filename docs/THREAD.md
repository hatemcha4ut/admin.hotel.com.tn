# admin.hotel.com.tn – Project Thread

## Purpose

This is the **backoffice admin interface** for hotel management operations:
- Manage hotels and inventory
- View and manage bookings
- Process payments and track revenue
- Administer user roles and permissions

The admin portal provides authenticated staff access to operational data and controls that are not exposed to guests or public users.

## Dependencies

1. **Supabase Project**
   - Authentication service (email/password)
   - PostgreSQL database with RLS policies
   - Real-time subscriptions for live updates
   
2. **api.hotel.com.tn Functions**
   - Payment processing endpoints
   - Booking validation and creation
   - Email notifications
   - Third-party integrations (payment gateways, channel managers)

## Authentication Model

**Admin-only access:**
- All users must authenticate via Supabase Auth
- Users must be registered in the `admin_users` table
- No guest or public access permitted
- Role-based UI adaptation (admin, manager, staff)

**No guest functionality:**
- Guest booking flows are handled by separate frontend
- This portal is exclusively for authenticated staff

## Operational Checklist: Post-Deploy Verification

After deploying changes, verify the following:

- [ ] **Login Flow**: Can authenticate with valid admin credentials
- [ ] **Access Control**: Non-admin users are blocked at login
- [ ] **List Bookings**: Bookings page loads and displays current reservations
- [ ] **View Booking Details**: Can click into individual booking and see full details
- [ ] **Dashboard**: Key metrics display correctly (occupancy, revenue, etc.)
- [ ] **Role-Based UI**: Menu items adapt to user role (staff vs manager vs admin)
- [ ] **Data Integrity**: RLS policies prevent unauthorized data access
- [ ] **Real-time Updates**: Changes reflect immediately without manual refresh

## Next Actions Checklist

Track ongoing work and planned improvements:

- [ ] Implement audit logging for critical actions (PR: [#TBD])
- [ ] Add bulk operations for bookings (Issue: [#TBD])
- [ ] Create detailed reports and analytics dashboard (Issue: [#TBD])
- [ ] Integrate with additional payment processors (Issue: [#TBD])
- [ ] Add email notification preferences (Issue: [#TBD])

## What Lives in Admin vs API

### admin.hotel.com.tn (This Repo)

**Scope:** Frontend-only React application

- User interface for backoffice staff
- Authentication and session management (Supabase client SDK)
- Data display and form interactions
- Client-side validation
- Routing and navigation
- No server-side logic or API endpoints

**Technology:**
- React + TypeScript + Vite
- Supabase JS client
- Deployed as static site (GitHub Pages)

### api.hotel.com.tn

**Scope:** Backend API and business logic

- Supabase Edge Functions or serverless endpoints
- Payment processing with external gateways
- Booking validation and state transitions
- Email sending and notifications
- Third-party API integrations
- Database schema and migrations
- Complex business rules and calculations
- Scheduled jobs and background tasks

**Key principle:** The admin portal consumes APIs from api.hotel.com.tn but implements no business logic itself. All data mutations and validations happen server-side.

## Architecture Notes

- **Database Access**: Admin portal uses Supabase client with anon key; all data access controlled by RLS policies
- **Service Role**: Never exposed in browser; reserved for api.hotel.com.tn backend functions
- **State Management**: React hooks and context; no global state library
- **Deployment**: Static hosting (GitHub Pages) with environment variables for Supabase configuration
