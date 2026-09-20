/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/shared/constants/them.constants";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === "unspecified" ? "light" : scheme;

  return Colors[theme];
}
