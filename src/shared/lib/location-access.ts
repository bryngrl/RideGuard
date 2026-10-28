import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

/** App permission and the phone's Location switch are separate settings. */
export async function getLocationAccess() {
  const [permission, servicesEnabled] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.hasServicesEnabledAsync(),
  ]);
  return { permission, servicesEnabled, ready: permission.granted && servicesEnabled };
}

export async function openLocationSettings() {
  if (Platform.OS === "android") {
    try {
      await Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
      return;
    } catch { /* Some devices do not expose this settings activity. */ }
  }
  await Linking.openSettings();
}
