const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const calls = [];
let reply = { success: true, data: { success: true } };
const apiClient = {
  request: async (endpoint, options) => {
    calls.push({ endpoint, options });
    if (reply instanceof Error) throw reply;
    if (typeof reply === "function") return reply(endpoint, options);
    return reply;
  },
};

const source = fs.readFileSync(path.join(__dirname, "../src/modules/mpin/services/mpin.api.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function("require", "module", "exports", compiled)((name) => {
  if (name === "@/shared/api") return { apiClient };
  if (name === "@/shared/api/errors") return { APIError };
  throw new Error(`Unexpected import: ${name}`);
}, moduleUnderTest, moduleUnderTest.exports);
const { MpinError, mpinApi, setupAndUnlockMpin } = moduleUnderTest.exports;

test("setup and unlock are enabled independently of unavailable email-link recovery", () => {
  assert.equal(mpinApi.enabled, true);
  assert.equal(mpinApi.emailLinksEnabled, false);
});

test("status forwards auth, abort signal, and lifecycle context", async () => {
  calls.length = 0;
  reply = { success: true, data: { configured: false, requiresUnlock: false } };
  const signal = new AbortController().signal;
  assert.deepEqual(await mpinApi.status("firebase-token", signal, { reason: "resume", inactiveForMs: 1200 }), reply.data);
  assert.equal(calls[0].endpoint, "/mpin/status?reason=resume");
  assert.equal(calls[0].options.token, "firebase-token");
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[0].options.method, "GET");
});

test("setup uses the server response and never treats a malformed envelope as success", async () => {
  calls.length = 0;
  reply = { success: true, data: { success: true } };
  assert.deepEqual(await mpinApi.create("firebase-token", "1234", new AbortController().signal), { success: true });
  assert.equal(calls[0].endpoint, "/mpin/setup");
  assert.deepEqual(JSON.parse(calls[0].options.body), { pin: "1234" });
  reply = { success: false, data: { success: true } };
  await assert.rejects(mpinApi.create("firebase-token", "1234", new AbortController().signal),
    (error) => error instanceof MpinError && error.code === "failed");
});

test("change and recovery send the backend's proof and challenge fields", async () => {
  calls.length = 0;
  const signal = new AbortController().signal;
  reply = { success: true, data: { token: "proof", expiresAt: Date.now() + 60000 } };
  await mpinApi.authorizeChange("firebase-token", "1234", signal);
  assert.equal(calls.at(-1).endpoint, "/mpin/change/authorize");
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { pin: "1234" });
  await mpinApi.requestChangeCode("firebase-token", "proof", signal);
  assert.equal(calls.at(-1).endpoint, "/mpin/change/code");
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { authorization: "proof" });
  await mpinApi.verifyRecovery("firebase-token", "challenge", "123456", signal);
  assert.equal(calls.at(-1).endpoint, "/mpin/recovery/code/verify");
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { challengeId: "challenge", code: "123456" });
  await mpinApi.reset("firebase-token", "reset-grant", "4321", signal);
  assert.equal(calls.at(-1).endpoint, "/mpin/recovery/reset");
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), { authorization: "reset-grant", pin: "4321" });
});

test("backend lockout and unavailable email delivery have actionable errors", async () => {
  reply = new APIError("MPIN is locked", 429, { retryAt: 123456 });
  await assert.rejects(mpinApi.unlock("firebase-token", "0000", new AbortController().signal),
    (error) => error instanceof MpinError && error.code === "locked" && error.retryAt === 123456);
  reply = new APIError("MPIN email delivery is not configured", 503);
  await assert.rejects(mpinApi.requestRecovery("firebase-token", new AbortController().signal),
    (error) => error instanceof MpinError && error.code === "email-delivery-unavailable");
});

test("confirmed setup explicitly unlocks and refreshes status using the same session", async () => {
  calls.length = 0;
  const status = { configured: true, requiresUnlock: false };
  reply = (endpoint) => ({ success: true, data: endpoint === "/mpin/status" ? status : { success: true } });
  const signal = new AbortController().signal;
  assert.deepEqual(await setupAndUnlockMpin("token", "1234", signal), status);
  assert.deepEqual(calls.map((call) => call.endpoint), ["/mpin/setup", "/mpin/unlock", "/mpin/status"]);
  assert.ok(calls.every((call) => call.options.token === "token" && call.options.signal === signal));
});

test("failed or ambiguous setup never continues to unlock", async () => {
  for (const response of [{ success: true, data: { success: false } }, new APIError("Service unavailable", 503)]) {
    calls.length = 0;
    reply = response;
    await assert.rejects(setupAndUnlockMpin("token", "1234", new AbortController().signal));
    assert.deepEqual(calls.map((call) => call.endpoint), ["/mpin/setup"]);
  }
});

test("a failed unlock after saving does not report a completed setup", async () => {
  calls.length = 0;
  reply = (endpoint) => {
    if (endpoint === "/mpin/unlock") throw new APIError("Service unavailable", 503);
    return { success: true, data: { success: true } };
  };
  await assert.rejects(setupAndUnlockMpin("token", "1234", new AbortController().signal));
  assert.deepEqual(calls.map((call) => call.endpoint), ["/mpin/setup", "/mpin/unlock"]);
});

test("the fifth incorrect PIN refreshes the server lockout immediately", async () => {
  calls.length = 0;
  const status = { configured: true, requiresUnlock: true, locked: true, remainingAttempts: 0, lockedUntil: Date.now() + 900000 };
  reply = (endpoint) => {
    if (endpoint === "/mpin/unlock") throw new APIError("Incorrect MPIN", 401);
    return { success: true, data: status };
  };
  await assert.rejects(mpinApi.unlock("token", "0000", new AbortController().signal),
    (error) => error.code === "incorrect-pin" && error.remoteStatus.locked === true && error.remoteStatus.remainingAttempts === 0);
  assert.deepEqual(calls.map((call) => call.endpoint), ["/mpin/unlock", "/mpin/status"]);
});
