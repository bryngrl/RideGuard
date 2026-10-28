const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, modules, globals = {}) {
  const context = { exports: {}, Promise, Date, Map, ...globals,
    require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
const record = (url = "https://example.test/old.jpg", id = "one") => ({ id, name: "Ana", phone: "+639123456789", relationship: "Friend", photo_url: url });
const response = (data) => ({ ok: true, json: async () => ({ success: true, data }) });
const deferred = () => { let resolve; const promise = new Promise((work) => { resolve = work; }); return { promise, resolve }; };
function api() {
  let owner = "a", subscription, handler = async () => response([record()]);
  const calls = [];
  const modules = {
    "@/shared/store/loading-counts.store": { useLoadingCountsStore: { getState: () => ({ remember() {} }) } },
    "@/modules/auth/store/auth.store": { useAuthStore: { getState: () => ({ user: owner ? { uid: owner, getIdToken: async () => "fixture" } : null }),
      subscribe: (work) => { subscription = work; } } },
    "@/shared/api/photo-upload": { appendPhoto: async () => {} }, "@/shared/api/client": { API_BASE_URL: "https://api.test/v1" },
  };
  const service = load("src/modules/emergency-contacts/services/contacts.api.ts", modules, {
    FormData: class { append() {} }, fetch: async (url, options) => { calls.push({ url, options }); return handler(url, options); },
  });
  return { service, calls, respond: (work) => { handler = work; }, owner: (value) => { owner = value; subscription(); } };
}

test("contacts reuse a fresh list and immediately expose the confirmed photo save", async () => {
  const app = api();
  await Promise.all([app.service.listContacts(), app.service.listContacts()]);
  assert.equal(app.calls.length, 1);
  app.respond(async () => response(record("https://example.test/new.jpg")));
  await app.service.updateContact("one", { name: "Ana", phone: "+639123456789", relationship: "Friend" });
  assert.equal((await app.service.listContacts())[0].profileImage, "https://example.test/new.jpg");
  assert.equal(app.calls.length, 2, "returning after Save must not block on another GET");
});

test("a GET started before photo Save cannot restore the previous picture", async () => {
  const app = api(); await app.service.listContacts();
  const pending = deferred();
  app.respond(async (_url, options) => options.method === "GET" ? pending.promise : response(record("https://example.test/new.jpg")));
  const refresh = app.service.listContacts({ force: true });
  await app.service.updateContact("one", { name: "Ana", phone: "+639123456789", relationship: "Friend" });
  pending.resolve(response([record()]));
  assert.equal((await refresh)[0].profileImage, "https://example.test/new.jpg");
});

test("a partial save cache never hides other contacts from the first list request", async () => {
  const app = api(); const pending = deferred();
  app.respond(async (_url, options) => options.method === "GET" ? pending.promise : response(record("https://example.test/new.jpg", "two")));
  const initial = app.service.listContacts();
  await app.service.createContact({ name: "Ana", phone: "+639123456789", relationship: "Friend" });
  pending.resolve(response([record()]));
  assert.deepEqual(Array.from(await initial, (contact) => contact.id), ["one", "two"]);
});

test("logout/account switching clears contact photos and rejects late responses", async () => {
  const app = api(); await app.service.listContacts();
  const pending = deferred(); app.respond(() => pending.promise);
  const oldRequest = app.service.listContacts({ force: true });
  await Promise.resolve(); await Promise.resolve();
  app.owner(null); app.owner("b");
  assert.equal(app.service.getCachedContacts().length, 0);
  pending.resolve(response([record()]));
  await assert.rejects(oldRequest, /Account changed/);
  assert.equal(app.service.getCachedContacts().length, 0);
});

test("failed save preserves the previously confirmed photo", async () => {
  const app = api(); await app.service.listContacts();
  app.respond(async () => ({ ok: false, json: async () => ({ success: false, message: "Save failed" }) }));
  await assert.rejects(app.service.updateContact("one", { name: "Ana", phone: "+639123456789", relationship: "Friend" }));
  assert.equal(app.service.getCachedContacts()[0].profileImage, "https://example.test/old.jpg");
});

test("photo loading keeps a placeholder, caches remote images and retains fallback on failure", () => {
  const slots = []; let cursor = 0;
  const { CachedPhoto } = load("src/shared/ui/cached-photo.tsx", {
    react: { useState: (value) => { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], (next) => { slots[i] = next; }]; } },
    "react/jsx-runtime": require("react/jsx-runtime"), "expo-image": { Image: "Image" },
    "@/shared/hooks/use-theme": { useTheme: () => ({ border: "skeleton" }) }, "./skeleton-pulse": { SkeletonPulse: "Skeleton" },
    "react-native": { View: "View", StyleSheet: { absoluteFill: {}, create: (value) => value } },
  }, { console: { info() {} } });
  const outer = CachedPhoto({ uri: "https://example.test/photo.jpg", style: { width: 48, height: 48 }, placeholder: "initial" });
  const render = () => { cursor = 0; return outer.type(outer.props); };
  let tree = render();
  assert.equal(tree.props.children[0].props.children, "initial");
  const image = tree.props.children[2];
  assert.equal(tree.props.children[1].props.active, true);
  assert.equal(image.props.cachePolicy, "memory-disk");
  assert.equal(image.props.style[1].opacity, 0);
  image.props.onLoad(); tree = render();
  assert.equal(tree.props.children[2].props.style[1].opacity, 1);
  assert.equal(tree.props.children[1].props.active, false);
  tree.props.children[2].props.onError(); tree = render();
  assert.equal(tree.props.children[2], false);
  assert.equal(tree.props.children[0].props.children, "initial");
  const next = CachedPhoto({ uri: "https://example.test/next.jpg", placeholder: "initial" });
  assert.notEqual(outer.key, next.key, "old image events must not update another source");
});
