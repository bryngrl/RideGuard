import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useState } from "react";

import { auth } from "@/lib/firebase";

export function useGoogleSignin() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    try {
      setIsLoading(true);

      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return null;
      }

      const googleIdToken = response.data.idToken;

      if (!googleIdToken) {
        throw new Error(
          "Google Sign-In succeeded, but no ID token was returned.",
        );
      }

      const credential = GoogleAuthProvider.credential(googleIdToken);

      const userCredential = await signInWithCredential(auth, credential);

      return userCredential.user;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isLoading,
  };
}
