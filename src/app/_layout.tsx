import { useAuth } from "@/modules/auth";
import { usePushRegistration } from "@/modules/notifications";
import { useAbly } from "@/shared/hooks/use-ably";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import { useSettingsStore } from "@/modules/settings/store/settings.store";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

// Show incoming push notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const settingsHydrated = useSettingsStore((state) => state.isHydrated);

  const [fontsLoaded, fontError] = useFonts({
    "EloquiaDisplay-ExtraBold": require("../../assets/fonts/EloquiaDisplay-ExtraBold.otf"),
    "EloquiaText-ExtraLight": require("../../assets/fonts/EloquiaText-ExtraLight.otf"),
    "Geist-Regular": require("../../assets/fonts/Geist-Regular.ttf"),
    "Geist-Medium": require("../../assets/fonts/Geist-Medium.ttf"),
    "Geist-SemiBold": require("../../assets/fonts/Geist-SemiBold.ttf"),
    "Geist-Thin": require("../../assets/fonts/Geist-Thin.ttf"),
  });
  useAuth();
  useAbly();
  usePushRegistration();

  useEffect(() => {
    if ((fontsLoaded || fontError) && settingsHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, settingsHydrated]);

  if ((!fontsLoaded && !fontError) || !settingsHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)/sign-in" options={{ animation: "none" }} />
          <Stack.Screen name="(app)/(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="(onboarding)/register" options={{ animation: "fade" }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
