# RideGuard authentication and MPIN audit

> Later decision on 28 October: six-digit MPIN email codes are now approved and
> connected in the frontend. Findings below describe the earlier audit snapshot.
> Email-link recovery requirements are superseded by
> [the current backend checklist](auth-backend-requirements.md).

Date: 28 October 2026 (Asia/Manila).

## Decision

**The requested security flow is not complete.** Existing screens cover registration,
email-link verification, onboarding and MPIN setup/unlock, but phone authentication,
MPIN email-link recovery, server onboarding state and backend enforcement of app
unlock are missing. Passing unit tests does not establish those missing features.

Frontend changes are in this working tree, uncommitted. Backend changes are supplied
as [a reviewable patch](patches/rideguard-node-auth-mpin.patch) against backend commit
`398e2f268779dbc8e70c59b522c0e730ade983f4` (the remote HEAD checked during this audit).
They were built/tested in `android/build/backend-api-audit`, a disposable snapshot.
The separate, older Downloads/rideguard-node checkout was not overwritten. Nothing
was deployed, pushed, committed, installed or built into a new APK.

## Confirmed cause of the current login outage

At 08:01 Manila time the deployed Azure endpoint returned:

```text
GET /v1/health/firestore
HTTP 500
Firestore connectivity check failed: 8 RESOURCE_EXHAUSTED: Quota exceeded.
```

`GET /v1/auth/me` without a token returned the expected 401/Missing bearer token.
Thus Azure is reachable. Firestore reported quota exhaustion; the app also reported
an authenticated profile-check HTTP 500. The exact authenticated request was not
replayed because no user token was collected. The quota failure explains database
dependent profile/authentication failures; the deployed revision and Azure stack
trace were not independently obtained.

Metro `--clear` resets bundler caches, not accounts. A restart triggers Firebase
session restoration and fresh profile checks. In the backend, even `/auth/me` runs
`FirebaseAuthGuard.isDeletionScheduled`, which reads Firestore before the handler.
`/auth/is-old-user` performs an additional profile read. These calls fail when their
database operations cannot run.

The Firebase project owner must inspect Firestore Usage/Cloud quotas and billing,
determine which quota was exhausted, and restore capacity. Do not erase user data
or bypass authentication. The specific exceeded quota and billing plan were not
visible to this audit. See [Firebase's quota documentation](https://firebase.google.com/docs/firestore/quotas).
Also inspect repeated polling/jobs/readiness probes: `HealthService.checkFirestore`
writes and reads a document on each public health request, rather than being a cheap
liveness check. No particular caller is proven to have exhausted the quota.

## Existing implementation and findings

Paths beginning `src/` below belong to the frontend, unless marked backend.

| Area | Source and functions | Finding before this audit's patch |
|---|---|---|
| Firebase session persistence | `src/lib/firebase.ts`: initializeAuth/getReactNativePersistence | Firebase session persists through AsyncStorage. No app MPIN is saved there. |
| Registration | `src/modules/auth/screens/create-account-screen.tsx`: handleSubmit; backend `auth.service.ts`: register | Backend creates the Firebase user and reserves username/email; frontend signs in and calls Firebase sendEmailVerification through sendVerificationForUser. Link delivery is not proven by successful account creation. |
| Verification | `src/modules/auth/screens/check-email-screen.tsx`: checkStatus/resend | Reloads the actual Firebase user and verifies backend identity; checks foreground/link events and polls. A URL alone is not verification proof. Cooldown is a local minimum plus Firebase errors, not a server-supplied resend deadline. |
| Login | `login-screen.tsx`: handleCredentialSignIn; `auth.api.ts`: loginAccount/ensureEmailPasswordProfile | Correct identifier/password payload and Bearer header; shared profile finalization prevents duplicate in-process requests. Transient profile failures were treated like failed login, and error text could collapse. Backend returned generic wrong-credentials for even correctly authenticated unverified users, preventing contextual resend discovery. |
| Session restoration | `src/modules/auth/hooks/use-auth.ts`: useAuth | Fails closed on profile errors. Previously had no clear restoration Retry UI and conflated outages with a signed-out state. |
| Progress | `src/modules/auth/services/registration-progress.ts`: saveOnboardingStep/postAuthDestination; onboarding layout | Checkpoints are local, keyed by normalized email. Draft fields have a UID owner in onboarding.store. They survive a process restart on the same installation. They are not server progress, UID-keyed checkpoints, or a reliable reinstall/second-device record. |
| Profile submission | `emergency-contact-step-screen.tsx`: save path; backend ProfileService.createProfile | Profile/vehicle/contact draft is submitted together through personal-info. An existing identity stub can be completed; a profile with personalInfo rejects a repeated create with 422. Local savedProfile avoids repeat submissions only after a confirmed response. A lost response can still require server reconciliation. |
| Required MPIN | `complete-setup-screen.tsx`: checkMpin/handleStartDriving; `mpin-flow-screen.tsx`: receiveStatus/showSuccess | Final completion checks server MPIN configuration. Existing configured accounts go to Unlock rather than Create. A fresh setup requires separate successful setup, unlock and status calls. |
| PIN storage | Backend `modules/mpin/mpin.service.ts`: hash/matches/create | Salted scrypt hash in Firestore mpinAccounts keyed by UID; random 16-byte salt, 64-byte output, timing-safe comparison. Account-level persistence is source-confirmed. Frontend draft and unlock state are memory-only. |
| Logout | `src/modules/settings/hooks/use-logout.ts`; MPIN lifecycle/store | Clears local account/unlock state, not the server PIN. No logout deletion of mpinAccounts is present. Reinstallation needs server PIN status, not a new PIN. |
| Dashboard gate | `mpin-app-gate.tsx`: MpinAppGate; `mpin.store.ts`: requiresLocalUnlock | Hides protected UI/touches/accessibility until account checks and this runtime's unlock succeed. Fresh launches do not accept only the backend's cached unlock window. Mocked gate tests pass; no new device test was performed in this audit. |
| Background lock | `use-mpin-lifecycle.ts`; backend MpinService.status | Local app locks immediately on actual backgrounding. Backend has an absolute 15-minute account-wide window and ignores resume/inactivity context. This is not a configurable background inactivity interval. |
| API enforcement | Backend `FirebaseAuthGuard`, AuthModule/AppModule | Global Firebase/email/deletion checks exist. There is no MPIN unlock guard or device-bound authorization on ordinary protected endpoints or Ably-token issuance. A Firebase token can bypass the frontend MPIN screen at the REST layer. |
| Multiple devices | Backend MpinService.unlock/status | unlockExpiresAt is account-wide, not per device/session. Frontend cold-start checks help UI privacy but cannot repair backend authorization. |
| Change MPIN | Settings settings-rows.ts → existing `/mpin/manage`; backend authorizeChange/requestChangeCode/change | Settings and existing Current/Create/Confirm/Success screens exist. Baseline requires an OTP email step; the configured MissingMpinEmailSender always fails. Frontend intentionally disables it. Direct current-PIN change was missing. |
| Recovery | Existing Forgot MPIN UI; backend recovery/code, recovery/reset | Backend contains code-based recovery, not reset links. Default email sender is unconfigured; frontend emailLinksEnabled is false. The Forgot screen cannot send a working link. This is not implemented recovery. |
| Biometrics/device credentials | Frontend dependencies/native source; backend modules | No native biometric/Keystore integration, enrolled public keys, server challenge verification, enrollment step or Security enrollment control found. No fake success Boolean was added. |

## Changes made

### Frontend

1. Session restoration now exposes a Retry overlay for temporary service/network/rate
   failures. It keeps the Firebase credential and grants no protected access until
   the profile check succeeds. Credential login also avoids signOut on a transient
   profile failure. Source: `use-auth.ts`, `session-errors.ts`, `session-recovery.tsx`,
   root layout, `login-screen.tsx`.
2. Login's error container stretches to full available width. API errors carry only
   the endpoint path/status for diagnostics, not tokens, passwords, query values or
   request bodies. Generic server errors display a short service-unavailable message.
3. Correct-password/unverified responses can expose contextual verification recovery,
   including username login, using the backend's registered email field. This needs
   the backend patch for its structured `EMAIL_NOT_VERIFIED` response.
4. Existing MPIN screens support Current → New → Confirm → Success without a code step
   **only when valid server status includes `directChangeEnabled: true`**. Calls use
   the current-PIN proof and `/mpin/change/direct`. The old Azure deployment will not
   advertise this and therefore will not be sent an unsupported mutation.
5. MPIN layouts reuse the existing NotificationSheet for success/errors, alongside
   persistent field feedback. No duplicate MPIN screens were created. Prior removal
   of MPIN back arrows/logout controls and phone Back/security guards remains intact.

### Backend patch (not deployed)

1. Adds POST `/v1/mpin/change/direct` with existing authorization/pin DTO, retaining the
   old code routes. Requires Firebase authentication and an expiring, account-bound
   proof from POST `/v1/mpin/change/authorize` with the current PIN.
2. Rejects the same PIN. Proof consumption and PIN replacement commit in one Firestore
   transaction. Proofs and legacy change/reset grants are bound to the current PIN
   hash fingerprint, so older outstanding authorizations cannot change a later PIN.
   Replacement clears unlockExpiresAt and lockout counters. No PIN goes into a URL.
3. Makes first-time creation and wrong-PIN attempt increments transactional, avoiding
   concurrent overwrites and lost failed-attempt counts. Counts commit before throwing
   a wrong-PIN response.
4. Makes proof consumption transactional; legacy replacements use the same atomic
   replacement logic. Challenges bind to the PIN version at issuance. Legacy code
   delivery remains unavailable and is not presented as working email-link recovery.
5. Checks revoked/disabled Firebase tokens in the global guard, and adds contextual
   unverified-account responses only after correct password verification.
6. Extends log redaction to PIN/password/code/proof/token request-body fields.

The patch does **not** add device unlock grants, a global MPIN guard, server onboarding
state, email-link delivery/recovery, or native phone authentication. Those remain
release blockers for the complete requested design.

## Required remaining implementation

### Backend

- Restore Firestore capacity and return sanitized 503/retry information for dependency
  outages; keep detailed provider errors in protected server logs. A healthy Azure
  web process does not prove healthy Firestore operations.
- Persist onboarding step/completion by authenticated UID. Return the canonical state
  at bootstrap; accept only valid step transitions; atomically require configured MPIN
  at completion. Make profile completion idempotent/reconcilable after lost responses.
  Profile existence must not mean all onboarding is complete.
- Issue short-lived device/session-bound app-unlock grants after MPIN verification.
  Store hashed opaque grants or verify signed claims plus server revocation/version.
  Bind UID, installation/session, credential version, scope, expiry and last activity.
  Enforce them in a global guard on sensitive routes, including Ably/media issuance.
  Explicitly scope bootstrap/setup/recovery and hardware/service authentication exceptions;
  never blindly exempt every auth/mpin/device route. Revoke grants on change/reset/logout
  and device revocation. Enforce expiry/activity server-side.
- Replace OTP recovery with an account-bound random email-link token, storing only a
  token hash, purpose, UID, credential version, expiry, consumption state and request
  metadata. Consume/reset/update credential version/revoke grants atomically. A GET
  from a mail scanner must not consume or reset it. Require explicit POST exchange
  and the intended account. Register an allowlisted HTTPS app-link domain and send
  links through a configured delivery provider. Do not use registration verification
  or Firebase password-reset proof as MPIN reset authorization.
- Return generic recovery request responses to prevent enumeration; impose persistent
  per-account and abuse/IP limits, retry deadlines, replacement rules and a single
  current request policy. Test parallel requests, resend mail failure, token replay,
  wrong account, invalid purpose, expiry, tampering and links opened on another device.
- Add phone-auth enrollment/challenge/verification/revocation contracts. Register a
  public key only under a recent MPIN authorization, validate fresh account/device-bound
  nonce signatures, prevent replay, and issue the same unlock grant used by MPIN.
  A frontend biometric result is never an API credential.

### Frontend and Android

- Reconcile server onboarding checkpoints with UID-scoped local drafts, migration and
  pending writes. Reinstallation/another device must resume server state; do not rely
  on normalized email as the permanent account identifier.
- Consume and clear server app-unlock grants in memory, attach them to protected calls,
  apply the configured inactivity policy, and keep the dashboard hidden while refreshing.
- Add bounded timeout/cancellation to ordinary authentication/bootstrap requests;
  today's generic API client uses fetch without an app-level timeout. MPIN mutations
  already have a 20-second request guard. An error-returning network double is not
  proof that an indefinitely stalled authentication request recovers.
- Integrate reset links into the existing Forgot/Create/Confirm screens; allowlist
  origin/path, exchange only with the backend, clear link material after exchange and
  background/signout, and never place a grant or MPIN in navigation params/storage/logs.
- Implement phone authentication through AndroidX BiometricPrompt and auth-bound
  Android Keystore keys, exposed through an appropriate native module. Protect signing
  operations cryptographically; do not store a phone PIN/password/fingerprint. Account
  and installation must namespace keys; deleting/reinstalling requires enrollment again.
- Offer optional enrollment after MPIN setup and in Settings → Security, with an actual
  MPIN fallback. Handle canAuthenticate errors, cancellation/lockout, no screen lock,
  unsupported authenticator combinations/versions, key invalidation, biometric changes
  and account switches. Do not offer enrollment before a functioning server key contract.
- Verify native snapshot privacy and screen transitions on a physical device; a JS
  AppState cover cannot guarantee every OS snapshot timing. Consider native privacy
  controls appropriate to the final product policy.

Platform references: [BiometricPrompt and cryptographic authentication](https://developer.android.com/identity/sign-in/biometric-auth),
[Android Keystore](https://developer.android.com/privacy-and-security/keystore).

## Correct target flows and current limits

New account: Register → actual email-link verification → Profile → Vehicle → Emergency
Contact → Permissions → optional cameras/Quick Button as currently supported → existing
MPIN status → Create/Confirm if absent, otherwise Unlock → optional phone enrollment
**when implemented** → server-confirmed Setup Complete → guarded Dashboard.

Returning session: Firebase restore → fail Login for invalid credentials, Retry for a
temporary dependency outage → server onboarding check **when available**, local checkpoint
in today's frontend → MPIN status → existing Unlock → protected app. A fresh process
always requires local unlock. Existing code locks immediately on background; the requested
configured interval and backend device grant must still be implemented together.

Change: existing Settings MPIN entry → Current PIN verified by server → New → Confirm →
atomic server change → existing Success/NotificationSheet → unlock again with the new PIN.
Supported by this patch after deployment; not asserted working on today's Azure API.

Forgot: existing Forgot screen → request registered-email reset link → backend token
exchange → existing New/Confirm → atomic reset/revoke → reset complete → unlock. This
flow is specified, **not implemented**; current sender/code routes cannot satisfy it.

## QA matrix

PASS below means a named source-backed automated assertion passed, not a production
end-to-end certification. FAIL means the requested requirement is absent/broken in
the inspected implementation. BLOCKED means live/device evidence was unavailable.

| Case / requirement | Result | Actual evidence / limit |
|---|---|---|
| API route/payload/envelope match | PASS (unit/source) | test-auth-profile-contract.cjs; backend AuthController/DTO/ResponseInterceptor. |
| Login outage cause | FAIL (live dependency) | Azure Firestore health response above; user authenticated profile log status 500. |
| Restore after profile 500 | PASS (mocked hook) | test-auth-bootstrap: access blocked, Firebase credential retained, Retry succeeds without another login. |
| New registration / real verification | PASS (unit/source); BLOCKED (live) | Registration/verification tests cover link send and verified-status checks; real inbox/Firebase writes blocked by quota. |
| Unverified login context | PASS (backend unit, frontend source) | New AuthService test: correct credentials get contextual code; wrong credentials remain generic. Requires patch deployment. |
| Wrong credentials | PASS (backend unit) | Same test confirms generic invalid-credentials response; invalid session remains signed out in test-auth-bootstrap. |
| Revoked/expired session | PASS (guard unit) | firebase-auth.guard.spec.ts checks revocation verification requested and invalid tokens rejected. Real revoked token not used. |
| Missing/existing MPIN routing | PASS (unit/source) | test-mpin.cjs and complete-setup-screen check configured status; source chooses Unlock for existing MPIN. |
| Server salt/hash persistence | PASS (backend unit/source) | MpinService tests actual scrypt hash; Firestore is an in-memory test double, not emulator/production persistence. |
| Logout preserves account MPIN | PASS (source) | useLogout has no server PIN-delete call; account hash is separate from memory-only MPIN store. |
| Incomplete onboarding after process restart | PASS (local unit) | test-onboarding-progress.cjs recreates module with same storage; server/reinstall resumption is FAIL. |
| Complete onboarding on another device/reinstall | FAIL | No server checkpoint/completion API; profile existence alone is insufficient. |
| Fresh launch / protected UI / duplicate redirects | PASS (mocked gate) | test-mpin/test-mpin-resume-gate: local unlock required, hidden/touch-disabled tree, deferred single foreground redirect, stale results ignored. |
| Real latest UI / Android transitions | BLOCKED this audit | No physical phone connected for these changes. Earlier native resume checks do not validate new enrollment/recovery. |
| Configured inactivity interval | FAIL | Immediate background lock; backend ignores context and has absolute account-wide 15-minute expiry. |
| REST bypass of MPIN | FAIL (source) | FirebaseAuthGuard has no MPIN/device unlock-grant check; not probed using a real user's token. |
| Multiple devices | FAIL (server authorization) | Account-wide unlockExpiresAt; no installation/session grant isolation. |
| Multiple accounts on one phone | PASS (limited unit) | test-auth-bootstrap stale-owner response; test-mpin store owner reset. Full native switching/reinstall not performed. |
| Five wrong PINs / concurrent attempts | PASS (backend unit) | Patched transaction test counts concurrent failures and sets lockout; simulated Firestore serialization. |
| Current → New → Confirm change | PASS (unit/source); BLOCKED (live) | 13 backend MPIN tests include current proof, new PIN unlock, replay rejection; frontend adapter/capability tests. No deployed route/phone QA yet. |
| Reused/new PIN / tampered/expired/wrong-owner proof | PASS (backend unit) | New direct-change tests; four-digit DTO and existing PIN policy tests. |
| Concurrent PIN changes / setup overwrite | PASS (backend unit) | Exactly one change/setup commits in serializable transaction test double; emulator contention not run. |
| Forgotten PIN email link | FAIL | No link request/exchange/delivery route. Legacy email sender always unavailable. |
| Expired/reused/tampered reset link / concurrent reset requests | FAIL / not testable as links | No link implementation. Proof tests must not be represented as reset-link tests. |
| Network disconnection | PASS (unit); BLOCKED (device) | Offline/error mapping, canceled request and status-check tests; no physical network toggle during this audit. |
| Phone biometrics/device credentials/cancellation | FAIL (missing) | No production native module, keystore key or backend challenge route. |
| Phone lock/enrollment changes / unsupported Android | FAIL (missing) | No corresponding implementation or device tests. |

## Test evidence and rollout

- Frontend: 218 tests pass, 0 fail; TypeScript noEmit passes.
- Patched backend: 314 tests pass, 0 fail, 6 skipped across 29 passing suites;
  see the final recorded Jest summary in
  [backend evidence](qa/auth-mpin-backend-tests.txt); skipped tests are not passes.
- Backend `npm run build` passes. Tests used Node 24.13.1 on this workstation;
  backend package engines declares Node 22.x. Re-run on the deployment Node 22
  runtime and a Firestore emulator before deploying the patch.
- [Frontend evidence](qa/auth-mpin-frontend-tests.txt) records individual test names.
  Jest tests use doubles/mocks; no production accounts/PINs/tokens were requested.
- First restricted backend test run could not open localhost test sockets (EACCES);
  repeating with local-socket access passed. This was a test-environment restriction,
  not a fixed application defect.

Apply the backend patch on the audited base in a separate backend working branch:

```powershell
git apply --check C:/Users/Esquerra/Downloads/RideGuard/docs/patches/rideguard-node-auth-mpin.patch
git apply C:/Users/Esquerra/Downloads/RideGuard/docs/patches/rideguard-node-auth-mpin.patch
npm ci
npm run build
npm test -- --runInBand
```

Review/deploy through the backend team's normal process, restore Firestore capacity,
then QA the capability flag and actual Change flow. Do not describe this patch as
completion of phone authentication, email-link MPIN recovery or server app-unlock
enforcement. Those require the contracts and implementation listed above.
