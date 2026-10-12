import { useColorScheme as useSystemColorScheme } from "react-native";
import { useSettingsStore } from "@/modules/settings/store/settings.store";

export function useColorScheme() {
  const preference = useSettingsStore((state) => state.themePreference);
  const system = useSystemColorScheme();
  return preference === "system" ? system : preference;
}
