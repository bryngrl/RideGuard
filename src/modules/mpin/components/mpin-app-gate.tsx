import { useFocusEffect, useLocalSearchParams, usePathname, useRouter, useSegments } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { postAuthDestination } from "@/modules/auth/services/registration-progress";
import { mpinApi } from "../services/mpin.api";
import { useMpinStore } from "../store/mpin.store";
import { canAccessMpinEmergency, isMpinEmergencyRoute, resolveMpinAccess } from "../utils/mpin-policy";

/** Guard every normal app route, including deep links; authenticated SOS stays available. */
export function MpinAppGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { alertId } = useLocalSearchParams<{ alertId?: string }>();
  const auth = useAuthStore();
  const mpin = useMpinStore();
  const mountedOwner = useRef<string | null>(null);
  const [completedOwner, setCompletedOwner] = useState<string | null>(null);
  const owner = auth.user?.uid ?? (auth.isDemo ? "demo-preview" : null);
  const emergency = mpinApi.enabled ? canAccessMpinEmergency(segments, mpin.status, alertId) : isMpinEmergencyRoute(segments);
  const access = resolveMpinAccess({ enabled: mpinApi.enabled, demo: auth.isDemo, uid: auth.user?.uid ?? null,
    owner: mpin.owner, status: mpin.status, unlocked: mpin.unlocked });
  const permitted = auth.isAuthenticated && auth.isOldUser === true &&
    (emergency || (completedOwner === owner && !mpin.checkingStatus && access === "allowed"));

  useFocusEffect(useCallback(() => {
    if (!auth.user || auth.isCheckingAuth || auth.isOldUser !== true || emergency) return;
    let cancelled = false;
    setCompletedOwner(null);
    void postAuthDestination(auth.user, true).then((destination) => {
      if (cancelled) return;
      if (destination === "/(app)/(tabs)") setCompletedOwner(auth.user!.uid);
      else router.replace(destination);
    }).catch(() => {
      if (!cancelled) router.replace("/(onboarding)/register/profile");
    });
    return () => { cancelled = true; };
  }, [auth.user?.uid, auth.isCheckingAuth, auth.isOldUser, emergency, pathname, router]));

  useFocusEffect(useCallback(() => {
    if (auth.isCheckingAuth || permitted || (mpin.checkingStatus && auth.isAuthenticated)) return;
    if (!auth.isAuthenticated) { router.replace("/(public)/welcome"); return; }
    if (auth.isOldUser === false) { router.replace("/(onboarding)/register/profile"); return; }
    if (auth.isOldUser === null) return;
    if (!emergency && completedOwner !== owner) return;
    useMpinStore.getState().setReturnTo(pathname);
    router.replace({ pathname: "/(mpin)/mpin/[step]", params: { step: access, mode: "setup" } });
  }, [auth.isCheckingAuth, auth.isAuthenticated, auth.isOldUser, mpin.checkingStatus, permitted, access, pathname, router, completedOwner, owner, emergency]));

  const visible = permitted && (!auth.isCheckingAuth || emergency);
  if (visible) mountedOwner.current = owner;
  // Preserve already-mounted monitoring during a recheck. Never mount protected
  // content for a new/unknown account, and hide both touch and accessibility access.
  if (!visible && (!auth.isAuthenticated || !owner || mountedOwner.current !== owner || auth.isOldUser !== true)) return null;
  return <View style={{ flex: 1 }}>
    <View style={{ flex: 1, opacity: visible ? 1 : 0 }} pointerEvents={visible ? "auto" : "none"}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? "auto" : "no-hide-descendants"}>
      {children}
    </View>
    {!visible && <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}
      accessible accessibilityLabel="Checking account security"><ActivityIndicator /></View>}
  </View>;
}
