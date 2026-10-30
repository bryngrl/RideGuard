const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules, globals = {}) {
  const context = { exports: {}, ...globals, require(name) { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
class APIError extends Error { constructor(status, message = "private details", data) { super(message); this.status = status; this.data = data; } }
const envelope = (data) => ({ success: true, data });

test("email verification uses the new public code endpoints and normalizes only the email", async () => {
  const calls = [];
  const api = load("src/modules/auth/services/email-verification.api.ts", {
    "@/shared/api/errors": { APIError },
    "@/shared/api": { apiClient: { post: async (...args) => { calls.push(args); return envelope({ uid: "a", email: "driver@gmail.com" }); } } },
  });
  assert.equal((await api.verifyEmailCode(" DRIVER@gmail.com ", "012345")).uid, "a");
  await api.resendEmailVerificationCode(" DRIVER@gmail.com ");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["/auth/verification/verify", { email: "driver@gmail.com", code: "012345" }],
    ["/auth/verification/resend", { email: "driver@gmail.com" }],
  ]);
  for (const code of ["12345", "1234567", "abcdef", " 12345"]) await assert.rejects(api.verifyEmailCode("driver@gmail.com", code));
  assert.equal(calls.length, 2);
});

test("malformed or other-account verification responses cannot confirm the account", async () => {
  for (const reply of [null, {}, envelope({}), envelope({ uid: "a", email: "other@gmail.com" }), { success: false, data: { uid: "a", email: "driver@gmail.com" } }]) {
    const api = load("src/modules/auth/services/email-verification.api.ts", {
      "@/shared/api/errors": { APIError }, "@/shared/api": { apiClient: { post: async () => reply } },
    });
    await assert.rejects(api.verifyEmailCode("driver@gmail.com", "012345"));
  }
});

test("code failures distinguish expiry, attempts, already-verified and unavailable deployments", () => {
  const api = load("src/modules/auth/services/email-verification.api.ts", { "@/shared/api/errors": { APIError }, "@/shared/api": {} });
  assert.match(api.emailVerificationError(new APIError(400, "Code expired")), /expired/);
  assert.match(api.emailVerificationError(new APIError(429)), /Wait a minute/);
  assert.match(api.emailVerificationError(new APIError(409)), /already verified/);
  assert.match(api.emailVerificationError(new APIError(404)), /unavailable/);
});

test("password change uses the authenticated contract and requires both success flags", async () => {
  const calls = []; let reply = envelope({ success: true });
  const api = load("src/modules/settings/services/account-security.api.ts", {
    "@/shared/api/errors": { APIError }, "@/modules/auth/utils/password-validation": { getPasswordError: (value) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value) ? undefined : "weak" },
    "@/shared/api": { apiClient: { request: async (...args) => { calls.push(args); return reply; } } },
  });
  await api.changeAccountPassword("firebase-token", "Password1", " Password2 ");
  assert.equal(calls[0][0], "/auth/change-password"); assert.equal(calls[0][1].token, "firebase-token");
  assert.deepEqual(JSON.parse(calls[0][1].body), { currentPassword: "Password1", newPassword: " Password2 " });
  for (const invalid of [null, {}, envelope({}), { success: false, data: { success: true } }, envelope({ success: false })]) {
    reply = invalid; await assert.rejects(api.changeAccountPassword("token", "Password1", "Password2"));
  }
  const count = calls.length;
  for (const [current, next] of [["", "Password2"], ["Password1", "Password1"], ["Password1", "weak"]]) await assert.rejects(api.changeAccountPassword("token", current, next));
  assert.equal(calls.length, count);
  assert.match(api.accountSecurityError(new APIError(401, "Invalid password.")), /current password is incorrect/);
  assert.match(api.accountSecurityError(new APIError(401, "Invalid token")), /session expired/);
  assert.match(api.accountSecurityError(new APIError(408)), /couldn't confirm/);
});

test("a verified code still requires matching Firebase and backend identities before onboarding", async () => {
  for (const uid of ["driver", "other"]) {
    const calls = [];
    const user = { uid, emailVerified: true, getIdToken: async (force) => { calls.push(force); return "token"; } };
    const api = load("src/modules/auth/services/complete-email-verification.ts", {
      "firebase/auth": { signInWithEmailAndPassword: async () => ({ user }) }, "@/lib/firebase": { auth: { currentUser: user } },
      "./auth.api": { getCurrentUser: async () => ({ uid, emailVerified: true }), ensureEmailPasswordProfile: async () => false },
      "./firebase-user-refresh": { refreshFirebaseUser: async () => {} },
      "./registration-progress": { postAuthDestination: async () => { calls.push("route"); return "/(onboarding)/register/profile"; } },
    });
    const result = api.completeEmailVerification({ uid: "driver", email: "driver@gmail.com" }, "Password1");
    if (uid === "driver") { assert.equal((await result).hasProfile, false); assert.deepEqual(calls, [true, "route"]); }
    else { await assert.rejects(result); assert.equal(calls.length, 0); }
  }
});

test("registration persistence excludes passwords, verification codes and authentication grants", () => {
  let options;
  load("src/modules/auth/store/registration-draft.store.ts", {
    zustand: { create: () => () => ({}) },
    "@react-native-async-storage/async-storage": {},
    "zustand/middleware": { createJSONStorage: () => ({}), persist: (creator, value) => { options = value; return creator; } },
  });
  const saved = options.partialize({ username: "driver", email: "driver@gmail.com", created: null, resendAt: 10, deliveryFailed: false,
    verificationEmail: "driver@gmail.com", password: "private-password", confirmPassword: "private-password", code: "123456", token: "private-token" });
  assert.equal(saved.verificationEmail, "driver@gmail.com");
  assert.equal(/password|123456|private-token/i.test(JSON.stringify(saved)), false);
});

test("credential-change cleanup stops local capture and signs out without waiting for unavailable services", async () => {
  const calls = [], user = { uid: "driver" }, auth = { currentUser: user };
  const api = load("src/modules/auth/services/credential-change-session.ts", {
    "firebase/auth": { signOut: async () => { calls.push("sign-out"); auth.currentUser = null; } }, "@/lib/firebase": { auth },
    "../store/auth.store": { useAuthStore: { getState: () => ({ user, clearAuth: () => calls.push("clear-auth") }) } },
    "../hooks/use-google-signin": { signOutGoogle: async () => {} },
    "./logout-session": { revokeLogoutSession: () => new Promise(() => {}) },
    "@/modules/phone-camera": { stopPhoneCapture: () => { calls.push("stop-capture"); return new Promise(() => {}); } },
    "@/modules/notifications": { getInstallationId: async () => "installation", unregisterPushNotification: async () => {} },
    "@/modules/alerts/store/alerts.store": { useAlertsStore: { getState: () => ({ clearAlerts: () => calls.push("clear-alerts") }) } },
    "@/modules/settings/store/settings.store": { useSettingsStore: { getState: () => ({ resetAutoArchive: () => calls.push("reset-settings") }) } },
  });
  assert.equal(await api.endCredentialChangeSession("other", "token"), false); assert.equal(calls.length, 0);
  assert.equal(await api.endCredentialChangeSession("driver", "token"), true);
  assert.equal(calls[0], "stop-capture"); assert.ok(calls.includes("clear-auth")); assert.ok(calls.includes("clear-alerts"));
});

function codeScreen({ password = "Password1", verify, finish } = {}) {
  let slot = 0, effectSlot = 0, focused = false, cleanup;
  const slots = [], effects = [], routes = [];
  const identity = { uid: "driver", email: "driver@gmail.com" };
  const user = { ...identity, emailVerified: true };
  let verifies = 0, finishes = 0;
  const store = { email: identity.email, password, resendAt: 0, update(data) { Object.assign(store, data); }, clear() { store.password = ""; } };
  const Screen = load("src/modules/auth/screens/email-code-screen.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    react: { useRef: (value) => { const index = slot++; return slots[index] ??= { current: value }; },
      useState: (initial) => { const index = slot++; if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }]; },
      useCallback: (work) => work,
      useEffect: (work, deps) => { const index = effectSlot++; if (!effects[index] || deps.some((value, i) => value !== effects[index][i])) { effects[index] = deps; work(); } },
    },
    "expo-router": { useRouter: () => ({ replace: (href) => routes.push(href), canDismiss: () => true, dismissAll() {}, dismissTo() {} }),
      useLocalSearchParams: () => ({ email: identity.email }), useFocusEffect: (work) => { if (!focused) { focused = true; cleanup = work(); } } },
    "react-native": { Text: "Text", View: "View", Keyboard: { dismiss() {} }, BackHandler: { addEventListener: () => ({ remove() {} }) } },
    "@/lib/firebase": { auth: { currentUser: user } }, "@/shared/hooks/use-theme": { useTheme: () => ({}) },
    "@/shared/theme": { Spacing: {}, Typography: {} }, "@/shared/api/errors": { APIError },
    "@/shared/ui/auth-form-layout": { AuthFormLayout: "Layout" }, "@/shared/ui/button": { Button: "Button" },
    "@/shared/ui/form-feedback": { FormFeedback: "Feedback" }, "@/shared/ui/text-input": { CustomTextInput: "Input" },
    "@/shared/ui/verification-code-input": { VerificationCodeInput: "Code" },
    "../store/auth.store": { useAuthStore: { getState: () => ({ setUser() {}, setIsOldUser() {} }) } },
    "../store/registration-draft.store": { useRegistrationDraft: Object.assign((selector) => selector(store), { getState: () => store }) },
    "../services/email-verification.api": { verifyEmailCode: async (...args) => { verifies++; return verify ? verify(...args) : identity; },
      resendEmailVerificationCode: async () => {}, emailVerificationError: () => "Verification failed" },
    "../services/complete-email-verification": { completeEmailVerification: async (...args) => { finishes++; if (finish) await finish(...args); return { user, hasProfile: false, destination: "/(onboarding)/register/profile" }; } },
    "../services/verified-success": { beginVerifiedSuccess() {} }, "../utils/auth-errors": { authErrorMessage: () => "Connection lost. Try again." },
  }, { setInterval: () => 1, clearInterval() {} }).default;
  return { render: () => { slot = 0; effectSlot = 0; return Screen(); }, blur: () => cleanup(), routes,
    verifies: () => verifies, finishes: () => finishes };
}
function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
  return null;
}
const button = (tree, title) => find(tree, (node) => node.type === "Button" && node.props.title === title);
function enterCode(app) { find(app.render(), (node) => node.type === "Code").props.onChange("012345"); }

test("a failed session initialization retries without resubmitting the consumed verification code", async () => {
  let offline = true;
  const app = codeScreen({ finish: async () => { if (offline) throw new TypeError("offline"); } });
  enterCode(app); await button(app.render(), "Verify email").props.onPress();
  assert.equal(app.verifies(), 1); assert.equal(app.finishes(), 1); assert.equal(app.routes.length, 0);
  offline = false;
  const retry = button(app.render(), "Continue").props.onPress;
  await retry(); await retry();
  assert.equal(app.verifies(), 1); assert.equal(app.finishes(), 2);
  assert.deepEqual(app.routes, ["/(public)/account-verified"]);
});

test("verification after an app restart shows success without exposing a password field or granting a session", async () => {
  const app = codeScreen({ password: "" }); enterCode(app);
  await button(app.render(), "Verify email").props.onPress(); assert.equal(app.finishes(), 0);
  const input = find(app.render(), (node) => node.type === "Input" && node.props.label === "Password");
  assert.equal(input, null);
  assert.deepEqual(app.routes, ["/(public)/account-verified"]);
  assert.equal(app.verifies(), 1); assert.equal(app.finishes(), 0);
});

test("accepted registration codes never flash a password while sign-in finishes", async () => {
  let finish;
  const app = codeScreen({ finish: () => new Promise((resolve) => { finish = resolve; }) });
  enterCode(app);
  const pending = button(app.render(), "Verify email").props.onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(app.verifies(), 1); assert.equal(app.finishes(), 1);
  assert.equal(find(app.render(), (node) => node.type === "Input"), null);
  assert.equal(app.routes.length, 0);
  finish(); await pending;
  assert.deepEqual(app.routes, ["/(public)/account-verified"]);
});

test("double tapping code verification sends one request and leaving rejects late navigation", async () => {
  let resolve;
  const app = codeScreen({ verify: () => new Promise((done) => { resolve = done; }) }); enterCode(app);
  const press = button(app.render(), "Verify email").props.onPress;
  const pending = press(); await press(); assert.equal(app.verifies(), 1);
  app.blur(); resolve({ uid: "driver", email: "driver@gmail.com" }); await pending;
  assert.equal(app.finishes(), 0); assert.equal(app.routes.length, 0);
});

function passwordScreen(request, provider = "password", getToken = async () => "token") {
  const slots = [], routes = [], events = []; let slot = 0;
  const auth = { currentUser: { uid: "driver", providerData: [{ providerId: provider }], getIdToken: getToken } };
  let calls = 0;
  const validation = load("src/modules/auth/utils/password-validation.ts", {});
  const Screen = load("src/modules/settings/screens/change-password-screen.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    react: { useCallback: (work) => work, useRef: (value) => { const index = slot++; return slots[index] ??= { current: value }; },
      useState: (initial) => { const index = slot++; if (!(index in slots)) slots[index] = initial;
        return [slots[index], (value) => { slots[index] = value; }]; } },
    "expo-router": { Stack: { Screen: "Options" }, useFocusEffect: (work) => { if (!events.includes("focus")) { events.push("focus"); work(); } },
      useRouter: () => ({ replace: (href) => routes.push(href), canGoBack: () => false }) },
    "react-native": { View: "View", Text: "Text", Keyboard: { dismiss() {} }, BackHandler: { addEventListener: () => ({ remove() {} }) } },
    "@/lib/firebase": { auth }, "../components/settings-page-layout": { SettingsPageLayout: "Page" },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/theme": { Spacing: {}, Typography: {} },
    "@/shared/ui/button": { Button: "Button" }, "@/shared/ui/text-input": { CustomTextInput: "Input" }, "@/shared/ui/form-feedback": { FormFeedback: "Feedback" },
    "@/modules/auth/utils/password-validation": validation,
    "@/modules/auth/services/credential-change-session": { endCredentialChangeSession: async () => { events.push("logout"); return true; } },
    "@/modules/auth/store/password-change-result.store": { usePasswordChangeResult: { getState: () => ({ confirm: () => events.push("confirmed") }) } },
    "../services/account-security.api": { changeAccountPassword: async (...args) => { calls++; return request(...args); }, accountSecurityError: () => "Change failed" },
  }).default;
  return { auth, routes, events, calls: () => calls, render: () => { slot = 0; return Screen(); } };
}
function passwords(app, confirmation = "Password2") {
  for (const [label, value] of [["Current password", "Password1"], ["New password", "Password2"], ["Confirm new password", confirmation]]) {
    find(app.render(), (node) => node.type === "Input" && node.props.label === label).props.onChangeText(value);
  }
}
test("Settings password changes prevent mismatch and double submission, then require a new login", async () => {
  let resolve;
  const app = passwordScreen(() => new Promise((done) => { resolve = done; }));
  passwords(app, "Different2"); await button(app.render(), "Change password").props.onPress(); assert.equal(app.calls(), 0);
  passwords(app); const press = button(app.render(), "Change password").props.onPress;
  const result = press(); await press(); await new Promise(setImmediate);
  assert.equal(app.calls(), 1); assert.equal(app.routes.length, 0);
  resolve(); await result;
  assert.deepEqual(app.routes, ["/(public)/password-changed"]); assert.ok(app.events.includes("logout"));
});
test("failed password changes and late responses for another account cannot create a success ticket", async () => {
  const failed = passwordScreen(async () => { throw new APIError(401, "Invalid password."); });
  passwords(failed); await button(failed.render(), "Change password").props.onPress();
  assert.equal(failed.routes.length, 0); assert.equal(failed.events.includes("confirmed"), false);
  let resolve;
  const changed = passwordScreen(() => new Promise((done) => { resolve = done; })); passwords(changed);
  const result = button(changed.render(), "Change password").props.onPress(); await new Promise(setImmediate);
  changed.auth.currentUser = { uid: "other", providerData: [{ providerId: "password" }] };
  resolve(); await result; assert.equal(changed.routes.length, 0); assert.equal(changed.events.includes("confirmed"), false);
});
test("Google-only accounts see their provider guidance instead of an unsupported password-change form", () => {
  const app = passwordScreen(async () => assert.fail("Unsupported mutation"), "google.com");
  assert.equal(button(app.render(), "Change password"), null);
  assert.ok(find(app.render(), (node) => node.props?.message?.includes("signs in with Google")));
});

test("changing accounts during token retrieval prevents the password mutation itself", async () => {
  let resolve;
  const app = passwordScreen(async () => assert.fail("Stale password mutation"), "password", () => new Promise((done) => { resolve = done; }));
  passwords(app); const pending = button(app.render(), "Change password").props.onPress();
  app.auth.currentUser = { uid: "other", providerData: [{ providerId: "password" }] };
  resolve("token"); await pending; assert.equal(app.calls(), 0); assert.equal(app.routes.length, 0);
});
