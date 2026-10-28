const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the real hook with controlled lifecycle, transport, and API inputs.
// No credentials or network calls are used.
function harness({ cameras = [], cameraError = false } = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let dirty = false;
  let foreground;
  let cameraList = cameras;
  let history = [];
  const clients = [];
  const auth = { user: { uid: "user-1", getIdToken: async () => "test-token" }, isCheckingAuth: false, isOldUser: true };
  const devices = { camera1DeviceId: "", camera2DeviceId: "", buttonDeviceId: "" };
  const store = {
    alerts: [],
    mergeAlerts(incoming) {
      const merged = new Map(store.alerts.map((alert) => [alert.alertId, alert]));
      for (const alert of incoming) merged.set(alert.alertId, alert);
      store.alerts = [...merged.values()];
      dirty = true;
    },
    upsertAlert(alert) { store.mergeAlerts([alert]); },
  };
  const same = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, (value) => { slots[index].value = value; dirty = true; }];
    },
    useMemo(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { value: fn(), deps };
      return slots[index].value;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (same(slots[index]?.deps, deps)) return;
      effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: fn() };
      });
    },
  };
  class Realtime {
    constructor(options) {
      this.options = options;
      this.closed = false;
      this.items = new Map();
      this.connection = { on() {}, off() {} };
      this.channels = { get: (name) => {
        if (!this.items.has(name)) {
          const listeners = {};
          this.items.set(name, {
            on: (event, handler) => { listeners[event] = handler; },
            off() {},
            subscribe: async (event, handler) => {
              this.items.get(name).receive = handler;
              this.items.get(name).event = event;
            },
            unsubscribe() {},
            attach: () => listeners.attached?.(),
          });
        }
        return this.items.get(name);
      } };
      clients.push(this);
    }
    close() { this.closed = true; }
  }
  const imports = {
    react,
    "expo-router": { useSegments: () => ["(app)"], useGlobalSearchParams: () => ({}) },
    "@/shared/api/errors": { APIError: class APIError extends Error {} },
    ably: { Realtime },
    "react-native": { AppState: { addEventListener: (_, handler) => {
      foreground = handler;
      return { remove: () => { foreground = undefined; } };
    } } },
    "@/modules/alerts/constants": { ALERT_CREATED_EVENT: "alert.created" },
    "@/modules/alerts/services/alerts.api": { getSavedAlerts: async () => ({ alerts: history }) },
    "@/modules/alerts/services/alerts.mapper": { parseAlertFields: (data) => data?.alertId ? data : null },
    "@/modules/alerts/store/alerts.store": { useAlertsStore: (select) => select(store) },
    "@/modules/auth/services/auth.api": { getAblyToken: async () => ({ clientId: auth.user.uid }) },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select(auth) },
    "@/modules/camera-sensor/services/cameras.api": { getMyCameras: async () => {
      if (cameraError) throw new Error("camera request failed");
      return cameraList;
    } },
    "@/modules/devices": { useDeviceStore: (select) => select(devices) },
  };
  const source = readFileSync(path.join(__dirname, "../src/shared/hooks/use-ably.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const context = {
    exports: {}, console: { log() {}, warn() {}, error() {} },
    require(name) { assert.ok(imports[name], `Unexpected import: ${name}`); return imports[name]; },
  };
  vm.runInNewContext(compiled, context);
  const render = () => {
    dirty = false;
    cursor = 0;
    context.exports.useAbly();
    const pending = effects;
    effects = [];
    pending.forEach((effect) => effect());
  };
  return {
    clients, devices, store, auth,
    setCameras(value) { cameraList = value; },
    setHistory(value) { history = value; },
    resume() { foreground?.("active"); },
    async flush() {
      render();
      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => setImmediate(resolve));
        if (dirty) render();
      }
    },
    cleanup() { slots.forEach((slot) => slot?.cleanup?.()); },
    channel(id) {
      return clients.at(-1)?.items.get(`rideguard:alerts:user:${auth.user?.uid}:device:${id}`);
    },
  };
}

test("subscribes to a backend-owned phone camera without setup IDs or previous alerts", async () => {
  const app = harness({ cameras: [{ deviceId: "CAM-PHONE" }] });
  await app.flush();
  assert.equal(app.channel("CAM-PHONE").event, "alert.created");
  const alert = { alertId: "new", deviceId: "CAM-PHONE", videoUrl: "https://example.com/clip.mp4" };
  app.channel("CAM-PHONE").receive({ data: alert });
  await app.flush();
  assert.equal(app.store.alerts[0], alert);
  assert.equal(app.clients.length, 1, "receiving an alert must not restart the connection");
  app.cleanup();
});

test("reacts when only camera 2 or the button changes", async () => {
  const app = harness();
  await app.flush();
  app.devices.camera2DeviceId = "CAM-2";
  await app.flush();
  assert.ok(app.channel("CAM-2"));
  app.devices.buttonDeviceId = "BUT-1";
  await app.flush();
  assert.ok(app.channel("BUT-1"));
  assert.equal(app.clients[0].closed, true);
  app.cleanup();
});

test("refreshes camera discovery and missed alerts on foreground", async () => {
  const app = harness();
  await app.flush();
  app.setCameras([{ deviceId: "CAM-NEW" }]);
  app.setHistory([{ alertId: "offline", deviceId: "CAM-NEW" }]);
  app.resume();
  await app.flush();
  assert.ok(app.channel("CAM-NEW"));
  assert.equal(app.store.alerts[0].alertId, "offline");
  app.cleanup();
});

test("reconciles alerts missed before channel attachment", async () => {
  const app = harness({ cameras: [{ deviceId: "CAM-1" }] });
  await app.flush();
  app.setHistory([{ alertId: "during-connect", deviceId: "CAM-1" }]);
  app.channel("CAM-1").attach();
  await app.flush();
  assert.equal(app.store.alerts[0].alertId, "during-connect");
  app.auth.user = null;
  await app.flush();
  assert.equal(app.clients[0].closed, true, "sign-out closes the connection");
  app.cleanup();
});

test("loads history and subscribes to known devices if camera discovery fails", async () => {
  const app = harness({ cameraError: true });
  app.setHistory([{ alertId: "saved", deviceId: "CAM-SAVED" }]);
  await app.flush();
  assert.equal(app.store.alerts[0].alertId, "saved");
  assert.ok(app.channel("CAM-SAVED"));
  app.cleanup();
});
