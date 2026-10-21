const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadAlertsApi() {
  const requests = [];
  const source = readFileSync(
    path.join(__dirname, "../src/modules/alerts/services/alerts.api.ts"),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const context = {
    exports: {},
    require(name) {
      if (name === "@/shared/api") {
        return {
          apiClient: {
            async get(endpoint, token) {
              requests.push({ endpoint, token });
              return {
                data: {
                  data: [{ alertFields: { alertId: "archived-1", isArchived: true } }],
                  nextCursor: "next page",
                },
              };
            },
          },
        };
      }
      if (name === "./alerts.mapper") {
        return { parseAlertFields: (value) => value };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(compiled, context);
  return { getSavedAlerts: context.exports.getSavedAlerts, requests };
}

test("saved alerts request uses only backend-supported pagination fields", async () => {
  const { getSavedAlerts, requests } = loadAlertsApi();
  const page = await getSavedAlerts("token", { limit: 10, cursor: "next page" });
  assert.deepEqual(requests[0], {
    endpoint: "/alerts?limit=10&cursor=next%20page",
    token: "token",
  });
  assert.equal(page.alerts[0].isArchived, true);
  assert.equal(page.nextCursor, "next page");
});

test("archived view reads past active-only pages", async () => {
  const pages = [
    { alerts: [{ alertId: "active-1", isArchived: false, isFalseAlarm: false, timeStamp: "2026-10-21T00:00:00Z" }], nextCursor: "page-2" },
    { alerts: [{ alertId: "archived-1", isArchived: true, isFalseAlarm: false, timeStamp: "2026-10-20T00:00:00Z" }], nextCursor: null },
  ];
  const cursors = [];
  const alerts = [];
  const slots = [];
  let slot = 0;
  const react = {
    useState(initial) {
      const index = slot++;
      slots[index] ??= { current: initial };
      return [slots[index].current, (value) => {
        slots[index].current = typeof value === "function" ? value(slots[index].current) : value;
      }];
    },
    useRef(initial) {
      const index = slot++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useCallback(fn) { slot++; return fn; },
    useMemo(fn) { slot++; return fn(); },
    useEffect() { slot++; },
  };
  const source = readFileSync(
    path.join(__dirname, "../src/modules/alerts/hooks/use-alerts.ts"),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const imports = {
    "expo-router": { useFocusEffect() {} },
    react,
    "react-native": { AppState: {} },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select({ user: { getIdToken: async () => "token" } }) },
    "../constants": { ALERTS_PAGE_SIZE: 1 },
    "../services/alerts.api": { getSavedAlerts: async (_token, options) => {
      cursors.push(options.cursor ?? null);
      return pages[cursors.length - 1];
    } },
    "../services/alerts.mapper": { alertTimeValue: (value) => Date.parse(value) },
    "../store/alerts.store": { useAlertsStore: (select) => select({
      alerts,
      listRefreshNonce: 0,
      mergeAlerts(incoming) { alerts.push(...incoming); },
    }) },
  };
  const context = {
    exports: {},
    require(name) {
      assert.ok(imports[name], `Unexpected import: ${name}`);
      return imports[name];
    },
    console,
  };
  vm.runInNewContext(compiled, context);
  slot = 0;
  const list = context.exports.useAlertsList("archived");
  list.refresh();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(cursors, [null, "page-2"]);
  slot = 0;
  const loaded = context.exports.useAlertsList("archived");
  assert.equal(loaded.visibleAlerts.length, 1);
  assert.equal(loaded.visibleAlerts[0].alertId, "archived-1");
});
