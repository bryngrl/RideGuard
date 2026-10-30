const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function setup() {
  let user = { uid: "a", getIdToken: async () => "fixture-token" };
  let authListener;
  const loads = [], saves = [], preferences = [], warnings = [];
  const modules = {
    "@react-native-async-storage/async-storage": {}, zustand: require("zustand"),
    "zustand/middleware": { persist: (factory) => factory, createJSONStorage() {} },
    "@/modules/auth/store/auth.store": { useAuthStore: {
      getState: () => ({ user }), subscribe: (listener) => { authListener = listener; },
    } },
    "../config/mock-data": { mockSettings: { autoArchiveHours: 24, autoArchiveStatus: "idle", themePreference: "light" } },
    "../config/settings-rows": { settingsRows: [] },
    "../services/settings.api": {
      getAutoArchive: () => { const request = deferred(); loads.push(request); return request.promise; },
      hasSavedAutoArchive: () => { const request = deferred(); preferences.push(request); return request.promise; },
      updateAutoArchive: () => { const request = deferred(); saves.push(request); return request.promise; },
    },
  };
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/settings/store/settings.store.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const context = { exports: {}, console: { warn: (...args) => warnings.push(args) },
    require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(compiled, context);
  return { store: context.exports.useSettingsStore, loads, saves, preferences, warnings, setUser: (value) => {
    const previous = user; user = value; authListener?.({ user }, { user: previous });
  } };
}

test("a stale load cannot overwrite a later saved preference", async () => {
  const { store, loads, saves } = setup();
  const loading = store.getState().loadAutoArchive(); await settle();
  const saving = store.getState().saveAutoArchive(48); await settle();
  saves[0].resolve(48); assert.equal(await saving, true);
  loads[0].resolve(72); await loading;
  assert.equal(store.getState().autoArchiveHours, 48);
});

test("an unset preference saves the 24-hour default through the real service boundary", async () => {
  const { store, loads, saves, preferences } = setup();
  const loading = store.getState().loadAutoArchive(); await settle();
  loads[0].resolve(null); await settle();
  preferences[0].resolve(false); await settle();
  assert.equal(saves.length, 1);
  assert.equal(store.getState().autoArchiveStatus, "saving");
  saves[0].resolve(24); await loading;
  assert.equal(store.getState().autoArchiveHours, 24);
  assert.equal(store.getState().autoArchiveStatus, "idle");
});

test("an explicit Never preference is preserved without writing a default", async () => {
  const { store, loads, saves, preferences } = setup();
  const loading = store.getState().loadAutoArchive(); await settle();
  loads[0].resolve(null); await settle();
  preferences[0].resolve(true); await loading;
  assert.equal(saves.length, 0);
  assert.equal(store.getState().autoArchiveHours, null);
});

test("switching accounts while checking the default cannot write the old account", async () => {
  const { store, loads, saves, preferences, setUser } = setup();
  const loading = store.getState().loadAutoArchive(); await settle();
  loads[0].resolve(null); await settle();
  setUser({ uid: "b", getIdToken: async () => "new-token" });
  preferences[0].resolve(false); await loading;
  assert.equal(saves.length, 0);
});

test("a failed default save stays retryable and does not claim confirmation", async () => {
  const { store, loads, saves, preferences } = setup();
  const loading = store.getState().loadAutoArchive(); await settle();
  loads[0].resolve(null); await settle();
  preferences[0].resolve(false); await settle();
  saves[0].reject(new Error("offline")); await loading;
  assert.equal(store.getState().autoArchiveStatus, "error");
});

test("logout reset rejects a late auto-archive response", async () => {
  const { store, loads, setUser } = setup();
  const loading = store.getState().loadAutoArchive(); await settle();
  setUser(null); store.getState().resetAutoArchive();
  loads[0].resolve(168); await loading;
  assert.equal(store.getState().autoArchiveHours, 24);
  assert.equal(store.getState().autoArchiveStatus, "idle");
});

test("switching accounts during token lookup sends no old-account request", async () => {
  const { store, loads, setUser } = setup(); const token = deferred();
  setUser({ uid: "a", getIdToken: () => token.promise });
  const loading = store.getState().loadAutoArchive();
  setUser({ uid: "b" }); token.resolve("old-token"); await loading;
  assert.equal(loads.length, 0);
});

test("duplicate saves and a load during saving cannot race a server mutation", async () => {
  const { store, saves, loads } = setup();
  const saving = store.getState().saveAutoArchive(48);
  assert.equal(await store.getState().saveAutoArchive(72), false);
  await store.getState().loadAutoArchive(); await settle();
  assert.equal(saves.length, 1); assert.equal(loads.length, 0);
  saves[0].resolve(48); await saving;
});

test("failed saves preserve the last confirmed value and remain retryable", async () => {
  const { store, saves, warnings } = setup();
  const saving = store.getState().saveAutoArchive(168); await settle();
  saves[0].reject(new Error("server failed"));
  assert.equal(await saving, false);
  assert.equal(store.getState().autoArchiveHours, 24);
  assert.equal(store.getState().autoArchiveStatus, "error");
  assert.equal(warnings.length, 1);
});

test("an account switch during saving clears the busy state and the new account can load", async () => {
  const { store, saves, loads, setUser } = setup();
  const saving = store.getState().saveAutoArchive(48); await settle();
  setUser({ uid: "b", getIdToken: async () => "new-token" });
  assert.equal(store.getState().autoArchiveStatus, "idle");
  const loading = store.getState().loadAutoArchive(); await settle();
  saves[0].resolve(48); assert.equal(await saving, false);
  loads[0].resolve(72); await loading;
  assert.equal(store.getState().autoArchiveHours, 72);
});
