import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { getAdditionalUserInfo, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useRef, useState } from "react";

import { auth } from "@/lib/firebase";

function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
}

/**
 * Forget the cached Google account so the next sign-in shows the account
 * picker. Firebase signOut alone leaves it cached. Android needs configure
 * first, even after an app restart.
 */
export async function signOutGoogle(): Promise<void> {
  configureGoogleSignin();
  await GoogleSignin.signOut();
}

export function useGoogleSignin() {
  const [isLoading, setIsLoading] = useState(false);
  const pending = useRef(false);
  const newAccount = useRef(false);

  const signIn = async () => {
    if (pending.current) return null;
    pending.current = true;
    newAccount.current = false;
    try {
      setIsLoading(true);

      configureGoogleSignin();

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
      newAccount.current = getAdditionalUserInfo(userCredential)?.isNewUser === true;

      return userCredential.user;
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      throw error;
    } finally {
      pending.current = false;
      setIsLoading(false);
    }
  };

  return {
    signIn,
    isLoading,
    isNewAccount: () => newAccount.current,
  };
}
