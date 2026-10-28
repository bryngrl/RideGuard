const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup() {
  const timers = new Map(); let timerId = 0, uid = "first-user";
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/devices/services/device-claim-lifecycle.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const context = { exports: {}, setTimeout: (work) => { timers.set(++timerId, work); return timerId; },
    clearTimeout: (id) => timers.delete(id) };
  vm.runInNewContext(compiled, context);
  const lifecycle = context.exports.createDeviceClaimLifecycle(() => uid);
  lifecycle.activate();
  return { lifecycle, createLifecycle: context.exports.createDeviceClaimLifecycle, timers, owner: (value) => { uid = value; }, flush: () => [...timers.values()].forEach((work) => work()) };
}

test("rapid Connect taps cannot create overlapping claims", () => {
  const { lifecycle } = setup();
  const attempt = lifecycle.begin("first-user");
  assert.ok(attempt);
  assert.equal(lifecycle.begin("first-user"), null);
  lifecycle.finish(attempt);
  const next = lifecycle.begin("first-user");
  assert.ok(next);
  assert.equal(lifecycle.isCurrent(attempt), false);
});

test("the claim hook cancels background responses and navigation, then enables a fresh attempt", () => {
  const base = setup();
  let cleanup, listener, resumes = 0;
  const appState = { currentState: "active", addEventListener: (_event, work) => {
    listener = work; return { remove: () => { listener = null; } };
  } };
  const modules = {
    react: { useRef: (value) => ({ current: value }), useCallback: (work) => work },
    "react-native": { AppState: appState },
    "expo-router": { useFocusEffect: (work) => { cleanup = work(); } },
    "@/lib/firebase": { auth: { currentUser: { uid: "first-user" } } },
    "../services/device-claim-lifecycle": { createDeviceClaimLifecycle: base.createLifecycle },
  };
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/devices/hooks/use-device-claim-lifecycle.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  const hook = context.exports.useDeviceClaimLifecycle(() => resumes++);
  const attempt = hook.begin("first-user");
  hook.schedule(attempt, () => assert.fail("Navigation continued while away"), 1500);
  appState.currentState = "background"; listener("background");
  assert.equal(hook.isCurrent(attempt), false);
  assert.equal(base.timers.size, 0);
  appState.currentState = "active"; listener("active");
  assert.equal(resumes, 1);
  assert.equal(hook.isCurrent(attempt), false);
  assert.ok(hook.begin("first-user"));
  cleanup(); assert.equal(listener, null);
});

test("leaving setup cancels delayed navigation and returning invalidates the old response", () => {
  const { lifecycle, timers, flush } = setup();
  const attempt = lifecycle.begin("first-user");
  lifecycle.schedule(attempt, () => assert.fail("Navigated after leaving"), 1500);
  lifecycle.cancel();
  assert.equal(timers.size, 0);
  lifecycle.activate();
  assert.equal(lifecycle.isCurrent(attempt), false);
  flush();
});

test("logout or changing accounts rejects late success and cannot update device IDs", () => {
  const { lifecycle, owner, flush } = setup();
  const attempt = lifecycle.begin("first-user");
  lifecycle.schedule(attempt, () => assert.fail("Applied old-account result"), 1500);
  owner("second-user");
  assert.equal(lifecycle.isCurrent(attempt), false);
  flush();
  owner(null);
  assert.equal(lifecycle.isCurrent(attempt), false);
});

test("an error can finish and retry, but a stale timer cannot finish the new attempt", () => {
  const { lifecycle, flush } = setup();
  const attempt = lifecycle.begin("first-user");
  lifecycle.schedule(attempt, () => lifecycle.finish(attempt), 2500);
  flush();
  const retry = lifecycle.begin("first-user");
  lifecycle.finish(attempt);
  assert.equal(lifecycle.begin("first-user"), null);
  assert.equal(lifecycle.isCurrent(retry), true);
});
