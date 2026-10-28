const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadProgress(storage = new Map()) {
  const source = readFileSync(path.join(__dirname, "../src/modules/auth/services/registration-progress.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require(name) {
    assert.equal(name, "@react-native-async-storage/async-storage");
    return {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => storage.set(key, value),
      removeItem: async (key) => storage.delete(key),
    };
  } };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, storage };
}
const account = (email = "driver@gmail.com") => ({ email });

test("new registration starts at Profile despite a backend-created profile", async () => {
  const { api } = loadProgress();
  await api.markRegistrationOnboardingPending(" DRIVER@gmail.com ");
  assert.equal(await api.postAuthDestination(account(), true), api.onboardingPaths.profile);
});

test("all unfinished steps survive a fresh app session", async () => {
  const { api, storage } = loadProgress();
  for (const [step, route] of Object.entries(api.onboardingPaths)) {
    await api.saveOnboardingStep("driver@gmail.com", step);
    assert.equal(await loadProgress(storage).api.postAuthDestination(account(), true), route);
  }
});

test("checkpoints belong to the registered email", async () => {
  const { api } = loadProgress();
  await api.saveOnboardingStep("driver@gmail.com", "vehicle");
  assert.equal(await api.postAuthDestination(account("other@gmail.com"), true), "/(app)/(tabs)");
});

test("legacy and invalid checkpoints restart safely at Profile", async () => {
  for (const value of ["true", "missing", "toString", "__proto__"]) {
    const { api } = loadProgress(new Map([["rideguard:onboarding-pending:driver@gmail.com", value]]));
    assert.equal(await api.postAuthDestination(account(), true), api.onboardingPaths.profile);
  }
});

test("only successful completion removes the pending checkpoint", async () => {
  const { api, storage } = loadProgress();
  await api.saveOnboardingStep("driver@gmail.com", "mpin");
  assert.equal(await api.postAuthDestination(account(), true), api.onboardingPaths.mpin);
  await api.clearRegistrationOnboardingPending("DRIVER@gmail.com");
  assert.equal(storage.size, 0);
  assert.equal(await api.postAuthDestination(account(), true), "/(app)/(tabs)");
  assert.equal(await api.postAuthDestination(account(), false), api.onboardingPaths.profile);
});
