# Auto archive default and phone camera

## Findings and changes

- The frontend initial value was 24 hours, but the backend settings service maps
  a missing `profiles/{uid}.autoArchiveHours` to `null` (Never). The app previously
  replaced the initial selection with that response without saving a default.
- The app now loads the preference in the background when entering the signed-in
  app. When settings returns null, it checks the existing `GET /profile/me` field:
  missing means save 24 using `PATCH /settings/auto-archive`; explicit null means
  preserve Never. Existing 24/48/72 choices are preserved. This does not change
  backend contracts or hold up authentication/navigation.
- Failed or malformed responses remain errors. Account/revision guards discard
  stale reads before starting default writes. The settings screen shows loading
  and saving feedback and allows retrying the selected option after an error.
- This is client initialization using existing endpoints. Atomic initialization
  across simultaneous clients would require a server-side create-if-absent default.
- Phone camera code and its Android native module remain present. Visibility
  previously required `EXPO_PUBLIC_PHONE_CAPTURE_ENABLED=true`, set in EAS preview
  only. Local Gradle does not inherit that profile. Android phone camera is now
  enabled by default, with an explicit `false` opt-out. Expo Go still lacks the
  native service; camera capture requires an Android app build.
- Phone registration, session start and session end still use the existing real
  `/devices/phone` endpoints. Camera capture starts only through its existing
  permission and session flow.

## Verification

- All 400 automated tests passed, including six new preference lifecycle/API
  cases. These exercise service boundaries with test fixtures, not live accounts.
- TypeScript and lint passed (lint reports its existing legacy-config notice).
- Release APK build passed in 3m 44s. Size: 59,125,577 bytes. SHA-256:
  `e9c03c8331d8c9326ed0819480e39039dcfb1c1572b42d19f57e30e9e1afce91`.
- Packager source map matches all five changed runtime files; the APK's embedded
  bundle hash matches the generated bundle. Its decoded manifest contains camera
  and camera foreground-service permissions plus `PhoneCaptureService`. Gradle
  autolinking includes `phone-capture`; all four hardware button PNGs decode from
  the final APK. This verifies packaging, not authenticated capture/upload.

## Check on a signed-in Android phone

- [ ] With no saved archive field, enter the app; confirm 24 hours is selected
  and the backend profile now contains `autoArchiveHours: 24`.
- [ ] Existing explicit Never and 48/72-hour choices survive restart.
- [ ] Offline/save errors remain visible; reconnect and retry successfully.
- [ ] Verify backend `AUTO_ARCHIVE_ENABLED`, backfill and indexes in the deployed
  environment. Saving a preference alone does not prove the worker is running.
- [ ] Open Camera, select the Phone camera tile, allow camera permissions and
  start. Confirm actual native capture and server-received frames.
- [ ] Stop and restart capture; test permission denial and backend outage.
- [ ] Keep SOS/alert tests within the existing approved test workflow.

Live account writes, backend worker deployment configuration, and authenticated
camera capture/upload were not verified by this automated run.
