const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

class APIError extends Error { constructor(status) { super("fixture"); this.status = status; this.endpoint = "/auth/is-old-user"; } }
function harness(check) {
  const firebase = { currentUser: { uid: "owner", emailVerified: true, providerData: [{ providerId: "password" }],
    reload: async () => {}, getIdToken: async () => "test-token" } };
  const store = { user: null, isAuthenticated: false, isOldUser: null, isCheckingAuth: true,
    setUser: (user) => { store.user = user; store.isAuthenticated = !!user; },
    setCheckingAuth: (value) => { store.isCheckingAuth = value; }, setIsOldUser: (value) => { store.isOldUser = value; } };
  let cursor = 0, pending = Promise.resolve(), effect, deps;
  const logs = [];
  const slots = [];
  const modules = {
    react: { useRef: (value) => { const i = cursor++; return slots[i] ??= { current: value }; },
      useState: (initial) => { const i = cursor++; if (!(i in slots)) slots[i] = initial;
        return [slots[i], (value) => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }]; },
      useCallback: (work) => work,
      useEffect: (work, next) => { if (!deps || next.some((value, i) => !Object.is(value, deps[i]))) {
        effect?.(); deps = next; effect = work();
      } } },
    "firebase/auth": { onAuthStateChanged: (_, callback) => { pending = callback(firebase.currentUser); return () => {}; } },
    "@/lib/firebase": { auth: firebase },
    "@/shared/api/errors": { APIError },
    "../store/auth.store": { useAuthStore: (selector) => selector(store) },
    "../services/auth.api": { ensureEmailPasswordProfile: () => check(), checkIsOldUser: () => check() },
    "../services/firebase-user-refresh": { refreshFirebaseUser: (user) => user.reload() },
  };
  function load(relative) {
    const compiled = ts.transpileModule(readFileSync(path.join(__dirname, "..", relative), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const context = { exports: {}, console: { info: (...args) => logs.push(args) }, require: (name) => {
      if (name === "../utils/session-errors") return load("src/modules/auth/utils/session-errors.ts");
      assert.ok(name in modules, name); return modules[name];
    } };
    vm.runInNewContext(compiled, context); return context.exports;
  }
  const hook = load("src/modules/auth/hooks/use-auth.ts").useAuth;
  return { firebase, store, logs, APIError, render: () => { cursor = 0; return hook(); }, settle: () => pending };
}

test("profile 500 blocks access but retains Firebase session and retries without a new login", async () => {
  let fails = true;
  const app = harness(async () => { if (fails) throw new APIError(500); return true; });
  app.render(); await app.settle();
  const failure = app.render();
  assert.match(failure.sessionError, /connect/);
  assert.equal(app.store.isAuthenticated, false);
  assert.equal(app.store.isOldUser, null);
  assert.equal(app.firebase.currentUser.uid, "owner");
  fails = false; failure.retrySession(); app.render(); await app.settle();
  assert.equal(app.render().sessionError, null);
  assert.equal(app.store.user.uid, "owner");
  assert.equal(app.store.isOldUser, true);
});

test("unverified account does not run authenticated profile checks", async () => {
  let checks = 0;
  const app = harness(async () => { checks++; return true; });
  app.firebase.currentUser.emailVerified = false;
  app.render(); await app.settle();
  assert.equal(checks, 0);
  assert.equal(app.store.isAuthenticated, false);
  assert.equal(app.render().sessionError, null);
});

test("a profile timeout retains Firebase login and logs the failing endpoint without credentials", async () => {
  let timesOut = true;
  const app = harness(async () => { if (timesOut) throw new APIError(408); return true; });
  app.firebase.currentUser.providerData = [{ providerId: "google.com" }];
  app.render(); await app.settle();
  const failure = app.render();
  assert.match(failure.sessionError, /connect/);
  assert.equal(app.store.isAuthenticated, false);
  assert.equal(app.firebase.currentUser.uid, "owner");
  assert.equal(app.logs[0][1].stage, "rideguard-profile");
  assert.equal(app.logs[0][1].endpoint, "/auth/is-old-user");
  assert.equal(app.logs[0][1].status, 408);
  assert.equal(app.logs[0][1].reason, "request-timeout");
  assert.equal(JSON.stringify(app.logs).includes("test-token"), false);
  timesOut = false; failure.retrySession(); app.render(); await app.settle();
  assert.equal(app.store.isAuthenticated, true);
});

test("temporary Firebase connection failure keeps the session and retries before any profile request", async () => {
  let checks = 0;
  const app = harness(async () => { checks++; return true; });
  app.firebase.currentUser.reload = async () => { throw { code: "auth/network-request-failed", message: "private fixture" }; };
  app.render(); await app.settle();
  const failure = app.render();
  assert.match(failure.sessionError, /connect/);
  assert.equal(checks, 0);
  assert.equal(app.store.isAuthenticated, false);
  assert.equal(app.firebase.currentUser.uid, "owner");
  assert.equal(app.logs[0][1].code, "auth/network-request-failed");
  assert.equal(app.logs[0][1].stage, "firebase-account-refresh");
  assert.equal(JSON.stringify(app.logs).includes("private fixture"), false);
  app.firebase.currentUser.reload = async () => {};
  failure.retrySession(); app.render(); await app.settle();
  assert.equal(app.store.isAuthenticated, true);
  assert.equal(app.render().sessionError, null);
});

test("expired server session stays signed out instead of using outage retry", async () => {
  const app = harness(async () => { throw new APIError(401); });
  app.render(); await app.settle();
  assert.equal(app.store.isAuthenticated, false);
  assert.equal(app.render().sessionError, null);
});

test("an old account's late profile response cannot authenticate the next account", async () => {
  let resolve;
  const app = harness(() => new Promise((done) => { resolve = done; }));
  app.render();
  await new Promise((done) => setImmediate(done));
  app.firebase.currentUser = { uid: "other" };
  resolve(true); await app.settle();
  assert.equal(app.store.isAuthenticated, false);
  assert.equal(app.store.user, null);
});
