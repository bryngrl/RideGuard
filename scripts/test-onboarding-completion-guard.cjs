const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function setup(configured) {
  const routes = [], values = []; let index = 0, completed = 0, cleared = 0;
  const user = { uid: "a", email: "fixture@example.invalid", getIdToken: async () => "fixture-token" };
  class MpinError extends Error {}
  const modules = {
    "./complete-setup-screen.styles": { styles: {} }, "react/jsx-runtime": require("react/jsx-runtime"),
    react: { useCallback: work => work, useContext: () => true, useEffect() {}, useRef: current => ({ current }),
      useState: initial => { const slot = index++; values[slot] = initial; return [initial, next => { values[slot] = next; }]; } },
    "react-native": { ActivityIndicator: "Spinner", Image: "Image", Text: "Text", View: "View" },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
    "expo-router": { useRouter: () => ({ replace: route => routes.push(route) }) },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/theme": { Spacing: {}, Typography: {} },
    "@/shared/ui/button": { Button: "Button" }, "@/shared/ui/form-feedback": { FormFeedback: "Error" },
    "@/shared/ui/onboarding-progress-context": { OnboardingProgressContext: {} },
    "../store/onboarding.store": { useOnboardingStore: select => select({ firstName: "Ana", hardwareSetup: "connection-skipped" }) },
    "@/lib/firebase": { auth: { currentUser: user } },
    "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => ({ setIsOldUser() {} }) } },
    "@/modules/auth/services/auth.api": { checkIsOldUser: async () => true },
    "@/modules/auth/services/registration-progress": { clearRegistrationOnboardingPending: async () => { cleared++; } },
    "@/modules/auth/services/onboarding-progress.api": { completeOnboarding: async () => { completed++; } },
    "@/modules/mpin/services/mpin.api": { MpinError, mpinErrorMessage: () => "Try again", mpinApi: {
      enabled: true, status: async () => { if (configured instanceof Error) throw configured; return { configured }; },
    } },
  };
  const context = { exports: {}, AbortController, require(name) {
    if (name.endsWith(".png")) return "badge";
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,
    "../src/modules/onboarding/screens/complete-setup-screen.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  const tree = context.exports.default();
  const button = tree.props.children.props.children[1].props.children;
  return { routes, values, click: button.props.onPress, completed: () => completed, cleared: () => cleared };
}
test("skipping every hardware step still cannot complete onboarding without a configured MPIN", async () => {
  const app = setup(false); await app.click();
  assert.deepEqual(app.routes, ["/(onboarding)/register/mpin"]);
  assert.equal(app.completed(), 0); assert.equal(app.cleared(), 0);
});
test("a failed MPIN check cannot clear the checkpoint or navigate into the app", async () => {
  const app = setup(Error("network")); await app.click();
  assert.equal(app.routes.length, 0); assert.equal(app.completed(), 0); assert.equal(app.cleared(), 0);
});
test("a confirmed configured MPIN permits completion and clears the checkpoint once", async () => {
  const app = setup(true); await app.click();
  assert.deepEqual(app.routes, ["/(app)/(tabs)"]);
  assert.equal(app.completed(), 1); assert.equal(app.cleared(), 1);
});
