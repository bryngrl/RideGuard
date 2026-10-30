// Run against the local Postman devices-mobile simulation. Never calls a live API.
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const baseUrl = process.env.DEVICE_SIMULATION_URL;
assert.ok(baseUrl && /^http:\/\/(?:localhost|127\.0\.0\.1):\d+\/rideguard$/.test(baseUrl),
  "Set DEVICE_SIMULATION_URL to the local Postman simulation's /rideguard member.");
function load(file, modules = {}) {
  const context = { exports: {}, fetch, AbortController, setTimeout, clearTimeout,
    process: { env: { EXPO_PUBLIC_API_BASE_URL: `${baseUrl}/v1` } },
    require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
const errors = load("src/shared/api/errors.ts");
const api = load("src/shared/api/client.ts", { "./errors": errors });
const cameras = load("src/modules/camera-sensor/services/cameras.api.ts", { "@/shared/api": api });
const user = { uid: "fixture-owner", getIdToken: async () => "fixture" };
const { useCameraStatusStore: store } = load("src/modules/camera-sensor/store/camera-status.store.ts", {
  zustand: require("zustand"), "../services/cameras.api": cameras,
  "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => ({ user }), subscribe() {} } },
});
const { homeDeviceCards: cards } = load("src/modules/home/utils/home-device-cards.ts", {
  "@/modules/devices/utils/device-presence": load("src/modules/devices/utils/device-presence.ts"),
});
const { claimDevice } = load("src/modules/onboarding/services/onboarding.api.ts", { "@/shared/api": api });
const buttonApi = load("src/modules/devices/services/button-status.api.ts", { "@/shared/api": api });
const device = { ownerUid: user.uid, buttonDeviceId: "", setButtonDeviceId: (id) => { device.buttonDeviceId = id; } };
const { useButtonStatusStore: buttonStore } = load("src/modules/devices/store/button-status.store.ts", {
  zustand: require("zustand"), "@/shared/api/errors": errors,
  "../services/button-status.api": buttonApi,
  "./devices.store": { useDeviceStore: { getState: () => device, persist: { hasHydrated: () => true } } },
  "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => ({ user }), subscribe() {} } },
});
const saved = { camera1DeviceId: "", camera2DeviceId: "CAM-STALE-AAA", buttonDeviceId: "BUT-123-ABC" };
const model = () => {
  const value = store.getState();
  return cards({ cameras: value.cameras, isLoading: value.loading, error: value.error }, saved);
};
async function control(route) {
  const response = await fetch(`${baseUrl}/__test/${route}`);
  assert.equal(response.status, 200);
  return (await response.json()).data;
}
(async () => {
  await control("reset");
  await store.getState().load(user);
  assert.equal(model().camera1.deviceId, "CAM-111-AAA");
  assert.equal(model().camera1.label, "Online");
  assert.equal(model().camera2.label, "Offline");
  assert.equal(model().button.label, "Status unavailable");
  await control("mode?value=offline"); await store.getState().load(user);
  assert.equal(model().camera1.label, "Offline");
  await control("mode?value=failed"); await store.getState().load(user);
  assert.equal(model().camera1.label, "Unavailable");
  assert.equal(model().camera1.deviceId, "CAM-111-AAA");
  await control("mode?value=malformed"); await store.getState().load(user);
  assert.equal(model().camera1.label, "Unavailable");
  assert.equal(store.getState().cameras.length, 3);
  await control("mode?value=online"); await store.getState().load(user);
  assert.equal(model().camera1.label, "Online");
  await control("mode?value=empty"); await store.getState().load(user);
  assert.equal(model().camera1.deviceId, "");
  await claimDevice("BUT-123-ABC", "fixture");
  assert.deepEqual((await control("state")).claims, ["BUT-123-ABC"]);
  await assert.rejects(cameras.getMyCameras("wrong-fixture"), (error) => error.status === 401);
  const buttonModel = () => {
    const state = buttonStore.getState();
    return cards({ cameras: [], isLoading: false, error: null, buttons: state.buttons,
      buttonsSupported: state.supported, buttonsLoading: state.loading, buttonsError: state.error },
    { ...saved, buttonDeviceId: device.buttonDeviceId }).button;
  };
  await control("mode?value=online"); await buttonStore.getState().load(user);
  assert.equal(device.buttonDeviceId, "BUT-123-ABC");
  assert.equal(buttonModel().label, "Offline");
  const heartbeat = await fetch(`${baseUrl}/v1/devices/BUT-123-ABC/heartbeat`, {
    method: "POST", headers: { Authorization: "Bearer hardware-fixture" },
  });
  assert.equal(heartbeat.status, 200);
  await buttonStore.getState().load(user); assert.equal(buttonModel().label, "Online");
  await control("age?ms=90001"); await buttonStore.getState().load(user);
  assert.equal(buttonModel().label, "Offline");
  await control("mode?value=buttons-failed"); await buttonStore.getState().load(user);
  assert.equal(buttonModel().label, "Unavailable");
  await control("mode?value=buttons-unsupported"); await buttonStore.getState().load(user);
  assert.equal(buttonModel().label, "Status unavailable"); assert.equal(device.buttonDeviceId, "BUT-123-ABC");
  await control("mode?value=buttons-empty"); await buttonStore.getState().load(user);
  assert.equal(device.buttonDeviceId, "");
  console.log("PASS: real HTTP client, camera API/store and shared card model handle online, offline, outage, malformed response, retry, empty assignments, authorization and button claim.");
  console.log("PASS: real button API/store restores ownership, reads heartbeat online/expiry, distinguishes 503 from unsupported 404, and clears an explicitly empty inventory.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
