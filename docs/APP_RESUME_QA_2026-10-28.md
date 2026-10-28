# App background/resume audit — 28 October 2026

## Scope and result

Reviewed app-switch navigation, MPIN gating, form preservation, back actions,
hardware callbacks, camera lifecycle cleanup and existing auth/SOS/realtime tests.
This is a targeted source and regression audit, not a guarantee that every app,
backend or Android failure has been eliminated.

## Confirmed fixes

- The shared MPIN gate pushes the lock over the existing protected stack;
  unlocking dismisses back to it. Forms and pending photo-picker results are
  retained in the same app process. Contact identity and supported route params
  are preserved in the account-scoped, memory-only return destination.
- Every current `(app)` page has an allowed return path, including Archives,
  SOS Preferences and SOS pages. External URLs and unexpected contact params
  remain rejected.
- Camera/button setup opened from Settings uses the shared lock gate even though
  those screens reuse the onboarding navigator. Camera slot and Settings source
  survive unlock. Registration onboarding keeps its existing navigator behavior.
- Contact, Account Edit, Search and onboarding Back controls have explicit safe
  destinations when no navigation history exists.
- A failed onboarding-progress read hides protected content and offers Retry;
  it no longer sends an existing user to Profile and discards the current screen.
- Hardware claim/disconnect callbacks are invalidated on backgrounding. Delayed
  navigation is cancelled, stale results cannot change local devices, and loading
  controls reset on resume. This cannot cancel a write already accepted by the
  backend; a repeated claim of the same device still needs backend idempotency.
- Button tests cancel completion timers and ignore hardware events while away.
  Returning starts a fresh test rather than navigating from a background event.

## Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Full frontend regression suite | PASS | `node --test --test-concurrency=1 scripts/test-*.cjs`: 252 passed, 0 failed. PowerShell expanded the file list. Output: `android/build/resume-audit-tests.log`. |
| TypeScript | PASS | `node --max-old-space-size=2048 node_modules/typescript/bin/tsc --noEmit --pretty false`, exit 0. Run outside restricted process after earlier memory failures. |
| All protected app destinations | PASS, automated | `scripts/test-mpin-resume-gate.cjs` enumerates current app routes. |
| Repeated switches, seven page types | PASS, automated | Account Edit, New Contact, Search, Archives, SOS Preferences, Alert Detail and Settings camera setup; three cycles each. |
| Missing history/contact identity | PASS, automated | `scripts/test-contact-navigation.cjs`, `scripts/test-resume-layouts.cjs`. |
| Progress failure/retry and account switch | PASS, automated | Protected screen remains hidden; old account subtree is removed. |
| Hardware late callbacks/background timers | PASS, automated | `scripts/test-device-claim.cjs`, `scripts/test-device-disconnect.cjs`, `scripts/test-button-test.cjs`. |
| Home → Android Settings → RideGuard | PASS, device observation | Same Android process before/after; inspected app-process React Native/AndroidRuntime error output was empty. No phone settings changed. |
| Emergency Contacts → another app → MPIN → same contact | PASS, user-confirmed | User confirmed contact details, unsaved text and selected photo remained without an error. App process was unchanged; inspected error output was empty. |
| Account Edit/photo and hardware on physical phone | NOT VERIFIED | Source and automated tests passed; these individual physical flows were not exercised in this session. |
| Android kills process, force-stop, reboot or reinstall | NOT VERIFIED | Keeping screens mounted preserves in-process drafts; it does not persist unsaved forms or recover every native picker result after process death. |
| Live SMS delivery and backend outages | OUTSIDE THIS CHECK | Mock/regression success does not prove real provider delivery or backend availability. |

No account data was saved, no MPIN was entered by the agent, and no live SOS was
started during this audit. Changes have not been committed.
