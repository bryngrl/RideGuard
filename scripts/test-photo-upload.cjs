const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const compiled = ts.transpileModule(readFileSync(path.join(__dirname, "../src/shared/api/photo-upload.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup(options = {}) {
  const calls = [], body = { append: (...args) => calls.push(args) };
  class File { constructor(uri) { this.uri = uri; this.exists = options.exists ?? true; this.size = options.size ?? 1024; } }
  const context = { exports: {}, fetch: async () => ({ ok: options.ok ?? true, blob: async () => ({ size: options.size ?? 1024 }) }),
    require: (name) => {
      if (name === "expo-file-system") return { File };
      if (name === "react-native") return { Platform: { OS: options.os ?? "android" } };
      throw new Error(`Unexpected dependency: ${name}`);
    } };
  vm.runInNewContext(compiled, context);
  return { calls, upload: (asset = {}) => context.exports.appendPhoto(body, { uri: "file:///photo.jpg", ...asset }) };
}

test("native photos append a file part without uploading a React Native URI descriptor", async () => {
  const app = setup(); await app.upload();
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0][0], "photo");
  assert.equal(app.calls[0][1].uri, "file:///photo.jpg");
  assert.equal("type" in app.calls[0][1], false);
});

test("unsupported and oversized images never enter multipart data", async () => {
  for (const asset of [{ mimeType: "image/heic" }, { fileSize: 5 * 1024 * 1024 + 1 }]) {
    const app = setup(); await assert.rejects(app.upload(asset)); assert.equal(app.calls.length, 0);
  }
});

test("missing, empty, or oversized native files fail before submission", async () => {
  for (const options of [{ exists: false }, { size: 0 }, { size: 5 * 1024 * 1024 + 1 }]) {
    const app = setup(options); await assert.rejects(app.upload()); assert.equal(app.calls.length, 0);
  }
});

test("web upload rejects missing, empty, or oversized downloads instead of attaching an error page", async () => {
  for (const options of [{ ok: false }, { size: 0 }, { size: 5 * 1024 * 1024 + 1 }]) {
    const app = setup({ os: "web", ...options }); await assert.rejects(app.upload()); assert.equal(app.calls.length, 0);
  }
});

test("valid web and native image types use the common photo field", async () => {
  for (const os of ["web", "android"]) for (const mimeType of ["image/jpeg", "image/png", "image/webp"]) {
    const app = setup({ os }); await app.upload({ mimeType }); assert.equal(app.calls[0][0], "photo");
  }
});
