const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, modules = {}) {
  const context = { exports: {}, require: (name) => {
    if (name.endsWith(".svg")) return { __esModule: true, default: "Vector" };
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
const palette = load("src/shared/theme/colors.ts");
const flatten = (value) => Array.isArray(value) ? Object.assign({}, ...value.filter(Boolean).map(flatten)) : value ?? {};
function luminance(hex) {
  const values = hex.replace("#", "").match(/../g).slice(0, 3).map((part) => parseInt(part, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

test("both palettes expose matching tokens and dark text meets normal-size contrast", () => {
  assert.deepEqual(Object.keys(palette.Colors.dark).sort(), Object.keys(palette.Colors.light).sort());
  const dark = palette.Colors.dark;
  for (const surface of ["background", "card", "inputBackground", "backgroundSelected", "modalSurface", "unreadBackground"]) {
    for (const text of ["text", "textSecondary", "textMuted", "accent", "error", "success"]) {
      assert.ok(contrast(dark[text], dark[surface]) >= 4.5, `${text} on ${surface} needs readable contrast`);
    }
  }
  for (const [foreground, background] of [["onPrimaryButton", "primaryButton"], ["dangerHeader", "dangerBackground"],
    ["dangerSubHeader", "dangerBackground"], ["warningHeader", "warningBackground"], ["warningSubHeader", "warningBackground"],
    ["onNotificationError", "notificationError"]]) {
    assert.ok(contrast(dark[foreground], dark[background]) >= 4.5, `${foreground} on ${background}`);
  }
  assert.equal(dark.background, "#030303");
  assert.equal(dark.accent, "#65A7FF");
});

test("actual buttons switch surfaces and labels with the palette, including disabled controls", () => {
  for (const theme of [palette.Colors.light, palette.Colors.dark]) {
    const { Button } = load("src/shared/ui/button.tsx", {
      react: require("react"), "react/jsx-runtime": require("react/jsx-runtime"),
      "react-native": { View: "View", Text: "Text", ActivityIndicator: "Spinner", StyleSheet: { create: (styles) => styles } },
      "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" }, "@/shared/hooks": { useTheme: () => theme },
      "@/shared/theme": { ...palette, BorderRadius: {}, Spacing: {}, Typography: {} },
    });
    const primary = Button({ title: "Save" });
    assert.equal(flatten(primary.props.style).backgroundColor, theme.primaryButton);
    const label = primary.props.children[0].props.children[1];
    assert.equal(flatten(label.props.style).color, theme.onPrimaryButton);
    const outline = Button({ title: "Cancel", variant: "outline" });
    assert.equal(flatten(outline.props.style).backgroundColor, theme.background);
    const disabled = Button({ title: "Save", disabled: true });
    assert.equal(flatten(disabled.props.style).backgroundColor, theme.disabledBackground);
    assert.equal(flatten(disabled.props.children[0].props.children[1].props.style).color, theme.disabledText);
    const forgot = Button({ title: "Forgot MPIN?", variant: "ghost", disabled: true });
    assert.equal(flatten(forgot.props.style).backgroundColor, "transparent");
    assert.equal(forgot.props.disabled, true);
  }
});

test("actual alert rows keep time, false-alarm labels and manual tags readable in both modes", () => {
  for (const theme of [palette.Colors.light, palette.Colors.dark]) {
    const { AlertItem } = load("src/modules/alerts/components/alert-item.tsx", {
      "react/jsx-runtime": require("react/jsx-runtime"), "react-native": { Text: "Text", View: "View" },
      "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" },
      "@/shared/hooks/use-theme": { useTheme: () => theme },
      "@/shared/theme": { ...palette, Typography: {} },
      "../services/alerts.mapper": { getAlertDetectionType: () => "weapon" },
      "./alert-item.styles": { styles: {} },
    });
    const row = AlertItem({ alert: { title: "Weapon detected", time: "9:00 AM", read: false, manual: true, isManual: true, subLabel: "Marked as false alarm" }, onPress() {} });
    assert.equal(flatten(row.props.style).backgroundColor, theme.unreadBackground);
    const textBlock = row.props.children.props.children[1];
    assert.equal(flatten(textBlock.props.children[0].props.children[0].props.style).color, theme.text);
    const badge = textBlock.props.children[0].props.children[1];
    assert.equal(flatten(badge.props.style).borderColor, theme.primary);
    assert.equal(flatten(badge.props.children.props.style).color, theme.primary);
    assert.equal(flatten(textBlock.props.children[2].props.style).color, theme.accent);
    assert.equal(flatten(row.props.children.props.children[2].props.children.props.style).backgroundColor, theme.unreadDot);
  }
});

test("onboarding progress uses the active palette for completed and remaining steps", () => {
  for (const theme of [palette.Colors.light, palette.Colors.dark]) {
    const { default: Stepper } = load("src/shared/ui/stepper.tsx", {
      "react/jsx-runtime": require("react/jsx-runtime"), "react-native": { View: "View", StyleSheet: { create: (styles) => styles } },
      "react-native-reanimated": { __esModule: true, default: { View: "AnimatedView" }, useAnimatedStyle: (work) => work(), withTiming: (value) => value },
      "@/shared/hooks/use-theme": { useTheme: () => theme }, "@/shared/theme": { Spacing: {} },
    });
    const segments = Stepper({ steps: 2, currentStep: 1 }).props.children;
    assert.equal(flatten(segments[0].type(segments[0].props).props.children.props.style).backgroundColor, theme.stepperActive);
    assert.equal(flatten(segments[1].type(segments[1].props).props.children.props.style).backgroundColor, theme.stepperInactive);
  }
});

test("a manual display choice overrides system mode and System follows subsequent phone changes", () => {
  let preference = "light", system = "dark";
  const { useColorScheme } = load("src/shared/hooks/use-color-scheme.ts", {
    "react-native": { useColorScheme: () => system },
    "@/modules/settings/store/settings.store": { useSettingsStore: (select) => select({ themePreference: preference }) },
  });
  assert.equal(useColorScheme(), "light");
  preference = "dark"; system = "light";
  assert.equal(useColorScheme(), "dark");
  preference = "system";
  assert.equal(useColorScheme(), "light");
  system = "dark";
  assert.equal(useColorScheme(), "dark");
});
