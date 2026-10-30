const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function render(height, props = {}) {
  const modules = {
    react: { useState: (value) => [value, () => {}], useEffect: () => {}, useCallback: (work) => work },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/shared/ui/brand-loading": { BrandLoading: "BrandLoading" },
    "react-native": { View: "View", Text: "Text", ActivityIndicator: "Spinner", StyleSheet: { create: (value) => value },
      useWindowDimensions: () => ({ height }) },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea", useSafeAreaInsets: () => ({ top: 24, bottom: 24 }) },
    "react-native-reanimated": { __esModule: true, default: { View: "AnimatedView" }, useReducedMotion: () => true,
      useSharedValue: (value) => ({ value }), useAnimatedStyle: (work) => work() },
    "expo-router": { useFocusEffect: () => {} }, "@expo/vector-icons": { Ionicons: "Icon" },
    "@/components/brand-lockup": { BrandLockup: "Brand" },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) },
    "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" },
    "@/shared/ui/button": { Button: "Button" }, "@/shared/ui/form-feedback": { FormFeedback: "Feedback" },
    "@/shared/ui/pin-pad": { PinPad: "PinPad" },
    "@/shared/theme": { actionFooterPadding: (bottom) => Math.max(40, bottom + 8) - bottom, BorderRadius: {}, Typography: {},
      Spacing: { two: 8, three: 16, four: 24, five: 32 },
      PinLayout: { keyHeight: 58, indicatorHeight: 52, rowGap: 8, actionGap: 16 },
      getPinKeypadGap: (available) => Math.max(32, Math.min(96, available - 696)) },
  };
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/mpin/components/mpin-unlock-experience.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(compiled, context);
  return context.exports.MpinUnlockExperience({ value: "", onChange() {}, onComplete() {}, onForgot() {},
    isPending: () => false, initialEntry: true, ...props });
}
const flatten = (styles) => Array.isArray(styles) ? Object.assign({}, ...styles.filter(Boolean).map(flatten)) : styles ?? {};
const plain = (value) => JSON.parse(JSON.stringify(value));
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return null;
  if (predicate(tree)) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const match = find(child, predicate); if (match) return match;
  }
  return null;
}
function panel(tree) { return find(tree, (node) => node.type === "AnimatedView" && flatten(node.props.style).bottom !== undefined); }

test("MPIN unlock has no scroll container at compact and tall portrait sizes", () => {
  for (const height of [640, 740, 850, 1000]) {
    const tree = render(height);
    assert.equal(tree.props.children.type, "View");
    assert.equal(flatten(tree.props.children.props.style).flex, 1);
    const pin = find(tree, (node) => node.type === "PinPad");
    assert.ok(pin.props.keyStyle.minHeight >= 44);
    assert.ok(flatten(panel(tree).props.style).bottom >= 8);
  }
});

test("errors and checking status do not move the keypad or Forgot MPIN anchor", () => {
  for (const height of [640, 850, 1000]) {
    const ready = render(height);
    const error = render(height, { error: "Incorrect MPIN. Try again." });
    const busy = render(height, { busy: true });
    for (const tree of [error, busy]) {
      assert.deepEqual(plain(flatten(panel(tree).props.style)), plain(flatten(panel(ready).props.style)));
      assert.deepEqual(plain(find(tree, (node) => node.type === "PinPad").props.keypadStyle),
        plain(find(ready, (node) => node.type === "PinPad").props.keypadStyle));
      assert.deepEqual(plain(find(tree, (node) => node.props?.title === "Forgot MPIN?").props.style),
        plain(find(ready, (node) => node.props?.title === "Forgot MPIN?").props.style));
    }
  }
});

test("error message grows upwards before the PIN boxes without a status button", () => {
  const tree = render(850, { error: "Incorrect MPIN. Try again." });
  const children = panel(tree).props.children;
  const feedbackIndex = children.findIndex((node) => node?.props?.style && flatten(node.props.style).bottom === "100%");
  const pinIndex = children.findIndex((node) => node?.type === "PinPad");
  assert.ok(feedbackIndex >= 0 && feedbackIndex < pinIndex);
  assert.equal(find(tree, (node) => node.type === "Feedback").props.message, "Incorrect MPIN. Try again.");
  assert.equal(find(tree, (node) => node.props?.title === "Check MPIN status"), null);
});

test("fetching disables the whole lock page without adding a loading logo", () => {
  const tree = render(850, { busy: true, footer: "emergency-action" });
  assert.equal(tree.props.pointerEvents, "none");
  assert.equal(tree.props.accessibilityState.busy, true);
  assert.equal(tree.props.children.props.importantForAccessibility, "no-hide-descendants");
  assert.equal(find(tree, (node) => node.type === "BrandLoading"), null);
  assert.equal(find(tree, (node) => node.type === "PinPad").props.disabled, true);
  assert.equal(find(tree, (node) => node.props?.title === "Forgot MPIN?").props.disabled, true);
  const ready = render(850);
  assert.equal(ready.props.pointerEvents, "auto");
  assert.equal(ready.props.children.props.importantForAccessibility, "auto");
});
