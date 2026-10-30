const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const react = { useState: (value) => [typeof value === "function" ? value() : value, () => {}],
  useRef: (value) => ({ current: value }), useEffect() {}, useCallback: (work) => work };
function load(file, modules) {
  const context = { exports: {}, require: (name) => {
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
test("reused hardware layouts apply the app lock for Settings and preserve onboarding behavior", () => {
  for (const source of ["settings", undefined]) {
    let stateIndex = 0;
    const Stack = Object.assign(() => {}, { Screen: "StackScreen" });
    const { default: Layout } = load("src/app/(onboarding)/_layout.tsx", {
      "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
      "@/shared/ui/onboarding-progress-context": { OnboardingProgressContext: { Provider: "ProgressProvider" } },
      "@/shared/ui/stepper": { __esModule: true, default: "Stepper" },
      "@/shared/theme": { Spacing: {}, MaxContentWidth: 440 },
      react: { ...react, useState: (initial) => [stateIndex++ === 0 ? true : initial, () => {}] }, "react/jsx-runtime": require("react/jsx-runtime"),
      "@/shared/hooks/use-theme": { useTheme: () => ({}) },
      "react-native": { View: "View", ActivityIndicator: "Spinner", Platform: { OS: "android" } },
      "expo-router": { Stack, Redirect: "Redirect", useRouter: () => ({}), useSegments: () => ["(onboarding)", "devices", "camera"], useGlobalSearchParams: () => ({ source }) },
      "@/shared/ui/button": {}, "@/shared/ui/form-feedback": {},
      "@/lib/firebase": { auth: {} },
      "@/modules/auth/store/auth.store": { useAuthStore: () => ({ user: { uid: "a", providerData: [] }, isCheckingAuth: false }) },
      "@/modules/auth/services/registration-progress": { onboardingPaths: {} },
      "@/modules/auth/services/onboarding-progress.api": {},
      "@/modules/onboarding/store/onboarding.store": {},
      "@/modules/mpin/components/mpin-app-gate": { MpinAppGate: "SecurityGate" },
    });
    const tree = Layout();
    assert.equal(tree.type, source === "settings" ? "SecurityGate" : "ProgressProvider");
    if (source === "settings") assert.equal(tree.props.children.type, Stack);
    else {
      const [header, content] = tree.props.children.props.children;
      assert.equal(header.props.children.type, "Stepper");
      assert.equal(header.props.children.props.currentStep, 5);
      assert.equal(content.props.children.type, Stack);
    }
  }
});
test("Account Edit has a safe destination when opened without back history", () => {
  for (const history of [true, false]) {
    const actions = [];
    const profile = { firstName: "Ana", lastName: "", vehicleBrand: "", vehicleModel: "" };
    const { AccountEditScreen } = load("src/modules/settings/screens/account-edit/account-edit-screen.tsx", {
      "@/shared/lib/branded-alert": { BrandedAlert: { alert() {} } },
      react, "react/jsx-runtime": require("react/jsx-runtime"),
      "react-native": { StyleSheet: { create: (value) => value }, View: "View", ActivityIndicator: "Spinner" },
      "expo-router": { useRouter: () => ({ canGoBack: () => history, back: () => actions.push("back"), replace: (route) => actions.push(route) }), useFocusEffect() {} },
      "expo-image-picker": {},
      "@/modules/auth/store/auth.store": { useAuthStore: (selector) => selector({ isDemo: false }) },
      "@/modules/settings/components/settings-page-layout": { SettingsPageLayout: "Layout" },
      "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/lib/input-formats": {},
      "@/shared/theme": { Spacing: {}, Typography: {}, BorderRadius: {} }, "@/shared/ui": {},
      "@/shared/ui/feedback-pressable": {}, "@/shared/ui/photo-options-bottom-sheet": {}, "@/shared/ui/keyboard-hidden-view": {},
      "../../hooks/use-account-edit": { useAccountEdit: () => ({ changed: false, saving: false }) },
      "../../hooks/use-profile": { useProfile: () => ({ profile, isLoading: true }) }, "../../services/profile.api": {},
    });
    AccountEditScreen().props.onBack();
    assert.deepEqual(actions, [history ? "back" : "/settings/account"]);
  }
});
test("Search closes safely with or without navigation history", () => {
  for (const history of [true, false]) {
    const actions = [];
    const { SearchScreen } = load("src/modules/settings/screens/search/search-screen.tsx", {
      "react/jsx-runtime": require("react/jsx-runtime"),
      "expo-router": { useRouter: () => ({ canGoBack: () => history, back: () => actions.push("back"), replace: (route) => actions.push(route) }) },
      "@/shared/ui": { KeyboardAvoidingWrapper: "Wrapper" }, "@/shared/theme": { Spacing: {} },
      "../../components/settings-search": { SettingsSearch: "Search" },
    });
    SearchScreen().props.children.props.onClose();
    assert.deepEqual(actions, [history ? "back" : "/settings"]);
  }
});
