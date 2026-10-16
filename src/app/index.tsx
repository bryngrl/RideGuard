import MainLogo from "@/assets/icons/logos/main.svg";
import { BrandNameReveal } from "@/components/brand-name-reveal";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const isOldUser = useAuthStore((state) => state.isOldUser);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    const finishTimeout = setTimeout(() => setIntroFinished(true), 2300);

    return () => {
      clearTimeout(finishTimeout);
    };
  }, []);

  useEffect(() => {
    if (isCheckingAuth || !introFinished) return;

    // Finish the same splash reveal before opening either destination.
    if (!isAuthenticated) {
      router.replace("/(public)/sign-in");
      return;
    }

    if (isOldUser === null) return;

    router.replace(
      isOldUser ? "/(app)/(tabs)" : "/(onboarding)/register/profile",
    );
  }, [introFinished, isAuthenticated, isCheckingAuth, isOldUser, router]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.View layout={LinearTransition.duration(450)} style={styles.brand}>
        <MainLogo width={64} height={64} />
        <BrandNameReveal style={styles.brandName} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    marginLeft: -15,
    marginTop: 25,
  },
});
