import { env } from '@/lib/config/env';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

let isConfigured = false;

// Returns a google ID token
export async function signInWithGoogle(): Promise<string | null> {
  // Ensures configuration exists even if this function is called early.
  configureGoogleSignIn();

  // This line checks whether the Android device can use Google’s native sign-in system
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  /**
   * This opens Google’s sign-in interface and waits for the user to either:
   * Select a Google account and continue.
   * Cancel the sign-in process.
   */
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return null;
  }

  const googleIdToken = response.data.idToken;

  if (!googleIdToken) {
    throw new Error('Google Sign-In succeeded, but no ID token was returned.');
  }

  return googleIdToken;
}

function configureGoogleSignIn(): void {
  if (isConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: env.GOOGLE_WEB_CLIENT_ID,
  });

  isConfigured = true;
}
