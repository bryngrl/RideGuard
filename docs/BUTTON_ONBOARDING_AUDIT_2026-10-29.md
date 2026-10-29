# Quick Button onboarding integration

Backend reference: fetched `origin/staging` at `a765469` from rideguard-node.
No backend checkout, firmware, device assignment or live SOS was changed.

## Confirmed connections

- `ButtonProvisionScreen.handleConnect` claims the entered button through
  `PATCH /v1/devices/claim-device/:device_id` with the Firebase ID token. The local
  account's button ID is updated only after the request succeeds.
- Onboarding continues to the existing short-press screen, then the long-press
  screen, then MPIN. Skipping Camera 1 skips Camera 2 but still opens Quick Button
  connection. Settings now opens the short-press test directly inside the app
  stack; a missing local Button ID offers ID entry and returns to that test after
  claiming. Completing the Settings test returns to Devices.
- `/auth/ably-token` grants subscription to `rideguard:buttons:device` in staging.
  This is an internet/Ably integration, not a direct phone Bluetooth connection.

## Frontend fixes

- The button test subscribes only while focused and foregrounded. Blur,
  backgrounding, account/device changes and Retry dispose the prior connection.
- Pending authentication/subscription callbacks cannot update a disposed screen.
- Only the currently claimed button's `device_id` is accepted. Duplicate event IDs
  are ignored within the subscription. Invalid/unknown payloads are ignored.
- `button.pressed` actions START_CAPTURE/STOP_CAPTURE recognize white short presses;
  FALSE_ALARM/CANCEL_SOS recognize red short presses; SOS recognizes red long press.
- `button.press_started` and `button.press_released` with `button: "SOS"` update the
  pressed artwork. A release duration alone does not invent a successful SOS action.
- The UI distinguishes an unavailable/connecting subscription from waiting for a
  physical press and provides Retry. Normal disposal no longer opens LogBox.

## Backend/firmware dependencies and limits

- `DevicesService.handleButtonEvent`, used by the older HTTP
  `POST /devices/button-event/:device_id/:button_event`, only logs the event in
  staging. It does not publish an Ably event. Hardware using only this HTTP route
  cannot update these test screens until the backend publishes the agreed events.
- Firmware must publish the documented `button.pressed` and optional SOS hold
  events to Ably using the device's credentials. Never embed device secrets or an
  Ably API key in the mobile app.
- Staging's `ButtonHandlingService.handleEvent` also currently logs validated
  events; its comment leaves capture/SOS business logic for later work. UI test
  recognition does not prove end-to-end capture or emergency-message delivery.
- Backend tokens currently grant every user subscription to the common button
  channel. The frontend filters IDs for UI correctness, but backend-scoped channels
  and ownership authorization are needed for privacy enforcement.

## QA evidence

Focused automated tests cover action mapping, malformed/other-device payloads,
hold artwork, duplicate delivery, focus/background cleanup, reconnect, subscription
failure and token completion after leaving. Existing tests cover both short presses,
red long-press recognition, timeout/Retry and camera-skip navigation.

Final regression run: 326 tests passed, zero failures/skips. TypeScript and
targeted whitespace checks passed.

Physical onboarding verification is blocked by the observed HTTP 500 from
`/auth/is-old-user`. No hardware press was generated and no end-to-end hardware pass
is claimed. Once authentication recovers, test the claimed button's white/red short
presses, then its red long press, as well as background/resume and reconnect.
