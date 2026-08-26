import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [userLabel, setUserLabel] = useState('No authenticated user');
  const [firebaseIdToken, setFirebaseIdToken] = useState<string | null>(null);
  const [status, setStatus] = useState('Signed out');
  const [backendResult, setBackendResult] = useState<string>('No backend test yet.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  const hasGoogleConfig = Boolean(
    googleWebClientId && (googleAndroidClientId || googleIosClientId || googleClientId),
  );

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
    webClientId: googleWebClientId,
    redirectUri: makeRedirectUri({
      scheme: 'rideguard',
      path: 'redirect',
    }),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserLabel('No authenticated user');
        setFirebaseIdToken(null);
        setStatus('Signed out');
        return;
      }

      setUserLabel(user.email ?? user.uid);
      const token = await user.getIdToken();
      setFirebaseIdToken(token);
      setStatus(`Signed in as ${user.email ?? user.uid}`);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type !== 'success') {
      return;
    }

    const loginWithFirebase = async () => {
      try {
        setBusyAction('signing-in');
        const googleIdToken = response.params.id_token ?? response.authentication?.idToken;
        if (!googleIdToken) {
          setStatus('Sign-in failed');
          setErrorMessage('Google auth succeeded, but no id_token was returned.');
          return;
        }

        setStatus('Signing in to Firebase...');
        setErrorMessage(null);
        const credential = GoogleAuthProvider.credential(googleIdToken);
        const result = await signInWithCredential(auth, credential);
        const token = await result.user.getIdToken(true);
        setFirebaseIdToken(token);
        setUserLabel(result.user.email ?? result.user.uid);
        setStatus(`Signed in as ${result.user.email ?? result.user.uid}`);
      } catch (error) {
        setStatus('Sign-in failed');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown sign-in error');
      } finally {
        setBusyAction(null);
      }
    };

    void loginWithFirebase();
  }, [response]);

  const tokenPreview = useMemo(() => {
    if (!firebaseIdToken) {
      return 'No Firebase ID token yet.';
    }
    return `${firebaseIdToken.slice(0, 40)}...`;
  }, [firebaseIdToken]);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setStatus('Opening Google sign-in...');
    setBusyAction('opening-google');
    const result = await promptAsync();
    if (result.type === 'dismiss' || result.type === 'cancel') {
      setStatus('Sign-in cancelled');
    }
    setBusyAction(null);
  };

  const handleRefreshToken = async () => {
    if (!auth.currentUser) {
      setErrorMessage('Sign in first before requesting a Firebase ID token.');
      return;
    }

    setErrorMessage(null);
    setStatus('Refreshing Firebase ID token...');
    setBusyAction('refreshing-token');
    try {
      const token = await auth.currentUser.getIdToken(true);
      setFirebaseIdToken(token);
      setStatus('Fresh Firebase ID token generated.');
    } catch (error) {
      setStatus('Token generation failed');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown token error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleVerifyBackend = async () => {
    if (!backendUrl) {
      setErrorMessage('Set EXPO_PUBLIC_BACKEND_URL to test backend token verification.');
      return;
    }

    if (!firebaseIdToken) {
      setErrorMessage('Generate a Firebase ID token first.');
      return;
    }

    setErrorMessage(null);
    setStatus('Verifying token against backend...');
    setBusyAction('verifying-backend');
    try {
      const response = await fetch(`${backendUrl}/api/auth/firebase/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseIdToken }),
      });

      const body = await response.text();
      setBackendResult(`HTTP ${response.status}: ${body}`);
      setStatus(response.ok ? 'Backend token verification passed.' : 'Backend token verification failed.');
    } catch (error) {
      setStatus('Backend token verification failed.');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown backend error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSignOut = async () => {
    setBusyAction('signing-out');
    await signOut(auth);
    setFirebaseIdToken(null);
    setUserLabel('No authenticated user');
    setStatus('Signed out');
    setBackendResult('No backend test yet.');
    setErrorMessage(null);
    setBusyAction(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection} type="backgroundElement">
          <ThemedText type="subtitle" style={styles.title}>
            RideGuard Auth
          </ThemedText>
          <ThemedText>{status}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            User: {userLabel}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Firebase ID token preview: {tokenPreview}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Backend check: {backendResult}
          </ThemedText>
          {!hasGoogleConfig && (
            <ThemedText type="small" themeColor="textSecondary">
              Missing Google OAuth env vars. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and one of
              EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID / EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID /
              EXPO_PUBLIC_GOOGLE_CLIENT_ID.
            </ThemedText>
          )}
          {errorMessage && (
            <ThemedText type="small" themeColor="textSecondary">
              Error: {errorMessage}
            </ThemedText>
          )}
        </ThemedView>

        <Pressable
          disabled={!request || !hasGoogleConfig || busyAction !== null}
          onPress={handleGoogleSignIn}
          style={({ pressed }) => [
            styles.button,
            (!request || !hasGoogleConfig || busyAction !== null) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}>
          <ThemedText>Continue with Google</ThemedText>
        </Pressable>

        <Pressable
          disabled={!auth.currentUser || busyAction !== null}
          onPress={handleRefreshToken}
          style={({ pressed }) => [
            styles.button,
            (!auth.currentUser || busyAction !== null) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}>
          <ThemedText>Get fresh Firebase token</ThemedText>
        </Pressable>

        <Pressable
          disabled={!firebaseIdToken || busyAction !== null}
          onPress={handleVerifyBackend}
          style={({ pressed }) => [
            styles.button,
            (!firebaseIdToken || busyAction !== null) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}>
          <ThemedText>Verify token with Backend</ThemedText>
        </Pressable>

        <Pressable
          disabled={userLabel === 'No authenticated user' || busyAction !== null}
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.button,
            (userLabel === 'No authenticated user' || busyAction !== null) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}>
          <ThemedText>Sign Out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.medium,
    justifyContent: 'center',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  heroSection: {
    padding: Spacing.large,
    borderRadius: 12,
    marginBottom: Spacing.large,
    gap: Spacing.small,
  },
  title: {
    marginBottom: Spacing.small,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.small,
  },
buttonDisabled: {opacity: 0.5,},buttonPressed: {opacity: 0.8,},});