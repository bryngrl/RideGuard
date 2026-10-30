const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules = {}, globals = {}) {
  const context = { exports: {}, ...globals, require(name) { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
test("manual login and the auth listener share one refresh, but later checks still refresh", async () => {
  const { refreshFirebaseUser } = load("src/modules/auth/services/firebase-user-refresh.ts");
  let resolve, calls = 0;
  const user = { reload: () => { calls++; return new Promise((done) => { resolve = done; }); } };
  const first = refreshFirebaseUser(user);
  assert.equal(refreshFirebaseUser(user), first); assert.equal(calls, 1);
  resolve(); await first;
  const later = refreshFirebaseUser(user); assert.equal(calls, 2); resolve(); await later;
});
test("refresh failure can be retried and another Firebase user never shares the refresh", async () => {
  const { refreshFirebaseUser } = load("src/modules/auth/services/firebase-user-refresh.ts");
  let fail = true, calls = 0;
  const user = { reload: async () => { calls++; if (fail) throw Error("offline"); } };
  await assert.rejects(refreshFirebaseUser(user)); fail = false; await refreshFirebaseUser(user);
  assert.equal(calls, 2);
  let other = 0;
  await refreshFirebaseUser({ reload: async () => { other++; } }); assert.equal(other, 1);
});
test("stage timing preserves results and errors without logging credentials or backend payloads", async () => {
  const logs = []; let now = 100;
  class APIError extends Error { constructor() { super("private server details"); this.status = 408; this.endpoint = "/auth/login?private=value"; this.data = { password: "secret" }; } }
  const { traceLoginStage } = load("src/modules/auth/utils/auth-diagnostics.ts", { "@/shared/api/errors": { APIError } }, {
    Date: { now: () => now }, console: { info: (_label, value) => logs.push(value) },
  });
  const result = { email: "private@gmail.com", uid: "private-uid" };
  assert.equal(await traceLoginStage("backend-login", async () => { now = 350; return result; }), result);
  assert.equal(logs[1].elapsedMs, 250); assert.equal(logs[1].outcome, "completed");
  const error = new APIError();
  await assert.rejects(traceLoginStage("backend-login", async () => { now = 25350; throw error; }), (value) => value === error);
  assert.equal(logs.at(-1).endpoint, "/auth/login"); assert.equal(logs.at(-1).status, 408);
  assert.equal(logs.at(-1).elapsedMs, 25000);
  assert.equal(/private|secret|password|gmail/.test(JSON.stringify(logs)), false);
});
