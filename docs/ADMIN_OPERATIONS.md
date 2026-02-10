# Admin Dashboard Operations Guide

## Overview

This document explains how to use the admin dashboard for `admin.hotel.com.tn` to manage hotel reservations, monitor myGO credit, configure checkout policies, and perform administrative tasks.

## Authentication & Security

### Access Requirements
- **Admin role required** for full access to all features
- **Manager role** has access to reservations and reports
- **Staff role** has read-only access to the dashboard

### Security Best Practices
1. Always log out when finished
2. Never share your credentials
3. Review the **Sécurité** page regularly to verify your session and access level
4. All API calls are authenticated via JWT tokens from Supabase Auth

## myGO Credit Balance

### Viewing Credit Balance
The myGO credit card is displayed on the Dashboard (homepage) and shows:
- **Dépôt restant** (Remaining Deposit): Available credit in the myGO system
- **Devise** (Currency): Currency code (usually TND)
- **Dernière MAJ** (Last Update): Timestamp of the last update

### Credit Status Monitoring
The credit card automatically monitors wallet credit levels and displays visual alerts:

#### Credit Status Levels
- **✓ Crédit Suffisant** (Adequate) - Green border: Credit is above 1000 units
- **⚠️ Crédit Faible** (Low) - Yellow border: Credit is between 500-1000 units
- **⚠️ Crédit Critique** (Critical) - Red border: Credit is below 500 units

#### Low Credit Alerts
When credit drops below safe thresholds, the system displays prominent alerts:
- **Critical Alert**: Immediate action required to avoid booking interruptions
- **Low Alert**: Consider recharging soon to maintain operations

**Important**: Low credit can prevent new bookings from being created in myGO, resulting in `wallet_insufficient` states on bookings.

### Real-Time Updates
- The credit card connects via **Server-Sent Events (SSE)** for real-time updates
- A green **"🟢 Live"** indicator shows when the connection is active
- The system auto-reconnects with exponential backoff if the connection drops

### Manual Refresh
Click the **"Rafraîchir"** button to manually fetch the latest credit balance from the API.

### Troubleshooting
- If the credit card shows an error, check your network connection and try refreshing
- If the error persists, verify your session on the **Sécurité** page

## Checkout Policy Settings

Navigate to **Paramètres** (Settings) to configure the checkout policy.

### Policy Options

#### STRICT
- Payment must be **captured immediately** before creating the myGO reservation
- If payment capture fails, the reservation is **not created**
- **Use case**: Maximum payment security, ensure funds are available before booking

#### ON_HOLD_PREAUTH
- Reservation is created **immediately** with state "OnRequest" and a pre-authorization
- Payment is **captured later** when the reservation is validated
- **Use case**: Faster booking flow, allows guest to secure a room even if immediate capture is not required

### Changing the Policy
1. Select the desired policy option
2. Click **"Enregistrer"** (Save)
3. Confirm the change in the dialog
4. The system displays a success message and updates the policy metadata

### Policy History
If available, the Settings page shows a history of policy changes including:
- Previous policy value
- Date and time of change
- Admin user who made the change

## Reservations Monitoring

Navigate to **Réservations** to view and manage bookings.

### Bookings List

#### Status Filter Options
- **All**: Show all bookings
- **🔔 Actionable (OnRequest/Wallet Low)**: Show only bookings requiring immediate attention
  - Bookings with myGO state "OnRequest" (awaiting validation)
  - Bookings with insufficient wallet credit (failed to create in myGO)
- **Pending**: Bookings awaiting confirmation
- **Confirmed**: Validated bookings
- **Cancelled**: Cancelled bookings
- **Checked In**: Guest has checked in
- **Checked Out**: Guest has checked out

#### Filters
- **Status**: Filter by booking status (pending, confirmed, cancelled, etc.)
- **Guest**: Search by guest name or email
- **Check-in from**: Filter by check-in date range
- **Check-out to**: Filter by check-out date range

#### Columns
- **ID**: Booking identifier
- **myGO ID**: MyGO booking identifier (if available)
- **Guest**: Guest name and email
- **Stay**: Check-in and check-out dates
- **État myGO**: Current myGO state (OnRequest 🟡, Validated 🟢, Cancelled 🔴)
  - Actionable bookings are highlighted with yellow background
  - Wallet insufficient bookings show a red badge
- **Statut**: Current booking status
- **Paiement**: Payment status (preauth, captured, reversed, failed)
- **Total**: Total amount with currency
- **WhatsApp**: Guest WhatsApp number (clickable to open chat)
- **Actions**: "View", "Refresh", and "Cancel" buttons

#### Actionable Bookings
Bookings requiring immediate attention are visually highlighted:
- **Yellow row background**: Indicates OnRequest or wallet_insufficient state
- **Red badge**: Shows "OnRequest + Crédit Insuffisant", "Crédit Insuffisant", or "OnRequest"
- These bookings appear when filtering by "Actionable (OnRequest/Wallet Low)"

#### Admin Actions (when available from backend)
- **Rafraîchir statut**: Manually refresh booking status from myGO and payment provider
- **Annuler**: Cancel the booking (cancels in myGO and reverses pre-authorization)

### Booking Details

Click **"View"** on any booking to see full details:
- Guest information (name, email, WhatsApp)
- Stay dates (check-in, check-out)
- Booking creation date
- Total amount and currency
- Current status (with ability to update manually)
- **myGO State** (if available): OnRequest 🟡, Validated 🟢, Cancelled 🔴
- **Wallet Status** (if insufficient): 🔴 Insuffisant
- **Payment Status** (if available): preauth, captured, reversed, failed
- **myGO Booking ID** (if available)
- **Clictopay Order ID** (if available)
- **Timestamps**: created_at, validated_at, cancelled_at

#### Actionable State Alert
When a booking is in an actionable state (OnRequest or wallet_insufficient), a prominent alert is displayed:
- **OnRequest**: Booking is awaiting myGO validation
- **Wallet Insufficient**: MyGO credit was insufficient during booking creation
- **Both**: Booking is OnRequest AND wallet was insufficient - immediate action required

### Handling Actionable Bookings

#### OnRequest Bookings
When a booking is created with policy `ON_HOLD_PREAUTH`:
1. The booking appears with myGO state "OnRequest" 🟡
2. A pre-authorization is held on the guest's card
3. Admin can:
   - Wait for automatic validation from myGO
   - Manually trigger a status refresh
   - Cancel the booking if needed (will reverse the pre-auth)

#### Wallet-Insufficient Bookings
When myGO credit is insufficient during booking creation:
1. The booking is created locally but not in myGO
2. The `wallet_insufficient` flag is set to `true`
3. A red badge "🔴 Crédit Insuffisant" is displayed
4. Admin must:
   - **Recharge the myGO credit immediately**
   - Click "Rafraîchir statut" to retry booking creation
   - Or cancel the booking and inform the guest

**Important**: Monitor the credit status card on the Dashboard to prevent wallet-insufficient situations.

#### Combined OnRequest + Wallet-Insufficient
In rare cases, a booking may be both OnRequest and have wallet_insufficient flag:
1. The booking was created in myGO but credit became insufficient for related operations
2. Recharge credit and refresh status to resolve
3. This state requires immediate attention

### Verifying Payment Status
- **preauth**: Pre-authorization is active (funds reserved but not captured)
- **captured**: Payment has been captured (funds transferred)
- **reversed**: Pre-authorization has been reversed (funds released)
- **failed**: Payment operation failed

### Force-Refreshing a Booking Status
If a booking status seems out of sync:
1. Click **"Rafraîchir statut"** button (when available)
2. The system queries myGO and the payment provider for the latest status
3. The booking details are updated with the fresh data

### Cancelling a Booking
To cancel a booking (available for actionable bookings - OnRequest or wallet_insufficient):
1. Click **"Annuler"** button (when available)
2. Confirm the cancellation in the dialog
3. The system:
   - Cancels the reservation in myGO (if it was created)
   - Reverses the pre-authorization (if active)
   - Updates the booking status to "cancelled"

**Warning**: Cancelling a booking is irreversible. Ensure you have the guest's confirmation before proceeding.

## Role-Based Access Control

### User Roles
The admin portal supports three role levels with different access permissions:

#### SuperAdmin (admin role)
- **Full Access** to all features
- Can view and manage all bookings
- Can change checkout policy settings
- Can access security and user management pages
- Can cancel bookings in any state
- Can refresh booking status

#### Manager (manager role)
- Access to reservations and reports
- Can view and manage bookings
- Can refresh booking status
- Can cancel actionable bookings
- **Cannot** change system settings
- **Cannot** access user management

#### Agent (staff role)
- **Read-only** access to the dashboard
- Can view booking information
- **Cannot** make changes to bookings
- **Cannot** cancel bookings
- **Cannot** access settings or admin pages

### Feature Visibility by Role
The UI automatically adapts based on user role:
- Navigation menu shows only accessible pages
- Action buttons (cancel, refresh) respect role permissions
- Settings and configuration pages restricted to admin role
- All roles can view myGO credit status for awareness

**Note**: Backend API enforces role permissions independently of frontend - UI restrictions are for convenience only.

## Security Status Page

Navigate to **Sécurité** to view:

### Current User
- Email address
- User ID
- Admin role (admin, manager, staff)
- Access level (✓ Autorisé or ✗ Refusé)

### Session
- JWT token (truncated for security)
- Session expiration timestamp

### Environment
- Application mode (production, development)
- API Base URL

### Application Version
- Git commit SHA
- Build timestamp
- Environment (if available)

Use this page to:
- Verify your current access level
- Check if your session is about to expire
- Confirm the environment you're working in
- Identify the deployed version

## API Architecture

### Important: Never Call myGO Directly
All admin operations **must** go through `api.hotel.com.tn`. The frontend **never** calls myGO APIs directly.

### API Endpoints Used
- `GET /api/admin/mygo/credit` - Get credit balance snapshot
- `GET /api/admin/mygo/credit/stream` - SSE stream for real-time credit updates
- `GET /api/admin/settings/checkout-policy` - Get current checkout policy
- `PUT /api/admin/settings/checkout-policy` - Update checkout policy
- `GET /api/admin/bookings` - List bookings with admin fields
- `GET /api/admin/bookings/:id` - Get single booking details
- `POST /api/admin/bookings/:id/refresh` - Refresh booking status from myGO + payment
- `POST /api/admin/bookings/:id/cancel` - Cancel booking (myGO + reverse preauth)
- `GET /api/version` - Get API version info

### Authentication
All API calls include an `Authorization: Bearer <token>` header with the Supabase JWT access token.

If you receive a 401 Unauthorized error:
1. Your session may have expired
2. Log out and log back in
3. If the issue persists, contact system administrators

## Troubleshooting

### "Session expirée" Error
- Log out and log back in
- Check the **Sécurité** page to verify session expiration time

### Credit Card Not Loading
- Check network connection
- Click "Rafraîchir" to retry
- Verify API Base URL on **Sécurité** page

### Booking Status Not Updating
- Click "Rafraîchir statut" to force a refresh from myGO
- Check if the myGO system is accessible
- Contact technical support if the issue persists

### Settings Not Saving
- Verify you have **admin role** (check **Sécurité** page)
- Ensure you confirmed the change in the dialog
- Check for error messages and retry

## Best Practices

1. **Regular Monitoring**: 
   - Check the Dashboard and myGO credit balance daily
   - Use the actionable bookings filter to quickly identify issues
   - Keep credit above 1000 units to avoid interruptions

2. **Credit Management**:
   - Recharge when credit reaches the "Low" threshold
   - **Never** let credit reach critical levels (below 500)
   - Monitor the real-time credit indicator on Dashboard

3. **Handling Actionable Bookings**:
   - Check the "Actionable" filter regularly (multiple times per day)
   - Prioritize wallet_insufficient bookings - these need immediate attention
   - OnRequest bookings usually resolve automatically but monitor for delays

4. **Policy Changes**: 
   - Only change the checkout policy during low-traffic periods
   - Consider impact on wallet credit when using ON_HOLD_PREAUTH policy

5. **Booking Cancellations**: 
   - Always confirm with the guest before cancelling
   - Document reason for cancellation
   - For wallet_insufficient, try to resolve by recharging first

6. **Status Verification**: 
   - Use the refresh button when in doubt about booking status
   - Refresh before making important decisions
   - Check both myGO state and payment status

7. **Security**: 
   - Review your access on the **Sécurité** page regularly
   - Verify your role matches your responsibilities
   - Log out when not actively using the system

8. **Documentation**: 
   - Keep this guide updated with operational changes
   - Note any patterns in actionable bookings for process improvement

9. **Communication**:
   - Keep guests informed about OnRequest status
   - Proactively contact guests if wallet_insufficient occurs
   - Use WhatsApp integration for quick communication

## Support

For technical issues or questions:
- Check the **Sécurité** page for environment and version info
- Review error messages carefully
- Contact the development team with specific error details and timestamps
