import { useAuth } from "@/modules/auth";
import { usePushRegistration } from "@/modules/notifications";
import { useAbly } from "@/shared/hooks/use-ably";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import { useSettingsStore } from "@/modules/settings/store/settings.store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMpinLifecycle } from "@/modules/mpin/hooks/use-mpin-lifecycle";
import { MpinPrivacyCover } from "@/modules/mpin/components/mpin-privacy-cover";
import { SessionRecovery } from "@/modules/auth/components/session-recovery";
import { BrandedAlertHost } from "@/shared/ui/branded-alert-host";
import { Colors } from "@/shared/theme/colors";
import { LocationServicesPrompt } from "@/shared/ui/location-services-prompt";
import { recordMpinActivity } from "@/modules/mpin/services/mpin-activity";

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

// Live alerts and device discovery update their own component, without
// rerendering the entire navigator and every theme consumer on each message.
function BackgroundServices() {
  useAbly();
  usePushRegistration();
  useMpinLifecycle();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const reduceMotion = useReducedMotion();
  const settingsHydrated = useSettingsStore((state) => state.isHydrated);

  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    "EloquiaDisplay-ExtraBold": require("../../assets/fonts/EloquiaDisplay-ExtraBold.otf"),
    "EloquiaText-ExtraLight": require("../../assets/fonts/EloquiaText-ExtraLight.otf"),
    "Geist-Regular": require("../../assets/fonts/Geist-Regular.ttf"),
    "Geist-Medium": require("../../assets/fonts/Geist-Medium.ttf"),
    "Geist-SemiBold": require("../../assets/fonts/Geist-SemiBold.ttf"),
    "Geist-Thin": require("../../assets/fonts/Geist-Thin.ttf"),
  });
  const { sessionError, retrySession, isCheckingAuth } = useAuth();
  const navigationTheme = useMemo(() => ({
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: { ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: Colors[colorScheme].background, card: Colors[colorScheme].card,
      text: Colors[colorScheme].text, border: Colors[colorScheme].border,
      primary: Colors[colorScheme].accent, notification: Colors[colorScheme].error },
  }), [colorScheme]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && settingsHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, settingsHydrated]);

  return (
    <>
    <BackgroundServices />
    {(fontsLoaded || fontError) && settingsHydrated ?
    <GestureHandlerRootView style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => { recordMpinActivity(); return false; }}
      onMoveShouldSetResponderCapture={() => { recordMpinActivity(); return false; }}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)/welcome" options={{ animation: "fade" }} />
          <Stack.Screen
            name="(public)/sign-in"
            options={{ animation: reduceMotion ? "none" : "slide_from_right", animationTypeForReplace: "push" }}
          />
          <Stack.Screen
            name="(public)/create-account"
            options={{ animation: reduceMotion ? "none" : "slide_from_right" }}
          />
          <Stack.Screen
            name="(public)/check-email"
            options={{ animation: reduceMotion ? "none" : "slide_from_right", gestureEnabled: false }}
          />
          <Stack.Screen
            name="(public)/forgot-password"
            options={{ animation: reduceMotion ? "none" : "slide_from_right" }}
          />
          <Stack.Screen
            name="(public)/verify-code"
            options={{ animation: reduceMotion ? "none" : "slide_from_right" }}
          />
          <Stack.Screen
            name="privacy/privacy"
            options={{ animation: reduceMotion ? "none" : "slide_from_right", animationDuration: 260 }}
          />
          <Stack.Screen name="(app)" options={{ animation: Platform.OS === "android" ? "none" : "fade" }} />
          <Stack.Screen name="(mpin)/mpin" options={{ animation: reduceMotion || Platform.OS === "android" ? "none" : "slide_from_right", gestureEnabled: false }} />
          <Stack.Screen
            name="(public)/new-password"
            options={{ animation: reduceMotion ? "none" : "slide_from_right" }}
          />
          <Stack.Screen
            name="(public)/password-reset-success"
            options={{ animation: reduceMotion ? "none" : "slide_from_right", animationTypeForReplace: "push", gestureEnabled: false }}
          />
          <Stack.Screen name="(onboarding)" options={{ animation: Platform.OS === "android" ? "none" : "fade" }} />
        </Stack>
        <SessionRecovery message={sessionError} busy={isCheckingAuth} onRetry={retrySession} />
        <MpinPrivacyCover />
        <BrandedAlertHost />
        <LocationServicesPrompt />
      </ThemeProvider>
    </GestureHandlerRootView> : null}
    </>
  );
}
