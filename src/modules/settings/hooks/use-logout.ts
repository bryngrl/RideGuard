import { auth } from "@/lib/firebase";
import { signOutGoogle } from "@/modules/auth";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  getInstallationId,
  unregisterPushNotification,
} from "@/modules/notifications";
import { stopPhoneCapture } from "@/modules/phone-camera";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Alert } from "react-native";
export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const [visible, setVisible] = useState(false);
  const logout = async () => {
    try {
      const token = await user?.getIdToken().catch(() => undefined);
      // Stop before signing out so no frame uploads under the old account.
      await stopPhoneCapture(token);
      // Needs the Firebase token, so before signOut. Best effort: a network
      // failure must not keep the user signed in.
      if (token) {
        await unregisterPushNotification(token, await getInstallationId()).catch(
          (error) => console.warn("Could not unregister push:", error),
        );
      }
      await signOutGoogle().catch((error) =>
        console.warn("Google sign-out failed:", error),
      );
      await signOut(auth);
      clearAuth();
      setVisible(false);
      router.replace("/(public)/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Logout failed", "Something went wrong while logging out.");
    }
  };
  return {
    visible,
    open: () => setVisible(true),
    close: () => setVisible(false),
    logout,
  };
}
