# Initial-link state update before mount

Expo Router 57.0.13 passes the navigation container's `setLastUnhandledLink`
directly to `useLinking`. The initial URL is requested during render. On Android,
its promise can resolve before that render commits, producing React's warning
about a state update on a component that has not mounted.

The stack ends at `url.then` in `expo-router/build/fork/useLinking.native.js`.
This matches [upstream issue #49378](https://github.com/expo/expo/issues/49378).

`scripts/patch-expo-router-linking.cjs` patches the installed navigation container
to queue linking notifications until its first effect. Mounted callbacks still
update normally; callbacks belonging to discarded or unmounted renders cannot
update React state. Initial route parsing, query parameters, and link listeners
remain in Expo Router.

The script runs through `postinstall` after dependency installation. It is
idempotent and fails if upstream code no longer matches the expected anchors,
so a dependency upgrade requires reviewing whether this workaround is still
needed. Do not remove it without testing an initial URL resolving before commit.

Apply manually with `node scripts/patch-expo-router-linking.cjs`. After applying
to an already-running development setup, restart Metro with
`npm.cmd start -- --clear` and reload the app.

The patch adds hooks to `NavigationContainerInner`. Fast Refresh must not reuse
an instance mounted with the original hook list. The patched file includes
`// @refresh reset` so React Refresh remounts its components on edits. Existing
sessions showing "Rendered more hooks than during the previous render" still
need a full app reload; continuing Fast Refresh on that old instance cannot
repair its hook state.

Run `node --test scripts/test-router-linking-mount.cjs`. The tests exercise the
installed Router linking code and reproduce the original race without the guard.
They cover resolution before/after commit, unmount, discarded renders,
synchronous URLs, route/query preservation, and repeated patch application.
Cold launches on a device remain a separate verification step.
