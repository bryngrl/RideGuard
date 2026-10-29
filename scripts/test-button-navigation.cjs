const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, modules = {}, globals = {}) {
  const context = { exports: {}, ...globals, require: (name) => {
    if (name.endsWith(".svg")) return "Icon";
    assert.ok(name in modules, name);
    return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
const common = {
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": { View: "View", Text: "Text", StyleSheet: { create: (styles) => styles }, Keyboard: { dismiss() {} } },
  "@/shared/hooks/use-theme": { useTheme: () => ({}) },
  "@/shared/theme": { Spacing: {}, Typography: {} },
  "@/shared/ui/button": { Button: "Button" },
  "@/shared/ui/keyboard-avoiding-wrapper": { KeyboardAvoidingWrapper: "Layout" },
  "@/shared/ui/stepper": { default: "Stepper" },
};
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return null;
  if (predicate(tree)) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}
function pressScreen({ id = "BUT-123-ABC", connectionState = "ready", params = {} } = {}) {
  const routes = []; let complete, retries = 0;
  const { ButtonTestScreen } = load("src/modules/button/screens/button-test-screen.tsx", {
    ...common,
    "expo-router": { useLocalSearchParams: () => params,
      useRouter: () => ({ push: (route) => routes.push(route), replace: (route) => routes.push(route), dismissTo: (route) => routes.push(route) }) },
    "@/modules/devices/store/devices.store": { useDeviceStore: (select) => select({ buttonDeviceId: id }) },
    "@/modules/devices/hooks/use-buttons": { useButtons: () => ({}) },
    "../components/button-test-status": { ButtonTestStatus: "Status" },
    "../components/button-test-visual": { ButtonTestVisual: "Visual" },
    "../components/button-hold-progress": { ButtonHoldProgress: "HoldProgress" },
    "../hooks/use-button-test": { useButtonTest: (_test, done) => {
      complete = done;
      return { state: "waiting", recognizedButtons: {}, pressedButtons: {}, connectionState,
        handleRetry: () => retries++ };
    } },
  });
  return { render: (props = { source: "settings" }) => ButtonTestScreen(props), routes,
    complete: () => complete(), retries: () => retries };
}

test("Settings opens short press artwork and waiting state without onboarding query parameters", () => {
  const app = pressScreen(); const tree = app.render();
  assert.ok(find(tree, (node) => node.props?.children === "Test short press"));
  for (const color of ["white", "red"]) assert.ok(find(tree, (node) => node.type === "Visual" && node.props.color === color));
  assert.ok(find(tree, (node) => node.props?.text === "Waiting for press"));
  assert.equal(app.routes.length, 0);
  app.complete(); assert.deepEqual(app.routes, ["/devices"]);
});

test("an unpaired button keeps the press screen open and offers account-scoped ID setup", () => {
  const app = pressScreen({ id: "", connectionState: "error" }); const tree = app.render();
  assert.ok(find(tree, (node) => node.type === "Visual" && node.props.color === "white"));
  assert.equal(app.routes.length, 0);
  find(tree, (node) => node.props?.title === "Enter Button ID").props.onPress();
  assert.equal(app.routes[0], "/(app)/devices/button-setup");
  find(tree, (node) => node.props?.title === "Back to devices").props.onPress();
  assert.equal(app.routes[1], "/devices");
});

test("a failed subscription stays on the test with Retry and Back instead of closing", () => {
  const app = pressScreen({ connectionState: "error" }); const tree = app.render();
  assert.ok(find(tree, (node) => node.props?.text === "Couldn't connect to Quick Button"));
  find(tree, (node) => node.props?.title === "Try again").props.onPress();
  assert.equal(app.retries(), 1);
  assert.equal(app.routes.length, 0);
});

test("onboarding still continues from short press to long press", () => {
  const app = pressScreen(); app.render({}); app.complete();
  assert.deepEqual(app.routes, ["/(onboarding)/devices/button/test-page"]);
});

test("new Settings routes force settings behavior without depending on URL query state", () => {
  const screen = () => {};
  const quick = load("src/app/(app)/devices/quick-button.tsx", {
    "react/jsx-runtime": common["react/jsx-runtime"], "@/modules/button": { ButtonTestScreen: screen },
  }).default();
  const setup = load("src/app/(app)/devices/button-setup.tsx", {
    "react/jsx-runtime": common["react/jsx-runtime"],
    "@/modules/onboarding/screens/provision-screen": { default: screen },
  }).default();
  assert.equal(quick.props.source, "settings");
  assert.equal(setup.props.source, "settings");
});

test("claiming a button from Settings enters the physical test after successful verification", async () => {
  const routes = [], scheduled = [], claimed = [], saved = [], slots = [];
  let cursor = 0;
  const component = load("src/modules/onboarding/screens/provision-screen.tsx", {
    ...common,
    react: { useState: (initial) => { const index = cursor++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }]; }, useCallback: (work) => work },
    "./provision-screen.styles": { styles: {} },
    "expo-router": { useLocalSearchParams: () => ({}), useFocusEffect() {},
      useRouter: () => ({ replace: (route) => routes.push(route), dismissTo: () => assert.fail("Skipped the press test") }) },
    "@/lib/firebase": { auth: { currentUser: { uid: "owner", getIdToken: async () => "fixture" } } },
    "@/modules/devices": { useDeviceStore: (select) => select({ setButtonDeviceId: (id) => saved.push(id) }) },
    "@/modules/devices/hooks/use-device-claim-lifecycle": { useDeviceClaimLifecycle: () => ({
      begin: () => ({}), isCurrent: () => true, schedule: (_attempt, work) => scheduled.push(work),
    }) },
    "../services/onboarding.api": { claimDevice: async (...args) => { claimed.push(args); } },
    "@/shared/lib/input-formats": load("src/shared/lib/input-formats.ts"),
    "@/shared/ui/keyboard-hidden-view": { KeyboardHiddenView: "Footer" },
    "@/shared/ui/modal": { LoadingModal: "Modal" },
    "@/shared/ui/text-input": { CustomTextInput: "Input" },
  }, { requestAnimationFrame: (work) => work() }).default;
  const render = () => { cursor = 0; return component({ source: "settings" }); };
  find(render(), (node) => node.type === "Input").props.onChangeText("BUT123ABC");
  await find(render(), (node) => node.props?.title === "Connect").props.onPress();
  assert.deepEqual(claimed, [["BUT-123-ABC", "fixture"]]);
  assert.deepEqual(saved, ["BUT-123-ABC"]);
  assert.equal(routes.length, 0);
  scheduled[0]();
  assert.deepEqual(routes, ["/(app)/devices/quick-button"]);
});
