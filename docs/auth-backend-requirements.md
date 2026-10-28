# RideGuard backend requirements — current

Updated 28 October 2026. MPIN recovery uses **six-digit email codes**, not links.
Registration email verification and Forgot Password keep their existing Firebase
email-link flows. This checklist excludes the already-reported login outage.

## 1. Configure the existing MPIN email sender

- Replace `MissingMpinEmailSender` in `MpinModule` with a working implementation
  of `MpinEmailSender.sendCode(to, code, purpose)`.
- Send to the authenticated account's registered, verified email.
- Support both `change` and `recovery` purposes. Never email/log the MPIN.
- Return delivery success only after the provider accepts the message; preserve
  a clear sanitized failure if delivery cannot be requested.
- The frontend now calls the existing code routes and handles unavailable delivery.
  No new link endpoints are needed for MPIN.

## 2. Harden the existing recovery and change-code flows

- Keep short-lived, account-bound, purpose-bound challenges and hashed codes.
- Rate-limit initial sends, resends and guesses per account as well as abuse/IP limits.
- Return stable error codes, `retryAt`, `expiresAt`, `resendAt` and `serverTime` in
  Unix milliseconds. Distinguish throttling from exhausted guesses on one code.
- Consume verified challenges and grants atomically. Prevent replay, wrong-account
  use, stale code use and concurrent reset/change races.
- Invalidate replaced codes and previous unlock authorizations after PIN replacement.
- Reject reuse of the existing PIN. Keep failed-attempt counters transactional.
- A valid email recovery authorization must allow reset despite the old PIN lockout.
- Avoid invalidating a usable old code before a replacement email has been accepted,
  or document the failure state clearly so the app can request a new challenge.

## 3. Enforce app unlock on sensitive endpoints

- Issue expiring account-and-device/session-bound unlock grants after MPIN verification.
- Enforce these on protected data and realtime/media-token endpoints independently
  of frontend navigation. Explicitly scope setup, recovery and emergency exceptions.
- Revoke grants after logout, PIN change/reset and device revocation.
- Scope unlock expiry per installation/session; today's account-wide timestamp is
  insufficient for multiple-device isolation.

## 4. Persist onboarding progress by UID

- Save the current step and completion state on the server.
- Return the correct state after reinstall, account switch or sign-in on another phone.
- Require configured MPIN before accepting onboarding completion.
- Make profile completion idempotent/reconcilable after a lost response.
- Do not equate profile existence with completion of every onboarding step.

## 5. Define the inactivity policy

- Return the background inactivity interval and authorization expiry policy.
- Enforce session expiry on the backend and document how foreground/background
  context affects it. The current frontend locks immediately on background.

## 6. Add secure phone-authentication contracts

- Enrollment under recent MPIN authorization, device public-key registration,
  fresh challenge issuance, signature verification and device/key revocation.
- Verify proofs from Android Keystore keys; do not trust a biometric success Boolean.
- Issue the same server unlock authorization used by MPIN and preserve MPIN fallback.

## 7. Improve authentication recovery responses

- After correct credential verification, return a structured verification-required
  response for an unverified account so the app can offer resend.
- Keep wrong-credential responses generic; do not expose account status beforehand.
- Check revoked/disabled Firebase credentials for protected endpoints.

## Hardware release for another account

The hardware Disconnect button now requests **unpairing**, not a temporary offline
state. Add the explicit `/devices/release` contract and ownership-isolated alert/media
handling described in [hardware unpairing requirements](HARDWARE_UNPAIR_BACKEND.md).
The existing `/devices/disconnect` does not clear ownership and is insufficient.
This is a backend dependency; the app cannot complete cross-account transfer yet.

## Existing MPIN routes connected in the app

The base URL already contains `/v1`. All requests below use a Firebase Bearer token.

| Operation | Route | JSON body |
|---|---|---|
| Current PIN proof | POST `/mpin/change/authorize` | `{ pin }` |
| Send change code | POST `/mpin/change/code` | `{ authorization }` |
| Resend change code | POST `/mpin/change/code/resend` | `{ challengeId }` |
| Verify change code | POST `/mpin/change/code/verify` | `{ challengeId, code }` |
| Save new PIN | POST `/mpin/change` | `{ authorization, pin }` |
| Send recovery code | POST `/mpin/recovery/code` | No body |
| Resend recovery code | POST `/mpin/recovery/code/resend` | `{ challengeId }` |
| Verify recovery code | POST `/mpin/recovery/code/verify` | `{ challengeId, code }` |
| Save reset PIN | POST `/mpin/recovery/reset` | `{ authorization, pin }` |

Send responses must supply a real challenge ID, masked destination, expiry and
resend deadline. Verification returns a short-lived authorization token; only that
server authorization allows New/Confirm. The app does not collect an arbitrary
recovery email, invent a challenge or mark a PIN reset successful locally.

An optional tested backend patch adds `/mpin/change/direct` for Current PIN → New
PIN without email codes. The app uses it only when backend status explicitly returns
`directChangeEnabled: true`. Until then, Change MPIN uses the existing code flow.
The patch also hardens setup, attempts, grants, PIN reuse and revocation checks.
See [the backend patch](patches/rideguard-node-auth-mpin.patch).

## QA before enabling delivery in production

Test accepted and failed mail delivery, wrong/expired/replaced codes, cooldown,
exhausted attempts, wrong account/purpose, replay, concurrent requests, a locked
old PIN followed by successful recovery, network loss during resend/save, and
reinstallation/multiple devices. Real email delivery is still unverified until
an actual sender is configured and tested.
