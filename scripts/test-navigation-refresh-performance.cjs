const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules) {
  const context = { exports: {}, require(name) {
    if (name.endsWith(".svg")) return "Icon";
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
const sample = { alertId: "one", deviceId: "CAM-123-ABC", message: "Weapon detected",
  imageUrl: ["https://example.test/image.jpg"], videoUrl: null,
  timeStamp: "2026-10-30T12:00:00Z", createdAt: "2026-10-30T12:00:00Z",
  isFalseAlarm: false, isSeen: false, isArchived: false, archivedAt: null, archiveAt: null };
function alertsStore() {
  return load("src/modules/alerts/store/alerts.store.ts", { zustand: require("zustand") }).useAlertsStore;
}
test("identical history refreshes notify no subscribers and preserve alert/list identities", () => {
  const store = alertsStore();
  store.getState().mergeAlerts([sample]);
  const before = store.getState().alerts;
  let redraws = 0;
  const unsubscribe = store.subscribe(() => redraws++);
  for (let i = 0; i < 20; i++) {
    store.getState().mergeAlerts([{ ...sample, imageUrl: [...sample.imageUrl] }]);
    store.getState().upsertAlert({ ...sample, imageUrl: [...sample.imageUrl] });
  }
  assert.equal(redraws, 0); assert.equal(store.getState().alerts, before);
  assert.equal(store.getState().alerts[0], before[0]); unsubscribe();
});
test("actual media, seen, archive and new-alert changes still notify immediately", () => {
  const store = alertsStore(); store.getState().mergeAlerts([sample]);
  let redraws = 0; store.subscribe(() => redraws++);
  store.getState().mergeAlerts([{ ...sample, videoUrl: "https://example.test/clip.mp4" }]);
  store.getState().upsertAlert({ ...store.getState().alerts[0], isSeen: true });
  store.getState().mergeAlerts([{ ...store.getState().alerts[0], isArchived: true, archivedAt: sample.timeStamp }]);
  const archived = store.getState().alerts[0];
  store.getState().mergeAlerts([{ ...archived, isArchived: false, archivedAt: null }]);
  assert.equal(store.getState().alerts[0], archived, "stale events cannot restore archived alerts");
  store.getState().mergeAlerts([{ ...sample, alertId: "two" }]);
  assert.equal(redraws, 4); assert.equal(store.getState().alerts.length, 2);
});
function tabBar({ index = 0, prevented = false } = {}) {
  const events = [], navigations = [];
  const { BottomNavigation } = load("src/components/navigation/bottom-navigation.tsx", {
    react: require("react"), "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { StyleSheet: { create: (s) => s }, Text: "Text", View: "View" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 0 }) },
    "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/theme": { Spacing: {}, Typography: {} },
  });
  const tree = BottomNavigation({ state: { index, routes: ["index", "alerts", "camera", "settings"].map((name) => ({ name, key: `tab-${name}` })) },
    navigation: { emit: (e) => { events.push(e); return { defaultPrevented: prevented }; }, navigate: (...args) => navigations.push(args) } });
  return { buttons: tree.props.children.props.children, events, navigations };
}
test("tab presses target the existing tab navigator and do not re-navigate an active tab", () => {
  const app = tabBar();
  app.buttons[0].props.onPress(); assert.equal(app.navigations.length, 0);
  app.buttons[2].props.onPress();
  assert.deepEqual(app.navigations[0], ["camera", undefined]);
  assert.equal(app.events[1].target, "tab-camera");
  assert.equal(app.events[1].type, "tabPress");
  app.buttons[2].props.onLongPress(); assert.equal(app.events[2].type, "tabLongPress");
});
test("tab bar honors prevented navigation and navigator-selected state", () => {
  const app = tabBar({ index: 3, prevented: true });
  assert.equal(app.buttons[3].props.accessibilityState.selected, true);
  assert.equal(app.buttons[0].props.accessibilityState.selected, false);
  app.buttons[1].props.onPress(); assert.equal(app.navigations.length, 0);
});
