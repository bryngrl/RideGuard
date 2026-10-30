const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { patchSource, guard, stateAnchor } = require("./patch-expo-router-linking.cjs");

const packageRoot = path.dirname(require.resolve("expo-router/package.json"));
const navigationSource = readFileSync(path.join(packageRoot, "build/fork/NavigationContainer.js"), "utf8");
const linkingSource = readFileSync(path.join(packageRoot, "build/fork/useLinking.native.js"), "utf8");
const unpatchedSource = navigationSource.replace(guard, stateAnchor).replace("    }, handleUnhandledLink);", "    }, setLastUnhandledLink);");
function deferred() {
  let resolve;
  const promise = new Promise((work) => { resolve = work; });
  return { promise, resolve };
}
function harness(url, source = patchSource(unpatchedSource)) {
  const updates = [], effects = [], cleanups = [];
  let initialState;
  const react = {
    useRef: (current) => ({ current }), useMemo: (work) => work(), useCallback: (work) => work,
    useState: (value) => [value, (next) => { updates.push(next); }],
    useEffect: (work) => { effects.push(work); }, useImperativeHandle() {}, forwardRef: (work) => work,
  };
  const native = { useNavigationIndependentTree: () => false,
    getStateFromPath: (path) => ({ path }), getActionFromState() {}, DefaultTheme: {}, ThemeProvider: "Theme",
  };
  const modules = {
    react, "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { I18nManager: { getConstants: () => ({ isRTL: false }) }, Linking: { addEventListener: () => ({ remove() {} }) } },
    "expo-linking": {}, "./extractPathFromURL": { extractExpoPathFromURL: (_prefixes, value) => value.replace("rideguard://", "/") },
    "../react-navigation/native": native,
    "./useBackButton": { useBackButton() {} }, "./useDocumentTitle": { useDocumentTitle() {} },
    "../imperative-api": { useImperativeApiEmitter() {} },
    "../utils/useLatestCallback": (work) => work,
    "./useThenable": { useThenable: (create) => { initialState = create(); return [false, undefined]; } },
  };
  const evaluate = (source) => {
    const context = { exports: {}, process: { env: { NODE_ENV: "test" } }, Promise, setTimeout,
      require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
    vm.runInNewContext(source, context);
    return context.exports;
  };
  modules["./useLinking"] = evaluate(linkingSource);
  evaluate(source).NavigationContainer({ linking: { prefixes: [], getInitialURL: () => url } }, {});
  return { updates, initialState: () => initialState,
    commit: () => { effects.forEach((work) => { const cleanup = work(); if (cleanup) cleanups.push(cleanup); }); },
    unmount: () => { cleanups.forEach((work) => work()); },
  };
}

test("the installed Expo Router reproduces the reported pre-commit initial-link race without the guard", async () => {
  const url = deferred();
  const app = harness(url.promise, unpatchedSource);
  url.resolve("rideguard://settings/account");
  await app.initialState();
  assert.deepEqual(app.updates, ["/settings/account"]);
});

test("an initial link resolving before commit waits for an effect and preserves its route and query", async () => {
  const url = deferred();
  const app = harness(url.promise);
  url.resolve("rideguard://alerts/123?source=notification");
  const state = await app.initialState();
  assert.equal(state.path, "/alerts/123?source=notification");
  assert.deepEqual(app.updates, []);
  app.commit();
  assert.deepEqual(app.updates, ["/alerts/123?source=notification"]);
});

test("a link resolving after commit still updates the mounted navigator", async () => {
  const url = deferred();
  const app = harness(url.promise);
  app.commit(); url.resolve("rideguard://contact");
  await app.initialState();
  assert.deepEqual(app.updates, ["/contact"]);
});

test("discarded renders and unmounted navigators never receive late link state updates", async () => {
  for (const commit of [false, true]) {
    const url = deferred();
    const app = harness(url.promise);
    if (commit) { app.commit(); app.unmount(); }
    url.resolve("rideguard://settings");
    await app.initialState();
    assert.deepEqual(app.updates, []);
  }
});

test("synchronous links also wait for commit, and patching is idempotent", () => {
  const app = harness("rideguard://settings");
  assert.deepEqual(app.updates, []);
  app.commit();
  assert.deepEqual(app.updates, ["/settings"]);
  assert.equal(patchSource(patchSource(unpatchedSource)), patchSource(unpatchedSource));
  assert.throws(() => patchSource("changed upstream implementation"), /Review the mount-race patch/);
});

test("Fast Refresh is instructed to remount the patched navigator instead of reusing its old hooks", () => {
  const babel = require("@babel/core");
  const { ast } = babel.transformSync(patchSource(unpatchedSource), {
    ast: true, configFile: false, babelrc: false,
    plugins: [[require.resolve("react-refresh/babel"), { skipEnvCheck: true }]],
  });
  let resetSignature = false;
  babel.traverse(ast, { CallExpression({ node }) {
    if (node.arguments[0]?.name === "NavigationContainerInner" && node.arguments[2]?.value === true) {
      resetSignature = true;
    }
  } });
  assert.equal(resetSignature, true, "the reset directive must reach React Refresh's hook signature");
});
