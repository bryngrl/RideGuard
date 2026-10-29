const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup(type = "short") {
  const values = [], timers = new Map(); let slot = 0, timerId = 0, receive, focus, cleanup, completed = 0;
  const appState = { currentState: "active", listener: null,
    addEventListener: (_event, callback) => { appState.listener = callback; return { remove: () => { appState.listener = null; } }; } };
  const modules = {
    react: {
      useRef: (current) => ({ current }), useCallback: (callback) => callback,
      useState: (initial) => { const index = slot++; values[index] = initial; return [initial, (value) => {
        values[index] = typeof value === "function" ? value(values[index]) : value;
      }]; },
    },
    "expo-router": { useFocusEffect: (callback) => { focus = callback; cleanup = callback(); } },
    "./use-button-realtime": { useButtonRealtime: (callback) => { receive = callback; return { connectionState: "ready", retryConnect() {} }; } },
    "react-native": { AppState: appState },
  };
  const compiled = ts.transpileModule(readFileSync(path.join(__dirname,
    "../src/modules/button/hooks/use-button-test.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id) };
  vm.runInNewContext(compiled, context);
  const hook = context.exports.useButtonTest(type, () => completed++);
  return { values, timers, hook, event: (button, type = "pulse") => receive({ button, type }),
    appState: (state) => { appState.currentState = state; appState.listener?.(state); },
    blur: () => cleanup(), focus: () => { cleanup = focus(); }, completed: () => completed,
    run: (delay) => {
      for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.callback(); }
    } };
}

test("both physical short presses schedule exactly one completion even with repeated events", () => {
  const app = setup(); app.event("white"); app.event("red"); app.event("red");
  assert.equal(app.values[0], "success");
  assert.equal(app.timers.size, 2);
  app.run(700); assert.equal(app.completed(), 1);
});

test("switching apps cancels button completion and ignores background presses", () => {
  const app = setup(); app.event("white"); app.event("red");
  app.appState("background");
  app.run(700); app.event("white"); app.event("red");
  assert.equal(app.timers.size, 0);
  assert.equal(app.completed(), 0);
  app.appState("active");
  assert.equal(app.values[0], "waiting");
  app.event("white"); app.event("red"); app.run(700);
  assert.equal(app.completed(), 1);
});

test("the same button twice cannot complete the two-button test", () => {
  const app = setup(); app.event("red"); app.event("red"); app.run(700);
  assert.equal(app.values[0], "waiting"); assert.equal(app.completed(), 0);
});

test("leaving the test cancels pending navigation, pulses and timeout", () => {
  const app = setup(); app.event("white"); app.event("red"); app.blur();
  assert.equal(app.timers.size, 0);
  app.run(700); assert.equal(app.completed(), 0);
  app.focus(); assert.equal(app.values[0], "waiting");
});

test("late hardware events are ignored while the screen is not focused", () => {
  const app = setup(); app.blur(); app.event("white"); app.event("red");
  assert.equal(app.timers.size, 0); assert.equal(app.values[0], "waiting");
});

test("a timeout blocks late presses until Retry starts a fresh attempt", () => {
  const app = setup(); app.run(180000); app.event("white"); app.event("red");
  assert.equal(app.values[0], "timeout"); assert.equal(app.completed(), 0);
  app.hook.handleRetry(); app.event("white"); app.event("red"); app.run(700);
  assert.equal(app.completed(), 1);
});

test("the long-press test requires the red button, not the white button or a short pulse", () => {
  const app = setup("long"); app.event("white", "long-press"); app.event("red");
  assert.equal(app.values[0], "waiting");
  app.event("red", "long-press"); assert.equal(app.values[0], "success");
  assert.equal(app.timers.size, 0);
});

test("hardware hold events animate the red button but only the SOS action completes the long test", () => {
  const app = setup("long");
  app.event("red", "hold-start"); assert.equal(app.values[2].red, true);
  assert.equal(app.values[0], "waiting");
  app.event("red", "hold-end"); assert.equal(app.values[2].red, false);
  assert.equal(app.values[0], "waiting");
  app.event("red", "long-press"); assert.equal(app.values[0], "success");
});
