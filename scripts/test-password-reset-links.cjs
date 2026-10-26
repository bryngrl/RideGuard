const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function harness(verify) {
  const source = readFileSync(path.join(__dirname, "../src/modules/auth/services/password-reset-link.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const state = { requestedEmail: "rider@gmail.com", session: null, clearVerifiedSession() { this.session = null; }, setVerifiedSession(email, session) {
    this.session = { email, ...session }; return true;
  } };
  const context = { exports: {}, URL, require(name) {
    if (name === "./password-recovery") return { verifyPasswordResetLink: verify };
    if (name === "../store/password-recovery.store") return { usePasswordRecoveryStore: { getState: () => state } };
    throw new Error(`Unexpected import: ${name}`);
  } };
  vm.runInNewContext(compiled, context);
  return { route: context.exports.routePasswordResetLink, state };
}

test("verified reset links open New Password without credentials in the route", async () => {
  const h = harness(async (code, expectedEmail) => {
    assert.equal(code, "private-action-code");
    assert.equal(expectedEmail, "rider@gmail.com");
    return { email: expectedEmail, session: { resetToken: code, provider: "firebase" } };
  });
  const route = await h.route("rideguard://auth-action?mode=resetPassword&oobCode=private-action-code&continueUrl=https://untrusted.test");
  assert.equal(route, "/new-password");
  assert.equal(h.state.session.email, "rider@gmail.com");
  assert.equal(route.includes("private-action-code"), false);
});

test("invalid and expired links cannot authorize password fields", async () => {
  const h = harness(async () => { throw { code: "expired-session" }; });
  assert.equal(await h.route("rideguard://auth-action?mode=resetPassword&oobCode=expired"), "/forgot-password?linkError=invalid");
  assert.equal(h.state.session, null);
});

test("network failures stay recoverable and never expose an action code", async () => {
  const h = harness(async () => { throw { code: "network" }; });
  assert.equal(await h.route("rideguard://auth-action?mode=resetPassword&oobCode=secret"), "/forgot-password?linkError=network");
  assert.equal(h.state.session, null);
});

test("missing and duplicate codes are rejected before calling Firebase", async () => {
  const h = harness(() => assert.fail("must not verify ambiguous codes"));
  for (const suffix of ["", "&oobCode=", "&oobCode=one&oobCode=two"]) {
    assert.equal(await h.route(`rideguard://auth-action?mode=resetPassword${suffix}`), "/forgot-password?linkError=invalid");
  }
});

test("a changed email request cannot be overwritten by an old verification response", async () => {
  let resolve;
  const h = harness(() => new Promise((finish) => { resolve = finish; }));
  const operation = h.route("rideguard://auth-action?mode=resetPassword&oobCode=secret");
  h.state.requestedEmail = "another@gmail.com";
  resolve({ email: "rider@gmail.com", session: { resetToken: "secret", provider: "firebase" } });
  assert.equal(await operation, "/forgot-password");
  assert.equal(h.state.session, null);
});

test("ordinary app links retain their existing destination", async () => {
  const h = harness(() => assert.fail("must not verify unrelated links"));
  assert.equal(await h.route("/alerts/123"), "/alerts/123");
});
