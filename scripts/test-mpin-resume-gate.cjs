const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const policyModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname,
  "../src/modules/mpin/utils/mpin-policy.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, policyModule);
const policy = policyModule.exports;

function harness(pathname = "/settings", params = {}) {
  let progressFailure = false;
  let progressChecks = 0;
  let cursor = 0, effectCursor = 0;
  const slots = [], effects = [], pending = [], routes = [], actions = [];
  const appState = { currentState: "active" };
  const user = { uid: "a" };
  const auth = { user, isAuthenticated: true, isCheckingAuth: false, isOldUser: true };
  const mpin = { owner: "a", unlocked: true, checkingStatus: false,
    status: { configured: true, requiresUnlock: false } };
  const same = (a, b) => a?.length === b?.length && a?.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef: (value) => { const index = cursor++; slots[index] ??= { current: value }; return slots[index]; },
    useState: (value) => { const index = cursor++; slots[index] ??= { value }; return [slots[index].value, (next) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }]; },
    useCallback: (work, deps) => {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { work, deps };
      return slots[index].work;
    },
  };
  const router = { replace: (route) => { actions.push("replace"); routes.push(route); },
    push: (route) => { actions.push("push"); routes.push(route); } };
  const useMpinStore = Object.assign(() => mpin, { getState: () => ({ ...mpin, setReturnTo: (value) => { mpin.returnTo = value; } }) });
  const modules = {
    react, "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { AppState: appState, View: "View", ActivityIndicator: "Spinner", StyleSheet: { absoluteFill: {} } },
    "expo-router": { useRouter: () => router, usePathname: () => pathname, useSegments: () => ["(app)", "settings"], useGlobalSearchParams: () => params,
      useFocusEffect: (work) => { const index = effectCursor++; if (effects[index]?.work !== work) pending.push(() => {
        effects[index]?.cleanup?.(); effects[index] = { work, cleanup: work() };
      }); } },
    "@/modules/auth/store/auth.store": { useAuthStore: () => auth },
    "@/modules/auth/services/registration-progress": { postAuthDestination: async () => {
      progressChecks++;
      if (progressFailure) throw new Error("Storage unavailable");
      return "/(app)/(tabs)";
    } },
    "@/shared/hooks/use-theme": { useTheme: () => ({ background: "#fff" }) },
    "@/shared/theme": { Spacing: { four: 24 } },
    "@/shared/ui/button": { Button: "Button" }, "@/shared/ui/form-feedback": { FormFeedback: "Feedback" },
    "../hooks/use-mpin-foreground": { useMpinForeground: () => appState.currentState === "active" },
    "../services/mpin.api": { mpinApi: { enabled: true } },
    "../store/mpin.store": { useMpinStore },
    "../utils/mpin-policy": { canAccessMpinEmergency: () => false, isMpinEmergencyRoute: () => false,
      mpinReturnPath: policy.mpinReturnPath,
      resolveMpinAccess: ({ unlocked }) => unlocked ? "allowed" : "login" },
  };
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/mpin/components/mpin-app-gate.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(compiled, context);
  return { appState, auth, mpin, routes, actions, navigate: (path) => { pathname = path; },
    progressChecks: () => progressChecks, failProgress: (value) => { progressFailure = value; }, render: () => {
    cursor = 0; effectCursor = 0;
    const tree = context.exports.MpinAppGate({ children: "protected-stack" });
    pending.splice(0).forEach((effect) => effect());
    return tree;
  } };
}

test("normal tab and page navigation does not repeat onboarding checks or cover the unlocked stack", async () => {
  const app = harness("/");
  app.render(); await settle(); app.render();
  assert.equal(app.progressChecks(), 1);
  for (const path of ["/alerts", "/camera", "/settings", "/settings/account", "/contact",
    "/devices/quick-button", "/devices/button-setup", "/"]) {
    app.navigate(path);
    const tree = app.render();
    assert.equal(tree.props.children[0].props.pointerEvents, "auto");
    assert.equal(tree.props.children[1].props.pointerEvents, "none");
    await settle(); app.render();
    assert.equal(app.progressChecks(), 1);
  }
  assert.equal(app.routes.length, 0);
});

test("background locking hides protected UI without replacing the native screen in the background", async () => {
  const app = harness(); app.render(); await settle();
  const ready = app.render();
  assert.equal(ready.props.children[0].props.children, "protected-stack");
  app.appState.currentState = "background"; app.mpin.unlocked = false;
  const hidden = app.render(); await settle();
  assert.equal(app.routes.length, 0);
  assert.equal(hidden.props.collapsable, false);
  assert.equal(hidden.props.children[0].props.collapsable, false);
  assert.equal(hidden.props.children[0].props.children, "protected-stack");
  assert.equal(hidden.props.children[0].props.pointerEvents, "none");
  assert.equal(hidden.props.children[0].props.accessibilityElementsHidden, true);
  assert.equal(hidden.props.children[1].props.collapsable, false);
  assert.equal(ready.props.children[1].type, hidden.props.children[1].type);
});

test("resume waits for the server check and redirects once without granting access from a cached unlock window", async () => {
  const app = harness(); app.render(); await settle(); app.render();
  app.appState.currentState = "background"; app.mpin.unlocked = false; app.render();
  app.appState.currentState = "active"; app.mpin.checkingStatus = true;
  app.render(); await settle(); app.render();
  assert.equal(app.routes.length, 0);
  app.mpin.checkingStatus = false;
  app.render(); app.render();
  assert.equal(app.routes.length, 1);
  assert.equal(app.routes[0].params.step, "login");
  assert.equal(app.mpin.returnTo, "/settings");
  assert.deepEqual(app.actions, ["push"], "security must cover, not replace, the existing form stack");
});

test("photo-picker background return retains the protected contact stack and its identity", async () => {
  const app = harness("/contact/edit-contact", { contactId: "saved-contact" });
  app.render(); await settle(); app.render();
  app.appState.currentState = "background"; app.mpin.unlocked = false;
  const hidden = app.render();
  assert.equal(hidden.props.children[0].props.children, "protected-stack");
  assert.equal(hidden.props.children[0].props.pointerEvents, "none");
  app.appState.currentState = "active";
  app.render(); await settle(); app.render(); app.render();
  assert.deepEqual(app.actions, ["push"]);
  assert.equal(app.mpin.returnTo, "/contact/edit-contact?contactId=saved-contact");
});

test("a pending onboarding lookup cannot redirect after the app backgrounds", async () => {
  const app = harness(); app.render();
  app.appState.currentState = "background";
  await settle(); app.render();
  assert.equal(app.routes.length, 0);
});

test("all normal app routes have an allowed MPIN return destination", () => {
  const fs = require("node:fs");
  const base = path.join(__dirname, "../src/app/(app)");
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".tsx") && !entry.name.startsWith("_")) {
        const relative = path.relative(base, file).replaceAll("\\", "/");
        const route = "/" + relative.replaceAll("(tabs)/", "").replace(/\.tsx$/, "").replace(/(^|\/)index$/, "").replace(/\/$/, "").replace("[alertId]", "alert-123");
        assert.equal(policy.safeReturnPath(route), route, `Unresumable screen: ${relative}`);
      }
    }
  }
  visit(base);
});

test("settings hardware return preserves camera slot and settings behavior", () => {
  for (const route of ["/devices/camera", "/devices/camera/camera-preview", "/devices/button", "/devices/button/test-page", "/register/provision"]) {
    const target = policy.mpinReturnPath(route, { source: "settings", camera: "2" });
    assert.equal(policy.safeReturnPath(target), target);
    assert.ok(target.includes("source=settings"));
    if (route.startsWith("/devices/camera")) assert.ok(target.includes("camera=2"));
    assert.equal(policy.mpinReturnPath(route, { source: "onboarding" }), "/devices");
  }
  assert.equal(policy.safeReturnPath("/devices/camera?source=onboarding&camera=2"), "/");
});

test("Quick Button pairing resumes only as an explicitly allowed Settings screen", () => {
  assert.equal(policy.mpinReturnPath("/register/provision", { source: "settings" }),
    "/register/provision?source=settings");
  for (const route of ["/register/provision", "/register/provision?source=onboarding",
    "/register/provision?source=settings&next=https://example.com", "/register/profile?source=settings"]) {
    assert.equal(policy.safeReturnPath(route), "/");
  }
});

test("repeated app switches do not replace existing forms or dispatch duplicate lock screens", async () => {
  for (const [route, params] of [["/settings/account/edit", {}], ["/contact/add-contact", {}],
    ["/settings/search", {}], ["/settings/archives", {}], ["/settings/sos-preferences", {}],
    ["/alerts/alert-123", {}], ["/devices/camera", { source: "settings", camera: "2" }],
    ["/register/provision", { source: "settings" }]]) {
    const app = harness(route, params);
    app.render(); await settle(); app.render();
    for (let i = 0; i < 3; i++) {
      app.appState.currentState = "background"; app.mpin.unlocked = false;
      assert.equal(app.render().props.children[0].props.pointerEvents, "none");
      app.appState.currentState = "active"; app.mpin.checkingStatus = true;
      app.render(); await settle(); app.render();
      const previous = app.actions.length;
      app.mpin.checkingStatus = false;
      app.render(); app.render();
      assert.equal(app.actions.length, previous + 1);
      assert.equal(app.actions.at(-1), "push");
      assert.equal(app.mpin.returnTo, policy.mpinReturnPath(route, params));
      app.mpin.unlocked = true;
      assert.equal(app.render().props.children[0].props.children, "protected-stack");
    }
  }
});

test("progress read failure offers retry without discarding the existing screen", async () => {
  const app = harness("/settings/account/edit");
  app.render(); await settle(); app.render();
  app.failProgress(true);
  app.appState.currentState = "background"; app.render();
  app.appState.currentState = "active"; app.render(); await settle();
  const failed = app.render();
  assert.deepEqual(app.routes, []);
  assert.equal(failed.props.children[0].props.children, "protected-stack");
  assert.equal(failed.props.children[0].props.pointerEvents, "none");
  const overlay = failed.props.children[1];
  assert.equal(overlay.props.accessibilityLabel, "Unable to restore screen");
  app.failProgress(false);
  overlay.props.children[1].props.children[1].props.onPress();
  app.render(); await settle(); app.render();
  assert.equal(app.render().props.children[0].props.pointerEvents, "auto");
});

test("logout and account changes remove the old protected subtree during resume", async () => {
  const app = harness(); app.render(); await settle(); app.render();
  app.auth.user = { uid: "b" }; app.mpin.owner = "b"; app.mpin.unlocked = false;
  assert.equal(app.render().props.children[0].props.children, null);
  app.auth.isAuthenticated = false; app.auth.user = null;
  const loggedOut = app.render();
  assert.equal(loggedOut.props.children[0].props.children, null);
  assert.equal(app.routes.at(-1), "/(public)/welcome");
});
