const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");

test("MPIN forms render visible content without waiting for an opacity animation or resume event", () => {
  const modules = {
    react: { useContext: () => false },
    "@/shared/ui/onboarding-progress-context": { OnboardingProgressContext: {} },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/shared/ui/brand-loading": { BrandLoading: "BrandLoading" },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native": { ActivityIndicator: "Spinner", KeyboardAvoidingView: "Keyboard", Platform: { OS: "android" },
      StyleSheet: { create: (value) => value }, Text: "Text", View: "View" },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea", useSafeAreaInsets: () => ({ bottom: 24 }) },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) },
    "@/shared/theme": { actionFooterPadding: () => 24, BorderRadius: {}, PinLayout: {}, Spacing: {}, Typography: {} },
    "@/shared/ui/form-feedback": { FormFeedback: "Feedback" },
    "@/shared/ui/back-arrow-icon": { BackArrowIcon: "BackArrow", BACK_ARROW_TOUCH_LEFT: 16, BACK_ARROW_TOUCH_SIZE: 48 },
    "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" },
    "@/shared/ui/keyboard-aware-form-scroll-view": { KeyboardAwareFormScrollView: "Scroll" },
    "@/shared/ui/success-indicator": { SuccessIndicator: "Success" },
    "@/shared/ui/stepper": { default: "Stepper" },
    "./mpin-notification": { MpinNotification: "Notification" },
  };
  const context = { exports: {}, require(name) { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/modules/mpin/components/mpin-layout.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  let found = false;
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    for (const style of [node.props?.style].flat(Infinity)) assert.notEqual(style?.opacity, 0);
    if (node.type === "Text" && node.props.children === "Enter current MPIN") found = true;
    if (node.type === "Notification") assert.equal(node.props.success, undefined);
    for (const child of [node.props?.children].flat(Infinity)) visit(child);
  };
  visit(context.exports.MpinLayout({ title: "Enter current MPIN", description: "Verify your current MPIN.", children: "keypad" }));
  assert.equal(found, true);
  const busy = context.exports.MpinLayout({ title: "Enter current MPIN", description: "Verify your current MPIN.", children: "keypad", busy: true });
  assert.equal(busy.props.pointerEvents, "none");
  assert.equal(busy.props.accessibilityState.busy, true);
  const keyboard = busy.props.children[0];
  assert.equal(keyboard.props.importantForAccessibility, "no-hide-descendants");
  assert.equal(keyboard.props.children.props.scrollEnabled, false);
  assert.equal(JSON.stringify(busy).includes("BrandLoading"), false);
});
