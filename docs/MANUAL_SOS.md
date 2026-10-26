# Manual SOS mobile flow

The existing trigger, countdown, and status screens use one shared SOS store.
The main screen's SOS button checks saved recovery and active SOS status before
navigating. It shows loading feedback, blocks repeated taps, and keeps failed
discovery on the main screen for retry. Active/recovery sessions open the status
screen; an idle session opens the trigger without a duplicate entry check.
The trigger loads saved emergency contacts. Direct entry still checks status,
and returning from the background checks again. The
countdown lasts five seconds and uses a deadline. Cancel, back, blur, or leaving
the foreground before expiry cancels it; it is never resumed after backgrounding.

Location sharing follows `locationWithContacts`, after settings hydration.
Sharing off prompts for consent before enabling sharing. SOS requires both
sharing consent and foreground location permission before the countdown.
Denied or failed permission checks block SOS. When native prompts are blocked,
the app offers to open phone settings; return and tap SOS again after granting access.
Turning sharing off during the countdown cancels the attempt.
One current fix is attempted during the countdown; stale/invalid or late fixes
are not added to an already-submitted request.

Before activation, AsyncStorage saves the user ID, request ID, and exact final
body. A request is submitted once. Lost responses are reconciled with request
lookup and active lookup. Only an explicit retry can submit the original body
and UUID again; reconnect, foreground, and restart never silently resend it.
If the service remains unreachable, the screen keeps the result uncertain,
offers status checks, and displays saved contact numbers for manual contact.

Recovery data is scoped to the signed-in user and removed on logout/account
change. Pending writes are serialized with cleanup. After confirmation, the
saved request body/location is removed and only the request/SOS IDs and stop
recovery state remain. Contact lists and full SOS records are memory-only.

Status refreshes on entry, foreground, explicit refresh, and after stop. While
the screen is focused and foregrounded, pending submissions and uncertain
activation are checked every five seconds. No SOS realtime channel is added.
Recipient statuses distinguish acceptance from delivery. Unknown submissions
have no recipient resend action. Stop waits for backend confirmation, can be
retried idempotently, and shows end-update results. Already-submitted SMS cannot
be recalled. A stale read cannot overwrite a confirmed stop.

Standalone SOS needs no alert. The trigger can accept an optional `alertId`
parameter for a future alert entry point; this task does not add alert navigation.
Automatic SOS stays disabled. Nearby automatic-SOS and live-tracking claims were
replaced with wording that does not claim contacts were notified.

## Local checks

From `rideguard-mobile`:

```powershell
npx.cmd tsc --noEmit
node --test scripts/test-*.cjs
```

The focused store suite is `node --test scripts/test-sos.cjs`. It uses fake
native boundaries and tests countdown drift, cancellation, permission handling,
late location, persisted request identity, explicit retry, account isolation,
storage failures/races, stop reconciliation, and stale status responses.

For real HTTP coverage, start the local simulation in another terminal:

```powershell
postman simulation run postman/simulations/sos-mobile.sim.yaml --port 4967 --no-history --output ndjson
```

Then run the actual mobile HTTP client and store against it:

```powershell
$env:SOS_SIM_BASE_URL = 'http://127.0.0.1:4967/rideguard/v1'
try {
  node --test scripts/test-sos.cjs
} finally {
  Remove-Item Env:SOS_SIM_BASE_URL
}
```

Stop the simulation with Ctrl+C. Only loopback HTTP URLs are accepted by the
simulation test. The mobile store and HTTP client run for real; native permission,
location, contact loading, and storage boundaries use fixtures. The simulation
models the backend contract from `rideguard-node` commit `ba5629e`, not an SMS
provider. The owner-workspace mock search was skipped because Postman is signed
out. No workspace, public mock, deployment, secret, or SMS account is needed.
The committed YAML files are local test fixtures, not deployment configuration.

The mock covers activation/read/stop state and the failure cases used by these
tests; it is not a full replacement for Firestore, authentication, or backend
concurrency tests. All simulated requests omit location, and recipients are
masked fixtures. Do not run it with real contact data or save raw simulation
logs in Git. No dependency or simulation is published.

## Verified and pending (2026-10-24)

- TypeScript passes after refreshing the ignored local Expo route-type cache.
- Full existing mobile script suite: 76 passed. Focused suite with HTTP
  simulation: 23 passed, including lost submissions/stops, timeout after durable
  acceptance, JSON/HTML server errors, disabled SOS, unreachable service, and
  bounded token lookup. Simulation logs showed SOS lookups and response statuses.
- Mobile ESLint is blocked: the installed ESLint 10 expects a flat config,
  while this checkout has only legacy `.eslintrc.json`. No config was added.
- Backend regression checks on the separate SOS routes branch: TypeScript
  passes; Jest 247 passed, 2 skipped. Backend source was not changed here.
- Device permission prompts, navigation blur/back, foreground/background,
  process restart, offline UI, contact pictures, and screen layout have not been
  exercised on a device. TypeScript and the logic tests do not establish these.
- No native rebuild, OTA, deployment, real Firestore, or live SMS run. Native
  project files are unchanged. `SOS_ENABLED` stays false on the backend; the
  separate backend recovery and route task branches still need integration.
# Automatic message status (2026-10-25)

1. Each contact card shows separate SOS and SOS-ended messages. Submitted is provider
   acceptance; Sent is carrier acceptance; Delivered requires a receipt and does not
   mean read or that help is coming. Only queued end updates get a row.
2. Node tracks each accepted message for five minutes, even after the app closes.
   The focused foreground SOS screen reads immediately on entry/resume and every
   five seconds while work remains. Known IDs use their GET directly on polling
   ticks. Errors back off 10/20/40/60s. Local expiry permits a final read; it does not
   restart tracking. Timers stop on blur, background, logout and completion.
3. The small refresh control calls status-only POST, then GET follows the persisted
   job. Jobs expire after 60s and have a 30s server cooldown. Retry status never
   resends. Retry the same SOS request remains a separate activation-recovery action.
4. Updated measures the last successful mobile GET. Delivery checked uses each
   message's saved provider timestamp. Failed refreshes preserve prior cards, the
   lifecycle header and Stop SOS. Sent remains visible after confirmation timeout.
5. Older backends can omit new fields. A refresh-route 404 triggers one owned GET;
   a second 404 means SOS unavailable. No automatic activation or resend occurs.
6. No status-change push, sound, vibration or background mobile polling was added.
   The cards use the existing theme preference, labels and icons, with a 44px refresh
   target and polite status announcements. Physical accessibility is still unverified.
7. Done dismisses a confirmed ended SOS and clears its local recovery state,
   regardless of delivered, failed, pending, or timed-out message results. In-flight
   lookups are cancelled and late results cannot reopen the dismissed screen.
   Reopening SOS permits a new countdown with a new request ID. Delivery tracking
   on the server continues independently; an unconfirmed delivery is not a failure.

Local checks and remaining acceptance/device checks are recorded in
`docs/SOS_STATUS_VERIFICATION.md`. Do not use real SMS to reproduce these fixtures.
