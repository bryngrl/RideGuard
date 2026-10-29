# Change MPIN app-switch regression — 29 October 2026

## Observed

The connected Xiaomi phone displayed a white RideGuard screen after leaving
Change MPIN for another app and returning. The captured recent native crash log
did not show a new AndroidRuntime crash; this does not prove no older crash occurred.

## Changes

- `MpinLayout` now renders its body as an ordinary visible View. The entire form
  no longer depends on an initial zero-opacity Reanimated fade completing.
  Existing navigator transitions and theme styling remain.
- Background/inactive suspension discards draft PINs and authorization grants,
  cancels pending work through the existing generation/abort guards, and retains
  only unexpired email-challenge metadata for the same account. This lets a rider
  open their email app and return to the existing code challenge.
- Background locking still requires local unlock for protected app content. It
  preserves non-secret challenge metadata and a previously confirmed success
  state. Logout, account changes and explicit flow exit still clear the flow.
- Expired challenges are discarded. A cleared authorization cannot save a new
  PIN; the existing Verify identity again path remains available.

## Evidence and limits

- Restarted only the development app and reconnected it to the running RideGuard
  Metro server over USB. No APK build, account reset or PIN entry was performed.
- The user opened Change MPIN, switched apps and returned, then confirmed:
  **“Change MPIN appears normally.”**
- Focused MPIN/layout/resume suite: 58 tests passed.
- Full frontend suite: 311 tests passed, zero failed/skipped.
- TypeScript and targeted `git diff --check`: passed.
- Tests cover visible initial layout, unexpired/expired challenges, discarded
  PIN/grant drafts, account isolation, pending-request cancellation, timeouts,
  background locking and preserved success state. Network dependencies are mocked.
- Real email receipt, a full PIN change/reset and provider failures were not
  exercised on the phone. No verification email was requested and no PIN changed.

## Follow-up: unlock must precede management

The rider subsequently reported that Change MPIN was visible before the normal
app lock appeared on Back. MPIN management routes were outside `MpinAppGate`.
`MpinFlowScreen` now covers management/current/new/confirmation/code steps with
the existing status/unlock components while the app is locked. A successful
server unlock resumes management in place, retaining an unexpired challenge;
it does not navigate away or accept a cached unlock flag. Failed unlocks keep
the management form hidden. Onboarding and Forgot MPIN recovery keep their
existing distinct paths; a confirmed success screen remains a confirmation.

The policy is unchanged: Firebase login persists, but local MPIN locking happens
immediately on actual backgrounding, including a ten-second app switch. A new
grace interval has not been introduced. The backend's unlock window is separate
from this local privacy policy.

Follow-up regression suite: 313 passed, zero failed/skipped; TypeScript passed.
The first phone retry still showed Change MPIN first. A full development reload
was then sent; verification of this final ordering change is pending the rider's
next test. The earlier phone confirmation applied to the white-screen fix only.

The rider's next test confirmed unlock appeared automatically, but the management
screen was briefly visible first. The global privacy cover now remains opaque
for the resume UI commit frames rather than disappearing in the same AppState
event. Android window blur covers content earlier; focus restores it after the
commit frames without changing when MPIN locking occurs. Stale callbacks cannot
uncover a backgrounded app. This is still best-effort JavaScript snapshot privacy;
Android OS snapshot behavior has not been independently proven by these tests.
Targeted privacy/navigation/Home suite: 19 passed; TypeScript passed. Physical
confirmation that the transient flash is gone remains pending.

## Current policy: one-minute background grace window

At the rider's subsequent request, the earlier immediate-lock policy is replaced
by a 60-second background window. A fresh launch still requires MPIN. A quick
return cannot create an unlock; it can only retain one already accepted by the
backend. Absolute expiry, revoked server state or an already-locked app still
requires verification. A return after at least 60 seconds locks locally and
revokes the installation's server window before checking status.

The shared branded Session locked modal explains inactivity and has a Continue
action. It is shown once on a long return from an unlocked session, not on fresh
launch, short switches or repeated active events. Pending notices are canceled
when leaving again and are checked against the current account before display.

Known configured accounts render the existing unlock keypad while rechecking,
without the separate status/Please wait page. Input is disabled during checking.
Quick-return Change MPIN remains in place while its valid session is rechecked.
Unexpired grants may remain in memory during the grace window; PIN drafts always
clear, and a full lock/account change still removes grants. Challenge deadlines
and purpose/account checks remain server-authoritative.

Final regression suite for this policy: 316 passed, zero failed/skipped;
TypeScript and targeted whitespace checks passed. Tests simulate the 10-second,
59,999 ms and 60,000 ms boundaries, duplicate events and modal issuance. A reload
was sent to the connected development phone; the new one-minute behavior has not
yet been independently verified by a timed physical-device test.

## Superseding policy: three minutes and immediate phone-screen lock

The final requested interval is 180 seconds in the foreground without interaction,
or 180 seconds in another app. Touch, scrolling and shared text/code inputs renew
the foreground deadline without recording their contents. Short app switches
retain only an existing, unexpired server-approved authorization.

The Android `AppSecurity` local Expo module observes screen-off broadcasts and
reads current power/keyguard state. A screen-off counter catches events missed
while JavaScript sleeps. Turning the screen off locks locally and forces the
installation's server unlock window to be revoked on return, even before three
minutes. Cold process launch still requires MPIN. The native module requires an
updated development APK; Metro refresh alone cannot add it to older binaries.

Idle locking also dismisses pending shared confirmation/sweet-alert dialogs so
they cannot remain usable above the MPIN screen. The existing branded inactivity
notice is used for the three-minute deadline, not for ordinary phone locking.

Validation: 319 regression tests passed, zero failed/skipped; TypeScript passed.
Focused tests exercise 179,999/180,000 ms boundaries, foreground activity renewal,
duplicate background events, a two-second screen-off return, missed JavaScript
screen events, and closing pending confirmation dialogs on lock. These are
simulated lifecycle tests; physical phone behavior still needs confirmation after
installing the updated native development build.

Development build/install evidence: `app:assembleDebug` succeeded (667 tasks),
with `AppSecurityModule` present in Expo's generated module registry. The debug
APK is 107,717,177 bytes. `adb -s f710b09 install -r` returned `Success`; app data
was retained and no uninstall was performed. Metro was started on port 8081 and
the development client was opened through USB reverse forwarding. Installation
success does not replace physical confirmation of the lock/resume behavior.

The initial development-launch error was an EOF connecting to Metro because
`--localhost` bound only IPv6 `::1` while USB reverse used IPv4. Restarting Metro
with `--host lan --port 8081` restored HTTP 200 from `127.0.0.1:8081/status`.
The phone then bundled 2,514 modules and resumed RideGuard's MainActivity.

Physical test blocked: the phone subsequently showed SessionRecovery
(`Reconnect to RideGuard`). Its sanitized ReactNativeJS log reported HTTP 500
from `/auth/is-old-user`. Metro still returned HTTP 200 and USB reverse remained
active. Immediate screen-off and timed idle behavior therefore remain unverified
on the physical phone; no account/onboarding or MPIN security checks were bypassed.
