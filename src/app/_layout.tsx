import { saveRefreshedPushToken } from '@/features/notifications/push-registration';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    'EloquiaDisplay-ExtraBold': require('../../assets/fonts/EloquiaDisplay-ExtraBold.otf'),
    'EloquiaText-ExtraLight': require('../../assets/fonts/EloquiaText-ExtraLight.otf'),
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
    'Geist-Thin': require('../../assets/fonts/Geist-Thin.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Expo may rotate the native token while the app runs. Persist the new one
    // against the same installation. Never fetch the token here or log it.
    const subscription = Notifications.addPushTokenListener((token) => {
      if (typeof token.data !== 'string') {
        return;
      }

      void saveRefreshedPushToken(token.data).catch(() => {
        console.error('Failed to update refreshed push token.');
      });
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

