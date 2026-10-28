const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "../src/shared/ui/keyboard-scroll-position.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { keyboardScrollPosition } = context.exports;

const base = {
  fieldTop: 450, fieldHeight: 60, viewportTop: 100, viewportHeight: 600,
  keyboardTop: 500, gap: 20, scrollY: 100, contentHeight: 1400,
};

test("reveals the full field when the keyboard overlaps an edge-to-edge viewport", () => {
  const result = keyboardScrollPosition(base);
  assert.equal(result.overlap, 200);
  assert.equal(result.target, 130);
});

test("uses the resized Android viewport without adding the keyboard twice", () => {
  const result = keyboardScrollPosition({ ...base, viewportHeight: 400 });
  assert.equal(result.overlap, 0);
  assert.equal(result.target, 130);
});

test("leaves an already visible field still while typing", () => {
  assert.equal(keyboardScrollPosition({ ...base, fieldTop: 350 }).target, 100);
});

test("scrolls up to recover a clipped label when switching fields", () => {
  assert.equal(keyboardScrollPosition({ ...base, fieldTop: 105, fieldHeight: 60 }).target, 85);
});

test("recalculates after an inline error expands the focused field", () => {
  assert.equal(keyboardScrollPosition({ ...base, fieldHeight: 90 }).target, 160);
});

test("reveals the field again when a password suggestion makes the keyboard taller", () => {
  const result = keyboardScrollPosition({ ...base, keyboardTop: 450 });
  assert.equal(result.overlap, 250);
  assert.equal(result.target, 180);
});

test("does not add an overlay inset after the keyboard leaves the viewport", () => {
  const result = keyboardScrollPosition({ ...base, keyboardTop: 700 });
  assert.equal(result.overlap, 0);
  assert.equal(result.target, 100);
});

test("clamps scrolling when content is shorter than the visible form", () => {
  assert.equal(keyboardScrollPosition({ ...base, contentHeight: 600 }).target, 0);
});
