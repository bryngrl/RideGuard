const { readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

// Expo Router 57 starts initial-link resolution during render. Android's promise
// can settle before commit, so the unhandled-link state setter must wait for an
// effect. Keep this patch until the upstream fix is present in our SDK version.
// https://github.com/expo/expo/issues/49378
const marker = "// RideGuard: defer initial linking state updates until commit.";
const refreshReset = "// @refresh reset";
const stateAnchor = "    const [lastUnhandledLink, setLastUnhandledLink] = react_1.default.useState();";
const callbackAnchor = "    }, setLastUnhandledLink);";
const guard = `${stateAnchor}
    ${marker}
    const linkingMounted = react_1.default.useRef(false);
    const pendingUnhandledLink = react_1.default.useRef({ pending: false, path: undefined });
    const handleUnhandledLink = react_1.default.useCallback((path) => {
        if (linkingMounted.current) {
            setLastUnhandledLink(path);
        } else {
            pendingUnhandledLink.current = { pending: true, path };
        }
    }, []);
    react_1.default.useEffect(() => {
        linkingMounted.current = true;
        if (pendingUnhandledLink.current.pending) {
            const { path } = pendingUnhandledLink.current;
            pendingUnhandledLink.current = { pending: false, path: undefined };
            setLastUnhandledLink(path);
        }
        return () => { linkingMounted.current = false; };
    }, []);`;

function patchSource(source) {
  const normalized = source.replace(/\r\n/g, "\n");
  let patched = normalized;
  if (!normalized.includes(marker)) {
    for (const anchor of [stateAnchor, callbackAnchor]) {
      if (normalized.split(anchor).length !== 2) {
        throw new Error("Expo Router linking has changed. Review the mount-race patch before updating dependencies.");
      }
    }
    patched = normalized.replace(stateAnchor, guard).replace(callbackAnchor, "    }, handleUnhandledLink);");
  }
  // A dependency edit may otherwise refresh an already-mounted navigator using
  // the pre-patch hook list. Remount this module instead of preserving that state.
  return patched.includes(refreshReset) ? patched : `${refreshReset}\n${patched}`;
}

function applyPatch() {
  const packageFile = require.resolve("expo-router/package.json", { paths: [path.join(__dirname, "..")] });
  const file = path.join(path.dirname(packageFile), "build/fork/NavigationContainer.js");
  const source = readFileSync(file, "utf8");
  const patched = patchSource(source);
  if (patched !== source) writeFileSync(file, patched);
  console.log("Expo Router initial linking mount guard is applied.");
}

module.exports = { patchSource, stateAnchor, guard };
if (require.main === module) applyPatch();
