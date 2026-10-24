const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const { create } = require("zustand");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

function setup() {
  const authStore = create(() => ({ user: null }));
  const requests = [];
  const source = readFileSync(path.join(__dirname, "../src/modules/settings/store/profile-cache.store.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = {
    exports: {},
    require(name) {
      if (name === "zustand") return { create };
      if (name === "@/modules/auth/store/auth.store") return { useAuthStore: authStore };
      if (name === "../services/profile.api") return { getProfile: (token) => {
        const result = deferred();
        requests.push({ token, ...result });
        return result.promise;
      } };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(compiled, context);
  const cache = context.exports.useProfileCacheStore;
  const user = (uid) => ({ uid, getIdToken: async () => `${uid}-token` });
  return { authStore, cache, requests, user };
}

test("concurrent profile consumers share one request and reuse fresh data", async () => {
  const { authStore, cache, requests, user } = setup();
  const account = user("one");
  authStore.setState({ user: account });
  const first = cache.getState().load(account);
  const second = cache.getState().load(account);
  await flush();
  assert.equal(requests.length, 1);
  requests[0].resolve({ personalInfo: { firstName: "Jovilyn" } });
  await Promise.all([first, second]);
  await cache.getState().load(account);
  assert.equal(requests.length, 1);
  assert.equal(cache.getState().document.personalInfo.firstName, "Jovilyn");
});

test("sign-out clears data and a late old-account response cannot replace new data", async () => {
  const { authStore, cache, requests, user } = setup();
  const oldAccount = user("old");
  authStore.setState({ user: oldAccount });
  const oldLoad = cache.getState().load(oldAccount);
  await flush();
  authStore.setState({ user: null });
  assert.equal(cache.getState().document, null);
  const newAccount = user("new");
  authStore.setState({ user: newAccount });
  const newLoad = cache.getState().load(newAccount);
  await flush();
  requests[1].resolve({ personalInfo: { firstName: "New" } });
  await newLoad;
  requests[0].resolve({ personalInfo: { firstName: "Old" } });
  await oldLoad;
  assert.equal(cache.getState().uid, "new");
  assert.equal(cache.getState().document.personalInfo.firstName, "New");
});

test("a confirmed edit remains visible even if an older refresh completes later", async () => {
  const { authStore, cache, requests, user } = setup();
  const account = user("one");
  authStore.setState({ user: account });
  const load = cache.getState().load(account);
  await flush();
  cache.getState().updateDetails("one", {
    firstName: "Updated", lastName: "Driver", phone: "999", email: "a@b.com",
    vehicleBrand: "Honda", vehicleModel: "Click", plateNumber: "ABC123",
  });
  requests[0].resolve({ personalInfo: { firstName: "Old" } });
  await load;
  assert.equal(cache.getState().document.personalInfo.firstName, "Updated");
});

test("a failed refresh preserves the last valid profile", async () => {
  const { authStore, cache, requests, user } = setup();
  const account = user("one");
  authStore.setState({ user: account });
  const first = cache.getState().load(account);
  await flush();
  requests[0].resolve({ personalInfo: { firstName: "Saved" } });
  await first;
  const refresh = cache.getState().load(account, true);
  await flush();
  requests[1].reject(new Error("offline"));
  await refresh;
  assert.equal(cache.getState().document.personalInfo.firstName, "Saved");
});
