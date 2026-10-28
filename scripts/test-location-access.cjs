const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, modules) {
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("location readiness requires both app permission and the phone Location switch", async () => {
  let granted = true, enabled = false, fallback = 0;
  const service = load("src/shared/lib/location-access.ts", {
    "expo-location": { getForegroundPermissionsAsync: async () => ({ granted }), hasServicesEnabledAsync: async () => enabled },
    "react-native": { Platform: { OS: "android" }, Linking: {
      sendIntent: async (action) => { assert.equal(action, "android.settings.LOCATION_SOURCE_SETTINGS"); throw Error("unsupported"); },
      openSettings: async () => { fallback++; },
    } },
  });
  assert.equal((await service.getLocationAccess()).ready, false);
  enabled = true;
  assert.equal((await service.getLocationAccess()).ready, true);
  granted = false;
  assert.equal((await service.getLocationAccess()).ready, false);
  await service.openLocationSettings();
  assert.equal(fallback, 1);
});

test("location prompt rechecks foreground visits and ignores checks completed after cleanup", async () => {
  let effect, listener, enabled = false, resolvePending, pending, removed = false;
  const alerts = [], settings = [];
  const appState = { currentState: "active", addEventListener: (_event, work) => { listener = work; return { remove: () => { removed = true; } }; } };
  const hook = load("src/shared/hooks/use-location-services-prompt.ts", {
    react: { useEffect: (work) => { effect = work; } },
    "react-native": { AppState: appState },
    "expo-location": { hasServicesEnabledAsync: () => pending ?? Promise.resolve(enabled) },
    "@/shared/lib/branded-alert": { BrandedAlert: { alert: (...args) => alerts.push(args) } },
    "@/shared/lib/location-access": { openLocationSettings: async () => settings.push(true) },
  });
  hook.useLocationServicesPrompt(false);
  assert.equal(effect(), undefined, "locked/logged-out sessions must not prompt");
  hook.useLocationServicesPrompt(true);
  const cleanup = effect();
  await tick();
  assert.equal(alerts.length, 1);
  alerts[0][2][1].onPress();
  await tick();
  assert.equal(settings.length, 1);
  appState.currentState = "background"; listener("background");
  enabled = true;
  appState.currentState = "active"; listener("active");
  await tick();
  assert.equal(alerts.length, 1, "enabled Location must not show another reminder");
  enabled = false;
  listener("active"); await tick();
  assert.equal(alerts.length, 2, "remind again on the next foreground visit when Location is off");
  pending = new Promise((resolve) => { resolvePending = resolve; });
  listener("active"); cleanup(); resolvePending(false); await tick();
  assert.equal(alerts.length, 2, "stale checks must not show a dialog after logout or locking");
  assert.equal(removed, true);
});
