const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, modules = {}) {
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return context.exports;
}
const parser = load("src/modules/button/utils/button-events.ts");
const device = "BUT-297-TXI";
const message = (press_type = "START_CAPTURE", extra = {}) => ({ name: "button.pressed", id: "message-1",
  data: { device_id: device, event_id: "event-1", press_type, ...extra } });

test("backend actions map to physical white/red presses and malformed or other-device events are ignored", () => {
  for (const [action, button, type] of [["START_CAPTURE", "white", "pulse"], ["STOP_CAPTURE", "white", "pulse"],
    ["FALSE_ALARM", "red", "pulse"], ["CANCEL_SOS", "red", "pulse"], ["SOS", "red", "long-press"]]) {
    const result = parser.parseButtonEvent(message(action), device);
    assert.equal(result.event.button, button); assert.equal(result.event.type, type);
  }
  const valid = message(); valid.data = JSON.stringify(valid.data);
  assert.equal(parser.parseButtonEvent(valid, device).event.button, "white");
  for (const invalid of [message("UNKNOWN"), message("SOS", { device_id: "BUT-123-ABC" }),
    { name: "other", data: message().data }, { data: "{" }, { data: [] }, { data: null }, { data: {} }]) {
    assert.equal(parser.parseButtonEvent(invalid, device), null);
  }
});

test("backend SOS start/release events update the hold visual without inventing a successful SOS action", () => {
  const data = { device_id: device, button: "SOS", press_id: "hold-1", held_ms: 3200 };
  assert.equal(parser.parseButtonEvent({ name: "button.press_started", data }, device).event.type, "hold-start");
  assert.equal(parser.parseButtonEvent({ name: "button.press_released", data }, device).event.type, "hold-end");
  assert.equal(parser.parseButtonEvent({ name: "button.press_released", data: { ...data, held_ms: -1 } }, device), null);
});

function setup({ user = { getIdToken: async () => "test-token" }, id = device } = {}) {
  const clients = [], states = [], events = []; let cleanup, appListener, slot = 0, tokenCalls = 0;
  const app = { currentState: "active", addEventListener: (_name, callback) => {
    appListener = callback; return { remove() { appListener = null; } };
  } };
  class Realtime {
    constructor(options) {
      this.options = options; this.closed = false;
      this.handlers = {};
      this.channel = { on: (name, work) => { this.handlers[name] = work; }, off() {}, unsubscribe() {},
        subscribe: (callback) => { this.receive = callback; return new Promise((_resolve, reject) => { this.reject = reject; }); } };
      this.channels = { get: (name) => { assert.equal(name, parser.BUTTON_EVENTS_CHANNEL); return this.channel; } };
      this.connection = { on: (work) => { this.change = work; }, off() {} };
      clients.push(this);
    }
    close() { this.closed = true; }
  }
  const hook = load("src/modules/button/hooks/use-button-realtime.ts", {
    ably: { Realtime },
    react: { useRef: (current) => ({ current }), useCallback: (work) => work,
      useState: (value) => { const index = slot++; states[index] = value; return [value, next => {
        states[index] = typeof next === "function" ? next(states[index]) : next;
      }]; } },
    "react-native": { AppState: app }, "expo-router": { useFocusEffect: (work) => { cleanup = work(); } },
    "@/modules/auth/services/auth.api": { getAblyToken: async () => { tokenCalls++; return {}; } },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select({ user }) },
    "@/modules/devices": { useDeviceStore: (select) => select({ buttonDeviceId: id }) },
    "../utils/button-events": parser,
  });
  hook.useButtonRealtime(event => events.push(event));
  return { clients, states, events, cleanup: () => cleanup(), tokenCalls: () => tokenCalls,
    state: next => { app.currentState = next; appListener?.(next); } };
}

test("only focused hardware events are received; redelivered events do not count twice", () => {
  const app = setup(); const client = app.clients[0];
  client.handlers.attached(); assert.equal(app.states[0], "ready");
  client.receive(message()); client.receive(message());
  assert.equal(app.events.length, 1);
  client.receive(message("SOS", { device_id: "BUT-123-ABC", event_id: "wrong-device" }));
  assert.equal(app.events.length, 1);
  app.cleanup(); assert.equal(client.closed, true);
  client.receive(message("SOS", { event_id: "late" })); assert.equal(app.events.length, 1);
});

test("backgrounding closes the old client; resume creates a fresh subscription", () => {
  const app = setup(), old = app.clients[0];
  app.state("background"); assert.equal(old.closed, true);
  old.receive(message()); assert.equal(app.events.length, 0);
  app.state("active"); assert.equal(app.clients.length, 2);
  app.clients[1].receive(message()); assert.equal(app.events.length, 1);
  old.handlers.failed(); assert.equal(app.states[0], "connecting");
});

test("subscription errors are retryable, while normal cleanup does not produce a false error", async () => {
  const app = setup(); app.clients[0].reject(new Error("connection failed"));
  await Promise.resolve(); assert.equal(app.states[0], "error");
  const closed = setup(); closed.cleanup(); closed.clients[0].reject(new Error("closed"));
  await Promise.resolve(); assert.equal(closed.states[0], "connecting");
  assert.equal(setup({ id: "" }).states[0], "error");
  assert.equal(setup({ user: null }).clients.length, 0);
});

test("leaving while Firebase token lookup is pending sends no stale backend token request", async () => {
  let resolve;
  const app = setup({ user: { getIdToken: () => new Promise(done => { resolve = done; }) } });
  const pending = app.clients[0].options.authCallback({}, () => assert.fail("late auth callback"));
  app.cleanup(); resolve("test-token"); await pending;
  assert.equal(app.tokenCalls(), 0);
});
