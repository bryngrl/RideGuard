# Backend API synchronization - 30 October 2026

## Versions and scope

Fetched `XpnsiveSharks/rideguard-node` without changing its working files.
Frontend work remains on `develop`, retaining the earlier login diagnostics.

- Target backend: `staging`, **56882eeae24dcb70a1c4a7de3ca572d7a25edac3**.
- Compared the changes since the last mobile integration baseline, `a765469`.
- `development` is **718585ff2d9e9a2d8fc8fffc6f9e21cb48db353d** and does **not**
  yet include staging's new registration-code and password-change commits. Use a
  compatible server when testing this frontend; merge/promotion is backend work.
- Inventoried all **80 controller routes**, compared changed controllers, DTOs,
  services and public responses with frontend consumers, and inspected relevant
  guards and lifecycle code. The full route inventory follows below.
- No backend, Firestore, firmware, signing secrets or production credentials were
  changed. No real password, email verification code, SOS or device mutation was
  submitted during verification.

Backend source: [staging revision](https://github.com/XpnsiveSharks/rideguard-node/tree/56882eeae24dcb70a1c4a7de3ca572d7a25edac3).

## Connected changes

| Contract | Frontend behavior |
| --- | --- |
| POST `/auth/change-password` | Settings > Change password, also searchable. Sends the authenticated `{ currentPassword, newPassword }` contract. Current/new/confirmation validation, double-submit prevention, honest failure/timeout feedback and both backend success flags are required. Passwords remain in memory and clear on leaving. Google-only accounts see provider guidance; linked password accounts can use the form. |
| Password-change session revocation | After confirmed success, a memory-only success screen directs the user to log in again. Local native capture stops, Firebase/Google sign-out runs, and existing server-logout/push cleanup uses the captured old token. Network cleanup cannot hold the local session open. Late responses cannot sign out another account. MPIN's allowed resume paths include the new Settings page. |
| POST `/auth/register` - changed behavior | Backend now emails a code itself. Removed frontend Firebase sign-in/email-link delivery from creation, avoiding duplicate/conflicting verification mechanisms. A failed or timed-out registration offers entry to verification/resend without claiming account creation succeeded. |
| POST `/auth/verification/verify` | Existing Check Email route now uses the shared six-digit code input. The backend must confirm the expected email and UID. Firebase password sign-in, fresh verified token, backend identity/profile checks and existing onboarding routing follow. Only then is the Account Verified countdown armed. Missing passwords after restart are entered in the app, never recovered from storage. |
| POST `/auth/verification/resend` | Uses real backend resend, a visible cooldown, and server-authoritative rate-limit/expiry errors. Old code success is never inferred from a resend or a route parameter. |
| Removed POST `/auth/register/verify` | Removed the active client call. Profile validation accepts an existing verified identity stub; an absent backend profile stays blocked with a setup error. Legacy Firebase action-link handling remains, returning verified link users to sign-in instead of pretending the retired route is available. |
| POST `/auth/login` - unverified 403 | Existing structured `ACCOUNT_UNVERIFIED` detection now opens code verification and retains the password only in memory. It does not attempt to create a session or send an obsolete verification link first. |
| Restart checkpoint | Registration stores only public email/username/checkpoint/cooldown fields. Passwords, confirmation values, codes and grants are excluded. Startup resumes pending code entry. |
| GET `/devices/buttons` | The existing inventory adapter already matches the new `{ device_id, online, last_seen_at }` contract. Account-scoped stores, focused polling and unavailable/offline distinctions remain connected. Device heartbeat traffic belongs to firmware and requires its secret; the mobile app does not manufacture presence. |
| POST `/devices/disconnect` | Hardware now exposes the actual soft-disconnect operation, targeting one explicit ID/type. An exact server confirmation is required, including the already-offline case. Refreshes server presence, retains pairing/activation data and never claims unpairing. The device may reconnect on its next report. |
| Hardware actions | Unpair was removed at the user's request. Hardware exposes only the supported Disconnect action, which retains pairing. The unused release request was removed. |
| GET `/alerts/:alertId/sos` and SOS changes | Added the alert-specific, read-only Response panel: validates the matching alert, distinguishes an explicit unlinked result from errors, shows actual start/end message states, and supports refresh. Reading status never sends or stops an SOS. Existing activation, recovery lookup, status and stop remain wired; public response contracts remain compatible. New station incident creation runs on the backend during SOS. Operator acknowledgement is an operator-only route and is not exposed in the rider UI. |
| Remaining controllers | Existing profile/contact/photo, auto-archive, push, phone-camera, MPIN code and logout contracts remain connected. Server-only manufacturing, upload verification and health routes keep their existing consumers. |

Local theme, location and notification preferences have **no corresponding new
backend endpoints**. Their established local persistence is retained; service
comments now identify that accurately rather than documenting planned routes as
available APIs.

## Live route probes

Sent empty, invalid JSON bodies without credentials or email addresses. DTO/auth
validation prevents any registration, email or password mutation.

| Route | Observed HTTP status |
| --- | --- |
| POST `/auth/verification/verify` | 400 |
| POST `/auth/verification/resend` | 400 |
| POST `/auth/change-password` | 401 |
| POST `/auth/register/verify` | 404 |

These observations confirm route availability/removal on the configured Azure
server. They do not prove its exact Git revision, SMTP delivery, authenticated
Firestore performance or successful password mutation.

## Backend follow-up findings

1. **Revoked-token enforcement:** `changePassword` calls `revokeRefreshTokens`, but
   the global guard calls `verifyToken` with its default `checkRevoked = false`.
   Existing ID tokens may remain usable until expiry. Local logout is implemented;
   immediate revocation of other devices requires backend enforcement and tests.
2. **Verification atomicity:** email verification marks the Firebase user verified
   before finalizing the pending profile and consumes the code afterward. A failure
   between those operations can leave a verified user without a profile; retries
   then return 409. Concurrent code attempts/consumption also need server review.
   The frontend does not bypass the missing-profile check.
3. **SMTP/deployment:** registration needs `SMTP_*`, `VERIFICATION_CODE_PEPPER`,
   TTL/attempt/cooldown configuration and real inbox testing. A send failure can
   leave the account committed; the UI offers real resend recovery.
4. **Deletion recovery:** the existing deletion routes were not newly changed in
   this synchronization. Scheduling disables Firebase sign-in and revokes refresh
   tokens, while cancellation needs a valid bearer token. Define recovery after
   token expiry/on another phone before enabling a rider deletion UI. The default
   grace period alone does not establish a usable cancellation flow.
5. **Hardware scope:** the user requested Disconnect only. Ownership transfer is
   outside this UI; Disconnect retains `assignedUserId`.
6. **Phone authentication:** existing challenge/signature routes do not establish
   a complete app-unlock session. Native device-backed key enrollment and a server
   unlock contract are needed; no software-key substitute or fake biometric pass
   was introduced.
7. **MPIN enforcement:** `MpinUnlockGuard`/`RequireMpinUnlock` are defined but no
   registration/application was found outside that definition. Frontend MPIN
   gates remain; backend authorization should be enforced independently.
8. **Login latency:** every protected request additionally reads the profile for
   `isDeletionScheduled`; profile/onboarding then perform their own reads. Manual
   login also validates the password in the backend and establishes a separate
   Firebase client session. Check stage timing, Firebase validation, Firestore
   latency/quota and deployment of the background-loop quota fixes. An anonymous
   fast 401 does not measure these authenticated paths.
9. **Firmware and authority:** button presence needs the updated secret-authenticated
   heartbeat firmware. Station acknowledgement needs an operator role and station
   claim. Neither is a rider-side API call.
10. **Backend checks:** the backend requires Node 22. This environment has Node 24
    and no installed backend test dependencies. Backend tests/build were not run;
    run the repository's deployment checklist/CI before promotion. Backend source
    was inspected, not modified or deployed.

## Verification and handoff

All 395 frontend tests, TypeScript, lint, the actual native ARM64 release build
and packaged-artwork checks passed. The production source map matches all 11
changed integration modules. Results and limitations are recorded in the accompanying
[acceptance checklist](qa/BACKEND_API_CHECKLIST_2026-10-30.md).
Authenticated password changes, inbox delivery, physical hardware, SMS and other
devices require live acceptance testing; isolated contract tests are not proof of
those operations.

## Complete route inventory

| Method and path (under `/v1`) | Consumer / status |
| --- | --- |
| `GET /alerts` | Connected: paginated alert/archives services |
| `PATCH /alerts/:alertId/seen` | Connected: alert update/SOS linking |
| `PATCH /alerts/:alertId/false-alarm` | Connected: alert update/SOS linking |
| `GET /auth/me` | Connected: auth, onboarding or logout services |
| `POST /auth/register` | Updated: server sends registration code |
| `POST /auth/verification/verify` | Connected: registration code screen |
| `POST /auth/verification/resend` | Connected: registration code screen |
| `POST /auth/login` | Updated: unverified 403 opens code entry |
| `POST /auth/forgot-password` | Connected: auth, onboarding or logout services |
| `POST /auth/change-password` | Connected: Settings password form |
| `GET /auth/is-old-user` | Connected: auth, onboarding or logout services |
| `GET /auth/ably-token` | Connected: auth, onboarding or logout services |
| `POST /auth/delete-account` | Existing backend; recovery/UI follow-up required |
| `POST /auth/delete-account/cancel` | Existing backend; recovery/UI follow-up required |
| `GET /auth/delete-account/status` | Existing backend; recovery/UI follow-up required |
| `GET /auth/onboarding` | Connected: auth, onboarding or logout services |
| `PATCH /auth/onboarding` | Connected: auth, onboarding or logout services |
| `POST /auth/onboarding/complete` | Connected: auth, onboarding or logout services |
| `POST /auth/phone/enroll-key` | Existing backend; native key/unlock flow required |
| `POST /auth/phone/challenge` | Existing backend; native key/unlock flow required |
| `POST /auth/phone/verify-signature` | Existing backend; native key/unlock flow required |
| `POST /auth/phone/revoke-key` | Existing backend; native key/unlock flow required |
| `POST /auth/logout` | Connected: auth, onboarding or logout services |
| `POST /devices/:device_id/ably-token` | Firmware/model-service route; existing protocol |
| `POST /devices` | Manufacturing/admin application |
| `PATCH /devices/claim-device/:device_id` | Connected: onboarding and Settings claim |
| `PATCH /devices/activate-device/:device_id` | Firmware/model-service route; existing protocol |
| `PATCH /devices/:device_id/stream-url` | Firmware/model-service route; existing protocol |
| `GET /devices/cameras` | Connected: camera inventory/preview |
| `GET /devices/buttons` | Connected: account inventory and live presence |
| `POST /devices/:device_id/heartbeat` | New: hardware-secret firmware heartbeat |
| `POST /devices/disconnect` | Connected: explicit soft disconnect; pairing retained |
| `GET /devices/:device_id/cameras` | Firmware/model-service route; existing protocol |
| `POST /devices/button-event/:device_id/:button_event` | Firmware/model-service route; existing protocol |
| `PATCH /devices/:device_id/rotate-secret` | Manufacturing/admin application |
| `POST /devices/phone` | Connected: phone camera/session service |
| `POST /devices/phone/:device_id/sessions` | Connected: phone camera/session service |
| `DELETE /devices/phone/:device_id/sessions/:session_id` | Connected: phone camera/session service |
| `POST /devices/phone/sessions/verify` | Model service: upload-token/presence verification |
| `POST /devices/phone/sessions/:session_id/presence` | Model service: upload-token/presence verification |
| `GET /health/firestore` | Operational diagnostics; outside rider login |
| `GET /health/ably` | Operational diagnostics; outside rider login |
| `GET /mpin/status` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/setup` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/unlock` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/lock` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/change/authorize` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/change/code` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/change/code/resend` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/change/code/verify` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/change/email-link` | Alternate backend flow; established code UI retained |
| `POST /mpin/change` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/recovery/code` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/recovery/code/resend` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/recovery/code/verify` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/recovery/email-link` | Alternate backend flow; established code UI retained |
| `POST /mpin/recovery/reset` | Connected: MPIN code/setup/unlock services |
| `POST /mpin/email-link/verify-and-change` | Alternate backend flow; established code UI retained |
| `POST /notifications/register` | Connected: push registration/logout |
| `DELETE /notifications/registrations/:installationId` | Connected: push registration/logout |
| `POST /profile/personal-info` | Connected: profile/contact/photo services |
| `POST /profile/emergency-contact` | Legacy singular route; mobile uses plural contacts |
| `GET /profile/me` | Connected: profile/contact/photo services |
| `PATCH /profile/me` | Connected: profile/contact/photo services |
| `POST /profile/photo` | Connected: profile/contact/photo services |
| `GET /profile/emergency-contacts` | Connected: profile/contact/photo services |
| `POST /profile/emergency-contacts` | Connected: profile/contact/photo services |
| `GET /profile/emergency-contacts/:id` | Connected: profile/contact/photo services |
| `PATCH /profile/emergency-contacts/:id` | Connected: profile/contact/photo services |
| `DELETE /profile/emergency-contacts/:id` | Connected: profile/contact/photo services |
| `GET /settings/auto-archive` | Connected: auto-archive preference |
| `PATCH /settings/auto-archive` | Connected: auto-archive preference |
| `POST /sos` | Connected: SOS service/lifecycle |
| `GET /sos/active` | Connected: SOS service/lifecycle |
| `GET /sos/by-request/:requestId` | Connected: SOS service/lifecycle |
| `GET /sos/:sosId` | Connected: SOS service/lifecycle |
| `POST /sos/:sosId/refresh-status` | Connected: SOS service/lifecycle |
| `POST /sos/:sosId/stop` | Connected: SOS service/lifecycle |
| `GET /alerts/:alertId/sos` | Connected: alert update/SOS linking |
| `POST /authority/incidents/:incidentId/acknowledge` | New: operator application; operator/station claims |

## Files changed

Includes the uncommitted login diagnostics retained from the preceding task.

- `docs/BACKEND_API_SYNC_2026-10-30.md`
- `docs/qa/BACKEND_API_CHECKLIST_2026-10-30.md`
- `scripts/test-alert-sos-response.cjs`
- `scripts/test-auth-bootstrap.cjs`
- `scripts/test-auth-profile-contract.cjs`
- `scripts/test-backend-auth-update.cjs`
- `scripts/test-device-disconnect.cjs`
- `scripts/test-manual-login-diagnostics.cjs`
- `src/app/(app)/settings/change-password.tsx`
- `src/app/(public)/auth-action.tsx`
- `src/app/(public)/password-changed.tsx`
- `src/app/index.tsx`
- `src/modules/alerts/components/alert-sos-response.tsx`
- `src/modules/alerts/screens/alert-detail-screen.tsx`
- `src/modules/alerts/services/alert-sos.api.ts`
- `src/modules/auth/hooks/use-auth.ts`
- `src/modules/auth/screens/check-email-screen.tsx`
- `src/modules/auth/screens/create-account-screen.tsx`
- `src/modules/auth/screens/email-code-screen.tsx`
- `src/modules/auth/screens/login-screen.tsx`
- `src/modules/auth/services/auth.api.ts`
- `src/modules/auth/services/complete-email-verification.ts`
- `src/modules/auth/services/credential-change-session.ts`
- `src/modules/auth/services/email-verification.api.ts`
- `src/modules/auth/services/firebase-user-refresh.ts`
- `src/modules/auth/store/password-change-result.store.ts`
- `src/modules/auth/store/registration-draft.store.ts`
- `src/modules/auth/utils/auth-diagnostics.ts`
- `src/modules/devices/screens/device-status-screen.tsx`
- `src/modules/devices/services/devices.api.ts`
- `src/modules/mpin/utils/mpin-policy.ts`
- `src/modules/settings/config/settings-rows.ts`
- `src/modules/settings/screens/change-password-screen.tsx`
- `src/modules/settings/services/account-security.api.ts`
- `src/modules/settings/services/settings.api.ts`
- `src/modules/settings/types/settings.types.ts`
