const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const calls = [];
let response = { success: true, data: {} };
const apiClient = {
  get: async (...args) => {
    calls.push(args);
    return response;
  },
  patch: async (...args) => {
    calls.push(args);
    return response;
  },
};
const source = fs.readFileSync(path.join(__dirname, "../src/modules/settings/services/settings.api.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function("require", "module", "exports", compiled)((name) => {
  if (name === "@/shared/api") return { apiClient };
  if (name === "@/shared/lib/phone-utils") return { toE164: (phone) => `+63${phone}` };
  throw new Error(`Unexpected import: ${name}`);
}, moduleUnderTest, moduleUnderTest.exports);
const { updateAccountDetails, getAutoArchive, hasSavedAutoArchive, updateAutoArchive } = moduleUnderTest.exports;

test("one changed field sends one authenticated PATCH", async () => {
  calls.length = 0;
  await updateAccountDetails({ firstName: "Alex" }, "firebase-token");
  assert.deepEqual(calls, [["/profile/me", { first_name: "Alex" }, "firebase-token"]]);
});

test("mixed changes use backend keys and international phone format", async () => {
  calls.length = 0;
  await updateAccountDetails({ phone: "9123456789", plateNumber: "ABC-1234" }, "firebase-token");
  assert.deepEqual(calls[0][1], { phone_number: "+639123456789", plate_number: "ABC-1234" });
});

test("a failed envelope does not report a saved account", async () => {
  response = { success: false, message: "Save failed" };
  await assert.rejects(updateAccountDetails({ lastName: "Driver" }, "firebase-token"), /Save failed/);
});

test("archive settings distinguish an unset profile field from explicit Never", async () => {
  response = { success: true, data: {} };
  assert.equal(await hasSavedAutoArchive("firebase-token"), false);
  response = { success: true, data: { autoArchiveHours: null } };
  assert.equal(await hasSavedAutoArchive("firebase-token"), true);
  assert.deepEqual(calls.at(-1), ["/profile/me", "firebase-token"]);
});

test("archive default uses the existing authenticated endpoint and validates confirmation", async () => {
  response = { success: true, data: { autoArchiveHours: 24 } };
  assert.equal(await updateAutoArchive(24, "firebase-token"), 24);
  assert.deepEqual(calls.at(-1), ["/settings/auto-archive", { autoArchiveHours: 24 }, "firebase-token"]);
  response = { success: false, data: { autoArchiveHours: 24 } };
  await assert.rejects(updateAutoArchive(24, "firebase-token"));
  response = { success: true, data: {} };
  await assert.rejects(getAutoArchive("firebase-token"));
  response = { success: true, data: { autoArchiveHours: 168 } };
  await assert.rejects(getAutoArchive("firebase-token"));
});
