# Onboarding, contacts and artwork

## Integration

Fetched and fast-forwarded `ui/visual-refinements` to `origin/develop` at
`24f182a`. No merge conflict occurred. The pre-pull Quick Button connection and
test flow was retained, including Settings destinations and optional hardware skip.
An ignored local backup is in `android/build/pre-develop-onboarding/`.

## Contacts

The onboarding profile request previously embedded emergency-contact fields in
`POST /profile/personal-info`. Settings uses `GET /profile/emergency-contacts`,
which is a different backend collection/contract. Onboarding now saves personal
and vehicle information separately, then uses the existing Settings contact API.
Successful contact saves update the same account-scoped contact cache.

A confirmed profile checkpoint is retained if the separate contact request fails.
Retry first refreshes the contact list and reconciles matching phone numbers to
avoid duplicate creation after a lost response. Saved contact IDs allow subsequent
edits without duplicating the onboarding contact. A known existing profile uses
the existing `PATCH /profile/me` route. Account changes abort further writes.

The contact remains optional. MPIN is mandatory, including when all hardware is
skipped. Neither a failed status check nor `configured: false` permits the
completion endpoint or dashboard transition.

Previously completed accounts with only the old embedded contact need a backend
migration into the contact list if that data is to appear automatically. The app
does not recreate old embedded contacts every time an empty list is opened,
because doing so would resurrect contacts that a rider deliberately deleted.

## Artwork and layout

The exact supplied PNGs remain the sources for white/red normal and pressed
buttons. Hardware events drive the pressed visual; the images crossfade briefly,
with their original aspect ratios anchored to a shared base. No test passes from
the visual animation alone. Existing background/blur cancellation is retained.

The connected development app was visually inspected: both supplied button images
are visible. A physical hardware press was not tested because the user has no
hardware available; simulated event tests cover the pressed/return state.

The completion badge is the supplied all-set image, followed by a smaller greeting
and larger first name. The parent progress bar is hidden on this final page. Copy
does not claim skipped hardware is connected or monitoring.

The existing standalone APK resource table was inspected with aapt2: it contains
all four button PNG resources, the all-set badge and the dark contact background.
These are supported PNG resources, not an unsupported file format. This task
targets the development app only; no standalone build was requested or made.

## Alert media findings

Checked backend `origin/staging` and the frontend mapper/detail screen. Backend
`InferenceAlertsRepository` attaches `videoUrl` only when the alert includes
qualifying violence; `InferenceHandlingService` supplies a URL only for an
uploaded video. Weapon-only alerts therefore normally have image evidence.

The frontend plays a clip when `videoUrl` exists and opens the image otherwise.
There is no date/age rule converting newer clips to photos. Older alerts retain
their available clip URLs. A recent weapon-only alert was visible on the phone.
To investigate a violence alert without a clip, backend/model video-upload status
for that specific event is required; a frontend change cannot invent a video.

## Verification

- `node --test scripts/test-*.cjs`: 411 passed, 0 failed, 0 skipped.
  Output: `android/build/onboarding-final-regression.log`.
- TypeScript check passed; `git diff --check` passed.
- Contact tests cover separate API writes, failed-contact retries, lost-response
  reconciliation, edited saved contacts, optional-contact skips, account changes,
  profile failures and the existing-profile update route.
- Completion tests confirm that skipped hardware cannot skip MPIN, and failed
  MPIN status requests cannot complete onboarding or open the dashboard.
- Simulated white-button events activate the pressed state, return after the
  hardware hook's pulse duration and preserve recognition. Real hardware,
  live onboarding writes and final-screen visual verification remain pending.

## October 31: develop, verification and responsiveness

Fast-forwarded to `origin/develop` at `7673ab0`, then reapplied all working
changes without conflicts. A backup stash remains. This develop update changed
only AGENTS.md; it did not replace our connection or onboarding code.

An accepted email code previously rendered the password input during the async
Firebase handoff, even with the registration password still in memory. The code
screen now never displays a password. Normal registration authenticates and
opens Account Verified, then the existing onboarding destination. After a restart
that lost the memory-only password, backend-confirmed verification opens the same
success screen but continues only to Login; it grants no authenticated access.
Failed sign-in initialization can retry without consuming the code again.

Responsiveness changes:

- Realtime/device/security lifecycle hooks run in a separate component, so
  background alert changes do not rerender the root navigator. Its theme object
  stays stable until the theme changes. Lifecycle hooks remain mounted during
  font/settings startup and background monitoring remains enabled.
- The bottom bar uses navigator state and tab events directly, respects prevented
  events and avoids re-navigating to the selected tab. Tab crossfades are disabled
  to avoid overlapping heavy screen rendering. Stack screen transitions remain.
- Identical alert refreshes preserve entity/list references and notify no store
  subscribers. Real changes still notify immediately, including media, seen and
  archive updates. Date grouping no longer repeatedly copies growing groups.
- Concurrent GETs for the same endpoint and authentication token share transport.
  Later reads are fresh, different tokens stay separate, failures can retry and
  mutations remain separate requests. No authentication checks are bypassed.

Verification: all 420 tests passed with no failures or skips; TypeScript passed.
Regression output: `android/build/verification-navigation-regression.log`.
The phone is disconnected, so no real-device frame-rate measurement, login/save
latency measurement or live registration was performed. These source fixes do
not establish that every reported delay is resolved; server latency remains a
separate possible source. No new commits or push were made.

The shared GET timeout also covers non-auth inventory/history reads, so a stalled
response cannot hold later refreshes indefinitely. A regression test confirms
transport abort and a subsequent fresh request.

Development build completed successfully (`app:assembleDebug`, ARM64) in 3m16s.
APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 110,169,362 bytes.
Metro served the Android development bundle successfully (HTTP 200, 2,541
modules). The disconnected phone was not updated. This is a development client
that uses Metro; no standalone release was built. Metro is running on port 8084.

## Standalone artwork regression and startup follow-up

The user subsequently requested a standalone APK and reported missing buttons
and completion artwork. The initial resource/dimension check was insufficient:
PNGs were packaged, but `assets/app.manifest` was still dated October 25 and
omitted all six new artwork resources. Expo's installed Gradle task tracks the
entry/project paths, not the changed bundle outputs, allowing that manifest to
remain UP-TO-DATE. Expo asset lookup uses the manifest/hash mapping in standalone
updates; the working light contact background is an inline SVG.

The app Gradle configuration now declares release bundle outputs as inputs to
`createReleaseUpdatesResources`. The verifier reads the manifest from the APK
and requires each artwork resource's current MD5 hash, as well as a decodable
packaged PNG with matching dimensions. It failed against the user's old APK
(red button missing from manifest) and passes against the rebuilt APK for all
six resources. No image conversions or button animation changes were needed.

The replacement build succeeded in 4m9s. Manifest ID:
`ac600379-9e34-4b91-8b7b-f26086e7080e`. APK signature verified.
`android/app/build/outputs/apk/release/RideGuard-artwork-fix.apk`:
59,145,245 bytes; SHA256
`7D16AAE6C1A59777D832AD4C4324CEE7128F0B0D9541E9215EC4D67E669E4F17`.

Returning authenticated users no longer wait for the 2.3-second decorative
welcome timer before server routing begins. Authentication, onboarding and
MPIN guards remain. Startup/auth/resume tests: 21 passed; TypeScript passed.
Actual phone display, hardware motion and cold-start timing remain unverified
because the phone is disconnected. Backend latency may still delay startup.
