const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");

function render(kind, params, history, scheme = "light") {
  const actions = [], effects = [];
  const router = { canGoBack: () => history, back: () => actions.push("back"), replace: (href) => actions.push(href) };
  const modules = {
    "@/shared/lib/branded-alert": { BrandedAlert: { alert() {} } },
    "@/shared/ui/cached-photo": { CachedPhoto: "CachedPhoto" },
    react: { useState: (value) => [value, () => {}], useRef: (value) => ({ current: value }), useCallback: (work) => work },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "expo-router": { useRouter: () => router, useLocalSearchParams: () => params, useFocusEffect: (work) => effects.push(work) },
    "expo-image-picker": {}, "@expo/vector-icons": { Ionicons: "Icon" }, "expo-linear-gradient": { LinearGradient: "Gradient" },
    "expo-image": { Image: "ArtworkImage" },
    "react-native": { View: "View", Text: "Text", Image: "Image", Pressable: "Pressable",
      BackHandler: { addEventListener: () => ({ remove() {} }) } },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) },
    "@/shared/hooks/use-color-scheme": { useColorScheme: () => scheme },
    "@/shared/theme": { actionFooterPadding: () => 40, BrandColors: {}, Spacing: {}, Typography: {} },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 24 }) },
    "@/shared/lib/input-formats": { nationalMobile: (value) => value, formatNationalMobile: (value) => value },
    "./edit-contact-screen.styles": { styles: {} }, "./add-contact-screen.styles": { styles: {} },
    "../components/relationship-picker": { RelationshipPicker: "RelationshipPicker" },
    "../services/contacts.api": {},
  };
  const controls = { "feedback-pressable": "FeedbackPressable", button: "Button", "keyboard-hidden-view": "KeyboardHiddenView",
    "confirmation-modal": "ConfirmationModal", "notification-sheet": "NotificationSheet", "page-layout": "PageLayout",
    "photo-options-bottom-sheet": "PhotoOptionsBottomSheet", "text-input": "CustomTextInput" };
  for (const [file, name] of Object.entries(controls)) modules[`@/shared/ui/${file}`] = { [name]: name };
  const source = readFileSync(path.join(__dirname, `../src/modules/emergency-contacts/screens/${kind}-contact-screen.tsx`), "utf8");
  const context = { exports: {}, require: (name) => {
    if (name.endsWith(".svg")) return "Svg";
    if (name.endsWith("/contact-information-dark.png")) return "contact-information-dark.png";
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, context);
  const tree = context.exports[kind === "edit" ? "EditContactScreen" : "AddContactScreen"]();
  return { tree, actions, focus: () => effects.forEach((effect) => effect()) };
}

test("contact detail back uses history when present and the list when history was lost", () => {
  for (const history of [true, false]) {
    const screen = render("edit", { contactId: "contact-1", contactName: "Ana" }, history);
    screen.tree.props.onBack();
    assert.deepEqual(screen.actions, [history ? "back" : "/contact"]);
  }
});

test("a restored detail route without a contact ID returns to the list", () => {
  const screen = render("edit", {}, false);
  screen.focus();
  assert.deepEqual(screen.actions, ["/contact"]);
});

test("an empty new-contact form can close safely without back history", () => {
  const screen = render("add", {}, false);
  screen.tree.props.onBack();
  assert.deepEqual(screen.actions, ["/contact"]);
});

test("contact details switch the background artwork without changing contact identity or navigation", () => {
  for (const scheme of ["light", "dark"]) {
    const screen = render("edit", { contactId: "contact-1", contactName: "Ana" }, true, scheme);
    const layer = screen.tree.props.children[0].props.children[1];
    const background = scheme === "dark" ? layer.props.children : layer;
    assert.equal(background.type, scheme === "dark" ? "Image" : "Svg");
    if (scheme === "dark") {
      assert.equal(background.props.source, "contact-information-dark.png");
      assert.equal(background.props.resizeMode, "contain");
      assert.equal(layer.props.pointerEvents, "none");
    }
    screen.tree.props.onBack();
    assert.deepEqual(screen.actions, ["back"]);
  }
});
