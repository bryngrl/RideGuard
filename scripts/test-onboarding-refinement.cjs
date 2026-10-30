const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules, globals = {}) {
  const context = { exports: {}, ...globals, require(name) {
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
const jsx = require("react/jsx-runtime");

test("concurrent Google profile checks share one request but a later login checks again", async () => {
  let resolve, calls = 0;
  const api = load("src/modules/auth/services/auth.api.ts", {
    "./verified-success": { beginVerifiedSuccess() {} },
    "@/shared/api": { apiClient: { get: () => { calls++; return new Promise((done) => { resolve = done; }); } } },
    "@/shared/api/errors": { APIError: Error },
  });
  const first = api.checkIsOldUser("session");
  assert.equal(api.checkIsOldUser("session"), first);
  assert.equal(calls, 1); resolve({ success: true, data: true }); await first;
  const next = api.checkIsOldUser("session");
  assert.equal(calls, 2); resolve({ success: true, data: false }); assert.equal(await next, false);
});

test("auth timeout aborts a stalled body read and never retries registration", async () => {
  let timer, signal, calls = 0;
  class APIError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const { APIClient } = load("src/shared/api/client.ts", { "./errors": { APIError } }, {
    process: { env: {} }, AbortController,
    setTimeout: (work) => { timer = work; return 1; }, clearTimeout() {},
    fetch: async (_url, options) => { signal = options.signal; calls++; return { text: () => new Promise(() => {}) }; },
  });
  const result = new APIClient("https://fixture.invalid").post("/auth/register", {});
  const failed = assert.rejects(result, (error) => error.status === 408);
  await Promise.resolve(); timer(); await failed;
  assert.equal(signal.aborted, true); assert.equal(calls, 1);
});

test("hardware skip persists MPIN locally before background sync without touching pairing or tests", async () => {
  for (const stage of ["connection-skipped", "tests-skipped"]) {
    const calls = [];
    const user = { uid: "owner", email: "driver@gmail.com" };
    const store = { firstName: "Ana", lastName: "Reyes", hardwareSetup: "", updateDraft(data) { Object.assign(store, data); } };
    const { skipHardware } = load("src/modules/onboarding/services/skip-hardware.ts", {
      "@/lib/firebase": { auth: { currentUser: user } },
      "@/modules/auth/services/registration-progress": { saveOnboardingStep: async (...args) => { calls.push(args); if (args[2]) throw Error("offline"); } },
      "@/modules/auth/services/onboarding-progress.api": { onboardingDraft: (data) => ({ firstName: data.firstName, hardwareSetup: data.hardwareSetup }) },
      "../store/onboarding.store": { useOnboardingStore: { getState: () => store } },
    });
    await skipHardware(stage);
    assert.equal(store.hardwareSetup, stage); assert.equal(store.firstName, "Ana"); assert.equal(store.lastName, "Reyes");
    assert.equal(calls[0].length, 2); assert.equal(calls[0][1], "mpin");
    assert.equal(calls[1][2], user); assert.equal(calls[1][3].hardwareSetup, stage);
  }
});

test("name field order and edits preserve the distinct first and last name mappings", () => {
  const values = { firstName: "Ana", lastName: "Reyes", phone: "9123456789", updateDraft(data) { Object.assign(values, data); } };
  const Screen = load("src/modules/onboarding/screens/profile-step-screen.tsx", {
    "react/jsx-runtime": jsx,
    react: { useRef: () => ({ current: null }), useState: (value) => [value, () => {}] },
    "@/assets/icons//logos/main.svg": "Logo",
    "@/shared/hooks/use-theme": { useTheme: () => ({}) },
    "@/shared/lib/input-formats": {}, "@/shared/theme": { Spacing: {}, Typography: {} },
    "@/shared/ui/button": { Button: "Button" },
    "@/shared/ui/keyboard-avoiding-wrapper": { KeyboardAvoidingWrapper: "Layout" },
    "@/shared/ui/keyboard-hidden-view": { KeyboardHiddenView: "Footer" },
    "@/shared/ui/stepper": { default: "Stepper" }, "@/shared/ui/text-input": { CustomTextInput: "Input" },
    "expo-router": { useRouter: () => ({}) }, "react-native": { Text: "Text", View: "View" },
    "../store/onboarding.store": { useOnboardingStore: () => values }, "./profile-step-screen.styles": { styles: {} },
  }).default;
  const inputs = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "Input") inputs.push(node);
    for (const child of [node.props?.children].flat(Infinity)) visit(child);
  }
  visit(Screen()); assert.deepEqual(inputs.map((input) => input.props.label), ["First Name", "Last Name", "Phone Number"]);
  inputs[0].props.onChangeText("Maria"); inputs[1].props.onChangeText("Santos");
  assert.equal(values.firstName, "Maria"); assert.equal(values.lastName, "Santos");
});

function verifiedScreen(authorized = true) {
  const animations = [], routes = [], cleanups = [];
  const handoff = { uid: "owner", destination: "/(onboarding)/register/profile" };
  let cleared = 0;
  class Value { interpolate() { return 0; } }
  const Screen = load("src/modules/auth/screens/account-verified-screen.tsx", {
    "react/jsx-runtime": jsx,
    react: { useState: (value) => [typeof value === "function" ? value() : value], useEffect: (work) => { cleanups.push(work()); } },
    "@expo/vector-icons": { Ionicons: "Check" },
    "expo-router": { Redirect: "Redirect", Stack: { Screen: "Options" }, useRouter: () => ({ replace: (href) => routes.push(href) }) },
    "react-native": { Animated: { Value, View: "AnimatedView", createAnimatedComponent: () => "Circle", timing: (_value, options) => {
      const item = { options, start(done) { item.done = done; }, stop() { item.stopped = true; } }; animations.push(item); return item;
    } }, BackHandler: { addEventListener: () => ({ remove() {} }) }, Easing: { linear: "linear" },
    StyleSheet: { create: (value) => value }, Text: "Text", View: "View" },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
    "react-native-svg": { default: "Svg", Circle: "Circle" },
    "react-native-reanimated": { useReducedMotion: () => false },
    "@/lib/firebase": { auth: { currentUser: { uid: "owner", emailVerified: authorized } } },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/theme": { Spacing: {}, Typography: {} },
    "../services/verified-success": { getVerifiedSuccess: () => authorized ? handoff : null, clearVerifiedSuccess: () => cleared++ },
  }).default;
  return { render: Screen, animations, routes, cleanup: () => cleanups.forEach((work) => work?.()), cleared: () => cleared };
}
test("verified countdown transitions once after three seconds and disposes animations", () => {
  const app = verifiedScreen(); app.render();
  const countdown = app.animations.find((item) => item.options.duration === 3000);
  assert.ok(countdown); assert.equal(app.routes.length, 0);
  countdown.done({ finished: true }); countdown.done({ finished: true });
  assert.deepEqual(app.routes, ["/(onboarding)/register/profile"]); assert.equal(app.cleared(), 1);
  app.cleanup(); assert.ok(app.animations.every((item) => item.stopped));
});
test("unverified/direct access never displays success; unmount cancels navigation", () => {
  const invalid = verifiedScreen(false); assert.equal(invalid.render().type, "Redirect"); assert.equal(invalid.animations.length, 0);
  const valid = verifiedScreen(); valid.render(); valid.cleanup();
  valid.animations.at(-1).done({ finished: true }); assert.equal(valid.routes.length, 0);
});
