# Hardware status and Quick Button navigation

## Button heartbeat implementation

The local `rideguard-node` and `button` repositories now implement authenticated
button heartbeats. Deploy the Node change and flash the new firmware before
expecting live presence. No production deployment or physical flash was done.

The button sends `POST /v1/devices/:device_id/heartbeat` using its existing
device secret every 30 seconds while the event worker is idle. The backend
records a server timestamp and considers it online for 90 seconds. Mobile reads
the authenticated `GET /v1/devices/buttons` list through an account-scoped store
shared by Home, Settings and the press test. The list also restores a claimed
Button ID on another installation. A 404 from an older deployment retains the
local pairing and shows Status unavailable; an outage shows Unavailable.

The backend's `docs/BUTTON_PRESENCE.md` and
`docs/postman/hardware-presence.postman_collection.json` describe authentication,
the wire format and rollout. Hardware credentials never enter the mobile app.

## Mobile changes

Settings opens `/(app)/devices/quick-button` directly. The screen uses the existing
short-press artwork, theme and hardware event recognition. It stays inside the
authenticated app stack instead of entering onboarding and its setup restore
checks. The screen has an explicit way back to Devices and keeps subscription
failures visible with Retry.

If this installation has no Button ID for the account, the press screen offers
Enter Button ID. A successful claim opens the short-press test instead of closing
back to Devices. Events still require an exact match to that claimed ID; the app
does not discover or claim another account's button from the shared event channel.

Home and Settings now share `homeDeviceCards` and the account-scoped camera status
store. Settings and its camera preview use the backend's external-camera order
instead of stale local camera slots. Phone cameras remain separate. Refresh status
requests an immediate update; the existing focused-screen polling runs every
15 seconds. A malformed or failed camera response keeps the last assignment and
shows Unavailable instead of clearing it or reporting a successful empty list.

## Earlier deployed-contract audit

Inspected `rideguard-node` origin/staging `6534611a121ae0b7f614c9187977146703ef3ba5`
locally on 2026-10-29. No backend deployment was changed.

- `GET /v1/devices/cameras` returns assigned cameras with `device_id`, `source`,
  `stream_url`, `online`, and `last_seen_at`. Camera `online` uses the backend's
  heartbeat freshness window; polling cannot make a powered-off camera disappear
  before that window expires.
- The inspected controller exposes no authenticated list/presence endpoint for
  buttons. Its HTTP button-event handler only logs events. The app's Ably
  subscription being attached proves that the phone can receive events, not that
  the physical button is powered on.
- Under that older contract a claimed button shows Status unavailable with a physical-test action.
  Continuous online/offline synchronization and restoring assigned Button IDs on
  another installation require an authenticated backend inventory/presence route
  and firmware heartbeat/disconnect evidence. Neither pairing success nor a past
  press is sufficient for an ongoing online indicator.

These are the earlier contract's limits. The heartbeat implementation above
addresses them locally; deployment and physical-device verification remain pending.

## Validation

Navigation tests cover the Settings entry without query parameters, both button
visuals, waiting/Retry states, missing ID entry, successful claim to test, and
unchanged onboarding short-to-long progression. Camera tests cover stale local
IDs, shared backend assignments, preview selection, explicit refresh, account
changes and failed/malformed status responses.

The local Postman simulation uses fixtures derived from the inspected controller
and service. Postman is signed out, so an owning-team mock search was skipped.
It runs the real mobile HTTP client, API adapters, camera store and card mapper
against local HTTP responses, including online/offline changes, 503, malformed
success, retry, empty assignments, authorization failure and button claim. It
does not establish live server, physical button or phone behavior.

Run in separate terminals:

```powershell
postman simulation run postman/simulations/devices-mobile.sim.yaml --port 4969 --no-history
```

```powershell
$env:DEVICE_SIMULATION_URL = 'http://127.0.0.1:4969/rideguard'
node scripts/verify-device-status-simulation.cjs
```
