const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const theme = { primary: "#123456", secondary: "#ffffff", background: "#ffffff" };
const flatten = (value) => Array.isArray(value) ? Object.assign({}, ...value.filter(Boolean).map(flatten)) : value ?? {};
const native = { View: "View", Text: "Text", Pressable: "NativePressable", ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (styles) => styles, absoluteFill: {}, flatten } };
const base = {
  "@/modules/mpin/services/mpin-activity": { recordMpinActivity() {} },
  react: require("react"), "react/jsx-runtime": require("react/jsx-runtime"),
    "@/shared/ui/brand-loading": { BrandLoading: "BrandLoading" }, "react-native": native,
  "@/shared/hooks": { useTheme: () => theme }, "@/shared/hooks/use-theme": { useTheme: () => theme },
  "@/shared/theme": { BorderRadius: {}, BrandColors: {}, Spacing: {}, Typography: {} },
  "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" },
};
function load(file, overrides = {}, globals = {}) {
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const modules = { ...base, ...overrides };
  const context = { exports: {}, ...globals, require: (name) => { assert.ok(name in modules, `Unexpected dependency: ${name}`); return modules[name]; } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
function structure(node) {
  if (Array.isArray(node)) return node.filter(Boolean).map(structure);
  if (!node || typeof node !== "object") return typeof node;
  return { type: node.type, key: node.key, children: node.props.children === undefined ? null : structure(node.props.children) };
}

test("loading buttons keep the same pinned native content and spinner parents", () => {
  const { Button } = load("src/shared/ui/button.tsx");
  for (const variant of ["primary", "ghost", "outline", "danger"]) {
    const ready = Button({ title: "Continue", variant, isLoading: false });
    const loading = Button({ title: "Continue", variant, isLoading: true });
    assert.deepEqual(structure(loading), structure(ready));
    const [content, spinner] = loading.props.children;
    assert.equal(content.props.collapsable, false);
    assert.equal(spinner.props.collapsable, false);
    assert.equal(flatten(content.props.style).opacity, 0);
    assert.equal(content.props.accessibilityElementsHidden, true);
    assert.equal(loading.props.disabled, true);
    assert.equal(loading.props.accessibilityState.busy, true);
    assert.equal(spinner.props.children.props.animating, true);
    assert.equal(ready.props.children[1].props.children.props.animating, false);
  }
});

test("pressed feedback surfaces cannot disappear through Fabric view flattening", () => {
  const { FeedbackPressable } = load("src/shared/ui/feedback-pressable.tsx", {
    "react-native-reanimated": { __esModule: true, default: { View: "AnimatedView" }, useSharedValue: (value) => ({ value }),
      useAnimatedStyle: (work) => work(), useReducedMotion: () => true },
  });
  const element = FeedbackPressable({ children: "Continue", style: { backgroundColor: theme.primary }, collapsable: true });
  assert.equal(element.props.collapsable, false);
  const children = element.props.children({ pressed: false }).props.children;
  const overlay = children.find((child) => child?.type === "AnimatedView");
  assert.equal(overlay.props.collapsable, false);
});

test("Android MPIN navigation has no native transition while iOS retains its animation", () => {
  for (const os of ["android", "ios"]) {
    const { default: Layout } = load("src/app/(mpin)/mpin/_layout.tsx", {
      "react-native": { ...native, Platform: { OS: os } },
      "expo-router": { Stack: "Stack", Redirect: "Redirect" },
      "react-native-reanimated": { useReducedMotion: () => false },
      "@/modules/auth/store/auth.store": { useAuthStore: (select) => select({ isAuthenticated: true, isCheckingAuth: false, isOldUser: true }) },
    });
    assert.equal(Layout().props.screenOptions.animation, os === "android" ? "none" : "slide_from_right");
  }
});

test("the app-switcher privacy cover keeps one native view across background and resume", () => {
  let hidden = false, mounted = false, frameId = 0;
  const listeners = new Map(), frames = new Map();
  const appState = { currentState: "active", addEventListener: (event, callback) => {
    listeners.set(event, callback); return { remove() { listeners.delete(event); } };
  } };
  const emit = (state) => { appState.currentState = state; listeners.get("change")(state); };
  const nextFrame = () => { const work = [...frames.values()]; frames.clear(); work.forEach((callback) => callback()); };
  const { MpinPrivacyCover } = load("src/modules/mpin/components/mpin-privacy-cover.tsx", {
    react: { useState: () => [hidden, (value) => { hidden = value; }], useEffect: (effect) => { if (!mounted) { mounted = true; effect(); } } },
    "react-native": { ...native, Platform: { OS: "android" }, AppState: appState },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select({ isAuthenticated: true }) },
  }, { requestAnimationFrame: (work) => { frames.set(++frameId, work); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id) });
  const active = MpinPrivacyCover(); emit("background");
  const background = MpinPrivacyCover(); emit("active");
  assert.equal(MpinPrivacyCover().props.pointerEvents, "auto");
  nextFrame();
  assert.equal(MpinPrivacyCover().props.pointerEvents, "auto");
  nextFrame();
  const resumed = MpinPrivacyCover();
  for (const view of [active, background, resumed]) assert.equal(view.props.collapsable, false);
  assert.equal(active.type, background.type);
  assert.equal(background.props.pointerEvents, "auto");
  assert.equal(resumed.props.pointerEvents, "none");
  assert.equal(resumed.props.accessibilityElementsHidden, true);
  listeners.get("blur")();
  assert.equal(MpinPrivacyCover().props.pointerEvents, "auto");
  listeners.get("focus")(); emit("background"); nextFrame(); nextFrame();
  assert.equal(MpinPrivacyCover().props.pointerEvents, "auto", "a stale reveal cannot uncover a backgrounded app");
});
