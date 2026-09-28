import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

// Storage key for this app install's stable id.
const INSTALLATION_ID_KEY = "rideguard.installationId";

/**
 * Returns a stable id for this app install. It's created once (a random UUID
 * saved to storage) and reused on every launch, so the backend can identify
 * this device across sessions for push registration.
 */
export async function getInstallationId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;

  const id = Crypto.randomUUID();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, id);
  return id;
}
