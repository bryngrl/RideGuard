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
    require: (name) => name.startsWith(".")
      ? load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), name + ".ts"))) : require(name),
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
  const storage = new Map(options.seed ? [["rideguard-sos-recovery", JSON.stringify(options.seed)]] : []);
  const stats = { starts: 0, stops: 0, permissions: 0, captures: 0, bodies: [], mode: "normal", record: null };
  const deps = {
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
    shareLocation: () => false,
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
  return { store, deps, stats, storage, advance, uuidCalls: () => uuidCalls, intervals };
}

test("one five-second deadline survives tick drift and repeated taps without duplicate submission", async () => {
  const h = await harness();
  await h.store.getState().begin(); await h.store.getState().begin();
  await h.advance(4999); assert.equal(h.stats.starts, 0);
  await h.advance(500); assert.equal(h.stats.starts, 1); assert.equal(h.uuidCalls(), 1);
  assert.equal(h.store.getState().phase, "active");
  assert.equal(JSON.parse(h.storage.get("rideguard-sos-recovery")).body, null);
  assert.equal(h.stats.permissions, 0); assert.equal(h.stats.captures, 0);
});

test("cancel/back and background before expiry send nothing, including after resume", async () => {
  for (const cancel of [(s) => s.cancelCountdown(), (s) => s.setForeground(false)]) {
    const h = await harness(); await h.store.getState().begin(); cancel(h.store.getState());
    await h.advance(6000); h.store.getState().setForeground(true); await h.store.getState().refresh();
    assert.equal(h.stats.starts, 0); assert.equal(h.intervals.size, 0); assert.equal(h.store.getState().phase, "idle");
  }
});

test("permission denial continues without a fix, while sharing off never requests permission", async () => {
  const h = await harness(); h.deps.shareLocation = () => true;
  h.deps.permission = async () => { h.stats.permissions++; return false; };
  await h.store.getState().begin(); await h.advance();
  assert.equal(h.stats.permissions, 1); assert.equal(h.stats.captures, 0);
  assert.equal(JSON.parse(h.stats.bodies[0]).location, null);
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

if (process.env.SOS_SIM_BASE_URL) {
  const base = process.env.SOS_SIM_BASE_URL;
  const url = new URL(base);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol !== "http:") throw new Error("Only a local simulation is allowed");
  const control = async (route) => { const response = await fetch(base.replace(/\/v1$/, "") + "/__test/" + route); assert.equal(response.ok, true); return (await response.json()).data; };
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
