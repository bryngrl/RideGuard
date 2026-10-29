# Backend staging integration — 29 October 2026

## Source inspected

- `XpnsiveSharks/rideguard-node` development: `5d07f87` (unchanged since the prior audit).
- Staging: `a765469`, merging PR #83 / `feat/mpin-forgot` (`249f6e1`).
- The user confirmed staging is deployed to the app's Azure API. This is deployment
  information from the user, not independent proof of Azure revision or inbox delivery.
- Inspected remote source with `git show origin/staging:...`; the local backend
  audit checkout contains earlier proposed changes and was not used as the contract.
  No backend source or deployment was modified.

## Connected frontend changes

| Contract | Frontend integration |
|---|---|
| GET `/auth/onboarding` | `registration-progress.ts` restores server checkpoints by authenticated UID, validates ownership/shape, and prevents a completed flag from bypassing a missing profile/MPIN. A 404 alone retains compatibility with the old deployment. Other failures do not mean completed setup. |
| PATCH `/auth/onboarding` | Existing onboarding layout syncs current steps and whitelisted registration draft fields, including debounced draft edits. Requests serialize per UID to avoid older checkpoints overwriting newer ones. Local drafts remain available if syncing fails. Settings hardware setup is excluded. |
| POST `/auth/onboarding/complete` | Existing Start driving action requires explicit server completion, after checking the personal profile and configured MPIN, before removing the local checkpoint. |
| GET `/mpin/status` | Sends `x-device-id` and valid `reason` / `inactiveForMs` context. Existing local launch/background protection remains. |
| POST `/mpin/unlock` | Sends the same stable installation identity as status and lock. Existing PIN entry/setup/unlock screens remain. |
| POST `/mpin/lock` | Launch, three minutes of foreground/background inactivity, and Android screen-off/device locking revoke this installation's unlock before refreshing status. Short app switches retain an existing server-approved unlock. Failure leaves protected content locked. Temporary inactive interruptions do not revoke. |
| POST `/auth/logout` | Best-effort server revocation for this installation before Firebase sign-out. Offline/server failure does not prevent local logout. |
| Existing MPIN code routes | Already connected; staging now injects a real Nodemailer sender. Change remains Current PIN → emailed six-digit code → New PIN → Confirm. Forgot remains emailed six-digit code → New PIN → Confirm. No duplicate screens or silent link migration. |

Push, phone-camera registration and MPIN share the existing installation ID.
Concurrent first-launch callers now share a single initialization promise. This
ID is not a secret or a biometric proof; no PIN or grant is persisted with it.
Structured concurrent-change errors no longer appear as "MPIN already exists."

Existing users with a personal profile and configured MPIN, but no versioned
checkpoint from the new frontend, are migrated using the server completion
endpoint and continue through the normal app's MPIN gate. A failed migration
retains the local checkpoint and allows retry. New checkpoints carry
`data.frontendFlowVersion: 2`, so genuinely incomplete setup still resumes.
Accounts missing a personal profile or configured MPIN cannot use this migration.
The onboarding layout also applies this check when Fast Refresh restores an old
onboarding route. Settings hardware connection routes are excluded.

## New routes deliberately not enabled as new UI flows

- MPIN email-link routes exist, but the agreed app flow remains six-digit codes.
  The backend consumes a grant before PIN replacement succeeds; rejected/reused
  PINs can consume recovery authorization. The combined link endpoint also falls
  back between change and reset purposes. These need documented, tested semantics
  before replacing the current flow.
- Phone key/challenge/signature/revoke routes exist, but `verifyPhoneSignature`
  returns a Boolean/UID without establishing an app-unlock session. No fake
  biometric success flag or software-stored private key was introduced. Native
  Android Keystore enrollment and account-bound server unlock grants are still needed.
- `/devices/disconnect` still stops connectivity without clearing assigned user
  ownership. `/devices/release` is absent in staging. It cannot safely substitute
  for the app's requested cross-account unpairing.

## Backend work still needed

1. Register and apply the MPIN unlock guard. Remote grep found its definitions only,
   with no registration or `RequireMpinUnlock` use on protected controllers.
2. Require valid device unlock proof, remove account-wide/missing-document fallback,
   and enforce revocation consistently in both status and guarded requests.
3. Make PIN setup, attempt counters, code verification, grant consumption and PIN
   replacement safe under concurrency. Do not consume authorization before a
   rejected PIN update; retain useful recovery after a failed resend.
4. Validate onboarding steps/draft fields and required profile/setup state server-side.
   The current completion method checks MPIN but not all required onboarding steps.
5. Finish secure phone-unlock enrollment and issuance of an actual unlock grant.
6. Add true hardware ownership release and isolate previous-owner alert/media access.
7. Confirm production SMTP configuration, accepted/failed delivery and real inbox receipt.

## Validation

- Focused integration suite: 68 tests passed, 0 failed.
- Full frontend regression suite: 303 tests passed, 0 failed, 0 skipped.
- Follow-up legacy-account redirect fix and early onboarding button refinement:
  306 tests passed, 0 failed, 0 skipped; TypeScript passed. Migration checks cover
  a missing personal profile, missing MPIN, failed completion and new checkpoints.
- TypeScript `tsc --noEmit --pretty false`: passed.
- Tests cover server checkpoint ownership, outage/404 distinctions, MPIN requirement,
  installation-ID concurrency, device headers, lifecycle revocation, existing code
  routes and logout transport. Dependencies/network are mocked.
- No account, PIN, email challenge, live SOS or hardware assignment was changed for QA.
  SMTP receipt, deployed route behavior with a real session, reinstall and multiple
  physical devices still require end-to-end QA. No commits or builds were made.
