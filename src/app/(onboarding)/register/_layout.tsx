import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="mpin" options={{ animation: Platform.OS === 'android' ? 'none' : 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
