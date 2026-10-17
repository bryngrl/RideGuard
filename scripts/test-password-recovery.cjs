const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Same lightweight TypeScript test harness as test-mjpeg-document.cjs.
function load(relativePath) {
  const compiled = ts.transpileModule(
    readFileSync(path.join(__dirname, "..", relativePath), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const context = { exports: {}, require, Date, Error, TypeError };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

const { getPasswordError, getConfirmPasswordError } = load("src/modules/auth/utils/password-validation.ts");
const { isResetSessionValid, usePasswordRecoveryStore: store } = load("src/modules/auth/store/password-recovery.store.ts");
const recovery = load("src/modules/auth/services/password-recovery.ts");

test("registration and reset password validation covers blank, weak, and valid values", () => {
  assert.equal(getPasswordError(""), "Enter a password.");
  for (const value of ["short1", "abcdefgh", "12345678", "        "]) {
    assert.equal(typeof getPasswordError(value), "string");
  }
  assert.equal(getPasswordError("ValidPass123!"), undefined);
  // Passwords are compared exactly; pasted spaces must not be silently trimmed.
  assert.equal(getPasswordError(" ValidPass123! "), undefined);
});

test("confirmation catches an empty field and mismatches, including whitespace", () => {
  assert.equal(getConfirmPasswordError("ValidPass123!", ""), "Confirm your password.");
  assert.equal(getConfirmPasswordError("ValidPass123!", "ValidPass123! "), "Passwords do not match.");
  assert.equal(getConfirmPasswordError("ValidPass123!", "ValidPass123!"), undefined);
});

test("reset session rejects missing tokens, malformed expiries, and expired credentials", () => {
  const now = Date.now();
  for (const session of [null, {}, { resetToken: "", expiresAt: now + 1000 },
    { resetToken: " ", expiresAt: now + 1000 }, { resetToken: "fixture", expiresAt: NaN },
    { resetToken: "fixture", expiresAt: Infinity }, { resetToken: "fixture", expiresAt: now }]) {
    assert.equal(isResetSessionValid(session, now), false);
  }
  assert.equal(isResetSessionValid({ resetToken: "fixture", expiresAt: now + 1 }, now), true);
});

test("verified state survives back navigation and completion removes the reset token", () => {
  store.getState().clear();
  assert.equal(store.getState().setVerifiedSession("test@example.test", {
    resetToken: "session-fixture", expiresAt: Date.now() + 60000,
  }), true);
  assert.equal(store.getState().session.destination, "test@example.test");
  assert.equal(store.getState().complete("a-different-session"), false);
  assert.equal(store.getState().completed, false);
  assert.equal(store.getState().complete("session-fixture"), true);
  assert.equal(store.getState().session, null);
  assert.equal(store.getState().completed, true);
  store.getState().clear();
  assert.equal(store.getState().completed, false);
});

test("invalid verification clears any previous reset session", () => {
  store.getState().setVerifiedSession("test@example.test", { resetToken: "fixture", expiresAt: Date.now() + 60000 });
  assert.equal(store.getState().setVerifiedSession("test@example.test", { resetToken: "", expiresAt: Date.now() + 60000 }), false);
  assert.equal(store.getState().session, null);
  assert.equal(store.getState().completed, false);
});

test("unconnected services cannot fake OTP delivery, verification, or password reset success", async () => {
  for (const action of [
    () => recovery.requestResetCode("test@example.test"),
    () => recovery.resendResetCode("test@example.test"),
    () => recovery.verifyResetCode("test@example.test", ""),
    () => recovery.changeResetPassword("session-fixture", "ValidPass123!"),
  ]) {
    await assert.rejects(action, (error) => error instanceof recovery.RecoveryError && error.code === "unavailable");
  }
});

test("recovery errors give specific instructions for invalid codes, expiry, and connectivity", () => {
  assert.match(recovery.recoveryMessage(new recovery.RecoveryError("invalid-code", "")), /incorrect/);
  assert.match(recovery.recoveryMessage(new recovery.RecoveryError("expired-code", "")), /expired/);
  assert.match(recovery.recoveryMessage(new recovery.RecoveryError("invalid-session", "")), /Request a new code/);
  assert.match(recovery.recoveryMessage(new recovery.RecoveryError("expired-session", "")), /Request a new code/);
  assert.match(recovery.recoveryMessage(new recovery.RecoveryError("network", "")), /internet/);
  assert.match(recovery.recoveryMessage(new TypeError("Network request failed")), /internet/);
  assert.match(recovery.recoveryMessage(new Error("unexpected")), /try again/);
});
