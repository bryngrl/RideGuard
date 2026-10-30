const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, modules) {
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, AbortController, setTimeout, clearTimeout, require: (name) => {
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(compiled, context); return context.exports;
}
function api(reply) {
  const calls = [];
  return { calls, ...load("src/modules/devices/services/devices.api.ts", {
    "@/shared/api": { apiClient: { request: async (route, options) => {
      calls.push({ route, ...options }); return reply;
    } } },
  }) };
}
const confirmation = (id) => ({ success: true,
  data: { released: true, device_id: id, device_type: id.startsWith("CAM") ? "camera" : "button", assigned_user_id: null } });

test("camera and button disconnect target one explicit ID with Firebase authorization", async () => {
  for (const [kind, id] of [["camera", "CAM-111-AAA"], ["button", "BUT-222-BBB"]]) {
    const adapter = api(confirmation(id));
    const signal = new AbortController().signal;
    await adapter.releaseDevice(` ${id} `, "session-token", kind, signal);
    assert.equal(adapter.calls[0].route, "/devices/release");
    assert.equal(adapter.calls[0].method, "POST");
    assert.equal(adapter.calls[0].token, "session-token");
    assert.equal(adapter.calls[0].signal, signal);
    assert.deepEqual(JSON.parse(adapter.calls[0].body), { device: kind, device_id: id });
  }
});

test("repeat unpair accepts an explicit released ownership confirmation", async () => {
  await api(confirmation("CAM-111-AAA")).releaseDevice("CAM-111-AAA", "token", "camera");
});

test("empty IDs, unsupported targets and unconfirmed results cannot cause local success", async () => {
  const invalid = api(confirmation("CAM-111-AAA"));
  await assert.rejects(invalid.releaseDevice(" ", "token", "camera"));
  await assert.rejects(invalid.releaseDevice("CAM-111-AAA", "token", "all"));
  assert.equal(invalid.calls.length, 0);
  for (const body of [null, {}, { success: false }, { success: true, data: {} },
    confirmation("CAM-999-ZZZ"), { success: true, data: { disconnected: ["CAM-111-AAA"], devices: [
      { device_id: "CAM-111-AAA", device_type: "camera", status: "disconnected" },
    ] } }, { ...confirmation("CAM-111-AAA"), data: { ...confirmation("CAM-111-AAA").data, assigned_user_id: "owner" } },
    { success: true, data: { ...confirmation("CAM-111-AAA").data, device_type: "button" } },
    { success: true, data: { ...confirmation("CAM-111-AAA").data, released: false } }]) {
    await assert.rejects(api(body).releaseDevice("CAM-111-AAA", "token", "camera"));
  }
});

function screen(request, cameraStatus = { cameras: [
  { deviceId: "CAM-111-AAA", source: "esp32", online: false },
  { deviceId: "CAM-222-BBB", source: "esp32", online: false },
], isLoading: false, error: null }, focus) {
  let cursor = 0;
  const slots = [], calls = [], cleared = [], routes = [];
  const auth = { currentUser: { uid: "owner", getIdToken: async () => "session-token" } };
  const store = { ownerUid: "owner", camera1DeviceId: "CAM-111-AAA", camera2DeviceId: "CAM-222-BBB", buttonDeviceId: "BUT-333-CCC",
    clearDisconnectedDevice: (uid, id) => { cleared.push([uid, id]); return true; } };
  const life = load("src/modules/devices/services/device-claim-lifecycle.ts", {}).createDeviceClaimLifecycle(() => auth.currentUser?.uid ?? null);
  life.activate();
  class APIError extends Error {}
  const component = load("src/modules/devices/screens/device-status-screen.tsx", {
    react: { useState: (value) => { const i = cursor++; if (!(i in slots)) slots[i] = value;
      return [slots[i], (next) => { slots[i] = next; }]; },
      useRef: (value) => { const i = cursor++; return slots[i] ??= { current: value }; }, useCallback: (work) => work },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "expo-router": { useFocusEffect: () => {}, useRouter: () => ({ push: (href) => routes.push(href) }), useLocalSearchParams: () => ({ focus }) },
    "react-native": { View: "View", Text: "Text", StyleSheet: { create: (value) => value } },
    "@/lib/firebase": { auth }, "@/shared/hooks": { useTheme: () => ({}) },
    "@/shared/theme": { Spacing: {}, Typography: {} }, "@/shared/ui/button": { Button: "Button" },
    "@/shared/ui/confirmation-modal": { ConfirmationModal: "Confirmation" },
    "@/modules/settings/components/settings-page-layout": { SettingsPageLayout: "Page" },
    "@/shared/ui/notification-sheet": { NotificationSheet: "Notice" }, "@/shared/api/errors": { APIError },
    "../services/devices.api": { releaseDevice: (...args) => { calls.push(args); return request(); } },
    "../store/devices.store": { useDeviceStore: Object.assign(() => store, { getState: () => store }) },
    "../hooks/use-device-claim-lifecycle": { useDeviceClaimLifecycle: () => life },
    "@/modules/camera-sensor/hooks/use-cameras": { useCameras: () => cameraStatus },
    "../hooks/use-buttons": { useButtons: () => ({ buttons: [], buttonsSupported: false, refresh: async () => {} }) },
    "../utils/device-presence": load("src/modules/devices/utils/device-presence.ts", {}),
    "@/modules/home/utils/home-device-cards": load("src/modules/home/utils/home-device-cards.ts", {
      "@/modules/devices/utils/device-presence": load("src/modules/devices/utils/device-presence.ts", {}),
    }),
  }).DeviceStatusScreen;
  let refreshes = 0;
  cameraStatus.refresh = async () => { refreshes++; };
  return { auth, calls, cleared, routes, life, store, refreshes: () => refreshes, render: () => { cursor = 0; return component(); } };
}
function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return null;
  if (predicate(tree)) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const found = find(child, predicate); if (found) return found;
  }
  return null;
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("Quick Button always opens the physical press screen in the protected app stack", () => {
  const app = screen(async () => {});
  app.store.buttonDeviceId = "";
  const connect = find(app.render(), (node) => node.props?.title === "Connect Quick Button");
  assert.ok(connect);
  assert.equal(connect.props.disabled, false);
  connect.props.onPress();
  assert.equal(app.routes[0], "/(app)/devices/quick-button");
  app.store.buttonDeviceId = "BUT-333-CCC";
  find(app.render(), (node) => node.props?.title === "Test Quick Button").props.onPress();
  assert.equal(app.routes[1], "/(app)/devices/quick-button");
});

test("Settings presence uses backend online flags and hides preview and unsupported battery rows", () => {
  const status = { cameras: [{ deviceId: "CAM-111-AAA", source: "esp32", online: true },
    { deviceId: "CAM-222-BBB", source: "esp32", online: false }], isLoading: false, error: null };
  const app = screen(async () => {}, status);
  let tree = app.render();
  assert.ok(find(tree, (node) => node.props?.children === "Online"));
  assert.ok(find(tree, (node) => node.props?.children === "Offline"));
  assert.ok(find(tree, (node) => node.props?.children === "Status unavailable"));
  assert.equal(find(tree, (node) => node.props?.children === "Battery"), null);
  find(tree, (node) => node.props?.title === "Preview camera angle").props.onPress();
  assert.equal(app.routes[0], "/(onboarding)/devices/camera/camera-preview?camera=1&source=settings");
  status.cameras[0].online = false;
  tree = app.render();
  assert.equal(find(tree, (node) => node.props?.title === "Preview camera angle"), null);
  assert.equal(find(tree, (node) => node.props?.title === "Connect camera"), null);
  assert.ok(find(tree, (node) => node.props?.title === "Disconnect"));
  status.cameras[0].online = true; status.error = "Network unavailable";
  assert.equal(find(app.render(), (node) => node.props?.title === "Preview camera angle"), null);
  status.error = null; status.isLoading = true;
  assert.equal(find(app.render(), (node) => node.props?.title === "Preview camera angle"), null);
});

test("Settings uses backend camera assignments with stale saved IDs without a refresh action", () => {
  const status = { cameras: [
    { deviceId: "PHONE-1", source: "phone", online: true },
    { deviceId: "CAM-999-NEW", source: "esp32", online: true },
  ], isLoading: false, error: null };
  const app = screen(async () => {}, status);
  app.store.camera1DeviceId = "";
  const tree = app.render();
  assert.ok(find(tree, (node) => node.props?.children === "Online"));
  find(tree, (node) => node.props?.title === "Preview camera angle").props.onPress();
  assert.equal(app.routes[0], "/(onboarding)/devices/camera/camera-preview?camera=1&source=settings");
  assert.equal(find(tree, (node) => node.props?.title === "Refresh status"), null);
});
function confirm(app) {
  find(app.render(), (node) => node.props?.title === "Disconnect").props.onPress();
  return find(app.render(), (node) => node.type === "Confirmation").props.onPrimaryPress;
}

test("confirmation sends once despite double taps and changes local state only after server success", async () => {
  let resolve;
  const app = screen(() => new Promise((done) => { resolve = done; }));
  const press = confirm(app); press(); press(); await settle();
  assert.equal(app.calls.length, 1); assert.equal(app.cleared.length, 0);
  resolve(); await settle();
  assert.deepEqual(app.cleared, [["owner", "CAM-111-AAA"]]);
  assert.equal(app.render().props.overlay.props.type, "success");
});

test("failed requests retain the device and show a sanitized error", async () => {
  const app = screen(async () => { throw new Error("private server details"); });
  confirm(app)(); await settle();
  assert.equal(app.cleared.length, 0);
  const notice = app.render().props.overlay.props;
  assert.equal(notice.type, "error"); assert.equal(notice.message.includes("private"), false);
});

test("a stalled release exits after its deadline without success, and late completion cannot clear the device", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let resolve;
  const app = screen(() => new Promise((done) => { resolve = done; }));
  confirm(app)(); await settle();
  assert.equal(app.calls.length, 1);
  t.mock.timers.tick(20_000); await settle();
  assert.equal(app.render().props.overlay.props.type, "error");
  assert.match(app.render().props.overlay.props.message, /timed out/);
  assert.equal(app.cleared.length, 0);
  resolve(); await settle(); assert.equal(app.cleared.length, 0);
});

test("late success after an account switch or leaving the screen cannot clear hardware", async () => {
  for (const change of [(app) => { app.auth.currentUser = { uid: "other" }; }, (app) => app.life.cancel()]) {
    let resolve;
    const app = screen(() => new Promise((done) => { resolve = done; }));
    confirm(app)(); await settle(); change(app); resolve(); await settle();
    assert.equal(app.cleared.length, 0);
  }
});


test("Home card focus never changes the settings device order", () => {
  for (const focus of [undefined, "camera1", "camera2", "button"]) {
    const app = screen(async () => {}, undefined, focus);
    const sections = app.render().props.children[0].props.children;
    assert.deepEqual(Array.from(sections, (section) => section.props.children[0].props.children),
      ["Camera 1", "Camera 2", "Quick Button"]);
  }
});

test("unpaired cameras offer connect and paired offline cameras offer only disconnect", () => {
  const app = screen(async () => {}, { cameras: [
    { deviceId: "CAM-111-AAA", source: "esp32", online: false },
  ], isLoading: false, error: null });
  const sections = app.render().props.children[0].props.children;
  assert.equal(find(sections[0], (node) => node.props?.title === "Connect camera"), null);
  assert.equal(find(sections[0], (node) => node.props?.title === "Preview camera angle"), null);
  assert.ok(find(sections[0], (node) => node.props?.title === "Disconnect"));
  assert.ok(find(sections[1], (node) => node.props?.children === "Not connected"));
  find(sections[1], (node) => node.props?.title === "Connect camera").props.onPress();
  assert.equal(app.routes[0], "/(onboarding)/devices/camera?camera=2&source=settings");
});
