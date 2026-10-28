const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Render the real keypad JSX with native surfaces stubbed; React still normalizes
// every key to a string, including the old placeholder key 0 and digit key "0".
const native = {
  View: "View", Text: "Text", StyleSheet: { create: (styles) => styles },
  useWindowDimensions: () => ({ height: 800 }),
};
const modules = {
  react: { useRef: (current) => ({ current }), useEffect: () => {} },
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": native,
  "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
  "react-native-reanimated": {
    __esModule: true, default: { View: "AnimatedView" }, useReducedMotion: () => true,
    useSharedValue: (value) => ({ value }), useAnimatedStyle: (style) => style(),
  },
  "@expo/vector-icons": { Ionicons: "Icon" },
  "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" },
  "@/shared/hooks/use-theme": { useTheme: () => ({}) },
  "@/shared/theme": {
    BorderRadius: {}, PinLayout: {}, Spacing: {}, Typography: {}, getPinKeypadGap: () => 24,
  },
};
const source = readFileSync(path.join(__dirname, "../src/shared/ui/pin-pad.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const context = { exports: {}, require: (name) => {
  assert.ok(name in modules, `Unexpected dependency: ${name}`);
  return modules[name];
} };
vm.runInNewContext(compiled, context);
const { PinPad } = context.exports;

function walk(node, visit) {
  if (Array.isArray(node)) { node.forEach((child) => walk(child, visit)); return; }
  if (!node || typeof node !== "object" || !node.props) return;
  visit(node);
  walk(node.props.children, visit);
}
const render = (props = {}) => PinPad({ value: "", onChange() {}, onComplete() {}, ...props });

test("each keypad row has unique React keys, including the placeholder next to zero", () => {
  let rows = 0;
  walk(render(), (node) => {
    const children = node.props.children;
    if (!Array.isArray(children)) return;
    const elements = children.filter((child) => child && typeof child === "object" && child.props);
    const keys = elements.map((child) => child.key).filter((key) => key !== null);
    assert.equal(new Set(keys).size, keys.length, `Duplicate sibling keys: ${keys}`);
    if (elements.some((child) => child.type === "Pressable")) rows++;
  });
  assert.equal(rows, 4);
});

test("zero remains usable and completing a PIN submits exactly once", () => {
  const changes = [], completed = [], buttons = new Map();
  walk(render({ onChange: (value) => changes.push(value), onComplete: (value) => completed.push(value) }), (node) => {
    if (node.type === "Pressable") buttons.set(node.props.accessibilityLabel, node.props);
  });
  for (const digit of ["0", "1", "2", "3", "4"]) buttons.get(digit).onPress();
  assert.deepEqual(changes, ["0", "01", "012", "0123"]);
  assert.deepEqual(completed, ["0123"]);
});

test("a disabled keypad cannot change or submit a PIN", () => {
  walk(render({ disabled: true, onChange: () => assert.fail("Changed disabled PIN"),
    onComplete: () => assert.fail("Submitted disabled PIN") }), (node) => {
    if (node.type === "Pressable") node.props.onPress();
  });
});
