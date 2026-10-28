# Android MPIN native mounting crash — 2026-10-27

## Confirmed symptom

The user supplied a native Fabric stack trace while moving from the Quick Button
onboarding step to MPIN:

```text
IllegalStateException: addViewAt: failed to insert view ... into parent ...
Caused by: The specified child already has a parent.
SurfaceMountingManager.addViewAt
ReactClippingViewManager.addView
```

This establishes a native mounting failure, separate from the previous duplicate
React key warning and the camera/push API console errors. The prior 205 passing
JavaScript tests did not establish native transition safety.

## Diagnosis and changes

Our loading Button previously replaced its native child hierarchy when loading
changed. MPIN status/unlock requests can finish, change loading, and replace the
screen in the same frame. This is consistent with the native-stack/Fabric
reparenting failure described in the upstream reports below, but the exact native
view tags in the user's trace have not been mapped to individual JSX components.

- Keep both button content and spinner in permanent, non-collapsible containers.
  Change their opacity and accessibility visibility instead of swapping parents.
- Pin FeedbackPressable's native root and feedback overlay so disabled/pressed
  styling does not cause those host views to flatten during navigation.
- Pin MPIN indicator/keypad rows and animated panel parents; disable clipping for
  the MPIN scroll views.
- Replace MPIN's entering layout animation with an opacity-only animation, and
  cancel MPIN fade/PIN animations on cleanup.
- Disable Android native transitions at the root MPIN/onboarding entries, the
  onboarding register entry, and the nested MPIN screens. iOS retains its existing
  native transition behavior.
- Correct the root onboarding navigator declaration to target `(onboarding)`,
  which owns the nested register navigator, rather than a non-root nested name.

These changes preserve theme colors, keypad dimensions, MPIN validation and actual
backend authentication. They are targeted mitigations, not a claim that an
upstream native-library fix has been installed.

## Why onboarding can show the unlock screen

`GET /mpin/status` determines the flow. An account with `configured: false` enters
Create/Confirm. An account with an existing MPIN enters Unlock, including when
resuming incomplete onboarding. A prior successful setup with an interrupted
response can therefore lead back to Unlock. Onboarding must not reset or
overwrite that existing PIN locally.

## Validation

- All 212 automated tests pass, including real JSX shape checks for stable button
  content/spinner parents and Android MPIN route animation options.
- TypeScript checks pass.
- After reconnecting the phone, the development app was fully restarted against
  the updated Metro bundle on port 8082 over USB. It reached the onboarding
  "You're all set" screen with no new error returned by the checked
  ReactNativeJS/AndroidRuntime log filters. This verifies one device run, not all
  transition/lockout combinations; mocked JSX tests do not exercise Fabric mounting.
- Recheck Button → MPIN, Create → Confirm, Back/Start again, API completion and
  background/resume in a rebuilt/reloaded app. Only the user should enter their
  real PIN. At the user's request, the standalone build was stopped; current
  verification uses the development app and Metro on port 8082. Earlier APKs do
  not contain these native-view stability changes.

## Background/resume regression

The user later reproduced the same native parent exception after opening another
app and returning. The successful setup run above did not cover that scenario.
The app gate was still able to replace its native route during a background
state change, while its protected-content opacity and conditional loading/privacy
views also changed the native hierarchy.

The resume path now locks/hides content immediately but defers route changes until
AppState is active and the security recheck completes. App-gate content, its
loading overlay and the root privacy cover retain permanent non-collapsible
native parents. Repeated redirect attempts are guarded. Android root navigation
back to the app also uses no animation. The existing backend unlock requirement
remains enforced; returning never trusts a cached unlock window alone.

Regression tests cover no background navigation, keeping protected UI hidden and
untouchable, waiting for the resumed server check, a single MPIN redirect, ignoring
late onboarding checks, and a stable privacy-cover host view. On the connected
Android development app, a Home-to-launcher-to-app cycle reached MPIN, followed
by two further background/resume cycles from MPIN without the native error.
MainActivity remained resumed and the checked ReactNativeJS/AndroidRuntime error
filters returned no new errors. The initial short cycle remained on Home; the
subsequent cycle confirmed the locked MPIN screen. No PIN was entered or changed
by the agent. These are device regression checks, not coverage of every native
transition. Normal background clearing also no longer displays the misleading
red "MPIN entry cleared" message.

## Upstream references

- [Fabric reparenting during screen-removal transitions](https://github.com/software-mansion/react-native-screens/issues/4677)
  describes the matching loading-state/navigation trigger and a non-collapsible
  native-parent workaround; that report was closed for missing reproduction data.
- [View recycling and fragment transitions](https://github.com/software-mansion/react-native-screens/issues/3249)
  documents the related Android parent-retention failure.
- [Reanimated entering/exiting animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/)
  explains the view-flattening caveats around layout animations.
