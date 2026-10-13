# Phone camera capture implementation plan

Status: requirements confirmed; implementation and device validation pending. No application code has been changed.

## Objective

Let a user start phone camera capture in RideGuard, leave the app, and continue sending JPEG frames to the model API. Reuse the current detection, live viewing, and alert pipeline.

## Confirmed scope

- Android only. Test device: Infinix GT 50 Pro running Android 16, as supplied by the user.
- Support background capture; attempt locked-screen capture and validate it on this phone before promising support.
- Phone and ESP32 can operate simultaneously with separate device IDs and independent sessions.
- Mobile Start/Stop controls only phone frames sent for model processing. Hardware-button integration is outside this feature.
- Front camera is the default. Allow front/rear selection before starting a session.
- Automatically stop each phone session after 10 minutes unless the user stops it earlier.
- Capture and upload one JPEG frame per second. Put the interval in a shared configuration constant so it is easy to change.

### Timing configuration and behavior

Use one shared mobile configuration module, proposed as `src/shared/constants/phone-capture.ts`:

```ts
export const PHONE_CAPTURE_INTERVAL_MS = 1_000;
export const PHONE_CAPTURE_SESSION_DURATION_MS = 10 * 60 * 1_000;
```

Pass these values into the native service when starting. Validate them there and snapshot them for that session; do not duplicate timing defaults across screens and native code. JavaScript provides configuration, but native code owns scheduling and shutdown while the screen is locked.

Start the 10-minute deadline when the native service accepts Start. Use monotonic elapsed time so clock changes cannot extend a session. Connection retries, camera interruptions, app navigation, and repeated Start calls must not reset this deadline. Check the deadline before capture, upload, and reconnect, as well as using a native stop callback. Discard pending unsent frames on expiry and release the camera, socket, workers, notification, and any wake lock. Already submitted frames may finish inference after capture stops.

Show `Session completed` after automatic stop. A new session requires another explicit Start. Do not automatically loop or resume a completed session. Capture interval controls sampled frames sent to the API; the camera sensor itself may run at a higher internal frame rate.

## What already exists

- Expo/React Native mobile app with an Android project and development client.
- Camera screen displays server MJPEG streams; it does not capture phone frames.
- ESP32 sends binary JPEG messages to `/v1/inference/stream?device_id=<id>`.
- Model API also accepts raw JPEG through `POST /v1/inference/frame` with `X-Device-Id`.
- WebSocket ingestion defaults to sampling inference every 0.5 seconds. Frame size defaults to a 2 MiB limit. Deployment settings can override both.
- The Node service maps camera IDs to users for alerts and push notifications.
- Device registration currently requires admin/manufacturing privileges. Camera IDs follow `CAM-123-ABC` conventions.
- Camera online status currently depends on stream URL reports within 90 seconds, rather than directly on model API frame arrival.
- The inspected frame WebSocket route accepts a device ID without verifying ownership. A device ID is not an upload credential.

## Requirements

| Area | Requirement |
| --- | --- |
| Build | Android SDK/JDK compatible with the checked-in project, a native development build, and a physical test phone. Native changes require a new binary. |
| Native module | Local Expo module written in Kotlin, camera capture using CameraX, a camera foreground service, and a native WebSocket client such as OkHttp. Pin compatible dependency versions during implementation. |
| Permissions | Camera runtime permission; `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_CAMERA` declarations; a service declared with type `camera`; notification handling for supported Android versions. Notification denial must have defined behavior. |
| Session | Start while the app is visible; capture at a configurable 1-second interval and stop after a configurable 10 minutes. Provide an ongoing notification with Stop. Do not promise automatic restart after force-stop or reboot. |
| Identity | Server-issued camera ID associated with the signed-in user and this installation. Repeated registration must not create duplicates. |
| Network | Reachable model API; authenticated mobile uploads over WSS for deployment; bounded sending and reconnects. |
| User feedback | Distinguish capturing, connecting, uploading, interrupted, and stopped. Local capture does not prove the server is receiving frames or running inference. |
| Verification | Real-device background and screen-lock tests, plus registration, upload, alert routing, and ESP32 regression checks. |

## Implementation sequence

### 1. Prove background capture on the target phone

Build a small native camera service behind a development-only control. Start it while the app is visible. Count frames without saving images. Test Home, app switching, screen lock, returning to the app, and Stop from the notification.

The service must own the camera lifecycle independently of the React screen. Report service state back to JavaScript. Check whether screen-off execution requires a narrowly scoped partial wake lock; add one only if justified and release it on every stop/error path.

Pass condition: sampled capture continues at one frame per second during a 10-minute background/lock trial on the Infinix GT 50 Pro with Android 16, then stops automatically. Also verify early manual stop. This establishes feasibility on this phone, not universal device reliability.

### 2. Define phone registration and upload contracts

Add a signed-in-user registration flow that creates or returns this installation's phone camera. Retain camera device type and valid CAM IDs; add source metadata such as `phone` versus `esp32`. Do not require users to invent an ID or hold admin credentials.

Define registration, session start/end, upload authorization, and presence request/response/error shapes before implementation. Select exact endpoint names after checking repository conventions. Keep contracts and runnable HTTP checks in the repository.

Choose an upload authorization mechanism that can refresh from native code while JavaScript is suspended. A proposed option is a device-scoped credential stored using Android-backed secure storage, exchanged for short-lived session tokens. Validate device ownership, expiry, revocation, and account changes. Keep credentials out of URLs and logs.

Explicitly define how the mobile-authenticated upload path coexists with existing ESP32 clients. A separate authenticated mobile route can reuse the same ingestion function if changing the current route would break firmware. Do not silently break hardware uploads or imply that the legacy route becomes secured by this change.

Pass condition: retries return the same phone camera, another account cannot upload under its ID, and credential renewal works without an active React screen.

### 3. Implement backend registration, sessions, and presence

Implement the agreed contracts in the Node service and model API. Enforce ownership server-side. Define logout, reinstall, account switching, duplicate sessions, and credential revocation behavior.

Track phone presence using accepted frames or session activity, with a timeout after disconnect. Keep phone presence separate from the ESP32's local stream URL reporting. Make camera listing expose source and state so the UI can display the phone correctly.

Allow phone and ESP32 streams concurrently with separate camera IDs. Starting or stopping the phone must not change the ESP32 session. Existing button pairing returns cameras sharing an owner: exclude phone sources from hardware-button evidence capture so registration does not accidentally add button behavior to this feature. Preserve existing ESP32 pairing.

Pass condition: registered phone cameras appear for their owner, become online while sending, and become offline after stop or timeout.

### 4. Implement native JPEG capture and upload

Add native start, stop, current-status, and status-event interfaces. Keep camera frames and network sending in native code; do not pass every frame through JavaScript.

Use CameraX image analysis, fix frame rotation, close every frame buffer, and encode JPEG on a worker thread. Sample one frame every `PHONE_CAPTURE_INTERVAL_MS` (default 1 second), dropping intermediate frames before encoding. Proposed image settings: 640x480 and JPEG quality around 70, subject to accuracy, bandwidth, and heat measurements. Keep the existing server inference sampling setting initially. Verify actual inference cadence and temporal violence-model behavior at 1 fps; do not assume accuracy is unchanged from the ESP32 cadence. Never send catch-up bursts after missed intervals.

Send one binary JPEG per WebSocket message. Bound both encoding work and the socket's queued bytes; drop stale frames instead of growing a backlog. Reconnect with capped exponential backoff and jitter. After a network outage, send fresh frames rather than replaying old ones. Respect server frame-size limits.

If reliable delivery status is required, add lightweight server acknowledgments or session statistics. A successful local socket send alone is not proof of inference.

Pass condition: correctly oriented phone frames enter inference at the configured upload cadence; connection loss does not cause growing memory use or stale-frame replay. The native 10-minute deadline stops capture and uploading even while JavaScript is suspended or the network is unavailable.

### 5. Add the mobile controls

Add phone setup, front/rear selection with front selected by default, preview, Start, Stop, remaining session time, and status text. Disable lens changes during capture; Stop allows selection before the next session. Explain camera permission when starting. Allow preview to detach while the service keeps capturing. Phone controls must coexist with ESP32 viewing. If the front camera is unavailable, show the available rear-camera choice.

When the screen remounts, read state from the native service. Do not assume capture stopped when the UI unmounted. Stop capture on logout and handle permission revocation and camera contention with a visible state and recovery action.

Pass condition: the app and notification agree on session state and remaining time, repeated Start cannot create duplicate services or extend the deadline, and manual or automatic Stop closes the camera and connection. Reopening the app after expiry shows a completed session.

### 6. Verify detection and alerts

Run phone frames through model inference, existing result publishing, Node alert creation, and user push delivery while the app is backgrounded. Verify the phone's camera ID reaches the correct owner.

The current result handler produces a nonempty `Nothing was detected here` message and checks only whether a message exists before creating an alert. Verify intended behavior and fix or explicitly resolve this before accepting continuous-capture alert tests.

Phone Start/Stop controls only the phone's inference stream. Do not emit hardware-button events or start the separate button-triggered evidence capture workflow. Verify simultaneous ESP32 detections remain associated with the ESP32 device ID.

Pass condition: threats follow the intended alert policy, non-threat frames do not produce unwanted notifications, and delivery works with the screen locked.

### 7. Test full sessions and failures

Use a release-like build without reliance on Metro. Test repeated 10-minute sessions on the Infinix GT 50 Pro with Android 16, including full locked-screen sessions and simultaneous ESP32 streaming. Record the actual model and OS details from the device when testing.

| Scenario | Expected result |
| --- | --- |
| Switch apps / lock screen | Capture continues on validated devices; interruption is reported if it occurs. |
| Return to app | Correct current status; no duplicate camera session. |
| Stop from app / notification | Camera, socket, workers, and any wake lock are released. |
| Automatic stop at 10 minutes | No new capture/upload after the deadline; resources released; UI shows completion on return. |
| Disconnect near expiry | Session still ends at its original deadline; reconnect cannot restart it. |
| Interval constant changed | Native sampling follows the configured interval without editing separate timing literals. |
| Front/rear selection | Front is default; selected lens produces correctly oriented frames; selection is fixed during a session. |
| Network loss / Wi-Fi to cellular | Bounded retries, truthful status, fresh frames after reconnection. |
| Token expiry / revocation | Native renewal where permitted; rejected access stops or reports an actionable error. |
| Permission denied / revoked | Clear state; no crash or retry loop. |
| Camera used by another app | Interruption is handled; recovery respects Android restrictions. |
| Force-stop / reboot | Capture is stopped; the user reopens the app to start again. |
| Logout / account switch | Old capture stops; frames cannot route to the wrong account. |
| Two sources / duplicate sessions | Phone and ESP32 run concurrently; stopping the phone leaves ESP32 running; repeated phone Start does not duplicate or extend its session. |
| Full session | Measure battery, heat, memory, sent/received frame rate, data use, and alert latency across 10 minutes. At 1 fps, expect approximately 600 sampled frames under uninterrupted conditions; accepted and processed counts may be lower. |
| Existing ESP32 | Upload, viewing, detection, and button capture still work. |

Use automated tests for ownership, duplicate registration, session expiry, native scheduling/deadline behavior, presence timeout, malformed/oversized frames, and alert mapping. Test that reconnects and duplicate Start cannot extend the deadline and that clock changes do not affect elapsed duration. Verify button camera resolution excludes phone sources. Use a WebSocket-capable integration test for binary uploads. HTTP-only checks do not establish background camera behavior.

Pass condition: the selected full-session target passes and measured limitations are recorded. Do not claim general Android reliability from a single phone trial.

### 8. Release and document

Deploy compatible backend changes before distributing the native app build. Keep phone capture behind a feature flag initially. Record supported devices, tested duration, operating instructions, and measured data/battery use. Rollback disables phone capture while preserving ESP32 operation.

## Architecture

```text
Start in RideGuard
  -> native Android camera foreground service
  -> CameraX frame -> JPEG -> authenticated WebSocket
  -> model API ingestion and inference
  -> existing result publisher -> Node alert handling -> user push

React screen <-> native service status and controls
Node device registration <-> phone identity, ownership, session and presence
```

## References

- Android camera foreground service requirements: https://developer.android.com/develop/background-work/services/fgs/service-types
- Android service declarations: https://developer.android.com/develop/background-work/services/fgs/declare
- CameraX image analysis and dropping stale frames: https://developer.android.com/media/camera/camerax/analyze
- Expo custom native code and local modules: https://docs.expo.dev/workflow/customizing/

This plan comes from repository inspection and official platform documentation. No native proof of concept, live API calls, or device tests have been run for this feature yet.
