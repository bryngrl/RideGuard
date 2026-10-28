const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "../src/shared/hooks/use-ably.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
class APIError extends Error { constructor(status) { super("Internal server error"); this.status = status; } }

function mount(options = {}) {
  const effects = [], cleanups = [], listeners = [], warnings = [], errors = [], merges = [];
  const calls = { cameras: 0, alerts: 0, realtime: 0 };
  const user = { uid: "test-user", getIdToken: options.token ?? (async () => "fixture-token") };
  const auth = { user, isOldUser: true, isCheckingAuth: false, ...options.auth };
  const alerts = { alerts: [], upsertAlert() {}, mergeAlerts: (value) => merges.push(value) };
  const modules = {
    react: { useEffect: (effect) => effects.push(effect), useMemo: (factory) => factory(), useState: (value) => [value, () => {}] },
    "react-native": { AppState: { addEventListener: (_, listener) => {
      listeners.push(listener); return { remove() {} };
    } } },
    "expo-router": { useSegments: () => options.segments ?? ["(app)", "(tabs)"], useGlobalSearchParams: () => options.params ?? {} },
    ably: { Realtime: class {
      constructor() { calls.realtime++; }
      connection = { on() {}, off() {} };
      channels = { get: () => ({ on() {}, off() {}, subscribe: async () => {}, unsubscribe() {} }) };
      close() {}
    } },
    "@/modules/alerts/constants": { ALERT_CREATED_EVENT: "alert.created" },
    "@/modules/alerts/services/alerts.api": { getSavedAlerts: async () => { calls.alerts++; return { alerts: ["saved-alert"] }; } },
    "@/modules/alerts/services/alerts.mapper": { parseAlertFields() {} },
    "@/modules/alerts/store/alerts.store": { useAlertsStore: (select) => select(alerts) },
    "@/modules/auth/services/auth.api": { getAblyToken: async () => ({}) },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select(auth) },
    "@/modules/camera-sensor/services/cameras.api": { getMyCameras: async () => {
      calls.cameras++; if (options.cameraFailure) throw new APIError(500); return [];
    } },
    "@/modules/devices": { useDeviceStore: (select) => select({ camera1DeviceId: options.device ?? null }) },
    "@/shared/api/errors": { APIError },
  };
  const context = { exports: {}, console: { log() {}, warn: (...args) => warnings.push(args), error: (...args) => errors.push(args) },
    require: (name) => { assert.ok(name in modules, `Unexpected import: ${name}`); return modules[name]; } };
  vm.runInNewContext(compiled, context);
  context.exports.useAbly();
  effects.forEach((effect) => cleanups.push(effect()));
  return { calls, warnings, errors, merges, resume: () => listeners.forEach((listener) => listener("active")),
    cleanup: () => cleanups.forEach((cleanup) => cleanup?.()) };
}

test("unfinished profile and MPIN onboarding do not discover cameras or subscribe", async () => {
  for (const options of [{ auth: { isOldUser: false } }, { auth: { isOldUser: null } },
    { auth: { isCheckingAuth: true } }, { segments: ["(onboarding)", "register", "mpin"] }]) {
    const app = mount({ ...options, device: "CAM-123-ABC" });
    await settle();
    assert.deepEqual(app.calls, { cameras: 0, alerts: 0, realtime: 0 });
    app.cleanup();
  }
});

test("completed accounts keep realtime monitoring during settings hardware setup", async () => {
  const app = mount({ segments: ["(onboarding)", "devices", "camera"], params: { source: "settings" }, device: "CAM-123-ABC" });
  await settle();
  assert.deepEqual(app.calls, { cameras: 1, alerts: 1, realtime: 1 });
  app.cleanup();
});

test("camera server failure does not block saved alerts or produce a console error", async () => {
  const app = mount({ cameraFailure: true });
  await settle();
  assert.equal(app.merges.length, 1);
  assert.equal(app.errors.length, 0);
  assert.equal(app.warnings.length, 1);
  assert.equal(app.warnings[0][1], "HTTP 500");
  app.resume(); await settle();
  assert.equal(app.calls.cameras, 2);
  app.cleanup();
});

test("overlapping resumes share one refresh and cleanup ignores a late token", async () => {
  let resolveToken;
  const app = mount({ token: () => new Promise((resolve) => { resolveToken = resolve; }) });
  app.resume(); app.resume();
  app.cleanup(); resolveToken("fixture-token");
  await settle();
  assert.equal(app.calls.cameras, 0);
  assert.equal(app.calls.alerts, 0);
  assert.equal(app.warnings.length, 0);
});
