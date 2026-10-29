const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules = {}, globals = {}) {
  const context = { exports: {}, ...globals, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
const { APIError } = load("src/shared/api/errors.ts");
const deferred = () => { let resolve; const promise = new Promise((work) => { resolve = work; }); return { promise, resolve }; };
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const button = { deviceId: "BUT-111-AAA", online: true, lastSeenAt: "2026-10-29T12:00:00Z" };
function setup(saved = "") {
  let uid = "a", changed, handler = async () => [button], requests = 0;
  const timers = new Set();
  const device = { ownerUid: "a", buttonDeviceId: saved, setButtonDeviceId: (id) => { device.buttonDeviceId = id; } };
  const user = () => ({ uid, getIdToken: async () => "fixture" });
  const { useButtonStatusStore: store } = load("src/modules/devices/store/button-status.store.ts", {
    zustand: require("zustand"), "@/shared/api/errors": { APIError },
    "@/modules/auth/store/auth.store": { useAuthStore: {
      getState: () => ({ user: uid ? user() : null }), subscribe: (work) => { changed = work; },
    } },
    "../services/button-status.api": { getMyButtons: async () => { requests++; return handler(); } },
    "./devices.store": { useDeviceStore: { persist: { hasHydrated: () => true }, getState: () => device } },
  }, { setTimeout: (work) => { timers.add(work); return work; }, clearTimeout: (work) => timers.delete(work) });
  return { store, device, timers, user, requests: () => requests, respond: (work) => { handler = work; },
    owner: (next) => { const previous = uid; uid = next; device.ownerUid = next; device.buttonDeviceId = "";
      changed({ user: next ? user() : null }, { user: previous ? { uid: previous } : null }); } };
}

test("button API authenticates inventory and validates presence instead of coercing online flags", async () => {
  const calls = []; let reply = { success: true, data: [{ device_id: "BUT-111-AAA", online: false, last_seen_at: null }] };
  const api = load("src/modules/devices/services/button-status.api.ts", {
    "@/shared/api": { apiClient: { get: async (...args) => { calls.push(args); return reply; } } },
  });
  const result = await api.getMyButtons("fixture");
  assert.deepEqual(calls, [["/devices/buttons", "fixture"]]);
  assert.equal(result[0].online, false);
  for (const invalid of [null, {}, { success: false, data: [] }, { success: true, data: [{}] },
    { success: true, data: [{ device_id: "BUT-111-AAA", online: "false", last_seen_at: null }] },
    { success: true, data: [{ device_id: "CAM-111-AAA", online: true, last_seen_at: null }] }]) {
    reply = invalid; await assert.rejects(api.getMyButtons("fixture"));
  }
});

test("shared button inventory restores a missing local assignment and deduplicates screen requests", async () => {
  const app = setup(); const pending = deferred(); app.respond(() => pending.promise);
  const first = app.store.getState().load(app.user()); const second = app.store.getState().load(app.user());
  await settle(); assert.equal(app.requests(), 1);
  pending.resolve([button]); await Promise.all([first, second]);
  assert.equal(app.device.buttonDeviceId, button.deviceId);
  assert.equal(app.store.getState().supported, true);
  assert.equal(app.store.getState().buttons[0].online, true);
  assert.equal(app.timers.size, 0);
});

test("an existing owned selection is preserved and an explicitly empty inventory clears it", async () => {
  const app = setup("BUT-222-BBB");
  app.respond(async () => [button, { ...button, deviceId: "BUT-222-BBB" }]);
  await app.store.getState().load(app.user()); assert.equal(app.device.buttonDeviceId, "BUT-222-BBB");
  app.respond(async () => []); await app.store.getState().load(app.user());
  assert.equal(app.device.buttonDeviceId, "");
});

test("an older inventory cannot replace a button claimed while the request was in flight", async () => {
  const app = setup(); const pending = deferred(); app.respond(() => pending.promise);
  const request = app.store.getState().load(app.user()); await settle();
  app.device.buttonDeviceId = "BUT-222-BBB";
  pending.resolve([button]); await request;
  assert.equal(app.device.buttonDeviceId, "BUT-222-BBB");
});

test("an older backend's 404 keeps pairing while server and authorization failures remain unavailable", async () => {
  const app = setup(button.deviceId);
  app.respond(async () => { throw new APIError("Not found", 404); }); await app.store.getState().load(app.user());
  assert.equal(app.store.getState().supported, false); assert.equal(app.device.buttonDeviceId, button.deviceId);
  for (const status of [401, 503]) {
    app.respond(async () => { throw new APIError("Unavailable", status); }); await app.store.getState().load(app.user());
    assert.equal(app.device.buttonDeviceId, button.deviceId);
    assert.equal(app.store.getState().error, "Couldn't load button status.");
  }
  app.respond(async () => [button]); await app.store.getState().load(app.user());
  assert.equal(app.store.getState().error, null); assert.equal(app.store.getState().supported, true);
});

test("account switches and logout discard previous-owner responses and status", async () => {
  const app = setup(); const pending = deferred(); app.respond(() => pending.promise);
  const old = app.store.getState().load(app.user()); await settle(); app.owner("b");
  assert.equal(app.store.getState().buttons.length, 0);
  app.respond(async () => [{ ...button, deviceId: "BUT-222-BBB" }]); await app.store.getState().load(app.user());
  pending.resolve([button]); await old;
  assert.equal(app.device.buttonDeviceId, "BUT-222-BBB");
  assert.equal(app.store.getState().uid, "b");
  app.owner(null); assert.equal(app.store.getState().buttons.length, 0);
});

test("a timed-out inventory releases loading and cannot apply a late assignment", async () => {
  const app = setup(); const pending = deferred(); app.respond(() => pending.promise);
  const request = app.store.getState().load(app.user()); await settle();
  for (const timeout of [...app.timers]) timeout(); await request;
  assert.equal(app.store.getState().loading, false);
  pending.resolve([button]); await settle(); assert.equal(app.device.buttonDeviceId, "");
  app.respond(async () => [button]); await app.store.getState().load(app.user());
  assert.equal(app.device.buttonDeviceId, button.deviceId);
});

test("button presence follows the backend and never inherits a camera or Ably connection state", () => {
  const { devicePresence } = load("src/modules/devices/utils/device-presence.ts");
  const device = { type: "button", deviceId: button.deviceId };
  const status = { cameras: [], isLoading: false, error: null, buttons: [button], buttonsSupported: true };
  assert.equal(devicePresence(device, status).label, "Online");
  status.buttons = [{ ...button, online: false }]; assert.equal(devicePresence(device, status).label, "Offline");
  status.buttonsLoading = true; assert.equal(devicePresence(device, status).online, false);
  status.buttonsLoading = false; status.buttonsError = "offline"; assert.equal(devicePresence(device, status).label, "Unavailable");
  status.buttonsError = null; status.buttonsSupported = false;
  assert.equal(devicePresence(device, status).label, "Status unavailable");
});

test("button status polls only while focused and foregrounded and refreshes immediately on resume", async () => {
  let focused, listener, tick, loads = 0, removed = false, cleared = false;
  const user = { uid: "a" };
  const app = { currentState: "active", addEventListener: (_name, work) => { listener = work; return { remove: () => { removed = true; } }; } };
  const store = Object.assign(() => ({ uid: "a", buttons: [], supported: true }), { getState: () => ({ load: async () => { loads++; } }) });
  const { useButtons } = load("src/modules/devices/hooks/use-buttons.ts", {
    react: { useCallback: (work) => work }, "react-native": { AppState: app },
    "expo-router": { useFocusEffect: (work) => { focused = work; } },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select({ user }) },
    "../store/button-status.store": { useButtonStatusStore: store },
  }, { setInterval: (work, delay) => { assert.equal(delay, 15000); tick = work; return 1; }, clearInterval: () => { cleared = true; } });
  useButtons(); const cleanup = focused(); assert.equal(loads, 1);
  app.currentState = "background"; tick(); listener(); assert.equal(loads, 1);
  app.currentState = "active"; listener(); assert.equal(loads, 2);
  cleanup(); assert.equal(removed, true); assert.equal(cleared, true);
});
