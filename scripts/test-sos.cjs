const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const cache = new Map();
function load(relative, overrides = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  if (!Object.keys(overrides).length && cache.has(filename)) return cache.get(filename);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, process, fetch, Date, Error, Object, Promise, AbortController,
    setTimeout, clearTimeout, setInterval, clearInterval, ...overrides,
    require: overrides.require ?? ((name) => name.startsWith(".")
      ? load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), name + ".ts"))) : require(name)),
  };
  vm.runInNewContext(compiled, context);
  if (!Object.keys(overrides).length) cache.set(filename, context.exports);
  return context.exports;
}
const apiModule = load("src/modules/sos/services/sos.api.ts");
const { hasPending, submissionLabel } = load("src/modules/sos/types.ts");
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(setImmediate); };
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
const publicRecord = (body) => ({ sosId: "fixture-sos", requestId: body.requestId, alertId: body.alertId || null,
  status: "active", createdAt: new Date().toISOString(), endedAt: null, location: body.location,
  recipients: [{ contactId: "contact", name: "Test contact", phone: "masked", initial: { status: "unknown", updatedAt: new Date().toISOString() }, ended: null }] });

async function harness(options = {}) {
  let time = Date.now();
  let uuidCalls = 0;
  const intervals = new Set();
  const locationDiagnostics = [];
  const storage = new Map(options.seed ? [["rideguard-sos-recovery", JSON.stringify(options.seed)]] : []);
  const stats = { starts: 0, stops: 0, permissions: 0, captures: 0, bodies: [], mode: "normal", record: null };
  const deps = {
    locationDiagnostic: (event) => locationDiagnostics.push(event),
    api: {
      async start(uid, body) {
        stats.starts++; stats.bodies.push(JSON.stringify(body));
        assert.equal(storage.has("rideguard-sos-recovery"), true, "persist before submitting");
        if (stats.mode === "disabled") throw new apiModule.SosApiError(503, "SOS_DISABLED");
        if (stats.mode === "not-submitted") throw new apiModule.SosApiError(500);
        stats.record = publicRecord(body);
        if (stats.mode === "lost-submit") throw new apiModule.SosApiError(500);
        return stats.record;
      },
      async active() { return stats.record?.status === "active" ? stats.record : null; },
      async byRequest() { return stats.record; },
      async get() { if (!stats.record) throw new apiModule.SosApiError(404); return stats.record; },
      async stop() {
        stats.stops++;
        stats.record = { ...stats.record, status: "ended", endedAt: new Date().toISOString() };
        if (stats.mode === "lost-stop") throw new apiModule.SosApiError(500);
        return stats.record;
      },
    },
    storage: {
      async getItem(key) { return storage.get(key) ?? null; },
      async setItem(key, value) { storage.set(key, value); },
      async removeItem(key) { storage.delete(key); },
    },
    async contacts() { return [{ id: "contact", name: "Test contact", phoneNumber: "test-fixture", relationship: "Friend" }]; },
    shareLocation: () => true,
    async permission() { stats.permissions++; return true; },
    async capture() { stats.captures++; return null; },
    uuid: () => { uuidCalls++; return "00000000-0000-4000-8000-000000000001"; }, now: () => time,
  };
  const { createSosStore } = load("src/modules/sos/store/sos-session.ts", {
    setInterval: (fn) => { intervals.add(fn); return fn; }, clearInterval: (fn) => intervals.delete(fn),
  });
  const store = createSosStore(deps);
  await store.getState().setOwner("owner-a"); store.getState().setForeground(true); await store.getState().loadContacts();
  const advance = async (ms = 5000) => { time += ms; for (const tick of [...intervals]) tick(); await flush(); };
  return { store, deps, stats, storage, advance, uuidCalls: () => uuidCalls, intervals, locationDiagnostics };
}

const { resolveSosEntry } = load("src/modules/sos/store/sos-entry.ts");

test("SOS entry waits for discovery and routes idle and active sessions without sending messages", async () => {
  const h = await harness();
  const lookup = deferred();
  h.deps.api.active = () => lookup.promise;
  let resolved = false;
  const opening = resolveSosEntry(h.store, "owner-a").then(route => { resolved = true; return route; });
  await flush();
  assert.equal(h.store.getState().refreshing, true);
  assert.equal(resolved, false);
  lookup.resolve(null);
  assert.equal(await opening, "/sos");
  h.deps.api.active = async () => publicRecord({ requestId: "existing-request" });
  assert.equal(await resolveSosEntry(h.store, "owner-a"), "/sos/active");
  assert.equal(h.stats.starts, 0);
  assert.equal(h.stats.permissions, 0);
});

test("SOS entry keeps failed discovery on the opening screen so the user can retry", async () => {
  const h = await harness();
  h.deps.api.active = async () => { throw new Error("offline"); };
  await assert.rejects(resolveSosEntry(h.store, "owner-a"), /Could not check SOS status/);
  h.deps.api.active = async () => null;
  assert.equal(await resolveSosEntry(h.store, "owner-a"), "/sos");
  assert.equal(h.stats.starts, 0);
});

test("SOS entry ignores discovery after logout or backgrounding", async () => {
  for (const interrupt of [h => h.store.getState().setOwner(null), h => h.store.getState().setForeground(false)]) {
    const h = await harness(); const lookup = deferred();
    h.deps.api.active = () => lookup.promise;
    const opening = resolveSosEntry(h.store, "owner-a"); await flush();
    await interrupt(h); lookup.resolve(publicRecord({ requestId: "old-request" }));
    assert.equal(await opening, null);
    assert.equal(h.stats.starts, 0);
  }
});

test("SOS entry waits for an existing lookup before resolving the destination", async () => {
  const h = await harness(); const lookup = deferred();
  h.deps.api.active = () => lookup.promise;
  const refresh = h.store.getState().refresh();
  const opening = resolveSosEntry(h.store, "owner-a");
  await flush(); lookup.resolve(publicRecord({ requestId: "existing-request" }));
  await refresh;
  assert.equal(await opening, "/sos/active");
  assert.equal(h.stats.starts, 0);
});

test("a prechecked first SOS screen skips discovery, but resuming still checks", async () => {
  const h = await harness(); let reads = 0;
  h.deps.api.active = async () => { reads++; return null; };
  const { startStatusPolling } = load("src/modules/sos/store/sos-polling.ts");
  const stop = startStatusPolling(h.store, Date.now, false);
  await flush(); assert.equal(reads, 0); stop();
  const resumed = startStatusPolling(h.store);
  await flush(); assert.equal(reads, 1); resumed();
});

function permissionAdapter(getPermission, requestPermission, native = { Alert: { alert() {} }, Linking: { async openSettings() {} } }) {
  let dependencies;
  const imports = {
    "@react-native-async-storage/async-storage": { default: {} },
    "expo-crypto": {},
    "expo-location": { getForegroundPermissionsAsync: getPermission, requestForegroundPermissionsAsync: requestPermission },
    "react-native": native,
    zustand: {},
    "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => ({ user: null }), subscribe() {} } },
    "@/modules/emergency-contacts/services/contacts.api": {},
    "@/modules/settings/store/settings.store": {},
    "../services/sos.api": { createSosApi: () => ({}) },
    "./sos-session": { createSosStore: (deps) => {
      dependencies = deps;
      return { getState: () => ({ async setOwner() {} }) };
    } },
  };
  load("src/modules/sos/store/sos.store.ts", { require: (name) => {
    assert.ok(Object.hasOwn(imports, name), "Unexpected import: " + name);
    return imports[name];
  } });
  return dependencies.permission;
}

test("already-granted location permission does not reopen native permissions and cancel SOS", async () => {
  const h = await harness();
  h.deps.shareLocation = () => true;
  let requests = 0;
  h.deps.permission = permissionAdapter(async () => ({ granted: true, canAskAgain: true }), async () => {
    requests++;
    // A native permission activity can pause the app during preparation.
    h.store.getState().setForeground(false);
    h.store.getState().cancelCountdown();
    h.store.getState().setForeground(true);
    return { granted: true };
  });
  await h.store.getState().begin();
  assert.equal(requests, 0);
  assert.equal(h.store.getState().phase, "countdown");
  await h.advance();
  assert.equal(h.stats.starts, 1);
});

test("blocked location permission prevents SOS and offers phone settings", async () => {
  const h = await harness();
  h.deps.shareLocation = () => true;
  let requests = 0;
  let prompt;
  let settings = 0;
  h.deps.permission = permissionAdapter(async () => ({ granted: false, canAskAgain: false }), async () => {
    requests++;
    return { granted: false };
  }, { Alert: { alert: (...args) => { prompt = args; } }, Linking: { async openSettings() { settings++; } } });
  await h.store.getState().begin();
  await h.advance();
  assert.equal(requests, 0);
  assert.equal(h.stats.starts, 0);
  assert.equal(h.stats.captures, 0);
  assert.equal(h.store.getState().phase, "idle");
  assert.match(h.store.getState().notice, /required/);
  assert.equal(prompt[0], "Location permission required");
  prompt[2][1].onPress(); await flush();
  assert.equal(settings, 1);
});

test("location permission is requested when it can still be granted", async () => {
  let requests = 0;
  const permission = permissionAdapter(async () => ({ granted: false, canAskAgain: true }), async () => {
    requests++;
    return { granted: true };
  });
  assert.equal(await permission(), true);
  assert.equal(requests, 1);
});

test("interruption during the first permission request stays cancelled and explains how to restart", async () => {
  const h = await harness();
  const permission = deferred();
  h.deps.shareLocation = () => true;
  h.deps.permission = () => permission.promise;
  const begin = h.store.getState().begin();
  h.store.getState().setForeground(false);
  h.store.getState().cancelCountdown("SOS preparation cancelled because the app was interrupted. No request was sent. Tap again when ready.");
  h.store.getState().setForeground(true);
  await h.store.getState().refresh();
  permission.resolve(true);
  await begin;
  await h.advance();
  assert.equal(h.store.getState().phase, "idle");
  assert.match(h.store.getState().notice, /No request was sent/);
  assert.equal(h.store.getState().error, null);
  assert.equal(h.stats.starts, 0);
  h.deps.permission = async () => true;
  await h.store.getState().begin();
  assert.equal(h.store.getState().notice, null);
  assert.equal(h.store.getState().phase, "countdown");
});

test("one five-second deadline survives tick drift and repeated taps without duplicate submission", async () => {
  const h = await harness();
  await h.store.getState().begin(); await h.store.getState().begin();
  await h.advance(4999); assert.equal(h.stats.starts, 0);
  await h.advance(500); assert.equal(h.stats.starts, 1); assert.equal(h.uuidCalls(), 1);
  assert.equal(h.store.getState().phase, "active");
  assert.equal(JSON.parse(h.storage.get("rideguard-sos-recovery")).body, null);
  assert.equal(h.stats.permissions, 1); assert.equal(h.stats.captures, 1);
});

test("cancel/back and background before expiry send nothing, including after resume", async () => {
  for (const cancel of [(s) => s.cancelCountdown(), (s) => s.setForeground(false)]) {
    const h = await harness(); await h.store.getState().begin(); cancel(h.store.getState());
    await h.advance(6000); h.store.getState().setForeground(true); await h.store.getState().refresh();
    assert.equal(h.stats.starts, 0); assert.equal(h.intervals.size, 0); assert.equal(h.store.getState().phase, "idle");
  }
});

test("permission denial blocks SOS, and a later grant allows a new attempt", async () => {
  const h = await harness(); h.deps.shareLocation = () => true;
  h.deps.permission = async () => { h.stats.permissions++; return false; };
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.stats.permissions, 1); assert.equal(h.stats.captures, 0);
  assert.equal(h.stats.starts, 0); assert.equal(h.uuidCalls(), 0);
  assert.equal(h.storage.size, 0); assert.equal(h.store.getState().phase, "idle");
  h.deps.permission = async () => true;
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.stats.starts, 1);
});

test("sharing off blocks SOS without requesting device permission", async () => {
  const h = await harness(); h.deps.shareLocation = () => false;
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.stats.permissions, 0); assert.equal(h.stats.captures, 0);
  assert.equal(h.stats.starts, 0); assert.equal(h.store.getState().phase, "idle");
  assert.match(h.store.getState().notice, /Allow location sharing/);
});

test("failed permission check blocks SOS without sending or capturing location", async () => {
  const h = await harness(); h.deps.permission = async () => { throw new Error("permission unavailable"); };
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.stats.starts, 0); assert.equal(h.stats.captures, 0);
  assert.equal(h.store.getState().phase, "idle");
});

test("revoking sharing during preparation or countdown cancels SOS", async () => {
  for (const duringPermission of [true, false]) {
    const h = await harness();
    if (duringPermission) h.deps.permission = async () => { h.deps.shareLocation = () => false; return true; };
    await h.store.getState().begin();
    h.deps.shareLocation = () => false;
    await h.advance();
    assert.equal(h.stats.starts, 0); assert.equal(h.store.getState().phase, "idle");
    assert.equal(h.intervals.size, 0);
  }
});

test("location diagnostics distinguish a slow fix from capture errors and unusable fixes", async () => {
  const scenarios = [
    { reason: "capture_pending", capture: () => new Promise(() => {}) },
    { reason: "capture_failed", capture: async () => { throw Object.assign(new Error("private error text"), { code: "E_LOCATION_UNAVAILABLE" }); } },
    { reason: "no_fix", capture: async () => null },
    { reason: "invalid_or_stale_fix", capture: async () => ({ latitude: 14, longitude: 121, capturedAt: new Date(Date.now() - 180000).toISOString(), accuracyMeters: 10 }) },
    { reason: "included", capture: async () => ({ latitude: 14, longitude: 121, capturedAt: new Date().toISOString(), accuracyMeters: 10 }) },
  ];
  for (const scenario of scenarios) {
    const h = await harness();
    h.deps.capture = scenario.capture;
    await h.store.getState().begin();
    await flush();
    await h.advance();
    const decision = h.locationDiagnostics.find(event => event.event === "submission_location");
    assert.equal(decision.reason, scenario.reason);
    assert.equal(decision.hasLocation, scenario.reason === "included");
    const confirmed = h.locationDiagnostics.find(event => event.event === "confirmed_location");
    assert.equal(confirmed.hasLocation, decision.hasLocation);
    const serialized = JSON.stringify(h.locationDiagnostics);
    assert.doesNotMatch(serialized, /latitude|longitude|private error text/);
    if (scenario.reason === "capture_failed") {
      assert.equal(h.locationDiagnostics.find(event => event.event === "capture_failed").errorCode, "E_LOCATION_UNAVAILABLE");
    }
  }
});

test("late location cannot mutate the persisted final body or create another submission", async () => {
  const h = await harness(); const fix = deferred(); h.deps.shareLocation = () => true; h.deps.capture = () => fix.promise;
  await h.store.getState().begin(); await h.advance();
  fix.resolve({ latitude: 0, longitude: 0, capturedAt: new Date().toISOString(), accuracyMeters: null });
  await flush(); assert.equal(h.stats.starts, 1); assert.equal(JSON.parse(h.stats.bodies[0]).location, null);
});

test("fresh capture is frozen into one activation and removed from recovery after confirmation", async () => {
  const h = await harness(); h.deps.shareLocation = () => true;
  h.deps.capture = async () => ({ latitude: 0, longitude: 0, capturedAt: new Date().toISOString(), accuracyMeters: null });
  await h.store.getState().begin("alert-fixture"); await flush(); await h.advance();
  assert.equal(JSON.parse(h.stats.bodies[0]).location !== null, true);
  assert.equal(JSON.parse(h.stats.bodies[0]).alertId, "alert-fixture");
  assert.equal(JSON.parse(h.storage.get("rideguard-sos-recovery")).body, null);
});

test("lost POST response is reconciled without another POST", async () => {
  const h = await harness(); h.stats.mode = "lost-submit";
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.store.getState().phase, "active"); assert.equal(h.stats.starts, 1);
  await h.store.getState().refresh(); assert.equal(h.stats.starts, 1);
});

test("absent request needs explicit retry with the exact original body and UUID", async () => {
  const h = await harness(); h.stats.mode = "not-submitted";
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.store.getState().phase, "retry");
  await h.store.getState().refresh(); assert.equal(h.stats.starts, 1);
  h.stats.mode = "normal"; await h.store.getState().retry();
  assert.equal(h.stats.starts, 2); assert.equal(h.stats.bodies[0] === h.stats.bodies[1], true); assert.equal(h.uuidCalls(), 1);
});

test("restart restores the same request and performs lookups without silently resubmitting", async () => {
  const body = { requestId: "saved-request", location: null };
  const h = await harness({ seed: { uid: "owner-a", requestId: body.requestId, body, sosId: null, stopPending: false } });
  await h.store.getState().refresh(); assert.equal(h.stats.starts, 0);
  assert.equal(h.store.getState().phase, "retry"); assert.equal(h.store.getState().recovery.requestId, body.requestId);
});

test("switching account or logging out clears recovery, contacts, and late responses", async () => {
  const h = await harness(); const result = deferred(); h.deps.api.start = () => result.promise;
  await h.store.getState().begin(); await h.advance();
  await h.store.getState().setOwner("owner-b"); result.resolve(publicRecord({ requestId: "old", location: null })); await flush();
  assert.equal(h.store.getState().record, null); assert.equal(h.store.getState().contacts.length, 0);
  assert.equal(h.storage.size, 0); await h.store.getState().setOwner(null); assert.equal(h.storage.size, 0);
});

test("an old account's recovery is never exposed or resubmitted", async () => {
  const h = await harness({ seed: { uid: "another-owner", requestId: "old", body: { requestId: "old", location: null }, sosId: null } });
  assert.equal(h.store.getState().recovery, null); assert.equal(h.storage.size, 0); assert.equal(h.stats.starts, 0);
});

test("an existing active SOS takes precedence over a previously displayed ended record", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance(); await h.store.getState().stop();
  const old = h.store.getState().record;
  h.stats.record = { ...old, sosId: "new-active", status: "active", endedAt: null };
  h.deps.api.get = async () => old;
  await h.store.getState().refresh();
  assert.equal(h.store.getState().record.sosId, "new-active"); assert.equal(h.stats.starts, 1);
});

test("persistence failure before HTTP leaves an explicit retry and sends nothing", async () => {
  const h = await harness(); h.deps.storage.setItem = async () => { throw new Error("fixture storage failure"); };
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.stats.starts, 0); assert.equal(h.store.getState().phase, "retry");
});

test("leaving foreground during persistence does not submit after the write completes", async () => {
  const h = await harness(); const write = deferred(); h.deps.storage.setItem = () => write.promise;
  await h.store.getState().begin(); await h.advance(); h.store.getState().setForeground(false);
  write.resolve(); await flush(); assert.equal(h.stats.starts, 0); assert.equal(h.store.getState().phase, "retry");
});

test("stop waits for confirmation and a lost stop response reconciles without duplicated follow-ups", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance();
  h.stats.mode = "lost-stop"; await h.store.getState().stop(); await h.store.getState().stop();
  assert.equal(h.store.getState().record.status, "ended"); assert.equal(h.stats.stops, 1);
});

test("a stale refresh cannot restore active state after a confirmed stop", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance();
  const old = h.stats.record; const query = deferred(); h.deps.api.get = () => query.promise;
  const refresh = h.store.getState().refresh(); await flush(); await h.store.getState().stop();
  query.resolve(old); await refresh; assert.equal(h.store.getState().record.status, "ended");
});

test("contact load failure remains an error rather than an empty-contact success", async () => {
  const h = await harness(); h.deps.contacts = async () => { throw new Error("fixture network failure"); };
  await h.store.getState().loadContacts(); await h.store.getState().begin();
  assert.equal(h.store.getState().contactsStatus, "error"); assert.equal(h.stats.starts, 0);
});

test("cancelling during permission lookup ignores the late permission result", async () => {
  const h = await harness(); const permission = deferred(); h.deps.shareLocation = () => true; h.deps.permission = () => permission.promise;
  const begin = h.store.getState().begin(); h.store.getState().cancelCountdown(); permission.resolve(true); await begin; await h.advance();
  assert.equal(h.store.getState().phase, "idle"); assert.equal(h.stats.starts, 0); assert.equal(h.stats.captures, 0);
});

test("logout cleanup cannot be overtaken by a pending recovery write", async () => {
  const h = await harness(); const write = deferred();
  h.deps.storage.setItem = async (key, value) => { await write.promise; h.storage.set(key, value); };
  await h.store.getState().begin(); await h.advance();
  const logout = h.store.getState().setOwner(null); write.resolve(); await logout; await flush();
  assert.equal(h.storage.size, 0); assert.equal(h.stats.starts, 0); assert.equal(h.store.getState().owner, null);
});

test("recovery lookup failure can be retried without silently discarding the saved attempt", async () => {
  const h = await harness(); await h.store.getState().setOwner(null);
  h.storage.set("rideguard-sos-recovery", JSON.stringify({ uid: "owner-a", requestId: "saved", body: { requestId: "saved", location: null }, sosId: null }));
  const read = h.deps.storage.getItem; h.deps.storage.getItem = async () => { throw new Error("fixture read failure"); };
  await h.store.getState().setOwner("owner-a"); assert.equal(h.store.getState().ready, false);
  h.deps.storage.getItem = read; await h.store.getState().setOwner("owner-a");
  assert.equal(h.store.getState().ready, true); assert.equal(h.store.getState().recovery.requestId, "saved");
});

test("unknown, failed, and accepted recipient outcomes remain distinct from lifecycle", () => {
  const r = publicRecord({ requestId: "fixture", location: null });
  assert.equal(submissionLabel.accepted, "Submitted to SMS provider");
  assert.equal(submissionLabel.unknown.includes("could not be confirmed"), true);
  assert.equal(hasPending(r), false); r.recipients[0].initial.status = "queued"; assert.equal(hasPending(r), true);
});

const deliveryFixture = (overrides = {}) => ({ status: "pending", observedAt: null,
  acceptedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 300000).toISOString(), tracking: "active",
  lastAttemptAt: null, lastCheckedAt: null, lastCheckError: null, failureCode: null, ...overrides });

test("delivery labels preserve progress, legacy failure and service-side guidance", () => {
  const { messagePresentation } = load("src/modules/sos/types.ts");
  const s = { status: "accepted", updatedAt: new Date().toISOString() };
  assert.equal(messagePresentation(s).label, "Submitted");
  assert.match(messagePresentation(s).detail, /unconfirmed/);
  for (const [status, label] of [["sent", "Sent"], ["delivered", "Delivered"], ["failed", "Failed"]]) {
    assert.equal(messagePresentation({ ...s, delivery: deliveryFixture({ status }) }).label, label);
  }
  assert.equal(messagePresentation({ status: "failed", errorCode: "delivery_failed" }).label, "Failed");
  assert.match(messagePresentation({ status: "failed", errorCode: "authentication_failed" }).detail, /messaging service/);
  const sent = messagePresentation({ ...s, delivery: deliveryFixture({ status: "sent", tracking: "timed_out", lastCheckError: "timeout" }) });
  assert.equal(sent.label, "Sent"); assert.match(sent.detail, /not confirmed/); assert.doesNotMatch(sent.detail, /automatically/);
});

test("delivery fields validate while legacy responses remain usable; fresh GET does not change evidence times", () => {
  const { isSosRecord, ageLabel } = load("src/modules/sos/types.ts");
  const r = publicRecord({ requestId: "fixture", location: null });
  assert.equal(isSosRecord(r), true);
  r.recipients[0].initial.delivery = deliveryFixture(); assert.equal(isSosRecord(r), true);
  r.recipients[0].initial.delivery.expiresAt = "bad"; assert.equal(isSosRecord(r), false);
  assert.equal(ageLabel("2026-10-25T00:00:00Z", Date.parse("2026-10-25T00:01:10Z")), "1 minute ago");
  assert.equal(ageLabel(null), "Not checked yet");
});

test("the frozen older mobile parser accepts the enhanced backend contract", () => {
  const { isSosRecord: legacyParser } = require("./fixtures/sos-legacy-parser.cjs");
  const r = publicRecord({ requestId: "fixture", location: null });
  r.statusRefresh = { state: "complete", requestedAt: null, expiresAt: null, nextAllowedAt: null };
  for (const status of ["pending", "sent", "delivered", "failed", "unknown"]) {
    r.recipients[0].initial = { status: "accepted", updatedAt: new Date().toISOString(), delivery: deliveryFixture({ status }) };
    assert.equal(legacyParser(r), true);
  }
});

test("pending detection includes ended-message delivery and manual jobs but stops at deadlines", () => {
  const r = publicRecord({ requestId: "fixture" });
  r.status = "ended"; r.recipients[0].initial.status = "accepted";
  r.recipients[0].ended = { status: "accepted", delivery: deliveryFixture() };
  assert.equal(hasPending(r), true);
  const end = Date.parse(r.recipients[0].ended.delivery.expiresAt);
  assert.equal(hasPending(r, end), false);
  r.statusRefresh = { state: "pending", expiresAt: new Date(end + 60000).toISOString() };
  assert.equal(hasPending(r, end), true); assert.equal(hasPending(r, end + 60000), false);
});

test("a fresh GET updates mobile time while preserving different per-message check times", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance();
  const times = ["2026-10-25T00:00:00.000Z", "2026-10-25T00:00:15.000Z"];
  h.stats.record.recipients[0].initial = { status: "accepted", updatedAt: times[0], delivery: deliveryFixture({ status: "sent", lastCheckedAt: times[0] }) };
  h.stats.record.recipients.push({ ...h.stats.record.recipients[0], contactId: "second",
    initial: { status: "accepted", updatedAt: times[0], delivery: deliveryFixture({ status: "delivered", lastCheckedAt: times[1] }) } });
  await h.store.getState().refresh(false); const fetched = h.store.getState().lastFetchedAt;
  await h.advance(); await h.store.getState().refresh(false);
  assert.notEqual(h.store.getState().lastFetchedAt, fetched);
  assert.deepEqual(h.store.getState().record.recipients.map(r => r.initial.delivery.lastCheckedAt), times);
  const { messagePresentation } = load("src/modules/sos/types.ts");
  assert.deepEqual(h.store.getState().record.recipients.map(r => messagePresentation(r.initial).label), ["Sent", "Delivered"]);
  assert.equal(h.stats.starts, 1);
});

test("known SOS polling uses only its GET and keeps lifecycle and Stop available on errors", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance();
  let discovery = 0; h.deps.api.active = async () => { discovery++; return null; };
  await h.store.getState().refresh(false); assert.equal(discovery, 0);
  const prior = h.store.getState().record;
  h.deps.api.get = async () => { throw new Error("offline"); };
  await h.store.getState().refresh(false);
  assert.equal(h.store.getState().phase, "active"); assert.equal(h.store.getState().record, prior);
  assert.match(h.store.getState().error, /last-known/);
  assert.equal(h.stats.starts, 1);
  await h.store.getState().stop(); assert.equal(h.stats.stops, 1);
});

test("mobile lookup errors use 10/20/40/60s backoff and success resets cadence", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance();
  h.deps.api.get = async () => { throw new Error("offline"); };
  for (const delay of [10000, 20000, 40000, 60000]) {
    const before = h.deps.now(); await h.store.getState().refresh(false);
    assert.equal(h.store.getState().nextPollAt - before, delay);
  }
  h.deps.api.get = async () => h.stats.record; await h.store.getState().refresh(false);
  assert.equal(h.store.getState().lookupFailures, 0); assert.equal(h.store.getState().nextPollAt - h.deps.now(), 5000);
});

test("status-only refresh is distinct from activation retry and ignores late owner responses", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance();
  const waiting = deferred(); let checks = 0;
  h.deps.api.refreshStatus = async () => { checks++; return waiting.promise; };
  const pending = h.store.getState().refreshStatus(); await flush();
  await h.store.getState().refreshStatus(); assert.equal(checks, 1);
  await h.store.getState().setOwner("another-owner"); waiting.resolve(h.stats.record); await pending;
  assert.equal(h.store.getState().record, null); assert.equal(h.stats.starts, 1); assert.equal(h.stats.stops, 0);
});

test("legacy refresh 404 falls back once to owned GET, and does not conceal an absent SOS", async () => {
  const h = await harness(); await h.store.getState().begin(); await h.advance();
  let checks = 0; let gets = 0;
  h.deps.api.refreshStatus = async () => { checks++; throw new apiModule.SosApiError(404); };
  h.deps.api.get = async () => { gets++; return h.stats.record; };
  await h.store.getState().refreshStatus(); assert.match(h.store.getState().notice, /Enhanced status refresh is unavailable/);
  h.deps.api.get = async () => { gets++; throw new apiModule.SosApiError(404); };
  await h.store.getState().refreshStatus(); assert.match(h.store.getState().error, /saved SOS is unavailable/);
  assert.equal(checks, 2); assert.equal(gets, 2); assert.equal(h.stats.starts, 1);
});

test("focused polling fetches on entry, stops at deadline, and ignores disposed timers", async () => {
  let time = Date.now(); const scheduled = new Map(); let counter = 0; let reads = 0;
  const { startStatusPolling } = load("src/modules/sos/store/sos-polling.ts", {
    setTimeout: fn => { scheduled.set(++counter, fn); return counter; }, clearTimeout: id => scheduled.delete(id),
  });
  const r = publicRecord({ requestId: "fixture" }); r.recipients[0].initial = { status: "accepted", delivery: deliveryFixture({ expiresAt: new Date(time + 10000).toISOString() }) };
  const state = { owner: "fixture", ready: true, foreground: true, record: r, phase: "active", nextPollAt: 0,
    async refresh(discover) { reads++; state.nextPollAt = time + 5000; assert.equal(discover, reads === 1); } };
  const dispose = startStatusPolling({ getState: () => state }, () => time); await flush(); assert.equal(reads, 1);
  const tick = async gap => { time += gap; const fn = [...scheduled.values()][0]; scheduled.clear(); fn?.(); await flush(); };
  await tick(5000); assert.equal(reads, 2); await tick(5000); assert.equal(reads, 3);
  await tick(60000); assert.equal(reads, 3); dispose(); assert.equal(scheduled.size, 0);
  state.foreground = false; const off = startStatusPolling({ getState: () => state }, () => time); await flush(); assert.equal(reads, 3); off();
});

if (process.env.SOS_SIM_BASE_URL) {
  const base = process.env.SOS_SIM_BASE_URL;
  const url = new URL(base);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol !== "http:") throw new Error("Only a local simulation is allowed");
  const control = async (route) => { const response = await fetch(base.replace(/\/v1$/, "") + "/__test/" + route); assert.equal(response.ok, true); return (await response.json()).data; };
  test("SOS entry discovers idle and existing active sessions through real HTTP without activation", async () => {
    await control("reset");
    const h = await harness();
    const client = apiModule.createSosApi(async () => "local-fixture", base, 1000);
    h.deps.api = client;
    assert.equal(await resolveSosEntry(h.store, "owner-a"), "/sos");
    assert.equal((await control("counts")).starts, 0);
    // Seed an SOS representing a session that already exists on the service.
    await client.start("owner-a", { requestId: "existing-entry-session", location: null });
    assert.equal(await resolveSosEntry(h.store, "owner-a"), "/sos/active");
    const counts = await control("counts");
    assert.equal(counts.starts, 1); assert.equal(counts.stops, 0);
  });
  test("real mobile HTTP client runs against the Postman SOS simulation", async () => {
    const client = apiModule.createSosApi(async () => "local-fixture", base, 1000);
    for (const mode of ["normal", "lost-submit", "timeout", "server-error", "html-error", "disabled"]) {
      await control("reset"); await control("mode?value=" + mode);
      const h = await harness(); h.deps.api = client;
      await h.store.getState().begin(); await h.advance();
      // Real HTTP has a separate event loop; wait for the bounded client and reconciliation.
      const deadline = Date.now() + 5000;
      while (["submitting", "checking"].includes(h.store.getState().phase) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));
      const expected = ["normal", "lost-submit", "timeout"].includes(mode) ? "active" : "retry";
      assert.equal(h.store.getState().phase, expected, mode);
      assert.equal((await control("counts")).starts, 1, "no automatic HTTP retry");
      if (expected === "active") {
        await control("mode?value=lost-stop"); await h.store.getState().stop();
        assert.equal(h.store.getState().record.status, "ended"); assert.equal((await control("counts")).stops, 1);
      } else if (mode !== "disabled") {
        const original = JSON.stringify(h.store.getState().recovery.body);
        await control("mode?value=normal"); await h.store.getState().retry();
        assert.equal(h.store.getState().record.requestId, JSON.parse(original).requestId);
        assert.equal((await control("counts")).starts, 2);
      }
    }
  });

  test("real mobile store reads both delivery rows and status-only POST without new activation or stop", async () => {
    await control("reset"); await control("mode?value=delivery");
    const h = await harness(); h.deps.api = apiModule.createSosApi(async () => "local-fixture", base, 1000);
    await h.store.getState().begin(); await h.advance();
    for (let i = 0; i < 100 && h.store.getState().phase !== "active"; i++) await new Promise(r => setTimeout(r, 10));
    assert.equal(h.store.getState().record.recipients[0].initial.delivery.status, "pending");
    for (const status of ["sent", "delivered"]) {
      await control("delivery?value=" + status); await h.store.getState().refresh(false);
      assert.equal(h.store.getState().record.recipients[0].initial.delivery.status, status);
    }
    await h.store.getState().stop(); assert.equal(h.store.getState().record.recipients[0].ended.delivery.status, "pending");
    await control("delivery?which=ended&value=sent"); await h.store.getState().refreshStatus();
    assert.equal(h.store.getState().record.statusRefresh.state, "pending");
    await h.store.getState().refresh(false);
    assert.equal(h.store.getState().record.statusRefresh.state, "complete");
    assert.equal(h.store.getState().record.recipients[0].initial.delivery.status, "delivered");
    assert.equal(h.store.getState().record.recipients[0].ended.delivery.status, "sent");
    const counts = await control("counts"); assert.equal(counts.starts, 1); assert.equal(counts.stops, 1); assert.equal(counts.refreshes, 1);
  });

  test("an unreachable service keeps the attempt uncertain without an automatic resend", async () => {
    const server = require("node:net").createServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    await new Promise((resolve) => server.close(resolve));
    const h = await harness();
    h.deps.api = apiModule.createSosApi(async () => "local-fixture", "http://127.0.0.1:" + port + "/v1", 500);
    await h.store.getState().begin(); await h.advance();
    const deadline = Date.now() + 3000;
    while ((h.store.getState().phase === "submitting" || h.store.getState().refreshing) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));
    assert.equal(h.store.getState().phase, "checking");
    assert.equal(h.store.getState().recovery.body !== null, true);
    assert.equal(h.uuidCalls(), 1);
  });

  test("a stalled auth token has a bounded timeout and makes no HTTP submissions", async () => {
    await control("reset");
    const h = await harness(); h.deps.api = apiModule.createSosApi(() => new Promise(() => {}), base, 25);
    await h.store.getState().begin(); await h.advance();
    const deadline = Date.now() + 1000;
    while ((h.store.getState().phase === "submitting" || h.store.getState().refreshing) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));
    assert.equal(h.store.getState().phase, "checking"); assert.equal((await control("counts")).starts, 0);
  });
}
