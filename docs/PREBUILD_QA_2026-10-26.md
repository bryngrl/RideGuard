# RideGuard pre-build audit — 2026-10-26

## Result

205 automated tests pass across all `scripts/test-*.cjs` files. TypeScript
`--noEmit` and `git diff --check` pass. This is a source and regression-test
audit, not a claim that every physical-device or backend edge case is verified.
After the audit, the user requested a standalone build. The existing native
Gradle project produced an ARM64 release APK successfully with the audit fixes
included. APK signature and bundled JavaScript verification passed. This confirms
packaging, not the outstanding physical-device/backend checks listed below.

The online Expo compatibility check reports **22 patch-update recommendations**.
Dependencies were not changed during this audit.

## Issues fixed

- MPIN keypad: the empty cell collided with the `0` digit's React key.
- MPIN onboarding: steps stay in the onboarding navigator; status-driven redirects
  run only while focused. The normal MPIN guard displays a loading state.
- Camera discovery and push registration: defer until profile/onboarding is
  complete, keep settings hardware monitoring active, and report background
  failures without opening the red console-error overlay over MPIN. Failed push
  token rotation remains retryable.
- Camera and Quick Button claims: reject duplicate taps and ignore late results
  or navigation after blur, logout, account change, or a newer attempt. Pending
  timers are cleaned up. A claim already accepted by the server is not undone.
- Camera preview: remove the artificial delayed navigation after Done.
- Quick Button tests: complete once, cancel timers when leaving, ignore late
  events, reset on Retry/refocus, and require the red button for its long-press
  test. Navigation side effects no longer occur inside a React state updater.
- Auto archive: reject stale loads/saves, prevent overlapping saves, reset on
  account changes, retain the confirmed value on failure, and permit retry.
- Hardware cache: keep local device snapshots per account instead of displaying
  the previous account's IDs. Legacy installation IDs are retained for the first
  authenticated owner during migration; subsequent switches use account-specific
  snapshots. These are local records, not proof of current backend ownership.
- Photo uploads: reject missing/empty files, unsupported types, files above 5 MB,
  and failed web downloads before attaching multipart data.
- Shared UI: remove the two self-barrel imports responsible for the earlier
  `ride-details-sheet` and `sweet-alert` require-cycle warnings.
- Realtime tests: update the existing hook harness to supply authentication and
  router context introduced by the onboarding guards; keep all original tests.

## Automated coverage

| Area | Exercised cases |
| --- | --- |
| Authentication | Username normalization, existing profiles/stubs, verification delivery failures, already-verified users, registration checkpoints and account separation |
| Email links | Invalid/expired/foreign password-reset links, route validation, no credentials in routes, actual Firebase reset verification adapters |
| MPIN | Four-digit validation, mismatches/grants, malformed responses, failed setup/unlock, lockout, expiry, clock skew, background cancellation, account changes, duplicate requests, protected routes, keypad keys and zero entry |
| Photos/profile | Multipart parts, file availability/type/size, failed web download, partial account PATCH fields, profile-cache expiry and stale-account responses |
| Hardware | Claim double taps, late responses, cancelled navigation timers, account-scoped local cache, short/long test events, retries and timeouts |
| Settings | Out-of-order auto-archive responses, logout, account switching, concurrent saves, failed saves |
| Alerts/realtime | Legacy/current API shapes, filtering/presentation, discovery without alert history, device-list changes, reconnection, independent API failures, cancelled work |
| SOS | Countdown cancellation, permission failures, frozen location, persistence failure, uncertain submission, explicit retries, logout, stopping, delivery states, polling/backoff, ended-session dismissal |
| Shared inputs | Phone/device/plate formatting, keyboard scroll geometry, PIN behavior |

## Remaining backend or configuration dependencies

1. The phone's captured camera-discovery and push-registration errors reported
   `Internal server error`. Backend investigation is still needed for
   `GET /v1/devices/cameras` and `POST /v1/notifications/register` if these continue
   after onboarding. Frontend failure handling does not repair the server.
2. Email-link MPIN change/recovery is unavailable until the backend supplies its
   request, verification, resend and authorized-reset contracts. The UI remains
   guarded; no local reset or fake verification was added.
3. Device disconnect remains unavailable in the currently audited API contract.
   The frontend does not clear a device and pretend it was released remotely.
4. Firebase password-reset emails need the owned action-handler/app-link
   configuration documented in `EMAIL_RECOVERY_FLOW.md` to hand an unconsumed
   action code back to the app's New Password screen.
5. Appearance, notification and location preferences persist locally; their
   placeholder service methods do not establish server or cross-device sync.
6. Camera angle preview currently uses a placeholder image. Its copy/image is
   not evidence of a functioning physical camera feed.

## Dependency compatibility

`expo install --check` (online) recommended these versions:

| Package | Installed | Recommended |
| --- | --- | --- |
| @expo/ui | 57.0.11 | ~57.0.26 |
| expo | 57.0.13 | ~57.0.31 |
| expo-auth-session | 57.0.7 | ~57.0.16 |
| expo-constants | 57.0.18 | ~57.0.22 |
| expo-crypto | 57.0.1 | ~57.0.4 |
| expo-dev-client | 57.0.18 | ~57.0.20 |
| expo-device | 57.0.1 | ~57.0.2 |
| expo-file-system | 57.0.4 | ~57.0.7 |
| expo-font | 57.0.1 | ~57.0.4 |
| expo-glass-effect | 57.0.1 | ~57.0.4 |
| expo-image | 57.0.3 | ~57.0.5 |
| expo-image-picker | 57.0.19 | ~57.0.20 |
| expo-linking | 57.0.6 | ~57.0.13 |
| expo-location | 57.0.16 | ~57.0.22 |
| expo-notifications | 57.0.18 | ~57.0.24 |
| expo-router | 57.0.13 | ~57.0.29 |
| expo-splash-screen | 57.0.6 | ~57.0.10 |
| expo-symbols | 57.0.2 | ~57.0.3 |
| expo-system-ui | 57.0.2 | ~57.0.4 |
| expo-updates | 57.0.23 | ~57.0.26 |
| expo-web-browser | 57.0.2 | ~57.0.3 |
| react-native | 0.86.2 | 0.86.3 |

These recommendations are not evidence that any specific package caused the
reported app closure. Dependency alignment needs its own native rebuild and QA;
the existing `android/` project must be preserved.

## Physical-device/backend checks still required

- Create a fresh account, verify the actual email link on the same and another
  device, resume onboarding after closing the app, and finish MPIN setup.
- Confirm wrong PIN, server lockout, background/resume and cold-launch gating
  against a real test account, without changing production account security.
- Exercise Cancel/Start again/Back in MPIN on the development app and new APK.
- Confirm photo draft/cancel/save for account and contacts; test camera/gallery
  permission denial and retry, large text, keyboard visibility and small screens.
- Test actual hardware events, camera feeds and ownership after reinstall on
  authorized devices; local snapshots cannot restore backend state by themselves.
- Verify SOS delivery in an explicitly authorized test environment. This audit
  did not send emergency SMS, trigger real SOS, delete accounts, or change PINs.
- Reproduce a real process closure with a fresh Android crash log if it recurs.
  Captured red screens were console errors; no RideGuard native crash was present
  in the retrieved crash buffer.

All source changes remain uncommitted for review.
