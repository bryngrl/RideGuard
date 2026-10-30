# Backend integration acceptance checklist

Target: backend `staging` **56882ee**, frontend `develop`.
The [integration report](../BACKEND_API_SYNC_2026-10-30.md) lists the changes,
all 80 routes, deployment probes and backend follow-up findings.

## Automated and build checks

- [x] Frontend regression suite: **395 tests passed**, zero failures/skips.
- [x] Existing ESLint check passed.
- [x] TypeScript check passed.
- [x] ARM64 release build passed; all 11 changed integration modules match the production source map.
- [x] All four packaged hardware PNGs decoded and match their source dimensions.
- [x] Final lint and whitespace checks passed.

APK: `android/app/build/outputs/apk/release/app-release.apk` (59123493 bytes).

SHA-256: `e3accafff27f63dfba7fc52a7f38d44dca04d7824f61d9292691b813d802bca9`.

The first default parallel build had a Windows Metro process crash (`0xC0000409`).
The successful build used two Gradle/Metro workers through an ignored local init
script; native checks were retained. The final build completed in 3m 11s.
This APK has not been installed or acceptance-tested on a device in this task.
- [x] Deployed code verification/resend routes reject empty bodies with 400.
- [x] Deployed Change Password route rejects an unauthenticated request with 401.
- [x] Retired registration-link verification endpoint returns 404.
- [ ] Backend Node 22 CI tests and production build. Local backend dependencies
  are absent; no backend build or deployment is claimed.

## Live application checks

1. [ ] Install the updated build against staging. Backend `development` currently
   lacks the new code/password endpoints. Confirm the intended server/branch.
2. [ ] Register a new Gmail account. Exactly one backend registration sends a
   six-digit email code; the app does not send an additional Firebase link.
3. [ ] Verify a real code, including one beginning with zero. Confirm Account
   Verified appears for about three seconds and continues through onboarding/MPIN.
4. [ ] Try a wrong, expired, already-used and replaced code. No failure may show
   verification success. Check resend cooldown and server rate limits.
5. [ ] Restart before verification. The email checkpoint returns; the password
   must be entered again. Check that passwords/codes never appear in device
   storage, navigation parameters or diagnostic logs.
6. [ ] Lose connectivity after the code is confirmed. Retrying session completion
   must not submit the consumed code again. Restart after confirmation and verify
   ordinary sign-in still resumes the correct onboarding stage.
7. [ ] Log in with an unverified account by username and by email. The structured
   403 leads to code entry. Wrong credentials must retain their generic failure.
8. [ ] Settings > Change password appears in the list and Settings search. Try
   wrong current password, weak/same password, mismatched confirmation and rapid
   taps; no failure may navigate to success or log out a different account.
9. [ ] Change a password successfully. Confirm success feedback, cleared fields,
   local sign-out/capture stop, and a fresh login with the new password. The old
   password must fail. Test another signed-in phone and token revocation behavior.
10. [ ] Check a Google-only account's password guidance and a linked account's
    password form. Existing Google login, reset links, logout and MPIN must work.
11. [ ] Background/resume on Change Password. MPIN unlock returns to that page
    with sensitive fields cleared. Check light/dark themes and the keyboard.
12. [ ] Hardware > Disconnect targets only the selected device, including an
    already-offline device. Pairing remains; server presence refreshes. Test
    timeout, 403, server outage and retry. No failed response reports success.
13. [ ] Power-cycle/reconnect the board. A soft-disconnected device may report
    online again. Confirm that no Unpair action is shown.
14. [ ] Flash heartbeat-capable Quick Button firmware. Verify online after its
    heartbeat, offline after the 90-second window plus a poll, Wi-Fi recovery,
    physical tests and account-scoped inventory. Never send fake app heartbeats.
15. [ ] Confirm camera claim/preview, emergency contacts, profile edit/photo,
    notifications, auto archive and archives retain their previous behavior.
16. [ ] Open an alert's Response panel: distinguish no linked SOS, submitted, sent,
    delivered, failed and unavailable states. Refresh without triggering any SMS.
17. [ ] Test SOS start/stop, crash recovery, alert linking and delivery states with
    approved test contacts. Check station incident creation/operator acknowledgement
    separately. Submitted must never be displayed as delivered or read.

## Backend follow-up before claiming full acceptance

- [ ] Verify/rework immediate revoked-token enforcement after password changes.
- [ ] Make email-code verification/finalization recoverable after partial failure
  and safe under concurrent attempts.
- [ ] Verify SMTP credentials/from-address and code expiry/attempt/cooldown policy.
- [ ] Define usable account-deletion recovery after tokens expire or on another
  phone before adding a destructive rider-facing deletion flow.
- [ ] Complete native key-based phone authentication and server app-unlock grants.
- [ ] Apply and test backend MPIN authorization independently of frontend gates.
- [ ] Check backend login/profile/onboarding timings and Firestore quota after
  deploying the worker polling/backfill fixes.
- [ ] Decide whether location, notification and theme preferences need backend
  synchronization; current staging exposes no such endpoints.

## Follow-up: remove Unpair

Unpair and its unused release handler were removed at the user's request.
Disconnect remains connected to the backend. The 13 focused device checks,
TypeScript and whitespace checks passed. The APK was rebuilt successfully
(4m 14s); its device screen/service source map matches the current source.
The 395-test result above records the earlier full integration baseline.

## Auto archive / phone camera follow-up

See [the follow-up checks](AUTO_ARCHIVE_PHONE_CAMERA_2026-10-30.md). The current
APK also includes the persisted 24-hour default for unset preferences and phone
camera visibility by default on Android. All 400 tests, TypeScript and lint pass;
the release build passed in 3m 44s. Current APK SHA-256:
`e9c03c8331d8c9326ed0819480e39039dcfb1c1572b42d19f57e30e9e1afce91`.
