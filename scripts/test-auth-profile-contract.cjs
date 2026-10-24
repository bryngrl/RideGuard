const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function loadAuthApi(reply) {
  const calls = [];
  const source = readFileSync(path.join(__dirname, "../src/modules/auth/services/auth.api.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const apiClient = {
    async get(path, token) {
      calls.push({ method: "GET", path, token });
      return reply("GET", path);
    },
    async post(path, body, token) {
      calls.push({ method: "POST", path, body, token });
      return reply("POST", path);
    },
  };
  const context = {
    exports: {},
    require(name) {
      if (name === "@/shared/api") return { apiClient };
      if (name === "@/shared/api/errors") return { APIError };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, calls };
}

const envelope = (data) => ({ success: true, message: "OK", data, timestamp: "2026-10-22T00:00:00Z" });

test("credential routes use documented paths, bodies, and verified token", async () => {
  const { api, calls } = loadAuthApi((_method, route) => envelope(
    route === "/auth/register" ? { email: "jane@gmail.com" }
      : route === "/auth/login" || route === "/auth/register/verify" ? { uid: "uid", email: "jane@gmail.com" }
        : {},
  ));
  await api.registerAccount({ username: "jane.driver", email: "jane@gmail.com", password: "Password1" });
  await api.loginAccount("jane.driver", "Password1");
  await api.verifyRegisteredAccount("verified-id-token");
  await api.requestPasswordReset("jane@gmail.com");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { method: "POST", path: "/auth/register", body: { username: "jane.driver", email: "jane@gmail.com", password: "Password1" } },
    { method: "POST", path: "/auth/login", body: { identifier: "jane.driver", password: "Password1" } },
    { method: "POST", path: "/auth/register/verify", token: "verified-id-token" },
    { method: "POST", path: "/auth/forgot-password", body: { email: "jane@gmail.com" } },
  ]);
});

test("profile verification is shared across simultaneous auth callbacks", async () => {
  const { api, calls } = loadAuthApi((_method, route) => envelope(
    route === "/auth/is-old-user" ? false : { uid: "uid", email: "jane@gmail.com" },
  ));
  const user = { uid: "uid", getIdToken: async () => "fresh-token" };
  const results = await Promise.all([
    api.ensureEmailPasswordProfile(user),
    api.ensureEmailPasswordProfile(user),
  ]);
  assert.deepEqual(results, [true, true]);
  assert.equal(calls.filter((call) => call.path === "/auth/register/verify").length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { method: "GET", path: "/auth/is-old-user", token: "fresh-token" },
    { method: "POST", path: "/auth/register/verify", token: "fresh-token" },
  ]);
});

test("a consumed registration is accepted only when a profile now exists", async () => {
  let statusChecks = 0;
  const { api, calls } = loadAuthApi((method, route) => {
    if (route === "/auth/is-old-user") return envelope(++statusChecks > 1);
    if (method === "POST" && route === "/auth/register/verify") {
      throw new APIError("Registration is no longer pending", 409);
    }
    throw new Error(`Unexpected route: ${route}`);
  });
  const user = { uid: "uid", getIdToken: async () => "fresh-token" };
  assert.equal(await api.ensureEmailPasswordProfile(user), true);
  assert.deepEqual(calls.map((call) => call.path), [
    "/auth/is-old-user", "/auth/register/verify", "/auth/is-old-user",
  ]);
});

test("a consumed registration without a profile stays blocked", async () => {
  const { api, calls } = loadAuthApi((_method, route) => {
    if (route === "/auth/is-old-user") return envelope(false);
    if (route === "/auth/register/verify") throw new APIError("Registration is no longer pending", 409);
    throw new Error(`Unexpected route: ${route}`);
  });
  const user = { uid: "uid", getIdToken: async () => "fresh-token" };
  await assert.rejects(
    api.ensureEmailPasswordProfile(user),
    /email is verified, but your RideGuard profile could not be found/i,
  );
  assert.equal(calls.filter((call) => call.path === "/auth/is-old-user").length, 2);
});

test("documented identity envelope is unwrapped", async () => {
  const { api } = loadAuthApi(() => envelope({ uid: "uid", emailVerified: true, name: "Jane Driver", picture: null }));
  const user = await api.getCurrentUser("token");
  assert.equal(user.name, "Jane Driver");
  assert.equal(user.emailVerified, true);
});

test("Ably token request keeps the signed-in Firebase credential", async () => {
  const tokenRequest = { keyName: "key", ttl: 60000 };
  const { api, calls } = loadAuthApi(() => envelope(tokenRequest));
  const result = await api.getAblyToken("firebase-token");
  assert.equal(result.keyName, "key");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { method: "GET", path: "/auth/ably-token", token: "firebase-token" },
  ]);
});

test("onboarding submits documented personal-info fields with Firebase token", async () => {
  const calls = [];
  const source = readFileSync(path.join(__dirname, "../src/modules/onboarding/services/onboarding.api.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const context = {
    exports: {},
    require(name) {
      assert.equal(name, "@/shared/api");
      return { apiClient: { post: async (...args) => { calls.push(args); return envelope({}); } } };
    },
  };
  vm.runInNewContext(compiled, context);
  const payload = {
    first_name: "Jane", last_name: "Driver", phone_number: "+639171234567",
    brand: "Honda", model: "Click 125", plate_number: "ABC 1234", color: "Red",
    contact_name: "Alex", emergency_phone_number: "+639181234567", relationship: "Sibling",
  };
  await context.exports.submitProfile(payload, "firebase-token");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["/profile/personal-info", payload, "firebase-token"]]);
});
