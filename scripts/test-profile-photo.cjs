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

test("account photos load through the cache on first login and retry on screen focus", () => {
  let attempt = 0, focus;
  const { ProfileAvatar } = load("src/shared/ui/avatar.tsx", {
    react: { useState: () => [attempt, (work) => { attempt = work(attempt); }], useCallback: (work) => work },
    "expo-router": { useFocusEffect: (work) => { focus = work; } },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { Text: "Text", View: "View", StyleSheet: { create: (value) => value } },
    "@/shared/hooks/use-theme": { useTheme: () => ({}) },
    "@/shared/theme": { BorderRadius: {}, Spacing: {}, Typography: {} },
    "./cached-photo": { CachedPhoto: "CachedPhoto" },
  });
  const first = ProfileAvatar({ name: "Ana", photoUrl: " https://example.test/profile.jpg ", size: 92 });
  assert.equal(first.type, "CachedPhoto");
  assert.equal(first.props.uri, "https://example.test/profile.jpg");
  assert.equal(first.props.placeholder.props.children.props.children, "A");
  focus();
  const retry = ProfileAvatar({ name: "Ana", photoUrl: " https://example.test/profile.jpg ", size: 92 });
  assert.notEqual(retry.key, first.key);
  const noPhoto = ProfileAvatar({ name: "Ana", photoUrl: " " });
  assert.equal(noPhoto.type, "View");
});

test("fresh login uses the current account photo and never another user's cache", () => {
  let authUser = { uid: "new", photoURL: "https://example.test/current-google.jpg" };
  let document = { personalInfo: { profileImageUrl: "https://example.test/old-google.jpg" } };
  let uid = "new", focus, loaded;
  const { useProfile } = load("src/modules/settings/hooks/use-profile.ts", {
    react: { useMemo: (work) => work(), useCallback: (work) => work },
    "expo-router": { useFocusEffect: (work) => { focus = work; } },
    "@/modules/auth/store/auth.store": { useAuthStore: (select) => select({ user: authUser, isDemo: false }) },
    "../store/profile-cache.store": { useProfileCacheStore: (select) => select({ uid, document, loading: false, attemptedAt: 1,
      load: async (user) => { loaded = user.uid; }, setPhotoUrl() {} }) },
  });
  assert.equal(useProfile().profile.photoUrl, authUser.photoURL);
  focus(); assert.equal(loaded, "new");
  document.photo_url = "https://example.test/uploaded.jpg";
  assert.equal(useProfile().profile.photoUrl, document.photo_url);
  authUser = { uid: "other", photoURL: null };
  assert.equal(useProfile().profile.photoUrl, null);
  assert.equal(useProfile().isLoading, true);
  uid = "other"; document = null;
  assert.equal(useProfile().profile.photoUrl, null);
});
