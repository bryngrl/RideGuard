const assert = require("node:assert/strict"), { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules) {
  const context = { exports: {}, require: (name) => {
    if (name.endsWith(".svg")) return "Logo";
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context); return context.exports;
}
const native = { View: "View", Text: "Text", ActivityIndicator: "Spinner", StyleSheet: { create: (value) => value } };
const common = { "react/jsx-runtime": require("react/jsx-runtime"), "react-native": native,
  "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/theme": { Spacing: {}, BorderRadius: {}, Typography: {} } };
const camera = { deviceId: "CAM-123-ABC", source: "esp32", online: true };
test("shared hardware frame shows loading, unavailable, missing, offline and live states honestly", () => {
  const frame = load("src/modules/camera-sensor/components/camera-preview-frame.tsx", { ...common,
    "@expo/vector-icons": { Ionicons: "Icon" }, "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" },
    "@/shared/ui/button": { Button: "Button" }, "./live-camera-view": { LiveCameraView: "LiveView" },
  });
  const preview = (props) => frame.HardwareCameraPreview({ label: "Camera 2", ...props });
  assert.equal(preview({ loading: true }).type, "Spinner");
  assert.equal(preview({ error: "Failed" }).props.title, "Camera unavailable");
  assert.equal(preview({}).props.title, "Camera 2 is not linked");
  const connect = () => {};
  const offline = preview({ camera: { ...camera, online: false }, onConnect: connect });
  assert.equal(offline.props.title, "Camera 2 is offline");
  assert.equal(offline.props.onConnect, connect);
  assert.equal(frame.CameraPreviewPlaceholder(offline.props).props.children[3].props.title, "Connect");
  assert.equal(preview({ camera }).type, "LiveView");
  assert.equal(preview({ camera }).props.camera.deviceId, camera.deviceId);
});
test("both setup slots use the exact paired camera with no sources and preserve Settings/onboarding Done routes", () => {
  for (const slot of ["1", "2"]) for (const source of [undefined, "settings"]) {
    const actions = [], records = [camera, { ...camera, deviceId: "CAM-456-DEF" }];
    const screen = load("src/modules/camera-sensor/screens/camera-preview-screen.tsx", { ...common,
      react: { useRef: (value) => ({ current: value }), useCallback: (work) => work },
      "expo-router": { useLocalSearchParams: () => ({ camera: slot, source }), useFocusEffect: (work) => work(),
        useRouter: () => ({ replace: (href) => actions.push(href), dismissTo: (href) => actions.push(href) }) },
      "@/shared/ui": { Stepper: "Stepper" }, "@/shared/ui/button": { Button: "Button" },
      "@/shared/ui/keyboard-avoiding-wrapper": { KeyboardAvoidingWrapper: "Layout" },
      "@/modules/devices/store/devices.store": { useDeviceStore: (select) => select({ camera1DeviceId: camera.deviceId, camera2DeviceId: records[1].deviceId }) },
      "../hooks/use-cameras": { useCameras: () => ({ cameras: records, isLoading: false, error: null }) },
      "../components/camera-preview-frame": { CameraPreviewFrame: "Frame", HardwareCameraPreview: "Preview" },
    });
    const children = screen.CameraPreviewScreen().props.children.props.children;
    assert.equal(!!children[0], source !== "settings");
    assert.equal(children[2].type, "Frame");
    const preview = children[2].props.children;
    assert.equal(preview.props.camera.deviceId, records[Number(slot) - 1].deviceId);
    const done = children[3].props.children;
    done.props.onPress(); done.props.onPress();
    assert.deepEqual(actions, [source === "settings" ? "/devices" : slot === "1" ? "/devices/camera?camera=2" : "/(onboarding)/register/provision"]);
    preview.props.onConnect();
    assert.equal(actions[1].params.camera, slot);
    assert.equal(actions[1].params.source, source);
  }
});

test("skipping either camera opens Quick Button connection, not its test or MPIN", () => {
  const find = (tree, title) => {
    if (!tree || typeof tree !== "object") return null;
    if (tree.props?.title === title) return tree;
    for (const child of [tree.props?.children].flat(Infinity)) { const found = find(child, title); if (found) return found; }
    return null;
  };
  for (const slot of ["1", "2"]) {
    const actions = [];
    let dismissals = 0;
    const screen = load("src/modules/camera-sensor/screens/provision-camera-screen.tsx", { ...common,
      react: { useState: (value) => [value, () => {}], useCallback: (work) => work },
      "react-native": { ...native, Keyboard: { dismiss: () => dismissals++ } },
      "expo-router": { useLocalSearchParams: () => ({ camera: slot }), useFocusEffect: () => {},
        useRouter: () => ({ replace: (href) => actions.push(href) }) },
      "@/lib/firebase": { auth: {} },
      "@/modules/devices": { useDeviceStore: () => ({}) },
      "@/modules/devices/hooks/use-device-claim-lifecycle": { useDeviceClaimLifecycle: () => ({}) },
      "@/shared/lib/input-formats": {}, "@/shared/ui": { Stepper: "Stepper" },
      "@/shared/ui/button": { Button: "Button" },
      "@/shared/ui/keyboard-avoiding-wrapper": { KeyboardAvoidingWrapper: "Layout" },
      "@/shared/ui/keyboard-hidden-view": { KeyboardHiddenView: "Footer" },
      "@/shared/ui/modal": { LoadingModal: "Modal" }, "@/shared/ui/text-input": { CustomTextInput: "Input" },
      "./provision-camera-screen.styles": { styles: {} },
    });
    find(screen.ProvisionCameraScreen(), "Skip for now").props.onPress();
    assert.deepEqual(actions, ["/(onboarding)/register/provision"]);
    assert.equal(dismissals, 1);
  }
});
