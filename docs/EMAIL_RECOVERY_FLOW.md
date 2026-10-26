# Email-link recovery screens

Registration, Forgot Password, and Forgot MPIN reuse the same centered email-link
content. The email remains blue with regular weight. Resend uses the existing top
notification, loading state, and a 60-second cooldown. Registration keeps its existing
verification checks; password reset never treats email verification as password-reset
authorization.

## Forgot Password

1. Enter email and request the existing `/auth/forgot-password` endpoint.
2. Show Check Your Email with the registered/requested email and centered guidance.
   Keep the backend's generic response so the screen does not reveal whether the
   address has an account.
3. When a password-reset link opens RideGuard, `+native-intent.tsx` extracts its
   `mode=resetPassword` and `oobCode` without forwarding the code in navigation.
4. Firebase `verifyPasswordResetCode` validates the code and resolves the email.
   If the app has a pending requested email, it must match.
5. Only a verified link opens the existing New Password and Confirm Password fields.
6. Saving revalidates the action code and calls `confirmPasswordReset`.
7. Confirmed success opens Password Changed, followed by Login.

Action codes stay in memory. They are not logged or persisted. Firebase does not
return an expiry timestamp for these codes, so the app does not invent one; Firebase
checks expiry again before saving. Expired, used, wrong-account, and malformed links
cannot authorize a password change.

## Required Firebase email-link configuration

Firebase's default email handler opens a hosted web password-reset form. It does
not automatically redirect to RideGuard's new-password fields. To use the in-app
form, configure an owned HTTPS email action handler / verified app link that opens
the app with the original, unconsumed reset action code:

```text
rideguard://auth-action?mode=resetPassword&oobCode=<firebase-action-code>
```

The app's existing `rideguard` scheme can handle that URL. The production HTTPS
handler and Firebase email-template configuration are external deployment work;
they have not been changed by this frontend update. Do not consume the reset code
in the web handler before handing it to the app. Ignore arbitrary `continueUrl`
destinations and never send the code to third-party URLs or logs.

Reference: [Firebase custom email action handlers](https://firebase.google.com/docs/auth/custom-email-handler).

## Forgot MPIN

The screen uses the same email-check layout and identifies the signed-in account's
email. The intended flow is email link → backend validation → account-bound,
single-use reset authorization → existing Create New MPIN → Confirm New MPIN →
`POST /mpin/recovery/reset` → explicit unlock with the new MPIN.

The current backend has OTP endpoints and an unconfigured email sender. It has no
request-link or verify-link contract. Therefore the screen clearly reports recovery
links unavailable and disables sending; it never claims an email was sent. New MPIN
entry remains guarded by real reset authorization. A Firebase registration or
password-reset link is never accepted as an MPIN reset grant.

See [the MPIN link requirements](mpin-recovery-email-link.md) for the backend work.
