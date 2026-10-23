const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(
  path.join(__dirname, "../src/modules/alerts/services/alerts.mapper.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {}, require };
vm.runInNewContext(compiled, context);
const { formatDetectionTimeRange, mapAlertFieldsToItem } = context.exports;

test("range uses actual endpoints and 12-hour time", () => {
  assert.equal(
    formatDetectionTimeRange(
      "2026-10-21T15:20:00",
      "2026-10-21T15:25:00",
      "2026-10-21T15:25:00",
    ),
    "3:20 PM - 3:25 PM",
  );
});

test("missing or invalid end retains a single timestamp", () => {
  assert.equal(formatDetectionTimeRange(null, null, "2026-10-21T09:25:00"), "9:25 AM");
  assert.equal(formatDetectionTimeRange("2026-10-21T09:00:00", "invalid", ""), "9:00 AM");
  assert.equal(formatDetectionTimeRange(null, null, "invalid"), "Time unavailable");
});

test("overnight range labels the end date", () => {
  assert.equal(
    formatDetectionTimeRange("2026-10-21T23:55:00", "2026-10-22T00:05:00", ""),
    "11:55 PM - 12:05 AM (Oct 22)",
  );
});

test("manual badge requires explicit presentation metadata", () => {
  const alert = {
    alertId: "one",
    deviceId: "camera",
    message: "Violence detected",
    timeStamp: "2026-10-21T09:00:00",
    isSeen: false,
    isFalseAlarm: false,
  };
  assert.equal(mapAlertFieldsToItem(alert).manual, false);
  assert.equal(mapAlertFieldsToItem(alert, { manual: true }).manual, true);
});
