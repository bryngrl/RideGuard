# Automatic SOS message status: local verification

2026-10-25. Implementation follows the ticket's approved D1–D6 decisions.
This is local evidence, not carrier delivery or production verification.
Android device acceptance remains open. No device was attached (`adb devices`).

## Checks

1. Backend `node node_modules/typescript/bin/tsc --noEmit` and
   `node node_modules/@nestjs/cli/bin/nest.js build`: passed.
2. Full backend Jest with `--runInBand --silent`, `RUN_SOS_POSTMAN=true`,
   `FIRESTORE_EMULATOR_HOST=127.0.0.1:8189`, and
   `TEXTBEE_SIM_BASE_URL=http://127.0.0.1:4968/textbee`: **290 passed across 29 suites,
   zero skipped/failed**.
   Includes real controller HTTP/auth/validation tests, the saved Postman collection,
   real provider HTTP, and three Firestore emulator transaction tests.
3. Mobile `node node_modules/typescript/bin/tsc --noEmit`: passed.
   `SOS_SIM_BASE_URL=http://127.0.0.1:4966/rideguard/v1` with
   `node --test scripts/test-sos.cjs`: **38 passed, zero skipped/failed**.
   Tests include the pre-existing permission/cancellation regression cases and a
   frozen pre-enhancement client parser against enhanced responses.
4. Native Gradle `app:assembleRelease -PreactNativeArchitectures=arm64-v8a`:
   **BUILD SUCCESSFUL**, final rebuild 4m 48s. Existing Android project retained.
   Deprecation warnings remain; no Gradle upgrade was attempted.
5. `apksigner verify --print-certs`: passed. `aapt dump badging`: package
   `com.rideguard.app`, version 1.0.0 / code 1, min SDK 24, target 36, ARM64.
   Version configuration was not changed. Existing RideGuard signing certificate
   SHA-256: `bf11f0e1dd6478c4e78718c1e5d21b933dbcd9820c986d4b7014e61c9f0523ee`.
6. Packaged `assets/index.android.bundle` matches the generated bundle byte for byte.
   It contains Refresh message status, SOS ended message, Delivery checked,
   Retry status, Awaiting delivery confirmation, and the refresh-status route.
   This establishes packaging, not UI behavior on a phone.
7. Git diff whitespace checks passed. The existing uncommitted mobile work was
   saved before editing at `C:/Sharks/RideGuard/.task-evidence/mobile-before.patch`.
   Trigger-screen and permission-adapter changes were left untouched.

## Acceptance evidence

“Local pass” means controlled logic, HTTP, or emulator evidence. It never means
physical phone behavior or a real carrier receipt. Related test names are in
`rideguard-node/src/modules/sos/sos.service.spec.ts`, the SMS specs, and
`rideguard-mobile/scripts/test-sos.cjs`. Emulator tests are under SOS infrastructure.

| Scenario | Evidence and limits |
| --- | --- |
| AT01 | Local pass: service persists pending/sent/delivered; mobile polling scheduler and HTTP store/client transitions tested separately; original-send counters unchanged. Phone progression still needs device validation. |
| AT02 | Local pass: message sent overrides completed batch; UI mapping remains Sent. |
| AT03 | Local pass: rejected authentication outcome and service-side failure guidance; no resend. |
| AT04 | Local pass: accepted submission retained with separate confirmed delivery failure. |
| AT05 | Local pass: sent/check time preserved through lookup errors; no additional send. |
| AT06 | Local pass: five-minute boundary stops checks, preserves progress; UI maps unconfirmed. |
| AT07 | Partial: disposed/background polling controller stops reads; persisted worker has independent scheduling. Actual navigation blur and Android background behavior untested without a device. |
| AT08 | Partial: saved-request restoration, entry fetch, deadline and final-read logic tested. Actual Android resume before/after deadline untested. |
| AT09 | Local pass: new worker instances recover durable evidence without changing provider/device/deadline. Emulator tests simulate worker replacement; no OS process-kill test. |
| AT10 | Local pass: Firestore competing refresh/claim transactions coalesce; process cap two; zero additional sends. |
| AT11 | Local pass: stale claimed pending result cannot replace delivered, including emulator revision fencing. |
| AT12 | Local pass: distinct initial/end provider IDs; independent mobile HTTP rows. |
| AT13 | Local pass: mixed per-contact labels and independent initial/end HTTP evidence. Visual card layout still untested on Android. |
| AT14 | Local pass: missing delivery/job fields accepted; original submission evidence retained. |
| AT15 | Local pass: frozen previous mobile parser accepts enhanced fields and unchanged submission enums. Installed old APK not exercised. |
| AT16 | Local pass: authenticated HTTP and service owner checks return 404 without lookup/send leakage. |
| AT17 | Local pass: failed GET then recovery resets backoff, preserves prior data and provider timestamps. |
| AT18 | Local pass: logout/owner switch ignores delayed responses and disposes polling. Android account-switch UI not exercised. |
| AT19 | Local pass: repeat stop/recovery is idempotent with accepted messages awaiting delivery; no duplicate end update. |
| AT20 | Local pass: explicit late recheck, saved job, unchanged window, one status lookup, no new send. |
| AT21 | Partial: all existing permission, interruption, cancellation and lost-response logic regressions pass. Actual native permission activity needs device testing. |
| AT22 | Blocked: no attached Android device. TalkBack, large font, small-screen layout, touch targets and Stop usability have code-level implementation only. |
| AT23 | Local pass: controlled clock proves immediate/5s/15s cadence, no missed-tick burst and exact 300s cutoff. |
| AT24 | Local pass: 29s denied, 30s accepted; pending jobs coalesced. |
| AT25 | Local pass: real HTTP 429 parsing, numeric/date Retry-After, shared worker cooldown and emulator persistence. |
| AT26 | Local pass: emulator live-lease exclusion, reclaimed revision and stale claimant fencing. Worker replacement simulated. |
| AT27 | Local pass: manual 60s expiry completes as unavailable/partial, late evidence cannot revive job; mobile deadline stops job polling. |
| AT28 | Local pass: actual HTTP adapter uses saved original device after default changes. |
| AT29 | Local pass: confirmed failed initial delivery excluded by stop and recovery; submission remains accepted. |
| AT30 | Local pass: real HTTP delivery_failed is uncertain; unknown cannot erase sent or become historical confirmed failure. |
| AT31 | Local pass: fresh GET changes mobile Updated time while retaining two distinct provider-check times. |
| AT32 | Local pass: terminal messages skip checks; nonterminal messages retain independent work/results. |
| AT33 | Local pass: final/missing-ID/foreign cases schedule no provider/send work and return honest results. |
| AT34 | Local pass: GET failure preserves confirmed lifecycle and contact data; stop still works. Native presentation untested. |
| AT35 | Partial: worker is independent of mobile and activation flag; durable results tested; source adds no push/sound/vibration. Actual app closure/reopen and absence of device notifications untested. |
| AT36 | Local pass: old response fields supported; refresh-route 404 performs one owned GET; second 404 shows unavailable, with no resend. |

The feature is not fully device-verified. No scenario requiring native lifecycle,
screen-reader or real carrier behavior is marked passed on that basis.

## APK and remaining checks

APK: `C:/Sharks/RideGuard/rideguard-mobile/android/app/build/outputs/apk/release/app-release.apk`

Size: **58,787,461 bytes**. SHA-256:
`6065fe9917ee7df7fdb1781b24d2217bd0ac7e3381e6edf4c3196bde5a98c78e`.

1. Install over a compatible signed installation; verify login and backend reachability.
   Native version code remains 1; distribution/versioning is outside this local build.
2. Use an isolated fixture backend to inspect both rows, live progression, mixed
   failures, offline retry, timeout, background/resume, logout and repeated Stop.
   The APK uses existing local environment configuration; do not activate SOS against
   a live backend to perform these fixture checks.
3. Check TalkBack announcements, theme preference, large fonts, 44px refresh target,
   small screen scrolling and visible Stop controls. Check native permission prompts.
4. Verify app closure produces no added notification, sound or vibration and reopening
   loads persisted results. No live SMS/carrier tests were authorized or performed.

Rollout requires the documented ascending `sos.deliveryDueAt` single-field index,
then backend, then mobile. No history backfill is needed or appropriate. At the local
verification checkpoint, no deployment, Azure change, credential rotation, live SMS,
commit, push or Postman publication had occurred. Feature-branch commits and PRs were
authorized afterward; deployment and live SMS remain outside that authorization.

## Files changed

Paths below are relative to their repository. “Added” means created in this task.

Backend:

- `src/modules/sos/sos.types.ts`, `sos.constants.ts`, `sos.service.ts`,
  `sos.controller.ts`, `sos.module.ts`, `sos.service.spec.ts`.
- Added `src/modules/sos/sos-delivery.ts`, `sos-delivery.worker.ts`.
- `src/modules/sos/infrastructure/sos.repository.ts`; added
  `sos-delivery.emulator.spec.ts` in that directory.
- `src/infra/sms/sms.types.ts`, `sms-status-checker.interface.ts`,
  `sms-delivery-tracker.ts`, `textbee.adapter.ts`, `textbee.status.spec.ts`;
  added `textbee.http.spec.ts`.
- `firestore.indexes.json`, `docs/v1-sos-routes.md`,
  `docs/postman/RideGuard_SOS.postman_collection.json`.
- Added `postman/mocks/textbee-status/config.yaml`, `default.js`, and
  `postman/simulations/sos-provider.sim.yaml`, `sos-provider.context.md`.

Mobile:

- `src/modules/sos/types.ts`, `services/sos.api.ts`, `store/sos-session.ts`,
  `hooks/use-sos-lifecycle.ts`, `screens/sos-active-screen.tsx`.
- Added `src/modules/sos/store/sos-polling.ts`.
- `scripts/test-sos.cjs`; added `scripts/fixtures/sos-legacy-parser.cjs`.
- `postman/mocks/rideguard-sos/default.js`; added
  `postman/simulations/sos-mobile.context.md`.
- `docs/MANUAL_SOS.md`; added this verification record.

Pre-existing edits retained: `screens/sos-trigger-screen.tsx` and `store/sos.store.ts`
were not edited by this task. Existing changes in the hook, session store and test
script were extended without removing the permission/cancellation fix.

Workspace-only evidence and helpers are under `C:/Sharks/RideGuard/.task-evidence/`.
Generated APK/build output remains outside source control.
