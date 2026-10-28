const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, modules) {
  const context = { exports: {}, Promise, require: (name) => {
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
function alerts() { return load("src/shared/lib/branded-alert.ts", { "zustand/vanilla": require("zustand/vanilla") }); }

test("branded discard runs once, while Keep editing never discards", () => {
  const { BrandedAlert: alert, brandedAlertStore: store } = alerts();
  let discarded = 0;
  const buttons = [{ text: "Keep editing", style: "cancel" }, { text: "Discard", style: "destructive", onPress: () => discarded++ }];
  alert.alert("Discard changes?", "Unsaved changes", buttons);
  const first = store.getState().queue[0].id;
  alert.press(first, 0); assert.equal(discarded, 0);
  alert.alert("Discard changes?", "Unsaved changes", buttons);
  const second = store.getState().queue[0].id;
  alert.press(second, 1); alert.press(second, 1);
  assert.equal(discarded, 1); assert.equal(store.getState().queue.length, 0);
});

test("repeated discard taps do not queue duplicates and unrelated errors remain queued", () => {
  const { BrandedAlert: alert, brandedAlertStore: store } = alerts();
  alert.alert("Discard?", "Unsaved changes"); alert.alert("Discard?", "Unsaved changes");
  alert.alert("Save failed", "Try again");
  assert.equal(store.getState().queue.length, 2);
  alert.press(store.getState().queue[0].id, 0);
  assert.equal(store.getState().queue[0].title, "Save failed");
});

test("background/account cleanup invalidates old destructive actions", () => {
  const { BrandedAlert: alert, brandedAlertStore: store } = alerts();
  let changed = false;
  alert.alert("Delete?", "Confirm", [{ text: "Delete", onPress: () => { changed = true; } }]);
  const id = store.getState().queue[0].id;
  alert.clear(); alert.press(id, 0);
  assert.equal(changed, false);
});

test("Back dismissal calls onDismiss without confirming, and honors noncancelable alerts", () => {
  const { BrandedAlert: alert, brandedAlertStore: store } = alerts();
  let dismissed = 0, confirmed = 0;
  alert.alert("Question", "Confirm", [{ text: "Continue", onPress: () => confirmed++ }], { onDismiss: () => dismissed++ });
  alert.dismiss(store.getState().queue[0].id);
  assert.equal(dismissed, 1); assert.equal(confirmed, 0);
  alert.alert("Wait", "Working", undefined, { cancelable: false });
  alert.dismiss(store.getState().queue[0].id);
  assert.equal(store.getState().queue.length, 1);
});

test("async action failures display a short branded error", async () => {
  const { BrandedAlert: alert, brandedAlertStore: store } = alerts();
  alert.alert("Action", "Confirm", [{ text: "Continue", onPress: async () => { throw new Error("private provider error"); } }]);
  alert.press(store.getState().queue[0].id, 0);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(store.getState().queue[0].title, "Action failed");
  assert.equal(store.getState().queue[0].message, "Please try again.");
});

function modal(width, fontScale, theme) {
  let listener, cancelled = 0, confirmed = 0;
  const { ConfirmationModal } = load("src/shared/ui/confirmation-modal.tsx", {
    react: { useRef: (value) => ({ current: value }), useEffect: (work) => work() },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { Modal: "Modal", ScrollView: "Scroll", View: "View", Text: "Text", StyleSheet: { create: (value) => value },
      useWindowDimensions: () => ({ width, fontScale }), AppState: { addEventListener: (_event, work) => { listener = work; return { remove() {} }; } } },
    "react-native-reanimated": { useReducedMotion: () => true },
    "@/shared/hooks/use-theme": { useTheme: () => theme },
    "@/shared/theme": { BorderRadius: { lg: 20 }, Spacing: { two: 8, three: 16, four: 24 }, Typography: {} },
    "./button": { Button: "Button" },
  });
  const tree = ConfirmationModal({ visible: true, title: "Discard changes?", description: "Unsaved changes", primaryButtonText: "Discard",
    secondaryButtonText: "Keep editing", onPrimaryPress: () => confirmed++, onSecondaryPress: () => cancelled++ });
  return { tree, background: () => listener("background"), cancelled: () => cancelled, confirmed: () => confirmed };
}

test("shared branded confirmations always stack the primary action above Cancel", () => {
  for (const theme of [{ card: "light-card", border: "light-border", text: "light-text" }, { card: "dark-card", border: "dark-border", text: "dark-text" }]) {
    for (const [width, fontScale] of [[320, 1], [410, 1], [410, 1.5], [900, 1]]) {
      const view = modal(width, fontScale, theme);
      const card = view.tree.props.children.props.children;
      assert.equal(card.props.style[1].backgroundColor, theme.card);
      const actions = card.props.children[1];
      assert.equal(actions.props.style.flexDirection, "column");
      assert.equal(actions.props.children[0].props.title, "Discard");
      assert.equal(actions.props.children[1].props.title, "Keep editing");
      assert.equal(actions.props.children[0].type, "Button");
      assert.equal(actions.props.children[1].type, "Button");
      assert.equal(view.tree.props.animationType, "none");
      view.tree.props.onRequestClose(); view.background();
      assert.equal(view.cancelled(), 2); assert.equal(view.confirmed(), 0);
    }
  }
});

test("app-owned alerts no longer import the platform Alert UI", () => {
  const fs = require("node:fs");
  function visit(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) visit(file);
      else if (/\.tsx?$/.test(file)) {
        const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
        for (const node of source.statements) {
          if (!ts.isImportDeclaration(node) || node.moduleSpecifier.text !== "react-native" || node.importClause?.isTypeOnly) continue;
          const names = node.importClause?.namedBindings;
          if (names && ts.isNamedImports(names)) for (const name of names.elements) {
            assert.notEqual((name.propertyName ?? name.name).text, "Alert", file);
          }
        }
      }
    }
  }
  visit(path.join(__dirname, "../src"));
});

test("ride and onboarding SweetAlert dialogs use the same vertical button order", () => {
  const { SweetAlert } = load("src/shared/ui/sweet-alert.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { Modal: "Modal", Pressable: "Pressable", View: "View", Text: "Text", StyleSheet: { create: (value) => value } },
    "@/assets/icons/alerts/primary-warning.svg": "Warning", "@expo/vector-icons": { Ionicons: "Icon" },
    "@/shared/hooks": { useTheme: () => ({}) },
    "@/shared/theme": { BorderRadius: {}, Spacing: {}, Typography: {} },
    "@/shared/ui/button": { Button: "Button" },
  });
  const tree = SweetAlert({ visible: true, title: "End this ride?", primaryButtonText: "End Ride", secondaryButtonText: "Keep Monitoring" });
  const actions = tree.props.children.props.children.props.children[1];
  assert.equal(actions.props.style.flexDirection, "column");
  assert.equal(actions.props.children[0].props.title, "End Ride");
  assert.equal(actions.props.children[1].props.title, "Keep Monitoring");
  assert.equal(actions.props.children[0].props.fullWidth, true);
  assert.equal(actions.props.children[1].props.fullWidth, true);
});
