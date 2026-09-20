import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // load custom fonts at runtime
  const [fontsLoaded, fontError] = useFonts({
    "EloquiaDisplay-ExtraBold": require("../../assets/fonts/EloquiaDisplay-ExtraBold.otf"),
    "EloquiaText-ExtraLight": require("../../assets/fonts/EloquiaText-ExtraLight.otf"),
    "Geist-Regular": require("../../assets/fonts/Geist-Regular.ttf"),
    "Geist-Medium": require("../../assets/fonts/Geist-Medium.ttf"),
    "Geist-SemiBold": require("../../assets/fonts/Geist-SemiBold.ttf"),
    "Geist-Thin": require("../../assets/fonts/Geist-Thin.ttf"),
  });

  // hide splash screen when fonts are loaded or if there is an error
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // don't render the app until fonts are loaded or if there is an error
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // render the app with the appropriate theme based on the device's color scheme
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
