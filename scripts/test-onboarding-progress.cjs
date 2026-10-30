const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadProgress(storage = new Map(), remote = null, complete = async () => {}) {
  const source = readFileSync(path.join(__dirname, "../src/modules/auth/services/registration-progress.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require(name) {
    if (name === "./onboarding-progress.api") return {
      getOnboardingProgress: async () => remote,
      updateOnboardingProgress: async () => {},
      completeOnboarding: complete,
    };
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
const account = (email = "driver@gmail.com") => ({ email, uid: email, getIdToken: async () => "token" });

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

test("server checkpoints resume across installations and configured MPIN is not recreated", async () => {
  const remote = { uid: "driver@gmail.com", step: "camera", completed: false, mpinConfigured: true, completedSteps: [], data: { frontendFlowVersion: 2 } };
  assert.equal(await loadProgress(new Map(), remote).api.postAuthDestination(account(), true), "/(onboarding)/devices/camera");
  remote.step = "mpin";
  assert.equal(await loadProgress(new Map(), remote).api.postAuthDestination(account(), true), "/(onboarding)/register/complete-setup");
  remote.completed = true;
  assert.equal(await loadProgress(new Map(), remote).api.postAuthDestination(account(), true), "/(app)/(tabs)");
  remote.mpinConfigured = false;
  assert.equal(await loadProgress(new Map(), remote).api.postAuthDestination(account(), true), "/(onboarding)/register/mpin");
});

test("legacy profile and configured MPIN migrate to the normal app instead of restarting onboarding", async () => {
  for (const step of ["profile", "permission", "camera", "mpin"]) {
    const remote = { step, completed: false, mpinConfigured: true, completedSteps: [] };
    const { api, storage } = loadProgress(new Map([["rideguard:onboarding-pending:driver@gmail.com", "permission"]]), remote);
    assert.equal(await api.postAuthDestination(account(), true), "/(app)/(tabs)");
    assert.equal(storage.size, 0);
    assert.equal(await api.postAuthDestination(account(), false), "/(onboarding)/register/profile");
  }
});

test("failed legacy migration retains the checkpoint and missing MPIN never migrates", async () => {
  const remote = { step: "permission", completed: false, mpinConfigured: true };
  const storage = new Map([["rideguard:onboarding-pending:driver@gmail.com", "permission"]]);
  let completions = 0;
  const app = loadProgress(storage, remote, async () => { completions++; throw new Error("offline"); });
  await assert.rejects(app.api.postAuthDestination(account(), true));
  assert.equal(storage.size, 1);
  assert.equal(completions, 1);
  remote.mpinConfigured = false;
  assert.equal(await app.api.postAuthDestination(account(), true), "/(onboarding)/register/permission");
  assert.equal(completions, 1);
});

test("a server completion flag cannot bypass a missing personal profile", async () => {
  const remote = { step: "complete-setup", completed: true, mpinConfigured: true };
  assert.equal(await loadProgress(new Map(), remote).api.postAuthDestination(account(), false), "/(onboarding)/register/profile");
});

test("a locally saved hardware skip wins over a stale remote hardware step and still requires MPIN", async () => {
  for (const step of ["button", "provision"]) {
    const remote = { step, completed: false, mpinConfigured: false, data: { frontendFlowVersion: 2 } };
    const storage = new Map([["rideguard:onboarding-pending:driver@gmail.com", "mpin"]]);
    assert.equal(await loadProgress(storage, remote).api.postAuthDestination(account(), true), "/(onboarding)/register/mpin");
    assert.equal(await loadProgress(storage, remote).api.postAuthDestination(account(), false), "/(onboarding)/register/profile");
  }
});
