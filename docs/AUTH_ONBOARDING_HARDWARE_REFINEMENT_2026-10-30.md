# Authentication, onboarding and hardware refinement

## Scope and findings

Inspected the Expo Router layouts, Firebase authentication, API adapter, onboarding
checkpoints/drafts, MPIN gates, device stores, claim/release handlers, Ably button
subscriptions, theme components, native build configuration and existing tests.
Backend inspection was read-only, including the locally available
`rideguard-node` `origin/staging` revision `1e5fd41`. No backend, database,
firmware, endpoint contracts, signing configuration or safety features were changed.
That cached backend reference does not independently identify the deployed revision.

| Area | Cause and implemented behavior |
| --- | --- |
| Google login | Login and the global Firebase observer independently called `/auth/is-old-user`. Concurrent calls now share an in-flight request, removed immediately after settlement so later logins still validate. Both the hook and login handler reject double submissions. Native cancellation ends loading without a false error or Firebase login. |
| Email registration/verification | Creating an account waits for backend Firebase lookup, Firestore reservation, Firebase creation and pending-registration storage, followed by frontend Firebase sign-in and email delivery. Those required operations remain. The verification/profile flow unnecessarily forced repeated token refreshes; it now reuses valid tokens, refreshing when verification actually changes and for the existing registration-race recovery. Creation shows its current stage immediately. Auth/profile HTTP requests have a 25-second abort deadline, including stalled body reads, and are never automatically retried. Actual authenticated latency was not benchmarked. |
| Verified success | A memory-only, UID-bound handoff is armed after confirmed registration verification, or a genuinely new, verified Google account with a backend-confirmed new-user status. The screen shows the requested copy, animated circular check, expanding ring and smooth three-second countdown. Completion replaces the route once; animations/back listeners are cleaned up. Direct URLs cannot manufacture success. Startup/password-login verification also uses the handoff; existing users retain normal routing. |
| Names | First Name precedes Last Name, including keyboard focus and validation focus. Their existing state fields and `first_name`/`last_name` request mappings remain distinct. |
| Dropdowns | The existing Emergency Contact relationship selector is the only applicable onboarding dropdown in this checkout; vehicle fields remain free-text inputs. Its field/caret/check pattern is now reusable `FormDropdown`, with theme states, keyboard dismissal, bounded nested scrolling and opening/closing animation. All ten existing relationship values remain unchanged. |
| Progress | A single stepper lives above the onboarding navigator and outside scrolling/keyboard content. The existing per-screen steppers defer to it. The current route drives its animated theme segments, including both cameras, both button tests, MPIN and completion. Shared content receives a subtle slide/fade entry; Settings routes retain their app lock and ordinary layout. |
| Hardware skip | Connection's **Skip for now** saves pending setup and advances directly to mandatory MPIN, bypassing both button tests. The top-right blue **Skip** in testing bypasses all remaining tests while preserving pairing. Skip immediately cancels test timers, queued navigation and realtime subscriptions. It changes no device ID, activation or passed-test state. Existing account-owned draft storage and the existing onboarding data map carry the pending state; a newer local MPIN checkpoint wins over a stale remote hardware checkpoint. Settings retains connect/test access. |
| Disconnect | The app requires `/devices/release` to confirm ownership removal. That endpoint is absent in inspected staging source, so this is a backend capability failure, not a proven slow successful release. No offline flag or substitute endpoint is accepted as unpairing. Removed the unnecessary forced Firebase token refresh; the existing 20-second deadline now bounds the release promise as well as token retrieval, even if a transport fails to reject on abort. Loading/double-submit prevention and strict confirmation remain. Errors/timeouts retain hardware; late responses cannot report success. |
| Production artwork | The inspected local APK was dated October 26; the four button PNG assets were added October 29 (`d377c17`). That APK had none of their resource entries. Current source already has correct static relative PNG requires, explicit dimensions, `contain`, and a non-collapsible container; no replacement artwork was needed. Rebuilt the actual release and verified all four named drawable resources resolve to decodable PNGs with their original dimensions. This establishes the cause for the inspected stale artifact, not every previously distributed APK. |

## Verification

- `node --test scripts/test-*.cjs`: **374 passed, zero failures/skips**.
  Includes cancellation, double submissions, shared status requests, registration
  failure/success handoffs, countdown cleanup, name mappings, skip persistence,
  stale callbacks, disconnect timeout/failure, existing MPIN and safety regressions.
- `npx tsc --noEmit`: passed.
- `npm run lint -- --no-cache`: passed using the existing ESLint configuration.
- Local ARM64 production Gradle build:
  `app:assembleRelease -PreactNativeArchitectures=arm64-v8a`, with
  `NODE_ENV=production`: passed using the maintained native project.
- `scripts/verify-release-hardware.ps1`: all four packaged image resources decoded
  successfully and matched source dimensions: red 124×103, red pressed 124×95,
  white 132×110, white pressed 124×95.
- APK installed with `adb install -r`, preserving application data. Launch reached
  the login screen; no AndroidRuntime error was observed in the smoke check.
- Build/test logs, resource dump and launch screenshot are kept under ignored
  `.expo/qa/`. The APK is under
  `android/app/build/outputs/apk/release/app-release.apk`.

## Remaining live verification

An authenticated account, email inbox and claimed physical hardware were not used
for acceptance testing. Actual Google/email completion times, inbox delivery,
cross-restart authenticated onboarding, physical presses, reconnect and visible
hardware artwork on the protected test screen remain unverified on-device.
Successful release cannot be claimed until the compatible backend endpoint is
implemented/deployed and tested with real ownership/presence synchronization.
The existing backend handoff in `HARDWARE_UNPAIR_BACKEND.md` describes the required
contract and historical-data isolation work. No successful pairing, verification,
test result or unpairing response was simulated in application code.

## Files changed

- `docs/AUTH_ONBOARDING_HARDWARE_REFINEMENT_2026-10-30.md`
- `scripts/test-auth-profile-contract.cjs`
- `scripts/test-button-navigation.cjs`
- `scripts/test-button-test.cjs`
- `scripts/test-dark-theme.cjs`
- `scripts/test-device-disconnect.cjs`
- `scripts/test-google-signin.cjs`
- `scripts/test-mpin-layout.cjs`
- `scripts/test-onboarding-progress.cjs`
- `scripts/test-onboarding-refinement.cjs`
- `scripts/test-resume-layouts.cjs`
- `scripts/verify-release-hardware.ps1`
- `src/app/(onboarding)/_layout.tsx`
- `src/app/(public)/account-verified.tsx`
- `src/app/index.tsx`
- `src/modules/auth/hooks/use-auth.ts`
- `src/modules/auth/hooks/use-google-signin.ts`
- `src/modules/auth/screens/account-verified-screen.tsx`
- `src/modules/auth/screens/check-email-screen.tsx`
- `src/modules/auth/screens/create-account-screen.tsx`
- `src/modules/auth/screens/login-screen.tsx`
- `src/modules/auth/services/auth.api.ts`
- `src/modules/auth/services/onboarding-progress.api.ts`
- `src/modules/auth/services/registration-progress.ts`
- `src/modules/auth/services/verified-success.ts`
- `src/modules/auth/utils/auth-errors.ts`
- `src/modules/auth/utils/session-errors.ts`
- `src/modules/button/hooks/use-button-realtime.ts`
- `src/modules/button/hooks/use-button-test.ts`
- `src/modules/button/screens/button-test-screen.tsx`
- `src/modules/devices/screens/device-status-screen.tsx`
- `src/modules/mpin/components/mpin-layout.tsx`
- `src/modules/onboarding/screens/complete-setup-screen.tsx`
- `src/modules/onboarding/screens/emergency-contact-step-screen.tsx`
- `src/modules/onboarding/screens/profile-step-screen.tsx`
- `src/modules/onboarding/screens/provision-screen.tsx`
- `src/modules/onboarding/services/skip-hardware.ts`
- `src/modules/onboarding/store/onboarding.store.ts`
- `src/shared/api/client.ts`
- `src/shared/ui/form-dropdown.tsx`
- `src/shared/ui/keyboard-avoiding-wrapper.tsx`
- `src/shared/ui/onboarding-progress-context.ts`
- `src/shared/ui/stepper.tsx`
