# Password recovery completion

Implemented on the existing `feat/splash-login` branch. Recovery remains email-only,
as in the existing UI; there was no phone recovery API integration in this checkout.

## Screens and shared design

- `src/modules/auth/screens/new-password-screen.tsx`: compact recovery layout matching
  Find Your Account, masked password/confirmation fields, validation and loading feedback.
- `src/modules/auth/screens/password-reset-success-screen.tsx`: quiet animated
  checkmark and explicit Back to Login action, without a countdown or automatic login.
- Route files: `src/app/(public)/new-password.tsx` and
  `src/app/(public)/password-reset-success.tsx`.
- Shared additions exported by `src/shared/ui/index.ts`: `AuthFormLayout`,
  `FormFeedback`, and `SuccessIndicator`. Existing `Button`, `CustomTextInput`,
  `BackArrowIcon`, theme spacing and typography are reused. Find Your Account and
  Create New Password share the same recovery layout: no logo, a 20px heading,
  24px below the back arrow and 32px before the form.
- Shared input disabled state prevents visibility toggling while a field is disabled.
  Focus borders transition gently and field errors fade in, respecting reduced motion.
- Password requirements are extracted from Create Account into
  `src/modules/auth/utils/password-validation.ts` with unchanged rules: at least
  eight characters, a letter and a number. No backend password policy was available
  in the existing integration; confirm these rules against the eventual API contract.

## Navigation and credentials

Verification must return a nonempty reset token with an actual future expiry before
the new password form can be used. `password-recovery.store.ts` keeps this session
in memory only, never in URLs or persisted storage. Returning to the OTP screen
preserves a still-valid verification and offers Continue. Restarting recovery clears
the session. Invalid/expired sessions disable submission and offer a new code.

An explicit successful password update clears fields and the reset token, then
resets the navigation stack to Welcome → Success. Back to Login and Android back
open Login with Welcome behind it. Direct access to Success without completion
redirects to Login. Native slide transitions and the checkmark/error entrance
animations respect reduced motion.

## Backend work still required

`src/modules/auth/services/password-recovery.ts` currently fails explicitly with
`RecoveryError("unavailable", ...)`. It does not send email, verify codes, or update
passwords. No new endpoint paths have been guessed and no responses are simulated.

Connect these service functions to the real API, using the existing API client's
response envelope/error handling once endpoint paths and contracts are supplied:

1. `requestResetCode(email)` / `resendResetCode(email)` → `expiresAt`, `resendAt`
   (Unix milliseconds, based on the actual server response).
2. `verifyResetCode(email, code)` → `resetToken`, `expiresAt` (the reset token's
   own expiry, distinct from the OTP expiry).
3. `changeResetPassword(resetToken, newPassword)` → `{ success: true }` only after
   the server confirms that the password was updated. Map invalid/expired sessions,
   network errors and rejected requests to the existing `RecoveryError` codes.

The backend must enforce token validity, one-time consumption, password policy and
expiry. Until connected, the real flow stops at code delivery; the existing
development-only OTP preview cannot verify a real code or complete a password change.
Google sign-in and the testing login are preserved.

### Development UI preview

In a development build, send a code from Forgot Password, then tap the existing
"Preview code screen (no code was sent)" action shown when delivery is unavailable.
Enter `123456` and confirm to open the new password form in explicit preview mode.
This creates no verified session or reset token and never calls the update endpoint.
You can test password visibility and validation; submitting valid fields explains
that no password was changed. This preview is disabled in release builds.

## Verification

- `node --test scripts/test-password-recovery.cjs`: password validation, session
  expiry/malformed responses, token clearing, error messages and explicit failure
  of unconnected recovery services. Test session fixtures never ship in the app.
- `npx tsc --noEmit` and `git diff --check`.
- Still requires device QA of keyboard/small-screen layouts, slide transitions,
  screen reader output and reduced motion. Successful/failed real API requests,
  incorrect OTPs and login with a changed password need the backend integration.
