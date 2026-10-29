import { useFocusEffect, useGlobalSearchParams, usePathname, useRouter, useSegments } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, StyleSheet, View } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { postAuthDestination } from "@/modules/auth/services/registration-progress";
import { mpinApi } from "../services/mpin.api";
import { useMpinStore } from "../store/mpin.store";
import { canAccessMpinEmergency, isMpinEmergencyRoute, mpinReturnPath, resolveMpinAccess } from "../utils/mpin-policy";
import { useMpinForeground } from "../hooks/use-mpin-foreground";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { Spacing } from "@/shared/theme";

/** Guard every normal app route, including deep links; authenticated SOS stays available. */
export function MpinAppGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const routeParams = useGlobalSearchParams();
  const alertId = typeof routeParams.alertId === "string" ? routeParams.alertId : undefined;
  const returnPath = mpinReturnPath(pathname, routeParams);
  const auth = useAuthStore();
  const mpin = useMpinStore();
  const foreground = useMpinForeground();
  const theme = useTheme();
  const redirecting = useRef(false);
  const mountedOwner = useRef<string | null>(null);
  const [completedOwner, setCompletedOwner] = useState<string | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [progressRetry, setProgressRetry] = useState(0);
  const owner = auth.user?.uid ?? (auth.isDemo ? "demo-preview" : null);
  const emergency = mpinApi.enabled ? canAccessMpinEmergency(segments, mpin.status, alertId) : isMpinEmergencyRoute(segments);
  const access = resolveMpinAccess({ enabled: mpinApi.enabled, demo: auth.isDemo, uid: auth.user?.uid ?? null,
    owner: mpin.owner, status: mpin.status, unlocked: mpin.unlocked });
  const permitted = auth.isAuthenticated && auth.isOldUser === true &&
    (emergency || (completedOwner === owner && !mpin.checkingStatus && access === "allowed"));

  useFocusEffect(useCallback(() => { redirecting.current = false; }, [foreground]));

  useFocusEffect(useCallback(() => {
    if (!foreground || AppState.currentState !== "active" || !auth.user || auth.isCheckingAuth || auth.isOldUser !== true || emergency) return;
    let cancelled = false;
    setCompletedOwner(null);
    setProgressError(false);
    void postAuthDestination(auth.user, true).then((destination) => {
      if (cancelled || AppState.currentState !== "active") return;
      if (destination === "/(app)/(tabs)") setCompletedOwner(auth.user!.uid);
      else if (!redirecting.current) { redirecting.current = true; router.replace(destination); }
    }).catch(() => {
      if (!cancelled && AppState.currentState === "active" && !redirecting.current) {
        // A storage/read failure is not proof that onboarding is incomplete.
        // Keep the form hidden and mounted instead of discarding it.
        setProgressError(true);
      }
    });
    return () => { cancelled = true; };
    // A route change is not a new authentication session. Rechecking here for
    // every tab hides an already-unlocked stack behind a full-screen spinner.
    // Focus/resume, identity changes and explicit retries still revalidate.
  }, [foreground, auth.user?.uid, auth.isCheckingAuth, auth.isOldUser, emergency, router, progressRetry]));

  useFocusEffect(useCallback(() => {
    if (!foreground || AppState.currentState !== "active" || redirecting.current || auth.isCheckingAuth || permitted || (mpin.checkingStatus && auth.isAuthenticated)) return;
    if (!auth.isAuthenticated) { redirecting.current = true; router.replace("/(public)/welcome"); return; }
    if (auth.isOldUser === false) { redirecting.current = true; router.replace("/(onboarding)/register/profile"); return; }
    if (auth.isOldUser === null) return;
    if (!emergency && completedOwner !== owner) return;
    useMpinStore.getState().setReturnTo(returnPath);
    redirecting.current = true;
    // Keep the protected stack mounted behind the lock. Replacing it discards
    // pending native photo results, form drafts, route params and back history.
    router.push({ pathname: "/(mpin)/mpin/[step]", params: { step: access, mode: "setup" } });
  }, [foreground, auth.isCheckingAuth, auth.isAuthenticated, auth.isOldUser, mpin.checkingStatus, permitted, access, returnPath, router, completedOwner, owner, emergency]));

  const visible = foreground && permitted && (!auth.isCheckingAuth || emergency);
  if (visible) mountedOwner.current = owner;
  // Preserve already-mounted monitoring during a recheck. Never mount protected
  // content for a new/unknown account, and hide both touch and accessibility access.
  const keepMounted = auth.isAuthenticated && !!owner && mountedOwner.current === owner && auth.isOldUser === true;
  return <View collapsable={false} style={{ flex: 1, backgroundColor: theme.background }}>
    <View collapsable={false} style={{ flex: 1, opacity: visible ? 1 : 0 }} pointerEvents={visible ? "auto" : "none"}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? "auto" : "no-hide-descendants"}>
      {keepMounted ? children : null}
    </View>
    <View collapsable={false} pointerEvents={visible ? "none" : "auto"}
      accessibilityElementsHidden={visible} importantForAccessibility={visible ? "no-hide-descendants" : "auto"}
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, alignItems: "center", justifyContent: "center", opacity: visible ? 0 : 1 }]}
      accessibilityLabel={progressError ? "Unable to restore screen" : "Checking account security"}>
      <ActivityIndicator animating={!visible && !progressError} style={{ opacity: progressError ? 0 : 1 }} />
      <View collapsable={false} style={{ padding: Spacing.four, display: progressError ? "flex" : "none" }}>
        <FormFeedback message="Couldn't restore your screen. Try again." />
        <Button title="Try again" onPress={() => setProgressRetry((value) => value + 1)} />
      </View>
    </View>
  </View>;
}
