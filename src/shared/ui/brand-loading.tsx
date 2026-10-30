import MainLogo from "@/assets/icons/logos/main.svg";
import { View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { SkeletonPulse } from "./skeleton-pulse";

export function BrandLoading({ active = true, fullScreen = false, label = "Loading RideGuard", size = 48 }: {
  active?: boolean; fullScreen?: boolean; label?: string; size?: number;
}) {
  const theme = useTheme();
  const logo = <SkeletonPulse active={active} label={label}>
    <MainLogo color={theme.logo} width={size} height={size * 65 / 48} />
  </SkeletonPulse>;
  return fullScreen ? <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>{logo}</View> : logo;
}
