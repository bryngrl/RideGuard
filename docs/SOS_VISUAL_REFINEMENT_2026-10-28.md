# SOS visual refinement — 28 October 2026

## Existing implementation inspected before edits

- Ready: `SosTriggerScreen`, `/sos`. The existing disabled predicate checks
  settings hydration, recovery readiness, status refresh/error, idle phase and
  loaded contacts. A 650 ms `onLongPress` calls the existing location-sharing
  confirmation and `state.begin(alertId)`; no tap-to-send handler exists.
- Countdown: `SosCountdownScreen`, `/sos/countdown`. The store supplies the
  remaining value, initially five seconds. Android Back and the existing slider
  call `cancelCountdown`. Blur/background cancellation stays unchanged.
- Active/Not Confirmed/Ended: `SosActiveScreen`, `/sos/active`. Current phase
  and the server record determine which branch renders. Refresh, retry,
  direct contact numbers, preference navigation, stop and dismissal handlers
  remain connected to the existing store.
- Delivery: `messagePresentation` in `types.ts` distinguishes queued, submitted,
  sent, delivered, failed and unknown. Contact expansion retains the initial
  message, ended message and delivery-check details.
- Data: `createSosApi` uses `/sos`, `/sos/active`, `/sos/by-request/:requestId`,
  `/sos/:sosId`, `/sos/:sosId/refresh-status` and `/sos/:sosId/stop` with the
  existing Firebase authorization. No endpoint or payload change is planned.
- Recovery/tracking: `sos-session.ts`, `sos-polling.ts` and `use-sos-lifecycle.ts`
  own interruption, persistence and polling. The existing five-minute ended
  tracking window remains unchanged.
- Gesture: shared `SlideButton` uses the existing rightward direction, 40 px
  thumb and 70% completion threshold for these SOS screens. The supplied
  screenshots do not override that behavior.
- Dashboard: `QuickActions` continues to resolve existing SOS status before
  opening a screen, with duplicate-tap, account and focus guards. Camera and
  monitoring logic are outside this visual refinement.

## Intended visual changes

- Theme-based navy ready button with a soft ring, standard header, balanced
  whitespace and the complete emergency-contact management card.
- Theme-aware countdown surface, compact red circle, large remaining number,
  accurate five-second copy and a pale full-width cancellation slider.
- Consistent emergency-red active/unconfirmed surfaces, a clear heading and
  indicator, readable location/status controls and delivery cards.
- Consistent cards, typography and safe-area-aware action regions for ended
  status, including all existing recovery notices and controls.

## Verification

- TypeScript: `tsc --noEmit --pretty false` passed.
- Full regression suite: `node --test --test-concurrency=1 scripts/test-*.cjs`
  passed 297 tests, with no failures or skipped tests. Output is recorded locally
  in `android/build/sos-all-tests.log`.
- The new `test-sos-presentation.cjs` checks the actual Ready, Countdown, Active,
  Not Confirmed and Ended components with mocked dependencies: hold-only entry,
  five-second copy, slider callbacks, refresh, location truthfulness, recovery
  actions, conditional ended copy, light/dark modes and narrow/large-font inputs.
  These are component/logic checks, not proof of physical text layout.
- SHA-256 comparison against the pre-edit baseline confirms all nine inspected
  SOS business-logic, API, gesture and dashboard action files remain unchanged.
- `git diff --check` passed for the SOS changes and theme tokens.
- Device visual verification remains pending: the captured phone image did not
  show a rendered SOS screen. No live SOS was triggered and no SMS was sent for
  visual QA. Live delivery, slider ergonomics and physical layout in all states
  have not been claimed as tested.
