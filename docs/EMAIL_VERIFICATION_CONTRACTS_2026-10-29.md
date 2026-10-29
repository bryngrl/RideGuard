# Email verification contracts — 29 October 2026

Inspected remote backend `staging` at `a765469` and frontend request callers.
Development remains `5d07f87`. The backend update did not convert every email
verification operation to a six-digit code.

| Operation | Backend implementation | Connected app behavior |
|---|---|---|
| Registration verification | Backend creates Firebase account; `/auth/register/verify` requires a Firebase identity whose actual email is verified. | Firebase `sendEmailVerification()` sends a **link**. Check Your Email reloads verification status before continuing. No registration OTP. |
| Forgot Password | `/auth/forgot-password` calls Firebase `accounts:sendOobCode` with `requestType: PASSWORD_RESET`. | **Link**. App validates the Firebase action code, opens New Password, and calls `confirmPasswordReset`. The action code inside the URL is not a six-digit email OTP. |
| Change MPIN | `/mpin/change/authorize`, `/change/code`, `/change/code/verify`, `/change`. | Current MPIN → **six-digit email code** → New MPIN → Confirm → success screen. Resend uses `/change/code/resend`. |
| Forgot MPIN | `/mpin/recovery/code`, `/recovery/code/verify`, `/recovery/reset`. | Registered account's **six-digit email code** → New MPIN → Confirm → success screen. Resend uses `/recovery/code/resend`. |
| MPIN email-link alternatives | `/mpin/change/email-link`, `/recovery/email-link`, `/email-link/verify-and-change` also exist. | Not selected: the app preserves the agreed code flow using equally current backend code routes. Adding link endpoints did not remove those routes. |
| Forgot registered email | No corresponding recovery route in the inspected backend. | No fabricated email-recovery flow. Login already accepts a username or email. |
| Change registered email | No corresponding account-email update/verification route in the inspected backend. | Account email remains read-only. Profile editing is not Firebase email-identity editing. |

## Relevant source

- Backend: `src/modules/auth/auth.service.ts`, `auth.controller.ts`,
  `src/modules/mpin/mpin.controller.ts`, `mpin.service.ts`,
  `mpin-nodemailer.sender.ts`.
- Frontend: `src/modules/auth/services/verification-email.ts`, `auth.api.ts`,
  `password-recovery.ts`, `password-reset-link.ts`,
  `src/modules/mpin/services/mpin.api.ts`, `screens/mpin-flow-screen.tsx`.

Legacy password OTP helper functions fail explicitly and are not the active
Forgot Password flow. No endpoint was guessed and no real recovery email was
requested during this source audit. Inbox receipt and link routing on a physical
device still require end-to-end verification.
