const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const cache = new Map();
function load(relativePath, overrides = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  if (!Object.keys(overrides).length && cache.has(filename)) return cache.get(filename);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = {
    exports: {}, Date, Error, TypeError, AbortController, URLSearchParams, Promise, setTimeout, clearTimeout,
    ...overrides,
    require: (name) => {
      if (overrides.modules && name in overrides.modules) return overrides.modules[name];
      if (name === "@/shared/api") return { apiClient: { request: async () => {
        const { APIError } = load("src/shared/api/errors.ts");
        throw new APIError("Service unavailable", 503);
      } } };
      if (name === "@/shared/api/errors") return load("src/shared/api/errors.ts");
      if (name.startsWith(".")) return load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), name + ".ts")));
      return require(name);
    },
  };
  vm.runInNewContext(output, context);
  if (!Object.keys(overrides).length) cache.set(filename, context.exports);
  return context.exports;
}

const policy = load("src/modules/mpin/utils/mpin-policy.ts");
const api = load("src/modules/mpin/services/mpin.api.ts");
const { useMpinStore: store } = load("src/modules/mpin/store/mpin.store.ts");
const grant = () => ({ token: "server-grant-fixture", expiresAt: Date.now() + 60000 });

test("MPIN accepts exactly four digits without inventing stronger backend rules", () => {
  for (const value of ["", "7", "73", "739", "73925", "73a2", " 7392", "7392 "]) assert.equal(policy.isCompleteMpin(value), false);
  assert.equal(policy.isCompleteMpin("7392"), true);
});

test("malformed, empty and expired grants cannot authorize change or reset", () => {
  const now = Date.now();
  for (const value of [null, {}, { token: "", expiresAt: now + 1 }, { token: "x", expiresAt: now },
    { token: "x", expiresAt: NaN }, { token: "x", expiresAt: Infinity }]) assert.equal(policy.validAuthorization(value, now), false);
  assert.equal(policy.validAuthorization(grant()), true);
});

test("backend status must explicitly report configuration and unlock policy", () => {
  assert.equal(policy.validMpinStatus({}), false);
  assert.equal(policy.validMpinStatus({ configured: true }), false);
  assert.equal(policy.validMpinStatus({ configured: true, requiresUnlock: true, remainingAttempts: -1 }), false);
  assert.equal(policy.validMpinStatus({ configured: true, requiresUnlock: true, lockedUntil: Infinity }), false);
  assert.equal(policy.validMpinStatus({ configured: true, requiresUnlock: true, remainingAttempts: 0 }), true);
});

test("recovery requires a real challenge, expiry and masked server destination", () => {
  const delivery = { challengeId: "challenge-fixture", expiresAt: Date.now() + 60000, resendAt: Date.now() + 10000, maskedDestination: "r***@example.test" };
  assert.equal(policy.validDelivery(delivery), true);
  assert.equal(policy.validDelivery({ ...delivery, challengeId: "" }), false);
  assert.equal(policy.validDelivery({ ...delivery, expiresAt: 0 }), false);
});

test("gate routes unknown status, missing MPIN, locked and unlocked accounts correctly", () => {
  const state = { enabled: true, demo: false, uid: "account-a", owner: "account-a", status: null, unlocked: false };
  assert.equal(policy.resolveMpinAccess(state), "status");
  assert.equal(policy.resolveMpinAccess({ ...state, status: { configured: false, requiresUnlock: false } }), "intro");
  assert.equal(policy.resolveMpinAccess({ ...state, status: { configured: true, requiresUnlock: true } }), "login");
  assert.equal(policy.resolveMpinAccess({ ...state, status: { configured: true, requiresUnlock: false }, unlocked: true }), "allowed");
  assert.equal(policy.resolveMpinAccess({ ...state, status: { configured: true, requiresUnlock: false } }), "login");
  assert.equal(policy.resolveMpinAccess({ ...state, owner: "another-account", unlocked: true }), "status");
});

test("unintegrated rollout and demo mode do not pretend to enforce MPIN", () => {
  const state = { enabled: false, demo: false, uid: "account-a", owner: null, status: null, unlocked: false };
  assert.equal(policy.resolveMpinAccess(state), "allowed");
  assert.equal(policy.resolveMpinAccess({ ...state, enabled: true, demo: true }), "allowed");
  assert.equal(api.mpinApi.enabled, true);
  assert.equal(api.mpinApi.emailLinksEnabled, false);
});

test("switching accounts clears PIN drafts, authorization, completion and unlock state", () => {
  store.getState().reset();
  store.getState().setOwner("account-a");
  store.getState().setStatus("account-a", { configured: true, requiresUnlock: false });
  store.getState().setAuthorization(grant(), "change");
  store.getState().setDraft("7392", "change");
  store.getState().acceptUnlock("account-a");
  store.getState().setOwner("account-b");
  const current = store.getState();
  assert.equal(current.draft, null);
  assert.equal(current.authorization, null);
  assert.equal(current.unlocked, false);
  assert.equal(current.success, null);
  assert.equal(current.status, null);
  assert.equal(current.setStatus("account-a", { configured: true, requiresUnlock: false }), false);
  assert.equal(current.complete("account-a", "setup"), false);
});

test("abandoning or backgrounding clears temporary values without interrupting an unlocked session", () => {
  store.getState().setOwner("account-a");
  store.getState().setStatus("account-a", { configured: true, requiresUnlock: false });
  store.getState().acceptUnlock("account-a");
  store.getState().setAuthorization(grant(), "change");
  store.getState().setDraft("7392", "change");
  const generation = store.getState().generation;
  store.getState().clearFlow();
  assert.equal(store.getState().draft, null);
  assert.equal(store.getState().authorization, null);
  assert.equal(store.getState().unlocked, true);
  assert.equal(store.getState().generation > generation, true);
  store.getState().setOwner(null);
  assert.equal(store.getState().unlocked, false);
});

test("cold startup does not restore an MPIN, grant or unlocked state from storage", () => {
  store.getState().reset();
  assert.equal(store.getState().owner, null);
  assert.equal(store.getState().draft, null);
  assert.equal(store.getState().authorization, null);
  assert.equal(store.getState().unlocked, false);
});

test("explicit lock clears grants and drafts without clearing full authentication ownership", () => {
  store.getState().reset(); store.getState().setOwner("a");
  store.getState().setStatus("a", { configured: true, requiresUnlock: false });
  store.getState().setAuthorization(grant(), "change");
  store.getState().setDraft("7392", "change");
  store.getState().lock();
  assert.equal(store.getState().unlocked, false);
  assert.equal(store.getState().status.requiresUnlock, true);
  assert.equal(store.getState().owner, "a");
  assert.equal(store.getState().draft, null);
  assert.equal(store.getState().authorization, null);
});

test("ordinary screen navigation does not require another MPIN", () => {
  store.getState().reset(); store.getState().setOwner("a");
  store.getState().setStatus("a", { configured: true, requiresUnlock: false });
  store.getState().acceptUnlock("a");
  store.getState().clearFlow();
  assert.equal(store.getState().unlocked, true);
});

test("a backend unlock window alone never unlocks a fresh app instance", () => {
  store.getState().reset(); store.getState().setOwner("a");
  store.getState().setStatus("a", { configured: true, requiresUnlock: false, unlockExpiresAt: Date.now() + 60000 });
  assert.equal(store.getState().unlocked, false);
  assert.equal(store.getState().requiresLocalUnlock, true);
  assert.equal(store.getState().acceptUnlock("wrong-account"), false);
});

test("background or expired sessions cannot reopen from another device's valid window", () => {
  for (const invalidate of [() => store.getState().lock(), () => store.getState().setStatus("a", { configured: true, requiresUnlock: true })]) {
    store.getState().reset(); store.getState().setOwner("a");
    store.getState().setStatus("a", { configured: true, requiresUnlock: false });
    assert.equal(store.getState().acceptUnlock("a"), true);
    invalidate();
    store.getState().setStatus("a", { configured: true, requiresUnlock: false, unlockExpiresAt: Date.now() + 60000 });
    assert.equal(store.getState().unlocked, false);
    assert.equal(store.getState().requiresLocalUnlock, true);
  }
});

test("return destination accepts app routes and rejects external or recovery redirects", () => {
  assert.equal(policy.safeReturnPath("/settings/account"), "/settings/account");
  assert.equal(policy.safeReturnPath("/alerts/example-id"), "/alerts/example-id");
  for (const value of ["https://example.test", "//example.test", "/mpin/success", "/settings?redirect=evil", "/../settings"]) {
    assert.equal(policy.safeReturnPath(value), "/");
  }
});

test("unavailable backend operations fail explicitly rather than fabricate security", async () => {
  for (const [name, method] of Object.entries(api.mpinApi)) {
    if (typeof method !== "function") continue;
    await assert.rejects(() => method(), (error) => error instanceof api.MpinError && error.code === "unavailable");
  }
});

test("email challenges retain their purpose and cannot authorize a change by themselves", () => {
  store.getState().reset();
  store.getState().setOwner("account-a");
  store.getState().setAuthorization(grant(), "reset");
  const delivery = { challengeId: "change-email", expiresAt: Date.now() + 60000,
    resendAt: Date.now() + 10000, maskedDestination: "a***@example.test" };
  assert.equal(store.getState().setDelivery(delivery, "change"), true);
  assert.equal(store.getState().delivery.mode, "change");
  assert.equal(store.getState().authorization, null);
  assert.equal(store.getState().setDelivery({ ...delivery, expiresAt: 0 }, "reset"), false);
  assert.equal(store.getState().delivery.mode, "change");
  store.getState().setAuthorization(grant(), "change");
  assert.equal(store.getState().authorization.mode, "change");
  store.getState().clearFlow();
  assert.equal(store.getState().delivery, null);
  assert.equal(store.getState().authorization, null);
});

const flush = () => new Promise((resolve) => setImmediate(resolve));
function requestHarness() {
  const callbacks = [];
  const events = [];
  let focusedCleanup;
  let background;
  let timeout;
  let user = { uid: "account-a", getIdToken: async () => "firebase-token-fixture" };
  store.getState().reset();
  store.getState().setOwner(user.uid);
  const module = load("src/modules/mpin/hooks/use-mpin-request.ts", {
    setTimeout: (callback) => { timeout = callback; return 1; }, clearTimeout: () => { timeout = null; },
    modules: {
      react: { useCallback: (callback) => callback, useRef: (value) => ({ current: value }), useState: (initial) => [initial, (value) => events.push(value)] },
      "expo-router": { useFocusEffect: (callback) => { focusedCleanup = callback(); } },
      "react-native": { AppState: { addEventListener: (_, callback) => { background = callback; return { remove() {} }; } } },
      "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => ({ user }) } },
    },
  });
  const task = module.useMpinRequest();
  return { task, events, callbacks, blur: () => focusedCleanup(), background: () => background("background"),
    timeout: () => timeout(), switchUser: () => { user = { ...user, uid: "account-b" }; store.getState().setOwner(user.uid); } };
}

test("only one verification can be pending at a time", async () => {
  const h = requestHarness();
  let finish;
  let requests = 0;
  const work = () => { requests++; return new Promise((resolve) => { finish = resolve; }); };
  const first = h.task.run(work, (value) => h.callbacks.push(value));
  await flush();
  await h.task.run(work, () => assert.fail("duplicate request completed"));
  assert.equal(requests, 1);
  finish("backend-confirmed-fixture");
  await first;
  assert.equal(h.callbacks.length, 1);
});

test("backgrounding cancels verification and cannot unlock on a late response", async () => {
  const h = requestHarness();
  let finish;
  const pending = h.task.run(() => new Promise((resolve) => { finish = resolve; }), () => assert.fail("unlocked after cancellation"));
  await flush();
  h.background();
  finish("late-response-fixture");
  await pending;
});

test("account switching ignores a pending response for the old user", async () => {
  const h = requestHarness();
  let finish;
  const pending = h.task.run(() => new Promise((resolve) => { finish = resolve; }), () => assert.fail("accepted a different account's response"));
  await flush();
  h.switchUser();
  finish("late-response-fixture");
  await pending;
});

test("timeouts stop processing and show actionable feedback", async () => {
  const h = requestHarness();
  const pending = h.task.run(() => new Promise(() => {}), () => assert.fail("timed-out request completed"));
  await flush();
  h.timeout();
  await pending;
  assert.equal(h.events.some((event) => typeof event === "string" && event.includes("timed out")), true);
});

test("leaving a verification screen discards late results", async () => {
  const h = requestHarness();
  let finish;
  const pending = h.task.run(() => new Promise((resolve) => { finish = resolve; }), () => assert.fail("accepted response after leaving"));
  await flush();
  h.blur();
  finish("late-response-fixture");
  await pending;
});

test("emergency navigation can cancel a pending MPIN request immediately", async () => {
  const h = requestHarness();
  let finish;
  const pending = h.task.run(() => new Promise((resolve) => { finish = resolve; }), () => assert.fail("MPIN interrupted emergency navigation"));
  await flush();
  assert.equal(h.task.isPending(), true);
  h.task.cancel();
  finish("late-response-fixture");
  await pending;
  assert.equal(h.task.isPending(), false);
});

test("incorrect MPIN and server lockouts preserve error meaning without invented limits", () => {
  assert.equal(api.mpinErrorMessage(new api.MpinError("incorrect-pin")), "Incorrect MPIN. Try again.");
  assert.match(api.mpinErrorMessage(new api.MpinError("locked")), /MPIN locked/);
  assert.match(api.mpinErrorMessage(new api.MpinError("expired-authorization")), /Verify again/);
  assert.match(api.mpinErrorMessage(new api.MpinError("expired-session")), /log in again/i);
});

test("server unlock status, expiry and lockout override a stale local unlocked flag", () => {
  const base = { enabled: true, demo: false, uid: "a", owner: "a", unlocked: true };
  for (const extra of [{ requiresUnlock: true }, { locked: true }, { remainingAttempts: 0 }, { unlockExpiresAt: Date.now() - 1 }]) {
    assert.equal(policy.resolveMpinAccess({ ...base, status: { configured: true, requiresUnlock: false, ...extra } }), "login");
  }
  assert.equal(policy.resolveMpinAccess({ ...base, status: { configured: true, requiresUnlock: false, unlockExpiresAt: Date.now() + 60000 } }), "allowed");
});

test("saving or resetting an MPIN does not establish unlock authorization", () => {
  store.getState().reset(); store.getState().setOwner("a");
  for (const mode of ["setup", "change", "reset"]) {
    store.getState().setStatus("a", { configured: true, requiresUnlock: false });
    store.getState().complete("a", mode);
    assert.equal(store.getState().unlocked, false);
    assert.equal(store.getState().status, null);
    assert.equal(store.getState().success, mode);
  }
});

test("server time corrects local clock skew for codes, grants and unlock expiry", () => {
  const serverTime = Date.now() - 86400000;
  store.getState().reset(); store.getState().setOwner("a");
  assert.equal(store.getState().setDelivery({ challengeId: "x", maskedDestination: "a***@example.test",
    serverTime, expiresAt: serverTime + 60000, resendAt: serverTime + 10000 }, "change"), true);
  assert.ok(store.getState().delivery.expiresAt > Date.now());
  assert.equal(store.getState().delivery.serverTime, undefined);
  assert.equal(store.getState().setAuthorization({ token: "x", serverTime, expiresAt: serverTime + 60000 }, "change"), true);
  assert.ok(store.getState().authorization.expiresAt > Date.now());
  store.getState().setStatus("a", { configured: true, requiresUnlock: false, serverTime, unlockExpiresAt: serverTime + 60000 });
  assert.equal(store.getState().acceptUnlock("a"), true);
  assert.equal(store.getState().unlocked, true);
  assert.ok(store.getState().status.unlockExpiresAt > Date.now());
});

const { createMpinSessionChecker } = load("src/modules/mpin/services/mpin-session.ts");
test("server recheck preserves a locally verified session and respects server expiry", async () => {
  const original = api.mpinApi.status;
  const checker = createMpinSessionChecker();
  const user = { uid: "a", getIdToken: async () => "fixture" };
  store.getState().reset(); store.getState().setOwner("a");
  try {
    api.mpinApi.status = async () => ({ configured: true, requiresUnlock: false });
    const pending = checker.check(user);
    assert.equal(store.getState().checkingStatus, true);
    await pending;
    assert.equal(store.getState().unlocked, false);
    assert.equal(store.getState().acceptUnlock("a"), true);
    assert.equal(store.getState().unlocked, true);
    assert.equal(store.getState().checkingStatus, false);
    api.mpinApi.status = async () => ({ configured: true, requiresUnlock: true });
    await checker.check(user);
    assert.equal(store.getState().unlocked, false);
  } finally { checker.cancel(); api.mpinApi.status = original; }
});

test("failed status checks close protected access and discard old-account responses", async () => {
  const original = api.mpinApi.status;
  const checker = createMpinSessionChecker();
  const user = { uid: "a", getIdToken: async () => "fixture" };
  store.getState().reset(); store.getState().setOwner("a");
  try {
    api.mpinApi.status = async () => { throw new TypeError("offline"); };
    await checker.check(user);
    assert.equal(store.getState().status, null);
    assert.equal(store.getState().unlocked, false);
    let finish;
    api.mpinApi.status = () => new Promise(resolve => { finish = resolve; });
    const pending = checker.check(user);
    await flush();
    store.getState().setOwner("b");
    finish({ configured: true, requiresUnlock: false });
    await pending;
    assert.equal(store.getState().owner, "b");
    assert.equal(store.getState().unlocked, false);
    assert.equal(store.getState().status, null);
  } finally { checker.cancel(); api.mpinApi.status = original; }
});

test("late status cannot overwrite a newer explicit lock or MPIN save", async () => {
  const original = api.mpinApi.status;
  const checker = createMpinSessionChecker();
  const user = { uid: "a", getIdToken: async () => "fixture" };
  store.getState().reset(); store.getState().setOwner("a");
  try {
    for (const transition of [() => store.getState().lock(), () => store.getState().complete("a", "reset")]) {
      let finish;
      api.mpinApi.status = () => new Promise(resolve => { finish = resolve; });
      const pending = checker.check(user);
      await flush(); transition();
      finish({ configured: true, requiresUnlock: false });
      await pending;
      assert.equal(store.getState().unlocked, false);
      assert.equal(store.getState().checkingStatus, false);
    }
  } finally { checker.cancel(); api.mpinApi.status = original; }
});

function lifecycleHarness() {
  const effects = [];
  const listeners = new Set();
  let expiryCallback;
  const native = { currentState: "active", addEventListener: (_, callback) => {
    listeners.add(callback); return { remove: () => listeners.delete(callback) };
  } };
  const module = load("src/modules/mpin/hooks/use-mpin-lifecycle.ts", {
    setTimeout: (callback) => { expiryCallback = callback; return 1; }, clearTimeout: () => {},
    modules: {
      react: { useEffect: (effect) => effects.push(effect()) },
      "react-native": { AppState: native }, "expo-router": { useSegments: () => ["(app)", "(tabs)"] },
      "@/modules/auth/store/auth.store": { useAuthStore: {
        getState: () => ({ user: { uid: "a", getIdToken: async () => "fixture" }, isDemo: false, isCheckingAuth: false, isOldUser: true }),
        subscribe: () => () => {},
      } },
    },
  });
  store.getState().reset();
  module.useMpinLifecycle();
  return {
    state(next) { native.currentState = next; for (const callback of listeners) callback(next); },
    expire() { expiryCallback(); },
    dispose() { for (const cleanup of effects) cleanup?.(); },
  };
}

test("cold launch and background return require MPIN while inactive interruptions do not", async () => {
  const original = api.mpinApi.status;
  let calls = 0;
  api.mpinApi.enabled = true;
  api.mpinApi.status = async () => { calls++; return { configured: true, requiresUnlock: false }; };
  const h = lifecycleHarness();
  try {
    await flush(); assert.equal(calls, 1); assert.equal(store.getState().unlocked, false);
    assert.equal(store.getState().acceptUnlock("a"), true);
    h.state("inactive"); h.state("active"); await flush(); assert.equal(calls, 1);
    assert.equal(store.getState().unlocked, true);
    h.state("background"); h.state("active"); await flush(); assert.equal(calls, 2);
    assert.equal(store.getState().unlocked, false);
    api.mpinApi.status = async () => ({ configured: true, requiresUnlock: true });
    h.state("background"); h.state("active"); await flush();
    assert.equal(store.getState().unlocked, false);
  } finally { h.dispose(); api.mpinApi.status = original; api.mpinApi.enabled = true; }
});

test("foreground expiry checks status and disabled rollout never invokes the adapter", async () => {
  const original = api.mpinApi.status;
  let calls = 0;
  api.mpinApi.enabled = true;
  api.mpinApi.status = async () => { calls++; return { configured: true, requiresUnlock: false, unlockExpiresAt: Date.now() + 60000 }; };
  const h = lifecycleHarness();
  try {
    await flush();
    assert.equal(store.getState().acceptUnlock("a"), true);
    api.mpinApi.status = async () => { calls++; return { configured: true, requiresUnlock: true }; };
    h.expire(); assert.equal(store.getState().checkingStatus, true); await flush();
    assert.equal(store.getState().unlocked, false);
    api.mpinApi.enabled = false;
    h.state("background"); h.state("active"); await flush();
    assert.equal(calls, 2);
  } finally { h.dispose(); api.mpinApi.status = original; api.mpinApi.enabled = true; }
});

test("emergency permission is explicit and restricted to SOS or a specific allowed alert", () => {
  const sos = ["(app)", "sos", "active"];
  const alert = ["(app)", "alerts", "[alertId]"];
  assert.equal(policy.canAccessMpinEmergency(sos, null), false);
  const status = { configured: true, requiresUnlock: true, emergencyAccessAllowed: true, emergencyAlertIds: ["active-alert"] };
  assert.equal(policy.canAccessMpinEmergency(sos, status), true);
  assert.equal(policy.canAccessMpinEmergency(alert, status, "active-alert"), true);
  assert.equal(policy.canAccessMpinEmergency(alert, status, "old-alert"), false);
  assert.equal(policy.canAccessMpinEmergency(["(app)", "(tabs)", "settings"], status), false);
  assert.equal(policy.canAccessMpinEmergency(sos, { ...status, emergencyAccessAllowed: false }), false);
});
