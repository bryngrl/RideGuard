import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

// Stable per-install identifier for this device's push registration. Generated
// once and persisted so the same installation keeps the same id across launches
// (and so logout can delete exactly this registration server-side).
const INSTALLATION_ID_KEY = "rideguard:push:installationId";

export async function getInstallationId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) {
    return existing;
  }

  const id = Crypto.randomUUID();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, id);
  return id;
}
