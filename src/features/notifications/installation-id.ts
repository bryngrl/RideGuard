import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const INSTALLATION_ID_KEY = "rideguard-push-installation-id";

// Returns a stable per-install identifier, generating and persisting one on
// first use. The same ID is returned on every future call, so it survives app
// restarts and is never regenerated per request.
export async function getInstallationId(): Promise<string> {
  const existingId = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existingId) {
    return existingId;
  }

  const newId = Crypto.randomUUID();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, newId);
  return newId;
}
