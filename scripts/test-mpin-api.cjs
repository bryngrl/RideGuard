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
const { MpinError, mpinApi } = moduleUnderTest.exports;

test("MPIN gate remains off until backend recovery email is available", () => {
  assert.equal(mpinApi.enabled, false);
});

test("status forwards auth, abort signal, and lifecycle context", async () => {
  calls.length = 0;
  reply = { success: true, data: { configured: false, requiresUnlock: false } };
  const signal = new AbortController().signal;
  assert.deepEqual(await mpinApi.status("firebase-token", signal, { reason: "resume", inactiveForMs: 1200 }), reply.data);
  assert.equal(calls[0].endpoint, "/mpin/status?reason=resume&inactiveForMs=1200");
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
