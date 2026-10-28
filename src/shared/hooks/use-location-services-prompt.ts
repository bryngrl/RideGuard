import { useEffect } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { BrandedAlert } from "@/shared/lib/branded-alert";
import { openLocationSettings } from "@/shared/lib/location-access";

/** Recheck on launch/unlock and each foreground visit; never change app navigation. */
export function useLocationServicesPrompt(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let generation = 0;
    let active = true;
    const check = async () => {
      const request = ++generation;
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!active || request !== generation || AppState.currentState !== "active" || servicesEnabled) return;
        BrandedAlert.alert("Turn on location", "Enable your phone's location for SOS and incident tagging.", [
          { text: "Not now", style: "cancel" },
          { text: "Open settings", onPress: () => { void openLocationSettings().catch(() =>
            BrandedAlert.alert("Couldn't open settings", "Turn on Location in your phone settings.")); } },
        ]);
      } catch { /* An OS status-check failure must not interrupt app unlock. */ }
    };
    void check();
    const subscription = AppState.addEventListener("change", (state) => {
      generation++;
      if (state === "active") void check();
    });
    return () => { active = false; generation++; subscription.remove(); };
  }, [enabled]);
}
