const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(
  path.join(__dirname, "../src/modules/camera-sensor/utils/mjpeg-document.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleContext = { exports: {} };
vm.runInNewContext(compiled, moduleContext);
const { createMjpegDocument } = moduleContext.exports;

function openDocument({ url = "http://camera.test/live.mjpeg", web = false } = {}) {
  const messages = [];
  const image = {
    naturalWidth: 0,
    naturalHeight: 0,
    removeAttribute(name) { delete this[name]; },
  };
  let now = 0;
  let tick;
  let pagehide;
  let cleared = false;
  const window = {
    addEventListener(event, callback) {
      if (event === "pagehide") pagehide = callback;
    },
    parent: { postMessage: (message) => messages.push(message) },
    ...(!web && {
      ReactNativeWebView: { postMessage: (message) => messages.push(message) },
    }),
  };
  const html = createMjpegDocument(url);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, {
    window,
    document: { getElementById: () => image },
    Date: { now: () => now },
    setInterval(callback) { tick = callback; return 1; },
    clearInterval() { cleared = true; },
  });
  return {
    image, messages, html,
    tick: () => tick(),
    advance: (ms) => { now += ms; tick(); },
    close: () => pagehide(),
    isCleared: () => cleared,
  };
}

test("detects a decoded frame without a load event or completed response", () => {
  const page = openDocument();
  assert.deepEqual(page.messages, []);
  page.image.naturalWidth = 640;
  page.image.naturalHeight = 480;
  page.tick();
  page.tick();
  assert.deepEqual(page.messages, ["mjpeg:playing"]);
  assert.equal(page.isCleared(), true);
  assert.equal(page.image.src, "http://camera.test/live.mjpeg");
});

test("reports a timeout when the connection delivers no decodable frame", () => {
  const page = openDocument();
  page.advance(15001);
  page.advance(15001);
  assert.deepEqual(page.messages, ["mjpeg:error"]);
});

test("an image error wins over later load callbacks", () => {
  const page = openDocument();
  page.image.onerror();
  page.image.naturalWidth = 640;
  page.image.naturalHeight = 480;
  page.image.onload();
  assert.deepEqual(page.messages, ["mjpeg:error"]);
});

test("reports errors after playback starts", () => {
  const page = openDocument();
  page.image.naturalWidth = 640;
  page.image.naturalHeight = 480;
  page.tick();
  page.image.onerror();
  assert.deepEqual(page.messages, ["mjpeg:playing", "mjpeg:error"]);
});

test("closing the page releases its image source and timer", () => {
  const page = openDocument();
  page.close();
  assert.equal(page.image.src, undefined);
  assert.equal(page.image.onerror, null);
  assert.equal(page.image.onload, null);
  assert.equal(page.isCleared(), true);
});

test("a URL cannot terminate the inline script", () => {
  const url = 'http://camera.test/</script><script>throw "injected"</script>';
  const page = openDocument({ url });
  assert.equal(page.image.src, url);
  assert.equal((page.html.match(/<script>/g) || []).length, 1);
});

test("the browser preview reports status to its parent", () => {
  const page = openDocument({ web: true });
  page.image.naturalWidth = 640;
  page.image.naturalHeight = 480;
  page.tick();
  assert.deepEqual(page.messages, ["mjpeg:playing"]);
});
