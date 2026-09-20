import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { env } from "@/lib/config/env";

let isConfigured = false;

export function configureGoogleSignIn(): void {
  if (isConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: env.GOOGLE_WEB_CLIENT_ID,
  });

  isConfigured = true;
}

export async function signInWithGoogle(): Promise<string | null> {
  // Ensures configuration exists even if this function is called early.
  configureGoogleSignIn();

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return null;
  }

  const googleIdToken = response.data.idToken;

  if (!googleIdToken) {
    throw new Error("Google Sign-In succeeded, but no ID token was returned.");
  }

  return googleIdToken;
}
