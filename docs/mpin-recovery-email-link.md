# Forgot MPIN recovery by email link

## Decision and scope

When a user **forgets their MPIN**, RideGuard sends a single-use verification
link to the email address on that account. After opening the link, the user
creates and confirms a new MPIN. They do **not** need the forgotten MPIN or a
six-digit recovery code. Opening a link alone never changes the MPIN.

This changes **Forgot MPIN / recovery** only. Ordinary **Change MPIN** (the
user knows their current MPIN) is a separate flow. Registration verification
and password reset retain their own Firebase email links.

The backend currently offers six-digit recovery codes with an unconfigured email
sender. This document defines the requested replacement; it is **not live yet**.
MPIN setup and unlock are enabled independently. Keep email-link recovery disabled
until its backend contract, sender, link handling, and device tests work.

## User flow

1. The user selects **Forgot MPIN?** from unlock or Settings.
2. The app requests a recovery link. This requires Firebase authentication,
   but must work while MPIN-locked and must not require the old PIN.
3. The backend sends a link to the account's registered, verified email. It
   returns a masked destination, expiry, and resend time. The app cannot
   choose or change the destination.
4. The app shows **Check your email**, the registered email, centered status,
   an inline resend action with the server cooldown, and Back. There is no OTP
   input, **Open Email**, or manual verification action.
5. The user opens the link. The app requires sign-in to the **same account**
   before redeeming it. On another device, the user signs in there first.
6. Redemption returns a short-lived, single-use MPIN-reset authorization.
   The app asks for **New MPIN** and **Confirm MPIN**.
7. The app submits the authorization and new PIN to the existing
   `POST /v1/mpin/recovery/reset` route. Only confirmed server success shows
   the success screen. The backend clears the old lockout and unlock state.

## Proposed backend contract

Use the existing response envelope and Unix millisecond timestamps. All
routes require a Firebase bearer token; none requires a current MPIN.

| Route | Request | Success data |
| --- | --- | --- |
| `POST /v1/mpin/recovery/link` (new) | No body | `{ "requestId": "...", "maskedDestination": "j***@gmail.com", "expiresAt": 0, "resendAt": 0 }` |
| `POST /v1/mpin/recovery/link/resend` (new) | `{ "requestId": "..." }` | New request ID, masked destination, expiry, and resend time |
| `POST /v1/mpin/recovery/link/redeem` (new) | `{ "token": "<opaque-link-token>" }` | `{ "authorization": "<reset-grant>", "expiresAt": 0 }` |
| `POST /v1/mpin/recovery/reset` (existing) | `{ "authorization": "<reset-grant>", "pin": "4321" }` | Confirmed success |

The backend can choose final route names. Publish exact paths, schemas, error
codes, and app-link format before frontend integration. The app must not infer
states by parsing error-message text.

## Security requirements

- Generate a cryptographically random, opaque link token and store only its
  hash. Bind it to the Firebase UID, `mpin-recovery` purpose, request ID,
  and expiry. It cannot authorize any other operation.
- Make links short-lived (proposed: 10 minutes) and single-use. Resending
  invalidates previous links. Reject expired, used, replaced, or wrong-account
  links without issuing a reset grant.
- **Do not consume a link on HTTP GET:** email scanners may open URLs. A
  landing page can open the app; redemption must be an authenticated POST
  after the user acts.
- Support an HTTPS app/universal link and an app-open fallback. Do not put a
  PIN or grant in the URL. Keep the link token out of analytics, logs,
  referrers, crash reports, and persistent app storage.
- Rate-limit sends and resends, enforce `resendAt`, and prevent duplicate
  sends on repeated taps. A failed email send must not show “Link sent.”
- Validate the new four-digit PIN on the server. Consume the reset grant
  atomically, reject replay, and clear prior lockouts and unlock sessions.

## Acceptance checks

- A Firebase-authenticated owner can request recovery while MPIN-locked,
  without entering the old PIN. Missing or unverified email gives a clear
  error. No email is sent to a client-supplied address.
- Only the newest link works, once, for the same account. A link opened on
  another device works after sign-in to that account.
- Expired and lost links offer **Resend Link** or **Start again**. Provider
  and network failures leave the current PIN unchanged.
- Closing and reopening the app can resume through the email link. The reset
  authorization expires and cannot be reused or used for Change MPIN.
- After success, the new PIN unlocks the app. The old PIN and old unlock
  sessions no longer work. The recovery UI has no six-digit OTP field.

## Migration and ownership

**Backend:** connect a real email sender and implement the link endpoints.
Test delivery, cooldown, expiry, scanner visits, replay, wrong account,
locked MPIN, and cross-device opening. Retire the existing
`/v1/mpin/recovery/code`, `/code/resend`, and `/code/verify` routes after
the app migrates. Existing in-flight codes can expire or be invalidated
with a restart message.

**Frontend:** replace `requestRecovery`, `resendRecovery`, and
`verifyRecovery` in `src/modules/mpin/services/mpin.api.ts` with link
request, resend, and redeem operations. Replace the recovery OTP step in
`src/modules/mpin/screens/mpin-flow-screen.tsx` with email-link waiting
and redemption states. Leave ordinary Change MPIN separate. Verify the
full flow on physical Android and iOS devices before enabling MPIN.
