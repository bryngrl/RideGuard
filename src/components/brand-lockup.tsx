import MainLogo from "@/assets/icons/logos/main.svg";
import { StyleSheet, View } from "react-native";

import { BrandNameReveal } from "./brand-name-reveal";

/** Assembled brand, using the exact dimensions at the end of the splash reveal. */
export function BrandLockup() {
  return (
    <View accessible accessibilityLabel="RideGuard">
      <View style={styles.brand} importantForAccessibility="no-hide-descendants">
        <MainLogo width={64} height={64} />
        <BrandNameReveal reveal={false} style={styles.wordmark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  wordmark: { marginLeft: -15, marginTop: 25 },
});
