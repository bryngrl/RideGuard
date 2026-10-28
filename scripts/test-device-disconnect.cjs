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

function screen(request) {
  let cursor = 0;
  const slots = [], calls = [], cleared = [];
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
    "expo-router": { useFocusEffect: () => {}, useRouter: () => ({}), useLocalSearchParams: () => ({}) },
    "react-native": { View: "View", Text: "Text", StyleSheet: { create: (value) => value } },
    "@/lib/firebase": { auth }, "@/shared/hooks": { useTheme: () => ({}) },
    "@/shared/theme": { Spacing: {}, Typography: {} }, "@/shared/ui/button": { Button: "Button" },
    "@/shared/ui/confirmation-modal": { ConfirmationModal: "Confirmation" },
    "@/modules/settings/components/settings-page-layout": { SettingsPageLayout: "Page" },
    "@/shared/ui/notification-sheet": { NotificationSheet: "Notice" }, "@/shared/api/errors": { APIError },
    "../services/devices.api": { releaseDevice: (...args) => { calls.push(args); return request(); } },
    "../store/devices.store": { useDeviceStore: Object.assign(() => store, { getState: () => store }) },
    "../hooks/use-device-claim-lifecycle": { useDeviceClaimLifecycle: () => life },
  }).DeviceStatusScreen;
  return { auth, calls, cleared, life, render: () => { cursor = 0; return component(); } };
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

test("late success after an account switch or leaving the screen cannot clear hardware", async () => {
  for (const change of [(app) => { app.auth.currentUser = { uid: "other" }; }, (app) => app.life.cancel()]) {
    let resolve;
    const app = screen(() => new Promise((done) => { resolve = done; }));
    confirm(app)(); await settle(); change(app); resolve(); await settle();
    assert.equal(app.cleared.length, 0);
  }
});
