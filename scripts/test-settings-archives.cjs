const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, modules) {
  const context = { exports: {}, require: (name) => { assert.ok(name in modules, name); return modules[name]; } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports;
}
function render({ loading = false, empty = false } = {}) {
  const statuses = [], routes = []; let refreshed = 0, paged = 0;
  const { AlertsScreen } = load("src/modules/alerts/screens/alerts-screen.tsx", {
    react: { useState: (value) => [value, () => {}], useRef: (value) => ({ current: value }), useMemo: (work) => work(), useCallback: (work) => work, useEffect() {} },
    "react/jsx-runtime": require("react/jsx-runtime"), "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native": { View: "View", Text: "Text", SectionList: "List", ActivityIndicator: "Spinner", RefreshControl: "Refresh",
      useWindowDimensions: () => ({ width: 400, height: 850 }) },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea", useSafeAreaInsets: () => ({ bottom: 24 }) },
    "react-native-reanimated": { __esModule: true, default: { View: "Animated" }, useReducedMotion: () => true,
      useSharedValue: (value) => ({ value }), useAnimatedStyle: (work) => work() },
    "expo-router": { useFocusEffect() {}, useRouter: () => ({ canGoBack: () => false, replace: (route) => routes.push(route), push: (route) => routes.push(route) }) },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) }, "@/shared/theme": { BrandColors: {}, Typography: {}, Spacing: { four: 24 } },
    "@/shared/ui/feedback-pressable": { FeedbackPressable: "Pressable" }, "@/shared/ui/page-layout": { PageLayout: "Page" },
    "@/modules/auth/store/auth.store": { useAuthStore: (selector) => selector({ user: { uid: "a" } }) },
    "@/shared/store/loading-counts.store": { useLoadingCountsStore: (selector) => selector({ counts: { a: { "alerts:archived": 1 } }, remember() {} }) },
    "../constants": { END_REACHED_THRESHOLD: 0.3 },
    "../hooks/use-alerts": { useAlertsList: (status) => { statuses.push(status); return {
      visibleAlerts: empty || loading ? [] : [{ alertId: "archived-1", timeStamp: "2026-10-27T12:00:00Z", isArchived: true }],
      isInitialLoading: loading, isRefreshing: false, isLoadingMore: false, hasMore: true,
      refresh: () => refreshed++, loadMore: () => paged++,
    }; } },
    "../components/alert-item": { AlertItem: "AlertItem" }, "../components/alerts-skeleton": { AlertsSkeleton: "Skeleton" },
    "../services/alerts.mapper": { mapAlertFieldsToItem: (value) => value, alertTimeValue: Date.parse },
    "./alerts-screen.styles": { styles: {} },
  });
  const { ArchivesScreen } = load("src/modules/settings/screens/archives/archives-screen.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"), "@/modules/alerts/screens/alerts-screen": { AlertsScreen },
  });
  const wrapper = ArchivesScreen();
  const tree = wrapper.type(wrapper.props);
  return { tree, statuses, routes, refreshed: () => refreshed, paged: () => paged };
}

test("Settings Archives uses the existing archived query and opens the same alert detail", () => {
  const app = render();
  assert.deepEqual(app.statuses, ["archived"]);
  assert.equal(app.tree.props.title, "Archives");
  const list = app.tree.props.children;
  assert.equal(list.props.sections[0].data[0].alertId, "archived-1");
  list.props.renderItem({ item: list.props.sections[0].data[0] }).props.onPress();
  assert.equal(app.routes[0].pathname, "/alerts/[alertId]");
  assert.equal(app.routes[0].params.alertId, "archived-1");
  list.props.refreshControl.props.onRefresh(); list.props.onEndReached();
  assert.equal(app.refreshed(), 1); assert.equal(app.paged(), 1);
  app.tree.props.onBack(); assert.equal(app.routes.at(-1), "/settings");
});

test("Settings Archives reuses the archive skeleton count and empty state", () => {
  const pending = render({ loading: true });
  assert.equal(pending.tree.props.children.props.ListEmptyComponent.type, "Skeleton");
  assert.equal(pending.tree.props.children.props.ListEmptyComponent.props.count, 1);
  const empty = render({ empty: true });
  assert.equal(empty.tree.props.children.props.ListEmptyComponent.props.children.props.children, "No archived alerts.");
});
