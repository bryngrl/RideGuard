# Authentication and MPIN backend checklist

This lists missing integrations found in this frontend checkout. Existing Google
Firebase sign-in, `/auth/me`, `/auth/is-old-user` and personal-info onboarding are
excluded. Confirm their server implementations in the backend repository before
changing them. The frontend MPIN adapter now calls the backend's `/v1/mpin` routes,
but its gate remains disabled until recovery email delivery and device testing work.
The MPIN rows below remain a checklist for backend behavior and deployment.
The active password reset flow uses `/auth/forgot-password` and a Firebase email
link. Legacy six-digit reset-code screens remain unavailable because the backend
does not provide reset-code endpoints.

The backend's `MpinModule` currently registers `MissingMpinEmailSender`, so MPIN
change codes and recovery links cannot be delivered until a real sender is wired.
Its status response also returns `emergencyAccessAllowed: false`; locked accounts
cannot use the app's emergency route until the backend explicitly grants that access.

| Feature | Backend requirement |
| --- | --- |
| Create account | Accept username, email and password; validate fields, reject duplicates, create an account compatible with the existing Firebase identity, and return field-specific errors. Never accept password confirmation as a substitute for server validation. |
| Username/password login | Authenticate credentials and establish Firebase authentication compatible with existing ID-token API requests. Return incorrect-credentials, disabled-account and rate-limit errors. |
| Password reset | Keep the existing `/auth/forgot-password` Firebase email-link flow, with rate limits, neutral responses for unknown accounts, and clear delivery failures. There is no password-reset OTP contract. |
| MPIN status | Return configured/unlock status, remaining attempts, lockout expiry, unlock expiry, server time and narrowly scoped emergency permissions for the signed-in account. |
| Set up MPIN | Save a four-digit MPIN securely for an authenticated eligible account; reject duplicate setup and confirm durable success. |
| Unlock with MPIN | Verify the MPIN, enforce attempt limits/lockout, and establish any server-side unlock authorization needed by protected APIs. Support authoritative status checks on launch, background return and unlock expiry. A brief interruption keeps access when authorization remains valid; the server chooses the inactivity threshold. |
| Change MPIN (current PIN known) | Keep this separate from forgotten-MPIN recovery. The existing change-code flow remains the current implementation until a separate decision changes it. |
| Forgot MPIN by email link | Send a single-use link to the authenticated account's registered email without requiring the old PIN. Redeem it for a reset-only grant. See [the recovery link contract](mpin-recovery-email-link.md), which replaces recovery OTP. |
| Reset MPIN | Validate the recovery authorization, save the new MPIN, consume the grant and confirm success. |

## Integration contracts

- Provide endpoint paths, request/response schemas and stable error codes for each
  operation. The server chooses expiry, cooldown and lockout policy; timestamps in
  the current MPIN adapter are Unix milliseconds.
- Bind challenges and grants to account, purpose and expiry; consume them atomically
  and prevent replay. Rate-limit sends, verification, password login and MPIN attempts.
- Validate Firebase ID tokens for authenticated requests. Store passwords/PINs with
  appropriate server-side protection; never return or log credentials, codes or grants.
- Document password and MPIN policies, session/unlock scope, and what happens to
  existing sessions after password or MPIN reset. Enforce sensitive API access on
  the server independently of client navigation.
- Legacy password-reset code screens are not part of the active Firebase link
  flow. Do not add code endpoints solely to support those old screens.

See `src/modules/mpin/services/mpin.api.ts` and
`src/modules/auth/services/password-recovery.ts` for current adapter contracts.

The status adapter sends optional `reason` (launch/resume/expiry) and observed
`inactiveForMs`. Confirm the server's unlock session binding before relying on MPIN
for server-side access control. Emergency access needs explicit `emergencyAccessAllowed`
and, for alert details, `emergencyAlertIds`; do not authorize unrelated protected APIs.
