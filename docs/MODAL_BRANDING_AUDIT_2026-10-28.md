# Modal branding audit — 28 October 2026

## Updated

App-owned alerts now use `BrandedAlert` and the root `BrandedAlertHost`, which
renders the shared RideGuard `ConfirmationModal`. The existing action callbacks
and destructive/cancel distinction are preserved. No backend contract changed.

| Area | Previous implementation | Current result |
| --- | --- | --- |
| New Contact: discard, help, save/photo errors, permission explanations | Native Android/iOS Alert | Shared branded dialog |
| Edit Contact: photo errors and permission explanations | Native Alert | Shared branded dialog |
| Account Edit: save/photo errors and permission explanations | Native Alert | Shared branded dialog |
| False-alarm confirmation and failure | Native Alert | Shared branded dialog |
| SOS sharing/permission explanations and opening errors | Native Alert | Shared branded dialog |
| Logout failure | Native Alert | Shared branded dialog |
| Edit Contact/Account: discard; delete; hardware unpair; logout confirmation | Custom ConfirmationModal | Shared theme surfaces, typography and buttons; adaptive stacked actions for narrow screens, large fonts and long labels |
| Home ride confirmations and onboarding Skip confirmation | Custom SweetAlert | Already branded; corrected title/icon theme colors |
| Hardware loading/result dialog | Custom LoadingModal | Already branded; corrected white-only surface and status colors to theme tokens |

## Other modal surfaces inspected

- Photo options bottom sheet: existing custom themed UI, retained.
- Relationship dropdown: existing custom themed anchored menu, retained.
- Ride details sheet: existing custom themed sheet, retained.
- Alert image viewer and video player: custom fullscreen media surfaces, retained.
  Their dark media backgrounds are intentional, not Android default alert styling.
- Android/iOS permission requests, system photo picker, camera UI and video native
  controls remain platform-owned. The explanatory dialogs before them are branded.

## Behavior and checks

- Cancel/Keep editing do not execute the destructive callback.
- Each queued action is removed before invoking its callback, preventing repeated
  taps from running the same action twice. Repeated identical prompts are deduplicated.
- Dialogs are cleared when the app backgrounds or the authenticated owner changes;
  stale queued buttons cannot run on another account or above MPIN.
- Descriptions can scroll within a bounded card. Buttons use existing shared pressed
  states and at least 44 px touch height. Confirmation and SweetAlert actions are
  always full-width vertical buttons, primary first and secondary below, on phones
  and larger screens. Reduced motion disables
  the confirmation fade.
- Full frontend regression suite: **259 passed, 0 failed**. Output:
  `android/build/modal-audit-tests.log`. The first restricted-process run exhausted
  memory; the successful full run used the normal host process.
- New tests cover action/cancel behavior, duplicate prompts, background/account
  cleanup, async callback failure, light/dark surfaces, narrow/large-font layouts,
  and ensure source files no longer import the native `Alert` UI.
- User confirmed the new branded New Contact discard dialog appears on the connected
  phone after loading the current development bundle. The initial captured dialog
  was the old cached Android UI, not the finished implementation.

No contacts were saved or deleted during this check. Changes are uncommitted.
