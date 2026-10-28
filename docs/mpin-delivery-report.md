# RideGuard MPIN implementation report

> Historical report. Current integration uses six-digit MPIN email codes; see
> [the current user flow](MPIN_USER_FLOW.md) and [backend checklist](auth-backend-requirements.md).

Branch: `feat/mpin`. This report includes the existing uncommitted MPIN work and
the lifecycle/security refinements requested in the complete MPIN task.

## Delivery status

| Category | Status |
| --- | --- |
| Existing connected authentication | Firebase Google sign-in, old-user/current-user and personal-information APIs preserved. No new backend endpoints integrated. |
| MPIN frontend | Setup, confirmation, login card/keypad, recovery, change with email verification, success and unavailable screens implemented through the existing adapter. |
| Backend integration | Blocked: all twelve MPIN operations still explicitly reject as unavailable; `mpinApi.enabled` remains false. MPIN protection is not active. |
| Local/demo features | Existing username/password demo login remains local. MPIN design previews are development-only and cannot unlock or save a real account. |
| Password recovery | Still awaiting its backend. Shared email-code input reused; its development preview opens designs without pretending to verify a hardcoded code. |

## Screens, navigation and onboarding

The existing splash and authentication animation are preserved. After full
authentication, the app checks the existing onboarding status. Incomplete accounts
return to personal-information onboarding; complete accounts enter the MPIN gate.
An MPIN deep link also checks onboarding, so it cannot skip that step. Opening the
authentication landing while authenticated routes to the appropriate onboarding or
app flow. Ordinary logout uses the existing landing route without replaying splash.

Backend-enabled flow:

- No MPIN: introduction → create → confirm → server save → success → status check.
- Configured MPIN: status check → continue if server unlock is valid, otherwise
  existing plain MPIN login card → numeric entry → server verification → status
  confirmation → permitted destination.
- Forgot MPIN: introduction → registered-email delivery → shared six-digit code
  entry → server verification → create/confirm replacement → reset → success.
- Change MPIN: current-PIN verification → email delivery → existing change-code
  screen → server verification → create/confirm replacement → change → success.

Success is displayed only after explicit save confirmation. Saving/resetting a PIN
does not automatically unlock the app. Continue/Done goes through the normal app
gate, which rechecks status and can require unlocking. Changes target Settings;
setup/reset target Home. Intended protected destinations use an allowlist.

## State, inactivity and session security

The Zustand MPIN store is memory-only and account-bound. Temporary PINs, challenges
and grants are cleared on account changes, logout, backgrounding and flow exit.
PIN drafts never survive restart. Current-PIN proof is used only for requesting the
change-email challenge; it is never stored as the final change authorization.
Change and recovery deliveries/grants carry separate purposes in memory.

Launch, genuine background return and server unlock expiry trigger status checks.
The optional status context reports launch/resume/expiry and observed background
duration; the server decides the inactivity threshold. Brief app switches preserve
access if the backend says the unlock remains valid. System inactive dialogs do
not force entry. Explicit local locking is supported by the store; backend session
revocation for an explicit lock still needs an agreed endpoint/event contract.

Protected content is hidden from touch and accessibility while status is checked.
Already-mounted content is retained to avoid tearing down monitoring just for a
brief check. New/unknown accounts never mount protected content. A background
privacy cover is added without changing capture, notification or SOS services.
Native snapshot timing is not guaranteed by this React cover.

Requests prevent duplicate submissions, use Firebase ID tokens, cancel on
blur/background, enforce a bounded request timeout and ignore stale account or
security-state results. Server time, when returned, normalizes deadlines once to
accommodate device clock skew. Lockout countdown reaching zero does not itself
enable verification; a fresh server status check is required.

Ambiguous network outcomes during saving clear temporary authorization and offer a
status check. They do not fabricate success or silently replay a save. Status can
confirm configuration/unlock, but distinguishing exactly which change committed
after a lost response may require backend operation receipts or idempotency support.

## OTP, errors and recovery

`VerificationCodeInput` is shared by Forgot Password, Change MPIN and Forgot MPIN.
It supports numeric entry, native autofill, partial/complete input, focused/error
borders, light-red error fill, disabled entry and screen-reader labeling. MPIN
creation/unlock retains the existing custom numeric keypad and four masked boxes.

The MPIN flow handles send/verify/resend loading, incorrect/expired/replaced/used
codes, cooldowns, attempt/resend limits, failed delivery, unavailable/unverified
registered email, expired authorization, network/timeouts and disabled accounts.
Successful resend replaces the challenge from the server, clears entry and shows
feedback. The backend must enforce old-code invalidation, replay protection and all
limits; frontend feedback is not authorization.

There is no recipient email input. The backend chooses the registered account
email and returns only a masked destination. Inaccessible email requires an
approved support/account-recovery policy; no alternate-email bypass was added.

## Emergency compatibility and blockers

No SOS, alert, Ably, notification or phone-capture business logic was redesigned.
With MPIN enabled, an emergency route requires explicit backend permission.
Specific alert details additionally require the alert ID in the server allowlist;
the alert list, other alerts and account screens remain protected. Essential
authorized emergency UI can remain visible during a status check while unrelated
screens remain guarded. Backend authorization must independently limit API access.

Rollout blockers found in the repository:

- There is no confirmed MPIN emergency authorization contract or authoritative
  active-emergency state tied to the MPIN adapter. Missing/failed policy checks
  fail closed. The team must agree on offline/expired-policy emergency behavior
  before enabling MPIN; this cannot be solved by granting unrestricted UI access.
- Alert details contain sensitive snapshots/clips, so a blanket exemption for
  every alert-detail route would expose account information.
- The existing SOS active screen still contains a TODO for backend stop/deactivate.
  Its navigation is not evidence of a backend-confirmed active SOS. It was preserved.
- Actual monitoring continuity across native navigation/background transitions must
  be tested on a device with the real services and approved emergency permissions.

## Backend requirements

No backend endpoints were created, guessed or connected. See
`docs/auth-backend-requirements.md` and `docs/mpin-implementation.md` for the proposed
adapter contracts. Required MPIN operations remain status, setup, unlock,
current-PIN proof, send/verify/resend change-email code, save change,
send/verify/resend recovery-email code and reset.

The backend must confirm unlock session binding, finite expiry, inactivity policy,
server time, scoped emergency permissions, account/email validation, attempt limits,
grant purpose/account binding, single use, replay protection, secure PIN storage,
session revocation and stable error codes. Remote MPIN changes/revocation are picked
up on the next status check or known expiry; instant revocation UI needs a confirmed
server event or protected-request error integration. APIs must reject revoked access
even before the UI receives that event.

## QA executed and remaining

Automated command:
`node --test scripts/test-mpin.cjs scripts/test-password-recovery.cjs scripts/test-push-registration.cjs`.
Also run `npx tsc --noEmit` and `git diff --check`.

Results: 41 tests passed; TypeScript and whitespace checks passed. Git emitted only
the repository's existing LF-to-CRLF normalization warnings.

| Requested journey | Validation / remaining work |
| --- | --- |
| A–B: new/existing account without MPIN | Gate/setup policy and response validation covered in unit tests; actual registration/onboarding/save needs backend and device. |
| C: returning user | Server-required unlock routing and status handling tested with fixtures; real verification pending. |
| D–E: brief interruption/inactivity | Lifecycle tests verify launch/resume checks, valid-unlock continuation and server-required locking. Real inactivity policy pending. |
| F–G: forgot/change MPIN | Scoped store/challenge validation, unavailable adapter and save-state rules tested; email delivery and successful real flows pending. |
| H–J: invalid/expired OTP and expired grant | Validators, error mappings and expiry handling tested; server limits and real OTP responses pending. |
| K–L: logout/account switching | Memory clearing, stale request rejection and account isolation tested; native back-stack/device testing pending. |
| M: active emergency | Scope policy unit tests verify allowed SOS/specific alert and deny unrelated pages. Real emergency lifecycle is blocked by the policy/contracts above. |
| N: backend unavailable | Explicit failures, no fabricated authorization and disabled rollout behavior tested. |

Tests use isolated fixtures, not live endpoints or production bypasses. No claim is
made that full backend journeys, actual email delivery, device animations,
TalkBack/VoiceOver, small-screen layouts, native snapshot privacy or emergency
continuity have been verified. Those remain required before production rollout.

## Files created or modified in the MPIN working tree

Created:

- `src/app/(app)/_layout.tsx`
- `src/app/(mpin)/mpin/_layout.tsx`, `src/app/(mpin)/mpin/[step].tsx`
- `src/components/brand-lockup.tsx`
- `src/modules/mpin/components/mpin-app-gate.tsx`
- `src/modules/mpin/components/mpin-layout.tsx`
- `src/modules/mpin/components/mpin-unlock-experience.tsx`
- `src/modules/mpin/components/mpin-privacy-cover.tsx`
- `src/modules/mpin/hooks/use-mpin-lifecycle.ts`
- `src/modules/mpin/hooks/use-mpin-request.ts`
- `src/modules/mpin/screens/mpin-flow-screen.tsx`
- `src/modules/mpin/services/mpin.api.ts`, `src/modules/mpin/services/mpin-session.ts`
- `src/modules/mpin/store/mpin.store.ts`, `src/modules/mpin/utils/mpin-policy.ts`
- `src/shared/theme/pin.ts`, `src/shared/ui/pin-pad.tsx`
- `src/shared/ui/verification-code-input.tsx`
- `scripts/test-mpin.cjs`
- `docs/auth-backend-requirements.md`, `docs/mpin-implementation.md`, this report.

Modified:

- `src/app/_layout.tsx`, `src/app/(public)/welcome.tsx`
- `src/modules/auth/screens/welcome-screen.tsx`
- `src/modules/auth/screens/verify-code-screen.tsx`, `src/modules/auth/screens/verify-code-screen.styles.ts`
- `src/modules/onboarding/screens/complete-setup-screen.tsx`
- `src/modules/settings/config/settings-rows.ts`
- `src/modules/settings/types/settings.types.ts`
- `src/shared/theme/index.ts`, `src/shared/ui/index.ts`
- `docs/password-recovery.md`

No new dependencies were added. No commit, push or standalone build was requested
for this task.
