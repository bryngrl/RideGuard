const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
function load(file, modules = {}) {
  const context = { exports: {}, require: (name) => {
    if (name.endsWith(".svg")) return "Icon";
    assert.ok(name in modules, name); return modules[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context); return context.exports;
}
const mapper = load("src/modules/alerts/services/alerts.mapper.ts");
const model = load("src/modules/home/utils/monitoring-state.ts", { "@/modules/alerts/services/alerts.mapper": mapper });
const options = { hasCameraConnected: true, hasOnlineCamera: true };
const presence = load("src/modules/devices/utils/device-presence.ts");
const cards = load("src/modules/home/utils/home-device-cards.ts", { "@/modules/devices/utils/device-presence": presence }).homeDeviceCards;
const saved = { camera1DeviceId: "CAM-OLD-AAA", camera2DeviceId: "", buttonDeviceId: "BUT-810-DFB" };

test("Home uses Camera Preview's backend camera list even with empty or stale saved slots", () => {
  const status = { cameras: [
    { deviceId: "PHONE-1", source: "phone", online: true },
    { deviceId: "CAM-111-AAA", source: "esp32", online: true },
    { deviceId: "CAM-222-BBB", source: "esp32", online: false },
  ], isLoading: false, error: null };
  for (const cache of [saved, { ...saved, camera1DeviceId: "" }]) {
    const result = cards(status, cache);
    assert.equal(result.camera1.deviceId, "CAM-111-AAA");
    assert.equal(result.camera1.label, "Online");
    assert.equal(result.camera2.deviceId, "CAM-222-BBB");
    assert.equal(result.camera2.label, "Offline");
    assert.equal(result.button.online, false);
    assert.equal(result.button.label, "Status unavailable");
  }
  status.cameras[1].online = false; status.cameras[2].online = true;
  assert.equal(cards(status, saved).camera1.label, "Offline");
  assert.equal(cards(status, saved).camera2.label, "Online");
  status.cameras = [];
  assert.equal(cards(status, saved).camera1.deviceId, "");
});

test("Home never keeps an online indicator when presence is loading or unavailable", () => {
  const status = { cameras: [{ deviceId: "CAM-111-AAA", source: "esp32", online: true }], isLoading: true, error: null };
  assert.equal(cards(status, saved).camera1.label, "Checking…");
  assert.equal(cards(status, saved).camera1.online, false);
  status.isLoading = false; status.error = "Network unavailable";
  assert.equal(cards(status, saved).camera1.label, "Unavailable");
  assert.equal(cards(status, saved).camera1.online, false);
});
const alert = (message, extra = {}) => ({ alertId: "a", deviceId: "CAM-123-ABC", message,
  timeStamp: "2026-10-28T12:00:00Z", isArchived: false, isFalseAlarm: false, ...extra });

test("archived threats cannot keep Home in a threat state", () => {
  assert.equal(model.monitoringState([alert("Violence detected", { isArchived: true })], options).state, "monitoring");
  const older = alert("Weapon detected", { alertId: "older", timeStamp: "2026-10-28T11:00:00Z" });
  assert.equal(model.monitoringState([older, alert("Violence detected", { isArchived: true })], options).title, "Weapon detected");
});
test("new clear and false-alarm records clear the preceding threat; archive deadlines alone do not", () => {
  const older = alert("Violence detected", { timeStamp: "2026-10-28T10:00:00Z" });
  for (const latest of [alert("All clear"), alert("No detections"), alert("Violence detected", { isFalseAlarm: true })]) {
    assert.equal(model.monitoringState([latest, older], options).state, "monitoring");
  }
  assert.equal(model.monitoringState([alert("Violence detected", { archiveAt: "2026-10-27T00:00:00Z" })], options).state, "threat");
});
test("violence, weapon and combined detections have one stable message without capture claims", () => {
  for (const message of ["Violence detected", "Weapon detected", "Violence and Weapon detected"]) {
    const first = model.monitoringState([alert(message)], options);
    assert.equal(first.state, "threat");
    assert.ok(!first.subtitle.includes("Auto-capturing"));
    assert.equal(model.monitoringState([alert(message)], options).subtitle, first.subtitle);
  }
  assert.equal(model.monitoringState([alert("Violence detected")], options).subtitle,
    "Unusual movement was detected.\nUse manual SOS if you need help.");
});
test("no camera, checking, failed presence and offline states do not claim active monitoring", () => {
  assert.equal(model.monitoringState([], { hasCameraConnected: false }).state, "no-camera");
  assert.equal(model.monitoringState([], { ...options, checking: true }).state, "checking");
  assert.equal(model.monitoringState([], { ...options, unavailable: true }).state, "unavailable");
  assert.equal(model.monitoringState([], { ...options, hasOnlineCamera: false }).state, "offline");
  assert.equal(model.monitoringState([alert("Violence detected")], { ...options, hasOnlineCamera: false }).state, "threat");
});
test("Home observes canonical archive updates and reuses the active Alerts refresh lifecycle", () => {
  let alerts = [alert("Violence detected")]; const refreshes = [];
  const { useMonitoringStatus } = load("src/modules/home/hooks/use-monitoring-status.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/modules/alerts/store/alerts.store": { useAlertsStore: (select) => select({ alerts }) },
    "@/modules/alerts/hooks/use-alerts": { useAlertsList: (...args) => refreshes.push(args) },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "../utils/monitoring-state": model,
  });
  assert.equal(useMonitoringStatus(options).monitoringCardState, "threat");
  alerts = [alert("Violence detected", { isArchived: true })];
  assert.equal(useMonitoringStatus(options).monitoringCardState, "monitoring");
  assert.deepEqual(refreshes, [["active"], ["active"]]);
});
