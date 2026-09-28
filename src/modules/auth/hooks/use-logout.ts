import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { auth } from "@/lib/firebase";
import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { unregisterDeviceForPush } from "@/modules/notifications";
import { useAuthStore } from "../store/auth.store";

export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setIsLoggingOut(true);

      // Clear the Google sign-in session separately so a Google error
      // doesn't prevent the Firebase logout from completing.
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        });

        await GoogleSignin.signOut();
      } catch (error) {
        console.error("Failed to sign out of Google:", error);
      }

      // Remove this device's push registration while the token is still valid,
      // so it stops receiving alerts. A failure here shouldn't block logout.
      try {
        const firebaseToken = await auth.currentUser?.getIdToken();
        if (firebaseToken) {
          await unregisterDeviceForPush(firebaseToken);
        }
      } catch (error) {
        console.error("Failed to unregister push notifications:", error);
      }

      // End the user's Firebase session.
      await signOut(auth);

      clearAuth();
      // Drop the previous user's alerts so they don't leak into the next session.
      useAlertsStore.getState().clearAlerts();

      router.replace("/(public)/sign-in");
    } catch (error) {
      console.error("Failed to log out:", error);

      Alert.alert(
        "Logout failed",
        "Something went wrong while logging out. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    logout,
    isLoggingOut,
  };
}
