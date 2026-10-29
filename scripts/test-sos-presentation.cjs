const assert = require("node:assert/strict"), { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules = {}) {
  const context = { exports: {}, Date, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context); return context.exports;
}
const palette = load("src/shared/theme/colors.ts");
const colors = palette.Colors;
const theme = { ...palette, FontFamily: {}, Typography: {}, Spacing: { one: 4, two: 8, three: 16, four: 24, five: 32, six: 48 }, actionFooterPadding: () => 40 };
const native = { View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView", ActivityIndicator: "Spinner", Image: "Image",
  StyleSheet: { create: (value) => value, hairlineWidth: 0.5 }, BackHandler: { addEventListener: () => ({ remove() {} }) } };
const react = { useEffect() {}, useState: (value) => [typeof value === "function" ? value() : value, () => {}], useCallback: (work) => work };
function setup(file, state, mode = "light", dimensions = { width: 393, height: 852, fontScale: 1 }) {
  const calls = [], routes = [], polls = [];
  const types = load("src/modules/sos/types.ts");
  const settings = { isHydrated: true, locationWithContacts: true };
  const shared = {
    react, "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { ...native, useWindowDimensions: () => dimensions },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea", useSafeAreaInsets: () => ({ bottom: 24 }) },
    "@expo/vector-icons": { Ionicons: "Icon", MaterialCommunityIcons: "MaterialIcon" }, "expo-status-bar": { StatusBar: "StatusBar" },
    "expo-router": { useRouter: () => ({ canGoBack: () => true, back: () => routes.push("back"), replace: (href) => routes.push(href), push: (href) => routes.push(href) }),
      useLocalSearchParams: () => ({}), useFocusEffect() {} },
    "@/shared/theme": theme, "@/shared/hooks/use-theme": { useTheme: () => colors[mode] }, "@/shared/hooks/use-color-scheme": { useColorScheme: () => mode },
    "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" }, "@/shared/ui/button": { Button: "Button" },
    "@/shared/ui/slide-button": { SlideButton: "SlideButton" }, "@/shared/lib/branded-alert": { BrandedAlert: { alert: (...args) => calls.push(args) } },
    "@/modules/settings/store/settings.store": { useSettingsStore: Object.assign((select) => select(settings), { getState: () => settings }) },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select({ user: { uid: "test-user" } }) },
    "../store/sos.store": { useSosStore: () => state, sosStore: { getState: () => state } },
    "../hooks/use-sos-lifecycle": { useSosStatus: (...args) => polls.push(args) }, "../types": types,
    "react-native-svg": { __esModule: true, default: "Svg", Circle: "Circle" },
  };
  const stylesFile = file.replace(".tsx", ".styles.ts");
  const styleExports = load(stylesFile, { "@/shared/theme": theme, "react-native": native });
  shared["./" + path.basename(stylesFile, ".ts")] = styleExports;
  const exports = load(file, shared);
  const component = Object.values(exports)[0];
  return { tree: component(), calls, routes, polls };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  if (typeof tree.type === "function") return nodes(tree.type(tree.props));
  return [tree, ...nodes(tree.props?.children)];
}
const find = (tree, work) => nodes(tree).find(work);
const text = (tree) => nodes(tree).filter((node) => node.type === "Text").map((node) => Array.isArray(node.props.children) ? node.props.children.join("") : node.props.children).join(" ");
const ready = (extra = {}) => ({ ready: true, phase: "idle", refreshing: false, error: null, contactsStatus: "ready",
  contacts: [{ id: "contact-1", name: "Ana", phoneNumber: "+639000000000" }], ...extra });

test("Ready remains hold-only, honors disabled states and retains Manage contacts in both themes", () => {
  for (const mode of ["light", "dark"]) {
    let begins = 0;
    const screen = setup("src/modules/sos/screens/sos-trigger-screen.tsx", ready({ begin: () => begins++ }), mode);
    const hold = find(screen.tree, (node) => node.props?.onLongPress);
    assert.equal(hold.props.delayLongPress, 650);
    assert.equal(hold.props.onPress, undefined);
    assert.equal(hold.props.disabled, false);
    hold.props.onLongPress(); assert.equal(begins, 1);
    find(screen.tree, (node) => node.props?.accessibilityLabel === "Manage emergency contacts").props.onPress();
    assert.equal(screen.routes.at(-1), "/contact");
    assert.ok(text(screen.tree).includes("5 seconds"));
    assert.deepEqual(screen.polls, [[true, true, true]]);
  }
  for (const extra of [{ ready: false }, { refreshing: true }, { error: "Unknown status" }, { contacts: [] }, { contactsStatus: "loading" }]) {
    const screen = setup("src/modules/sos/screens/sos-trigger-screen.tsx", ready(extra));
    assert.equal(find(screen.tree, (node) => node.props?.onLongPress).props.disabled, true);
  }
});

test("Countdown displays store seconds and keeps the same rightward cancel handler and fixed footer", () => {
  for (const mode of ["light", "dark"]) for (const dimensions of [{ width: 320, height: 640, fontScale: 1.5 }, { width: 430, height: 932, fontScale: 1 }]) {
    let cancelled = 0;
    const screen = setup("src/modules/sos/screens/sos-countdown-screen.tsx", { phase: "countdown", remaining: 5, cancelCountdown: () => cancelled++ }, mode, dimensions);
    const slider = find(screen.tree, (node) => node.type === "SlideButton");
    assert.equal(slider.props.label, "Slide to cancel");
    assert.equal(slider.props.direction, "right");
    assert.equal(slider.props.thumbSymbol, "×");
    assert.ok(find(screen.tree, (node) => node.props?.accessibilityLabel === "5 seconds remaining"));
    assert.ok(text(screen.tree).includes("Cancelling won't restart it."));
    const scroll = find(screen.tree, (node) => node.type === "ScrollView");
    assert.equal(find(scroll, (node) => node.type === "SlideButton"), undefined);
    slider.props.onComplete();
    assert.equal(cancelled, 1); assert.equal(screen.routes.at(-1), "/sos");
  }
});

function record(status = "active", ended) {
  return { sosId: "sos-1", status, location: null, recipients: [{ contactId: "contact-1", name: "Ana", phone: "+639000000000",
    initial: { status: "queued", updatedAt: new Date().toISOString() }, ended }] };
}
test("Active preserves message states, truthful missing location, refresh, and the stop slider", async () => {
  for (const mode of ["light", "dark"]) {
    let refreshes = 0, stops = 0;
    const screen = setup("src/modules/sos/screens/sos-active-screen.tsx", ready({ record: record(), phase: "active",
      refreshStatus: async () => refreshes++, stop: () => stops++ }), mode);
    assert.ok(text(screen.tree).includes("Queued"));
    assert.ok(text(screen.tree).includes("Location not included"));
    const slider = find(screen.tree, (node) => node.type === "SlideButton");
    assert.equal(slider.props.direction, "right");
    slider.props.onComplete(); assert.equal(stops, 1);
    find(screen.tree, (node) => node.props?.accessibilityLabel === "Refresh message status").props.onPress();
    await Promise.resolve(); assert.equal(refreshes, 1);
    assert.deepEqual(screen.polls, [[true, true]]);
  }
});
test("Not Confirmed retains its warning, numbers, retry and Back to SOS without a stop action", () => {
  for (const phase of ["retry", "idle"]) {
    const screen = setup("src/modules/sos/screens/sos-active-screen.tsx", ready({ phase, record: null, retry() {} }));
    assert.ok(text(screen.tree).includes("Do not assume contacts were notified."));
    assert.ok(text(screen.tree).includes("Contact someone directly"));
    assert.ok(text(screen.tree).includes("+639000000000"));
    assert.equal(find(screen.tree, (node) => node.type === "SlideButton"), undefined);
    assert.ok(find(screen.tree, (node) => node.props?.title === (phase === "retry" ? "Retry the same SOS request" : "Back to SOS")));
  }
});
test("Ended retains five-minute status tracking and Done; processing copy is shown only for pending end messages", async () => {
  for (const status of ["queued", "accepted", "failed"]) {
    let dismissed = 0;
    const screen = setup("src/modules/sos/screens/sos-active-screen.tsx", ready({ phase: "ended",
      record: record("ended", { status, updatedAt: new Date().toISOString() }), dismissEnded: async () => dismissed++ }));
    assert.ok(text(screen.tree).includes("Statuses update for up to 5 minutes."));
    assert.equal(text(screen.tree).includes("We're notifying your contacts"), status === "queued");
    find(screen.tree, (node) => node.props?.title === "Done").props.onPress();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(dismissed, 1); assert.equal(screen.routes.at(-1), "/");
  }
});
