const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function setup(signIn) {
  let loading = false, credentialCalls = 0;
  const user = { uid: "driver", emailVerified: true };
  const modules = {
    react: { useRef: (value) => ({ current: value }), useState: () => [false, (value) => { loading = value; }] },
    "@/lib/firebase": { auth: {} },
    "@react-native-google-signin/google-signin": {
      GoogleSignin: { configure() {}, hasPlayServices: async () => true, signIn },
      isSuccessResponse: (response) => response.type === "success",
      isErrorWithCode: (error) => typeof error?.code === "string", statusCodes: { SIGN_IN_CANCELLED: "CANCELLED" },
    },
    "firebase/auth": { GoogleAuthProvider: { credential: (token) => ({ token }) },
      signInWithCredential: async () => { credentialCalls++; return { user }; }, getAdditionalUserInfo: () => ({ isNewUser: true }) },
  };
  const context = { exports: {}, process: { env: {} }, require(name) { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/modules/auth/hooks/use-google-signin.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return { hook: context.exports.useGoogleSignin(), loading: () => loading, credentials: () => credentialCalls, user };
}
test("Google login displays loading immediately and blocks double submission until the native attempt ends", async () => {
  let resolve, calls = 0;
  const app = setup(() => { calls++; return new Promise((done) => { resolve = done; }); });
  const pending = app.hook.signIn(); assert.equal(app.loading(), true);
  assert.equal(await app.hook.signIn(), null); assert.equal(calls, 1);
  resolve({ type: "success", data: { idToken: "provider-token" } });
  assert.equal(await pending, app.user); assert.equal(app.loading(), false);
  assert.equal(app.credentials(), 1); assert.equal(app.hook.isNewAccount(), true);
});
test("both Google cancellation responses and cancellation errors end loading without authenticating", async () => {
  for (const response of [async () => ({ type: "cancelled" }), async () => { throw { code: "CANCELLED" }; }]) {
    const app = setup(response); assert.equal(await app.hook.signIn(), null);
    assert.equal(app.credentials(), 0); assert.equal(app.loading(), false); assert.equal(app.hook.isNewAccount(), false);
  }
});
test("missing provider tokens and native network failures cannot create a successful Firebase session", async () => {
  for (const response of [async () => ({ type: "success", data: {} }), async () => { throw Error("Network unavailable"); }]) {
    const app = setup(response); await assert.rejects(app.hook.signIn());
    assert.equal(app.credentials(), 0); assert.equal(app.loading(), false); assert.equal(app.hook.isNewAccount(), false);
  }
});
