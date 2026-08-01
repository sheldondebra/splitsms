# Password Reset Security Design

## Goal

Prevent a user from resetting their password to their current password, and notify the user by email after a successful password change.

## Behavior

- The server loads the user identified by the verified password-reset session.
- It compares the proposed password with the current bcrypt hash before creating a new hash.
- If they match, the password is not changed, the reset session remains valid, and the reset form shows: “Your new password must be different from your current password.”
- If they differ, the existing update flow clears failed-login state, invalidates the reset session, and records the reset event.
- After the database update, SplitSMS sends a clean transactional security email to the account email address when one exists.
- A notification delivery failure is logged but does not reverse or report failure for an already completed password change.

## Components

- `lib/actions/auth.ts`: enforce the reuse check and trigger the notification.
- `components/auth/auth-alert.tsx`: add the specific password-reuse error.
- `lib/email/templates.ts`: add the successful password-change email template.
- A small password-policy helper will keep the bcrypt comparison independently testable.

## Security and Error Handling

- Enforcement is server-side; browser validation is not trusted.
- Only the current password is rejected. No password-history storage is introduced.
- The notification never contains the password or reset code.
- Existing reset-session and password-strength requirements remain unchanged.

## Tests

- A proposed password matching the current bcrypt hash is rejected.
- A different proposed password is accepted by the policy helper.
- The security email contains the expected subject, account-security wording, and no password value.
- Type checking and the production build must pass.
