const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, modules, globals = {}) {
  const context = { exports: {}, Promise, ...globals, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
const deferred = () => { let resolve; const promise = new Promise((work) => { resolve = work; }); return { promise, resolve }; };
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
function setup() {
  let uid = "a", authChanged, handler = async () => [], requests = 0;
  const timers = new Set();
  const user = (id = uid) => ({ uid: id, getIdToken: async () => "fixture" });
  const { useCameraStatusStore: store } = load("src/modules/camera-sensor/store/camera-status.store.ts", {
    zustand: require("zustand"),
    "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => ({ user: uid ? user() : null }), subscribe: (work) => { authChanged = work; } } },
    "../services/cameras.api": { getMyCameras: async () => { requests++; return handler(); } },
  }, { setTimeout: (work) => { timers.add(work); return work; }, clearTimeout: (work) => timers.delete(work) });
  return { store, user, timers, requests: () => requests, respond: (work) => { handler = work; },
    owner: (next) => { const previous = uid; uid = next; authChanged({ user: next ? user(next) : null }, { user: previous ? user(previous) : null }); } };
}

test("Home and Preview share one request and the same backend online/offline values", async () => {
  const app = setup(); const result = deferred(); app.respond(() => result.promise);
  const home = app.store.getState().load(app.user());
  const preview = app.store.getState().load(app.user());
  await settle(); assert.equal(app.requests(), 1);
  result.resolve([{ deviceId: "CAM-123-ABC", online: false }, { deviceId: "CAM-456-DEF", online: true }]);
  await Promise.all([home, preview]);
  assert.equal(app.store.getState().cameras[0].online, false);
  assert.equal(app.store.getState().cameras[1].online, true);
  assert.equal(app.store.getState().loading, false);
  assert.equal(app.timers.size, 0);
});

test("account switch clears statuses and ignores the previous account's late response", async () => {
  const app = setup(); const pending = deferred(); app.respond(() => pending.promise);
  const old = app.store.getState().load(app.user()); await settle();
  app.owner("b"); assert.equal(app.store.getState().cameras.length, 0);
  app.respond(async () => [{ deviceId: "B-camera", online: false }]);
  await app.store.getState().load(app.user());
  pending.resolve([{ deviceId: "A-camera", online: true }]); await old;
  assert.equal(app.store.getState().uid, "b");
  assert.equal(app.store.getState().cameras[0].deviceId, "B-camera");
});

test("failed and timed-out status requests allow retry", async () => {
  const app = setup(); app.respond(async () => { throw new Error("offline"); });
  await app.store.getState().load(app.user());
  assert.equal(app.store.getState().error, "Couldn't load cameras.");
  app.respond(() => new Promise(() => {}));
  const pending = app.store.getState().load(app.user());
  for (const timeout of [...app.timers]) timeout();
  await pending; assert.equal(app.store.getState().loading, false);
  app.respond(async () => [{ deviceId: "camera", online: false }]);
  await app.store.getState().load(app.user());
  assert.equal(app.store.getState().error, null);
  assert.equal(app.store.getState().cameras[0].online, false);
});

test("camera API uses the existing route and requires an actual online boolean", async () => {
  const calls = [];
  const { getMyCameras } = load("src/modules/camera-sensor/services/cameras.api.ts", {
    "@/shared/api": { apiClient: { get: async (...args) => { calls.push(args); return { data: [
      { device_id: "one", online: true }, { device_id: "two", online: "false" },
    ] }; } } },
  });
  const cameras = await getMyCameras("fixture");
  assert.deepEqual(calls, [["/devices/cameras", "fixture"]]);
  assert.equal(cameras[0].online, true); assert.equal(cameras[1].online, false);
});

test("a malformed camera response cannot clear assignments or pretend every camera is offline", async () => {
  for (const reply of [null, {}, { success: false, data: [] }, { success: true, data: {} }]) {
    const { getMyCameras } = load("src/modules/camera-sensor/services/cameras.api.ts", {
      "@/shared/api": { apiClient: { get: async () => reply } },
    });
    await assert.rejects(getMyCameras("fixture"));
  }
});
