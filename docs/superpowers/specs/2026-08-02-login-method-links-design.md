# Login method links (password modes)

## Goal

Make alternate sign-in paths easy to find on the password login card without changing auth behavior.

- Default `/login`: email + password
- Phone + password: `/login?mode=password&phone=1`
- SMS / email OTP: `/login?mode=sms` (unchanged)

Surfaces “Use phone number” and “Sign in with SMS / email code” at the **top** of the password card (below Google), instead of burying the SMS link under the form.

## UX

### Default email + password (`/login`)

1. Alerts (existing)
2. Google button + divider (existing)
3. **Method link row** (new): “Use phone number” · “Sign in with SMS / email code”
4. Email + password form
5. Card footer: signup / support only — **no** duplicate SMS link

### Phone + password (`/login?mode=password&phone=1`)

Same structure; method row is “Use email” · “Sign in with SMS / email code”, then phone + password form.

### SMS mode (`/login?mode=sms`)

Unchanged (Phone | Email OTP tabs). Existing “← Sign in with email & password” footer link stays.

## Components

| File | Change |
|------|--------|
| `components/auth/login-method-links.tsx` | New shared top link row; props for current mode (`email` \| `phone`) and optional `returnTo` |
| `app/(auth)/login/page.tsx` | Render `LoginMethodLinks` on email- and phone-password modes; remove redundant SMS link from password-mode footer |
| `components/auth/login-password-form.tsx` | Remove bottom “Signed up with a code? … SMS / email code” |
| `components/auth/login-phone-password-form.tsx` | Remove bottom “← Sign in with email instead” |

Preserve `returnTo` (and other query params as needed) on method links.

## Out of scope

- Auth actions / password verification
- OTP send/verify flow
- Signup page
- Google auth
- New tabs or segmented controls for password modes

## Testing

Manual: open `/login`, confirm both top links work and form still signs in; open phone-password mode, confirm “Use email” and SMS links; confirm SMS mode still works; confirm no duplicate SMS CTA on password modes.
