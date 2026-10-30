const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");

function startup() {
  const state = { isAuthenticated: false, isCheckingAuth: true, isOldUser: null, user: null };
  const slots = [], routes = [], timers = []; let cursor = 0, effectRan = false, checks = 0;
  const modules = {
    "react/jsx-runtime": require("react/jsx-runtime"),
    react: { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (value) => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }]; },
      useEffect(work) { if (!effectRan) { effectRan = true; work(); } }, useCallback: (work) => work },
    "expo-router": { useRouter: () => ({ replace: (route) => routes.push(route) }), useFocusEffect: (work) => work() },
    "@/modules/auth/screens/welcome-screen": { default: "Welcome" },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select(state) },
    "@/modules/auth/services/registration-progress": { postAuthDestination: async () => { checks++; return "/(app)/(tabs)"; } },
    "@/modules/auth/services/verified-success": { getVerifiedSuccess: () => null },
    "@/modules/auth/store/registration-draft.store": { useRegistrationDraft: (select) => select({ verificationEmail: null }) },
    "@/lib/firebase": { auth: { currentUser: null } },
  };
  const context = { exports: {}, setTimeout: (work, delay) => { timers.push({ work, delay }); return timers.length; }, clearTimeout() {},
    require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/app/index.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return { state, routes, timers, checks: () => checks, render: () => { cursor = 0; return context.exports.default(); } };
}
test("returning users start server routing as soon as auth completes without waiting for the welcome timer", async () => {
  const app = startup(); app.render();
  assert.equal(app.timers[0].delay, 2300); assert.equal(app.checks(), 0);
  Object.assign(app.state, { isAuthenticated: true, isCheckingAuth: false, isOldUser: true, user: { uid: "owner" } });
  app.render(); await Promise.resolve();
  assert.equal(app.checks(), 1); assert.deepEqual(app.routes, ["/(app)/(tabs)"]);
});
test("startup never routes a session while authentication is still being checked", () => {
  const app = startup(); Object.assign(app.state, { isAuthenticated: true, user: { uid: "owner" }, isOldUser: true });
  app.render(); assert.equal(app.checks(), 0); assert.equal(app.routes.length, 0);
});
test("signed-out visitors retain the welcome animation and never route to protected content", () => {
  const app = startup(); app.state.isCheckingAuth = false;
  assert.equal(app.render().props.showLanding, false);
  app.timers[0].work(); assert.equal(app.render().props.showLanding, true);
  assert.equal(app.checks(), 0); assert.equal(app.routes.length, 0);
});
