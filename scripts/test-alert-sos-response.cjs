const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules = {}, globals = {}) {
  const context = { exports: {}, ...globals, require(name) { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context); return context.exports;
}
const types = load("src/modules/sos/types.ts");
const record = { sosId: "sos-one", requestId: "request-one", alertId: "alert one", status: "active", createdAt: "2026-10-30T12:00:00Z", endedAt: null,
  recipients: [{ contactId: "one", name: "Contact", phone: "***", initial: { status: "accepted", updatedAt: "2026-10-30T12:00:00Z" }, ended: null }] };
test("alert response lookup is one authenticated GET and accepts only an explicit null or matching alert record", async () => {
  const calls = []; let data = record;
  const api = load("src/modules/alerts/services/alert-sos.api.ts", { "@/modules/sos/types": types,
    "@/shared/api": { apiClient: { request: async (...args) => { calls.push(args); return { success: true, data }; } } } });
  assert.equal((await api.getAlertSos("token", "alert one")).sosId, "sos-one");
  assert.equal(calls[0][0], "/alerts/alert%20one/sos"); assert.equal(calls[0][1].method, "GET"); assert.equal(calls[0][1].token, "token");
  data = null; assert.equal(await api.getAlertSos("token", "alert one"), null);
  for (const invalid of [{}, [], { ...record, alertId: "other" }, { ...record, recipients: [{ initial: { status: "invented" } }] }]) {
    data = invalid; await assert.rejects(api.getAlertSos("token", "alert one"));
  }
});
function screen(request, token = async () => "token") {
  let slot = 0, mounted = false, cleanup;
  const slots = [], timers = new Map(); let timerId = 0, calls = 0;
  const user = { uid: "owner", getIdToken: token }, auth = { currentUser: user };
  const Screen = load("src/modules/alerts/components/alert-sos-response.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    react: { useCallback: (work) => work, useState: (initial) => { const index = slot++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }]; } },
    "expo-router": { useFocusEffect: (work) => { if (!mounted) { mounted = true; cleanup = work(); } } },
    "react-native": { ActivityIndicator: "Spinner", Text: "Text", View: "View" }, "@/lib/firebase": { auth },
    "@/modules/auth/store/auth.store": { useAuthStore: (selector) => selector({ user }) }, "@/modules/sos/types": types,
    "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/theme": { Typography: {}, Spacing: {} }, "@/shared/ui/button": { Button: "Button" },
    "../services/alert-sos.api": { getAlertSos: (...args) => { calls++; return request(...args); } },
  }, { AbortController, setTimeout: (work) => { timers.set(++timerId, work); return timerId; }, clearTimeout: (id) => timers.delete(id) }).AlertSosResponse;
  return { auth, calls: () => calls, render: () => { slot = 0; return Screen({ alertId: "alert one" }); }, blur: () => cleanup(),
    timeout: () => { for (const work of timers.values()) work(); } };
}
function contents(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  return [node.props?.children].flat(Infinity).map(contents).join(" ");
}
const settle = () => new Promise(setImmediate);
test("alert message status distinguishes a submitted message from delivery and an unlinked alert", async () => {
  const submitted = screen(async () => record); submitted.render(); await settle();
  const text = contents(submitted.render()); assert.match(text, /Submitted/); assert.doesNotMatch(text, /Delivered/);
  const missing = screen(async () => null); missing.render(); await settle(); assert.match(contents(missing.render()), /No SOS is linked/);
  const failed = screen(async () => { throw Error("404 or outage"); }); failed.render(); await settle();
  assert.match(contents(failed.render()), /unavailable/); assert.doesNotMatch(contents(failed.render()), /No SOS is linked/);
});
test("leaving before token retrieval issues no stale alert request, and a stalled read displays a timeout", async () => {
  let resolve;
  const left = screen(async () => assert.fail("Stale request"), () => new Promise((done) => { resolve = done; }));
  left.render(); left.blur(); resolve("token"); await settle(); assert.equal(left.calls(), 0);
  const stalled = screen(() => new Promise(() => {})); stalled.render(); await settle(); stalled.timeout();
  assert.match(contents(stalled.render()), /Couldn't confirm response status/);
});
