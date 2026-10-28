# MPIN frontend — feat/mpin

> Updated decision, 28 October 2026: MPIN email-code routes are now connected in
> the existing screens. The backend still needs a real mail sender. The older
> email-link plan below is superseded by [the current flow](MPIN_USER_FLOW.md).

> **Current integration (2026-10-25):** Setup and unlock are now connected and enabled.
> Cold launch and background return require MPIN for the signed-in account.
> Email-link change/recovery remain unavailable because the current backend only
> implements OTP routes with a missing email sender. See [the current user flow
> and endpoint audit](MPIN_USER_FLOW.md). The sections below retain earlier design
> and rollout notes and describe the previous disabled state.

> This document records the current code-based MPIN flows. The planned
> [Forgot MPIN email-link recovery](mpin-recovery-email-link.md) replaces only
> the recovery OTP flow; the app and backend have not migrated to it yet.

## Scope and current security status

This branch adds the 4-digit MPIN UI using existing Firebase authentication,
Zustand state, shared design tokens, back arrows, buttons, feedback, success icon,
Reanimated motion and Settings rows. No dependencies or backend endpoints were added.

There was no MPIN integration in this checkout. `mpinApi.enabled` is deliberately
false until the adapter in `src/modules/mpin/services/mpin.api.ts` is implemented.
Every adapter operation currently rejects with `MpinError("unavailable")`.
Existing login, Google sign-in, onboarding, password recovery and emergency behavior
continue to work; an unfinished MPIN service does not lock everyone out.
**The account is not protected by MPIN until the real backend is integrated.**

## Screens and testing the designs

Settings → Account security → Change MPIN opens `/mpin/manage`.

The authenticated `/mpin/[step]` route provides:

- `status`: fetch setup/unlock policy; retry when unavailable.
- `intro`: first-time setup introduction.
- `create`: create a 4-digit MPIN (setup, change or reset mode).
- `confirm`: matching confirmation; mismatches clear only the confirmation.
- `success`: created/changed/reset copy, gated by actual server confirmation.
- `login`: plain MPIN welcome screen, lock icon, assembled logo and outlined
  nine-dot MPIN Login card. Tapping the card reveals the PIN entry stage.
- `unlock`: directly open the same experience at its keypad stage.
- `current`: verify current MPIN and request a code at the account's registered email.
- `forgot`: request identity verification for the signed-in account.
- `verify-identity`: registered-email challenge, masked code entry, expiry and resend.
- `manage`: status and Settings action, plus development-only design previews.

In a development build, the manage screen offers clearly labelled previews for
setup, unlocking, recovery, replacement PIN forms, and success layouts. Users may
choose any four digits to test entry and confirmation. Matching preview entries
never save a PIN; preview verification never unlocks an account. Success layout
previews are explicitly labelled and do not grant access. There is no default PIN,
test authentication token, or fake successful backend response.

## Shared design and interactions

`src/shared/ui/pin-pad.tsx` adds a reusable numeric keypad and masked indicators:
large touch targets, backspace, entry animation, brief error shake, disabled states
and accessible digit-count announcements. The actual PIN is not rendered as text,
announced, persisted or logged. Email codes use the shared `VerificationCodeInput`, also used by Forgot Password, with native numeric entry and a Verify action.
The screen layout uses navy/white theme tokens, 20px headings, 15px action labels,
safe areas, a scrolling layout for small screens, an existing shield icon and the
shared animated success indicator. Motion respects reduced-motion preferences.

The login/keypad experience matches the two-screen reference with a plain surface
and no rings or gradient. `BrandLockup` shares the exact final splash logo dimensions;
the logo glides from its centered splash position into the plain login layout,
then remains mounted while the login card fades out and the existing keypad
appears, with an 8px upward glide and no scaling. Its layout scrolls on small screens.
Use Settings → Change MPIN → Preview MPIN Login screens to inspect both stages.
All PIN entry screens now share `PinLayout` theme values: 44px-wide PIN boxes, a
centered 280px keypad, 58px key touch targets and 8px row gaps. The larger gap before
the keypad adapts to available height. Forgot MPIN, resend and restart actions sit
16px below the keypad. This applies to setup, confirmation, current MPIN, unlock,
and replacement MPIN. Email verification uses the shared six-code-box component.

## Authentication and navigation

When `mpinApi.enabled` is true, `MpinAppGate` protects normal `(app)` routes,
including deep links. It waits for existing full authentication, then routes:

1. Unknown MPIN status → status check.
2. No configured MPIN → introduction → create → confirm → confirmed save → success.
3. Configured MPIN with server-required unlock, lockout or expired unlock authorization → login card → keypad →
   confirmed verification → Home or
   an allowlisted requested app path.
4. Server confirms current unlock remains valid → existing destination, including brief app switches.

Existing onboarding completes before the MPIN gate is reached. The completion
screen marks its finished onboarding state before opening the guarded Home route.
An MPIN cannot authenticate a logged-out user or a new device. Demo login remains
a UI testing session and does not invoke real MPIN security.

Setup and locked gates have no ordinary back escape. Native swipe gestures are
disabled in the MPIN stack; hardware back is blocked for mandatory gates and
pending requests. Successful saves replace the recovery history with a clean success
stack. Changes finish at Settings; setup/reset finish at Home. Route parameters
contain only step/mode/preview flags, never a PIN, reset grant or recovery challenge.

## State, interruption and emergency handling

`mpin.store.ts` is memory-only and bound to the authenticated user. It stores only
the temporary draft, server-issued authorization/challenge, server status and
session unlock state. Logout/account switching clears all state; changing owners
invalidates in-flight results. A cold launch rechecks the backend policy.

Leaving confirmation, leaving the MPIN flow, or backgrounding the app clears
sensitive drafts and grants. Interrupted confirmation requires restarting entry;
expired grants require identity verification again. `useMpinRequest` prevents
parallel submissions, aborts on blur/background, ignores old-user responses and
reports network/20-second request timeouts. This timeout is not a security cooldown.

The updated policy checks server status on launch, genuine background return and
server-provided unlock expiry. A brief switch does not force entry when the server
confirms a valid unlock. Status requests can carry launch/resume/expiry context and
observed background duration; the backend chooses the inactivity threshold. No
client timeout is invented. Normal app content is hidden during a recheck. Failed
checks require an explicit retry; cached local flags cannot authorize access.

A PIN save/reset does not itself establish an unlock. Continue rechecks server
status before normal app access. Server time, when supplied, normalizes expiry,
lockout and resend deadlines once on response receipt to accommodate clock skew.

Existing SOS and alert processing are unchanged. With MPIN enabled, exceptions
require explicit server emergency permission. Alert details additionally require
the specific alert ID in the server allowlist, because those screens expose media.
Unrelated screens remain guarded. Missing/failed policy checks fail closed; backend
emergency policy and actual active-emergency state integration are rollout blockers.
No unverified assertion is made that the existing SOS UI is backend-complete.

An authenticated background privacy cover hides the React view on inactive and
background states. This is best effort: native app-switcher snapshot timing still
requires device QA and may need native privacy support before production rollout.

## Backend adapter still required

Provide confirmed API routes, response schemas, error mappings and policies for:

| Operation | Required result |
| --- | --- |
| `status(authToken, signal, context?)` | `configured`, `requiresUnlock`; optional `unlockExpiresAt`, `locked`, `lockedUntil`, `remainingAttempts`, `serverTime`, `emergencyAccessAllowed`, `emergencyAlertIds` |
| `create(authToken, pin)` | `{ success: true }` only after durable creation |
| `unlock(authToken, pin)` | `{ success: true }` only after actual server verification |
| `authorizeChange(authToken, currentPin)` | A scoped, short-lived `token` and `expiresAt` |
| `requestChangeCode(authToken, currentPinProof)` | Email challenge: `challengeId`, `maskedDestination`, `expiresAt`, `resendAt` |
| `resendChangeCode(authToken, challengeId)` | Replacement change challenge, invalidate previous code and return updated times |
| `verifyChangeCode(authToken, challengeId, code)` | Short-lived, single-use change authorization after email verification |
| `change(authToken, authorization, pin)` | `{ success: true }` after validated change |
| `requestRecovery(authToken)` | `challengeId`, masked registered destination, `expiresAt`, `resendAt` |
| `resendRecovery(authToken, challengeId)` | Replacement challenge and updated times |
| `verifyRecovery(authToken, challengeId, code)` | A scoped reset `token` and `expiresAt` |
| `reset(authToken, authorization, pin)` | `{ success: true }` after validated reset |

Change MPIN requires current PIN → registered-email code → new PIN → confirmation.
Current-PIN proof only permits requesting the email challenge; it must never be
accepted by `change`. Only successful email verification issues the final change
grant. Change and recovery challenges/grants are purpose-bound and cannot be
exchanged. The backend chooses the account email; no email is entered in this flow.
The code screen reuses the shared email-code input, error fill, resend cooldown and expiry
handling. Settings previews include "Preview change MPIN email code"; no email is
sent and no authorization is fabricated in previews.

All timestamps are Unix milliseconds from the server. Lockout delays and attempts
must come from the backend; the UI does not invent account-level rate limiting.
The backend must enforce full authentication, PIN verification/storage policy,
setup conflicts, recovery identity proof, scope, expiry, one-time authorization use,
rate limits and lockout. Unlocked app access or an email address alone must not
authorize reset. Password-reset previews never issue an MPIN authorization.

Use authenticated HTTPS and the project's request conventions, but do not log
PINs, credentials or raw error payloads containing sensitive values. Server
authorization must protect sensitive APIs independently of this UI gate. Enable
the adapter only when every required operation and error mapping is in place.

## Validation and remaining QA

- `node --test scripts/test-mpin.cjs`: PIN validation, grant/status/challenge
  validation, gate decisions, account isolation, interruption, redirect allowlist,
  explicit adapter failure, single-flight requests, cancellation, timeout and errors.
- Existing password recovery and notification tests should remain passing.
- `npx tsc --noEmit` and `git diff --check`.

Device QA remains necessary for small-screen/font-scaling layouts, TalkBack/VoiceOver,
animations/reduced motion, hardware/swipe navigation, cold launch and actual SOS
handoff. End-to-end setup, unlock, lockout, change and recovery require the real
backend; the development previews do not verify those security outcomes.
