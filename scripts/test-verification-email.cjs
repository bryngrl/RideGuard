const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadVerificationEmail({ signInError, sendError, verified = false } = {}) {
  const calls = [];
  const user = { emailVerified: verified };
  const source = readFileSync(path.join(__dirname, "../src/modules/auth/services/verification-email.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = {
    exports: {},
    require(name) {
      if (name === "@/lib/firebase") return { auth: {} };
      assert.equal(name, "firebase/auth");
      return {
        async signInWithEmailAndPassword(_auth, email) {
          calls.push(`sign-in:${email}`);
          if (signInError) throw signInError;
          return { user };
        },
        async sendEmailVerification() {
          calls.push("send");
          if (sendError) throw sendError;
        },
        async signOut() { calls.push("sign-out"); },
      };
    },
  };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, calls };
}

test("sends a link only after Firebase sign-in and clears the session", async () => {
  const { api, calls } = loadVerificationEmail();
  assert.equal(await api.sendRegistrationVerification("jane@gmail.com", "Password1"), "sent");
  assert.deepEqual(calls, ["sign-in:jane@gmail.com", "send", "sign-out"]);
});

test("sign-in failure does not attempt send or sign out another session", async () => {
  const { api, calls } = loadVerificationEmail({ signInError: { code: "auth/invalid-credential" } });
  await assert.rejects(api.sendRegistrationVerification("jane@gmail.com", "bad"), (error) =>
    error.stage === "sign-in" && error.code === "auth/invalid-credential");
  assert.deepEqual(calls, ["sign-in:jane@gmail.com"]);
});

test("send failure still signs out and preserves the Firebase error code", async () => {
  const { api, calls } = loadVerificationEmail({ sendError: { code: "auth/too-many-requests" } });
  await assert.rejects(api.sendRegistrationVerification("jane@gmail.com", "Password1"), (error) =>
    error.stage === "send" && error.code === "auth/too-many-requests");
  assert.deepEqual(calls, ["sign-in:jane@gmail.com", "send", "sign-out"]);
});

test("already verified users do not receive another email", async () => {
  const { api, calls } = loadVerificationEmail({ verified: true });
  assert.equal(await api.sendRegistrationVerification("jane@gmail.com", "Password1"), "already-verified");
  assert.deepEqual(calls, ["sign-in:jane@gmail.com", "sign-out"]);
});
