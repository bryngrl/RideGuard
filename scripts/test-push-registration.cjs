const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const compiled = ts.transpileModule(readFileSync(path.join(__dirname,
  "../src/modules/notifications/hooks/use-push-registration.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const flush = () => new Promise((resolve) => setImmediate(resolve));

class APIError extends Error { constructor(status) { super("Internal server error"); this.status = status; } }

function setup(getToken, options = {}) {
  let cleanup;
  let resume;
  let tokenListener;
  let tokenRequests = 0;
  let removed = 0;
  let timerId = 0;
  const timers = new Map();
  const registrations = [];
  const warnings = [], errors = [];
  const user = { uid: "test-user", getIdToken: async () => "test-auth-token" };
  const mocks = {
    react: { useRef: (value) => ({ current: value }), useEffect: (effect) => { cleanup = effect(); } },
    "expo-device": { isDevice: true, deviceName: "Test phone" },
    "expo-notifications": {
      getPermissionsAsync: async () => ({ granted: true }),
      getDevicePushTokenAsync: async () => { tokenRequests++; return getToken(tokenRequests); },
      addPushTokenListener: (callback) => { tokenListener = callback; return { remove: () => removed++ }; },
    },
    "react-native": {
      Platform: { OS: "android" },
      AppState: { addEventListener: (_, callback) => { resume = callback; return { remove: () => removed++ }; } },
    },
    "@/modules/auth/store/auth.store": { useAuthStore: (selector) => selector({ user, isCheckingAuth: false, isOldUser: true, ...options.auth }) },
    "@/shared/api/errors": { APIError },
    "expo-router": { useSegments: () => options.segments ?? ["(app)"], useGlobalSearchParams: () => options.params ?? {} },
    "../services/installation-id": { getInstallationId: async () => "test-installation" },
    "../services/notifications.api": { registerPushNotification: async (...args) => {
      registrations.push(args); if (options.register) await options.register(...args);
    } },
  };
  const context = { exports: {}, Error, String,
    console: { log() {}, warn: (...args) => warnings.push(args), error: (...args) => errors.push(args) },
    require: (name) => { if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`); return mocks[name]; },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
  };
  vm.runInNewContext(compiled, context);
  context.exports.usePushRegistration();
  return {
    timers, registrations, warnings, errors,
    cleanup: () => cleanup?.(), resume: () => resume?.("active"),
    rotate: (token) => tokenListener({ data: token }),
    requests: () => tokenRequests, removed: () => removed,
    runTimer() {
      const [id, timer] = timers.entries().next().value;
      timers.delete(id);
      timer.callback();
      return timer.delay;
    },
  };
}

test("push registration waits until profile and onboarding are complete", async () => {
  for (const options of [{ auth: { isOldUser: false } }, { auth: { isOldUser: null } },
    { auth: { isCheckingAuth: true } }, { segments: ["(onboarding)", "register", "mpin"] }]) {
    const flow = setup(async () => ({ data: "test-token" }), options);
    await flush();
    assert.equal(flow.requests(), 0);
    assert.equal(flow.registrations.length, 0);
    flow.cleanup();
  }
});

test("settings hardware setup keeps push registration enabled", async () => {
  const flow = setup(async () => ({ data: "test-token" }), {
    segments: ["(onboarding)", "devices", "camera"], params: { source: "settings" },
  });
  await flush();
  assert.equal(flow.registrations.length, 1);
  flow.cleanup();
});

test("backend failures do not open LogBox and retry on resume without claiming success", async () => {
  let fail = true;
  const flow = setup(async () => ({ data: "test-token" }), { register: async () => {
    if (fail) throw new APIError(500);
  } });
  await flush();
  assert.equal(flow.errors.length, 0);
  assert.equal(flow.warnings[0][1], "HTTP 500");
  fail = false; flow.resume(); await flush();
  assert.equal(flow.registrations.length, 2);
  flow.resume(); await flush();
  assert.equal(flow.registrations.length, 2);
  flow.cleanup();
});

test("failed token rotation retries registration on resume", async () => {
  let fail = false;
  const flow = setup(async () => ({ data: "rotated-token" }), { register: async () => {
    if (fail) throw new APIError(500);
  } });
  await flush();
  fail = true; flow.rotate("rotated-token"); await flush();
  fail = false; flow.resume(); await flush();
  assert.equal(flow.registrations.length, 3);
  flow.cleanup();
});

test("temporary Firebase failures retry with backoff and stop after successful registration", async () => {
  const flow = setup(async (attempt) => {
    if (attempt < 3) throw new Error("SERVICE_NOT_AVAILABLE");
    return { data: "test-device-token" };
  });
  await flush();
  assert.equal(flow.runTimer(), 5000);
  await flush();
  assert.equal(flow.runTimer(), 15000);
  await flush();
  assert.equal(flow.registrations.length, 1);
  assert.equal(flow.registrations[0][1].registrationId, "test-device-token");
  assert.equal(flow.timers.size, 0);
  flow.resume();
  await flush();
  assert.equal(flow.requests(), 3);
  flow.rotate("rotated-token");
  await flush();
  assert.equal(flow.registrations[1][1].registrationId, "rotated-token");
  flow.cleanup();
});

test("retries are bounded and a later app resume starts a fresh attempt", async () => {
  const flow = setup(async () => { throw new Error("SERVICE_NOT_AVAILABLE"); });
  await flush();
  for (const delay of [5000, 15000, 30000]) {
    assert.equal(flow.runTimer(), delay);
    await flush();
  }
  assert.equal(flow.requests(), 4);
  assert.equal(flow.timers.size, 0);
  flow.resume();
  await flush();
  assert.equal(flow.requests(), 5);
  assert.equal(flow.timers.size, 1);
  flow.cleanup();
  assert.equal(flow.timers.size, 0);
  assert.equal(flow.removed(), 2);
});

test("a token failure arriving after logout cannot schedule a retry", async () => {
  let rejectToken;
  const flow = setup(() => new Promise((_, reject) => { rejectToken = reject; }));
  await flush();
  flow.cleanup();
  rejectToken(new Error("SERVICE_NOT_AVAILABLE"));
  await flush();
  assert.equal(flow.timers.size, 0);
  assert.equal(flow.registrations.length, 0);
});

test("resuming during a token request does not start duplicate registration", async () => {
  let resolveToken;
  const flow = setup(() => new Promise((resolve) => { resolveToken = resolve; }));
  await flush();
  flow.resume();
  await flush();
  assert.equal(flow.requests(), 1);
  resolveToken({ data: "test-device-token" });
  await flush();
  assert.equal(flow.registrations.length, 1);
  flow.cleanup();
});
