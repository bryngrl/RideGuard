import { BrandedAlert as Alert } from "@/shared/lib/branded-alert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { Linking } from "react-native";
import { useStore } from "zustand";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { listContacts } from "@/modules/emergency-contacts/services/contacts.api";
import { useSettingsStore } from "@/modules/settings/store/settings.store";
import { createSosApi } from "../services/sos.api";
import { createSosStore } from "./sos-session";

const api = createSosApi(async (uid) => {
  const user = useAuthStore.getState().user;
  if (!user || user.uid !== uid) throw new Error("SOS account changed");
  const token = await user.getIdToken();
  if (useAuthStore.getState().user?.uid !== uid) throw new Error("SOS account changed");
  return token;
});

export const sosStore = createSosStore({
  locationDiagnostic: (event) => { console.info("[SOS location]", event); },
  api, storage: AsyncStorage, contacts: listContacts, uuid: () => Crypto.randomUUID(),
  shareLocation: () => {
    const settings = useSettingsStore.getState();
    return settings.isHydrated && settings.locationWithContacts;
  },
  permission: async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.granted) return true;
    if (!permission.canAskAgain) {
      Alert.alert("Location permission required", "Allow location access in your phone settings to use SOS.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open settings", onPress: () => { void Linking.openSettings().catch(() => undefined); } },
      ]);
      return false;
    }
    return (await Location.requestForegroundPermissionsAsync()).granted;
  },
  capture: async () => {
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: fix.coords.latitude, longitude: fix.coords.longitude,
      capturedAt: new Date(fix.timestamp).toISOString(), accuracyMeters: fix.coords.accuracy };
  },
});

// Account cleanup must also run when no SOS screen is mounted.
const syncOwner = () => { void sosStore.getState().setOwner(useAuthStore.getState().user?.uid ?? null); };
useAuthStore.subscribe((state, previous) => {
  if (state.user?.uid !== previous.user?.uid) syncOwner();
});
syncOwner();
export const useSosStore = () => useStore(sosStore);
