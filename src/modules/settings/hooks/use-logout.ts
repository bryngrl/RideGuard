import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Alert } from "react-native";
export function useLogout() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [visible, setVisible] = useState(false);
  const logout = async () => {
    try {
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
