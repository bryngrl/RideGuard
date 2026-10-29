const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");
function load(file, modules) {
  const context = { exports: {}, AbortController, setTimeout, clearTimeout, require(name) {
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
class APIError extends Error { constructor(status) { super("private server error"); this.status = status; } }
const envelope = (data) => ({ success: true, data });
test("onboarding accepts only owned, well-formed server checkpoints and treats only 404 as compatibility", async () => {
  let value = envelope({ uid: "a", step: "mpin", completedSteps: [], completed: false, mpinConfigured: true });
  const calls = [];
  const request = async (...args) => { calls.push(args); if (value instanceof Error) throw value; return value; };
  const api = load("src/modules/auth/services/onboarding-progress.api.ts", {
    "@/shared/api": { apiClient: { get: request, patch: request, post: request } },
    "@/shared/api/errors": { APIError },
  });
  assert.equal((await api.getOnboardingProgress("token", "a")).step, "mpin");
  assert.equal(calls[0][0], "/auth/onboarding");
  await assert.rejects(api.getOnboardingProgress("token", "b"));
  value = new APIError(500);
  await assert.rejects(api.getOnboardingProgress("token", "a"));
  value = new APIError(404);
  assert.equal(await api.getOnboardingProgress("token", "a"), null);
  value = envelope({ success: true, completed: true });
  await api.completeOnboarding("token");
  assert.equal(calls.at(-1)[0], "/auth/onboarding/complete");
  value = envelope({ success: true, completed: false });
  await assert.rejects(api.completeOnboarding("token"));
  const draft = api.onboardingDraft({ firstName: "Ana", pin: "1234", password: "secret", authorization: "grant", owner: "b", savedProfile: "a" });
  assert.deepEqual(Object.keys(draft).sort(), ["firstName", "savedProfile"]);
});

test("server logout includes device identity, auth and an abort deadline", async () => {
  const calls = [];
  const api = load("src/modules/auth/services/logout-session.ts", {
    "@/shared/api": { apiClient: { request: async (...args) => { calls.push(args); return envelope({ success: true }); } } },
    "@/modules/notifications/services/installation-id": { getInstallationId: async () => "install-a" },
  });
  await api.revokeLogoutSession("firebase-token");
  assert.equal(calls[0][0], "/auth/logout");
  assert.equal(calls[0][1].headers["x-device-id"], "install-a");
  assert.equal(calls[0][1].token, "firebase-token");
  assert.equal(calls[0][1].method, "POST");
  assert.ok(calls[0][1].signal);
});

test("concurrent push, camera and MPIN initialization share one installation ID", async () => {
  let writes = 0, generated = 0;
  const api = load("src/modules/notifications/services/installation-id.ts", {
    "@react-native-async-storage/async-storage": { getItem: async () => null, setItem: async () => { writes++; } },
    "expo-crypto": { randomUUID: () => `id-${++generated}` },
  });
  const ids = await Promise.all([api.getInstallationId(), api.getInstallationId(), api.getInstallationId()]);
  assert.deepEqual(ids, ["id-1", "id-1", "id-1"]);
  assert.equal(writes, 1);
});
