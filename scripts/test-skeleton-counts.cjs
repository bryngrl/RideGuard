const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, modules = {}) {
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
const countPolicy = load("src/shared/lib/skeleton-count.ts");

test("known counts show the matching rows, capped by the visible area", () => {
  assert.equal(countPolicy.skeletonRowCount(1, 5), 1);
  assert.equal(countPolicy.skeletonRowCount(3, 5), 3);
  assert.equal(countPolicy.skeletonRowCount(0, 5), 0);
  assert.equal(countPolicy.skeletonRowCount(100, 8), 8);
  assert.equal(countPolicy.skeletonRowCount(undefined, 8), 1);
  assert.equal(countPolicy.skeletonRowCount(-1, 8), 1);
});

test("counts stay separate by account and alert filter, and successful deletions can save zero", () => {
  const { useLoadingCountsStore: store } = load("src/shared/store/loading-counts.store.ts", {
    zustand: require("zustand"), "@react-native-async-storage/async-storage": {},
    "zustand/middleware": { persist: (factory) => factory, createJSONStorage() {} },
  });
  store.getState().remember("a", "contacts", 1);
  store.getState().remember("b", "contacts", 4);
  store.getState().remember("a", "alerts:active", 8);
  store.getState().remember("a", "alerts:unread", 2);
  assert.equal(store.getState().counts.a.contacts, 1);
  assert.equal(store.getState().counts.b.contacts, 4);
  assert.equal(store.getState().counts.a["alerts:unread"], 2);
  assert.equal(store.getState().counts.a["alerts:active"], 8);
  store.getState().remember("a", "contacts", 0);
  store.getState().remember("a", "contacts", NaN);
  assert.equal(store.getState().counts.a.contacts, 0);
  assert.equal(store.getState().counts.b.contacts, 4);
});

test("Emergency Contacts renders one actual skeleton row for one saved contact", () => {
  const { ContactsSkeleton } = load("src/modules/emergency-contacts/components/contacts-skeleton.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { View: "View", StyleSheet: { create: (value) => value } },
    "@/shared/hooks/use-theme": { useTheme: () => ({ border: "skeleton" }) },
    "@/shared/theme": { BorderRadius: {}, Spacing: {} },
    "@/shared/ui/skeleton-pulse": { SkeletonPulse: "Pulse" }, "@/shared/lib/skeleton-count": countPolicy,
  });
  assert.equal(ContactsSkeleton({ count: 1 }).props.children.length, 1);
  assert.equal(ContactsSkeleton({ count: 2 }).props.children.length, 2);
  assert.equal(ContactsSkeleton({ count: 0 }).props.children.length, 0);
  assert.equal(ContactsSkeleton({}).props.children.length, 1);
});

test("Alerts uses remembered rows instead of filling the whole screen", () => {
  const { AlertsSkeleton } = load("src/modules/alerts/components/alerts-skeleton.tsx", {
    react: { useEffect() {} }, "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { View: "View", StyleSheet: { create: (value) => value } },
    "react-native-reanimated": { __esModule: true, default: { View: "Animated" }, useReducedMotion: () => true,
      useSharedValue: (value) => ({ value }), useAnimatedStyle: (work) => work() },
    "@/shared/hooks/use-theme": { useTheme: () => ({ border: "skeleton" }) },
    "@/shared/theme": { BorderRadius: {}, Spacing: {} }, "@/shared/lib/skeleton-count": countPolicy,
  });
  assert.equal(AlertsSkeleton({ count: 1, viewportHeight: 900 }).props.children[1].length, 1);
  assert.equal(AlertsSkeleton({ count: 2, viewportHeight: 900 }).props.children[1].length, 2);
  assert.equal(AlertsSkeleton({ count: 0, viewportHeight: 900 }).props.children[0], false);
  assert.equal(AlertsSkeleton({ viewportHeight: 900 }).props.children[1].length, 1);
});
