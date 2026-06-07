# ALERTO CALBAYOG Admin Management Guide

## Access

Admins sign in through the web app and open the Admin Console. Admin accounts have platform-wide access to incidents, users, responder assignments, notifications, audit logs, and system settings.

## Managing Incidents

1. Open **Incidents**.
2. Search by incident ID, reporter, type, assigned responder, or location.
3. Filter by status or agency.
4. Change the inline status dropdown to move the workflow through:
   - Pending
   - Verified
   - Active
   - Resolved
   - Closed
5. Assign an available responder from the responder dropdown.
6. Use **Export CSV** to download the filtered incident history.

Status changes are saved to the database immediately, logged in the incident audit trail, sent to agency/admin dashboards through Socket.IO, and sent to the resident mobile app as a notification when applicable.

## Managing Users

1. Open **Users**.
2. Use the Add User form to create residents, responders, staff, or admins.
3. Assign an agency for responders and staff: BFP, CDRRMO, or PNP.
4. Use **Edit** to update user details or reset a password.
5. Use **Remove** to delete an account. Admins cannot delete their own active account.

## Permission Levels

- **Admin:** Full platform access and responder assignment.
- **Staff:** Can update incidents routed to their agency.
- **Responder:** Can update assigned incidents. If an incident has not yet been assigned, routed agency responders can update it.
- **Resident:** Can submit, view, and delete their own mobile reports, but cannot update incident status.

## Notifications

Resident notifications are automatic:

- Verified: Rescue is on the way.
- Active/Responding: Rescue units are en route.
- Resolved/Responded: The incident has been resolved.
- Assigned responder: A responder has been assigned.

The **Notifications** page shows live notifications captured during the current admin session.

## Audit Trail

The **Audit Trail** page lists status changes and responder assignments from each incident's action log, including actor, role, message, and timestamp.

## Testing Checklist

1. Submit a mobile report.
2. Confirm it appears in the Admin Console and routed agency dashboard without reload.
3. Assign a responder.
4. Change status from Pending to Verified, then Active, then Resolved.
5. Confirm the resident mobile app receives notifications and history/tracking status updates.
6. Confirm a resident cannot call status update APIs.
7. Confirm an unrelated responder cannot update an incident assigned to another responder.
8. Export CSV from the Incidents page and verify the filtered rows.
