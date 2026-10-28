# Hardware unpairing for another account and phone

## Required behavior

The app's **Disconnect** action means **unpair this specific ESP32 camera or Quick
Button from the authenticated account**, allowing another account on another phone
to claim that same hardware ID. It must not merely mark the hardware offline.

This contract is prepared for backend implementation. It is **not implemented or
deployed** in inspected backend commit `398e2f268779dbc8e70c59b522c0e730ade983f4`.
The existing `POST /v1/devices/disconnect` preserves `assignedUserId`; it cannot
meet this requirement. The frontend no longer accepts its response as unpairing.

## Proposed endpoint used by the frontend

```http
POST /v1/devices/release
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{ "device": "camera", "device_id": "CAM-111-AAA" }
```

`device` must be `camera` or `button`; `device_id` is required. No implicit `all`
target and no caller-supplied account UID. The account comes from verified auth.

Return only after ownership removal has committed:

```json
{
  "success": true,
  "data": {
    "released": true,
    "device_id": "CAM-111-AAA",
    "device_type": "camera",
    "assigned_user_id": null
  },
  "message": "Hardware unpaired successfully"
}
```

The data describes the confirmed release operation. It must not be fabricated from
an offline flag. The frontend requires every field above to match before clearing
that account's local slot/activation. Failure/timeout leaves the local device intact;
there is no fallback to the soft disconnect route.

## Ownership change

1. Validate the authenticated user and the explicit hardware ID/type.
2. Verify current ownership transactionally, not only before an asynchronous write.
3. Keep the device record, ID and manufacturing credential hash; do not delete the
   hardware or expose its secret. Reject phone-camera virtual devices on this route.
4. Clear `assignedUserId`, `connected`, stream/presence/session state, and advance an
   ownership generation. Revoke old account commands, subscriptions/authorizations and
   pending capture/session access as supported by the actual infrastructure.
5. Make release/claim races safe through transactional ownership checks. A retry while
   unowned may succeed only with proof it repeats that caller's release; an old owner
   must never unpair the device after someone else claims it. Define a durable release
   receipt/idempotency policy and an owned-device reconciliation API for timeout cases.
6. Only after release can the existing claim-device route assign it to the next UID.
   New-owner setup/preview/activation must be performed for that account.

## Privacy blocker: historical alerts must not transfer

The inspected backend currently authorizes alerts by device ownership:

- `AlertsService.getAlertsByAssignedUserId` obtains the user's current device IDs.
- `AlertsRepository.findNonFalseAlarmsByDeviceId` queries historical alerts by those IDs.
- `AlertsRepository.findOwnedData` also checks the alert's device ID against current
  assignments, rather than checking an immutable incident owner.

Simply clearing and reassigning a device could therefore expose the old owner's
alerts/media to the new owner. **Do not ship ownership release alone.**

Before allowing transfers:

- Bind every alert, clip/image reference and capture/session request to an immutable
  account owner and ownership generation at creation. Query/authorize by that owner,
  not the device's current account. Preserve the original owner's records according
  to the existing retention policy; do not delete their history as a workaround.
- Migrate legacy records to their proven original owner. Do not guess an ambiguous
  owner. Reject/quarantine transfers until the device's historical records are safe.
- Bind in-flight inference results/button actions to their original ownership
  generation. Resolve late results safely instead of delivering old frames to whoever
  owns the device when processing finishes. `InferenceHandlingService` currently
  resolves the owner after saving, so this path needs explicit review.
- Scope realtime and media authorization accordingly, including stale tokens, signed
  links and cached device lists on the old phone. Clearing an app cache does not revoke
  a token or a directly reachable LAN camera stream; audit the actual firmware/network
  controls before claiming those connections have been revoked.

## Error contract

- 400: missing ID/type, wrong hardware type, unsupported virtual phone camera.
- 401: missing/invalid/expired user authentication.
- 403/404: caller does not own the device; avoid exposing another owner's details.
- 409: ownership changed or historical-data migration/active handoff prevents release.
- 503: dependent service unavailable; no unpair-success response.

Avoid raw provider errors or credentials in logs/responses. The existing global
Firebase guard is required; apply server app-unlock authorization when that broader
security contract is implemented.

## Edge-case acceptance tests

| Scenario | Expected outcome |
|---|---|
| Release Camera 1 | Only that ID is unassigned; Camera 2 and button stay intact. |
| Release button | Button is unassigned; cameras stay intact. |
| Offline hardware | Authorized release works without requiring a live connection. |
| Same account on two phones | Both inventories reconcile the released device. |
| Other account attempts release | Denied; ownership and local caches stay intact. |
| Double tap / retry | One operation; safe repeat or defined reconciliation. |
| Network timeout after commit | No invented local success; reconcile using receipt/owned inventory. |
| Old owner retries after new claim | New ownership remains intact. |
| Simultaneous claims by two accounts | Exactly one successful owner. |
| Account switch while request runs | Late result cannot clear the new account's local slots. |
| Historical alert/media access | New owner sees none of the previous owner's data. |
| Pending inference or button event | Cannot deliver old-owner data/actions into the new account. |
| Local missing/blank ID | No bulk request is sent. |

## Current delivery status

Frontend confirmation, request path and strict ownership-removal response validation
are prepared. The inspected backend still has **no true unpair endpoint** and its
alert authorization needs the isolation changes above. This feature will report
unavailability until backend implementation/deployment; it is not yet a working
cross-account hardware transfer. Do not report it as live based on mocked tests.
