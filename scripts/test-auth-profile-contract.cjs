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
  const successes = [];
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
      if (name === "./verified-success") return { beginVerifiedSuccess: (...args) => successes.push(args) };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, calls, successes };
}

const envelope = (data) => ({ success: true, message: "OK", data, timestamp: "2026-10-22T00:00:00Z" });

test("credential routes use documented paths, bodies, and verified token", async () => {
  const { api, calls } = loadAuthApi((_method, route) => envelope(
    route === "/auth/register" ? { email: "jane@gmail.com" }
      : route === "/auth/login" ? { uid: "uid", email: "jane@gmail.com" }
        : {},
  ));
  await api.registerAccount({ username: "jane.driver", email: "jane@gmail.com", password: "Password1" });
  await api.loginAccount("jane.driver", "Password1");
  await api.requestPasswordReset("jane@gmail.com");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { method: "POST", path: "/auth/register", body: { username: "jane.driver", email: "jane@gmail.com", password: "Password1" } },
    { method: "POST", path: "/auth/login", body: { identifier: "jane.driver", password: "Password1" } },
    { method: "POST", path: "/auth/forgot-password", body: { email: "jane@gmail.com" } },
  ]);
});

test("registration normalizes username before the backend lowercase DTO validation", async () => {
  const { api, calls } = loadAuthApi(() => envelope({ email: "rider@gmail.com" }));
  await api.registerAccount({ username: " Rider.One ", email: " RIDER@gmail.com ", password: "Password1 " });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].body)), {
    username: "rider.one", email: "rider@gmail.com", password: "Password1 ",
  });
});

test("backend username validation points to the field while duplicate conflicts keep the banner", () => {
  const source = readFileSync(path.join(__dirname, "../src/modules/auth/utils/auth-errors.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: () => ({ APIError }) };
  vm.runInNewContext(compiled, context);
  const fields = context.exports.registrationFieldErrors(new APIError(
    "username must be 3-24 lowercase letters, numbers, periods, or underscores", 400,
  ));
  assert.ok(fields.username);
  assert.equal(fields.email, undefined);
  assert.deepEqual(Object.keys(context.exports.registrationFieldErrors(new APIError("Username is already taken.", 409))), []);
  assert.equal(context.exports.authErrorMessage(new APIError("Username is already taken.", 409), "register"),
    "The username or email already has an account.");
});

test("profile validation is shared across concurrent callbacks without legacy verification mutations", async () => {
  const { api, calls } = loadAuthApi((_method, route) => envelope(route === "/auth/is-old-user" ? false : { uid: "uid" }));
  const user = { uid: "uid", getIdToken: async () => "fresh-token" };
  const results = await Promise.all([api.ensureEmailPasswordProfile(user), api.ensureEmailPasswordProfile(user)]);
  assert.deepEqual(results, [false, false]);
  assert.deepEqual(calls.map((call) => call.path), ["/auth/is-old-user", "/profile/me"]);
  assert.equal(calls.some((call) => call.method === "POST"), false);
});

test("a verified Firebase user without a backend identity stub stays blocked", async () => {
  const { api, calls } = loadAuthApi((_method, route) => envelope(route === "/auth/is-old-user" ? false : null));
  await assert.rejects(api.ensureEmailPasswordProfile({ uid: "uid", getIdToken: async () => "token" }), /profile could not be found/i);
  assert.deepEqual(calls.map((call) => call.path), ["/auth/is-old-user", "/profile/me"]);
});

test("a verified registration stub resumes onboarding without verifying again", async () => {
  const { api, calls } = loadAuthApi((_method, route) => envelope(route === "/auth/is-old-user" ? false : { uid: "uid", email: "jane@gmail.com" }));
  assert.equal(await api.ensureEmailPasswordProfile({ uid: "uid", getIdToken: async () => "token" }), false);
  assert.equal(calls.some((call) => call.method === "POST"), false);
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
