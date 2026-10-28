const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

async function setup(saved, uid = "a") {
  let auth = { user: uid ? { uid } : null, isCheckingAuth: false }, listener;
  let stored = saved ? JSON.stringify({ state: saved, version: 0 }) : null;
  const modules = {
    zustand: require("zustand"), "zustand/middleware": require("zustand/middleware"),
    "@react-native-async-storage/async-storage": {
      getItem: async () => stored, setItem: async (_, value) => { stored = value; }, removeItem: async () => { stored = null; },
    },
    "@/modules/auth/store/auth.store": { useAuthStore: {
      getState: () => auth, subscribe: (callback) => { listener = callback; },
    } },
  };
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/devices/store/devices.store.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(compiled, context);
  await new Promise((resolve) => setImmediate(resolve));
  return { store: context.exports.useDeviceStore, account: (uid) => {
    auth = { user: uid ? { uid } : null, isCheckingAuth: false }; listener();
  }, stored: () => JSON.parse(stored).state };
}

test("legacy local hardware is retained for the installation's first authenticated owner", async () => {
  const { store } = await setup({ buttonDeviceId: "BUT-297-TXI", isButtonActivated: true });
  assert.equal(store.getState().ownerUid, "a");
  assert.equal(store.getState().buttonDeviceId, "BUT-297-TXI");
});

test("switching accounts does not expose the previous account's local devices", async () => {
  const { store, account } = await setup();
  store.getState().setButtonDeviceId("BUT-297-TXI");
  store.getState().setButtonActivated(true);
  account("b");
  assert.equal(store.getState().buttonDeviceId, "");
  assert.equal(store.getState().isButtonActivated, false);
  store.getState().setCamera1DeviceId("CAM-123-ABC");
  account("a");
  assert.equal(store.getState().buttonDeviceId, "BUT-297-TXI");
  assert.equal(store.getState().isButtonActivated, true);
  assert.equal(store.getState().camera1DeviceId, "");
});

test("logout hides local devices while signing back in restores that account's snapshot", async () => {
  const { store, account } = await setup();
  store.getState().setButtonDeviceId("BUT-297-TXI");
  account(null); assert.equal(store.getState().buttonDeviceId, "");
  account("a"); assert.equal(store.getState().buttonDeviceId, "BUT-297-TXI");
});

test("hydration reconciles a persisted owner with the currently authenticated account", async () => {
  const { store, account } = await setup({ ownerUid: "a", buttonDeviceId: "BUT-297-TXI", devicesByOwner: {} }, "b");
  assert.equal(store.getState().ownerUid, "b");
  assert.equal(store.getState().buttonDeviceId, "");
  account("a"); assert.equal(store.getState().buttonDeviceId, "BUT-297-TXI");
});

test("confirmed disconnect clears only the matching hardware slot and activation", async () => {
  const { store, account } = await setup();
  store.getState().setCamera1DeviceId("CAM-111-AAA"); store.getState().setCamera1Activated(true);
  store.getState().setCamera2DeviceId("CAM-222-BBB"); store.getState().setCamera2Activated(true);
  store.getState().setButtonDeviceId("BUT-333-CCC"); store.getState().setButtonActivated(true);
  assert.equal(store.getState().clearDisconnectedDevice("a", "CAM-111-AAA"), true);
  assert.equal(store.getState().camera1DeviceId, ""); assert.equal(store.getState().isCamera1Activated, false);
  assert.equal(store.getState().camera2DeviceId, "CAM-222-BBB"); assert.equal(store.getState().isCamera2Activated, true);
  assert.equal(store.getState().buttonDeviceId, "BUT-333-CCC");
  account("b"); account("a");
  assert.equal(store.getState().camera1DeviceId, "");
  assert.equal(store.getState().clearDisconnectedDevice("a", "BUT-333-CCC"), true);
  assert.equal(store.getState().buttonDeviceId, ""); assert.equal(store.getState().isButtonActivated, false);
});

test("late disconnect cannot clear another account or replacement hardware", async () => {
  const { store, account } = await setup();
  store.getState().setButtonDeviceId("BUT-333-CCC");
  account("b"); store.getState().setButtonDeviceId("BUT-444-DDD");
  assert.equal(store.getState().clearDisconnectedDevice("a", "BUT-333-CCC"), false);
  assert.equal(store.getState().buttonDeviceId, "BUT-444-DDD");
  assert.equal(store.getState().clearDisconnectedDevice("b", "BUT-333-CCC"), false);
  assert.equal(store.getState().clearDisconnectedDevice("b", ""), false);
  assert.equal(store.getState().buttonDeviceId, "BUT-444-DDD");
});
