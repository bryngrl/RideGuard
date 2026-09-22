import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
/*
 *TypeScript does not recognize getReactNativePersistence yet,
 *but Firebase supports it in React Native.
 *We added a custom type for it in src/types/firebase-auth.d.ts.
 */
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

import { env } from '@/lib/config/env';

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

const isFirebaseInitialized = getApps().length > 0;

const app: FirebaseApp = isFirebaseInitialized ? getApp() : initializeApp(firebaseConfig);
/**
 * This line of code:
 * Use initializeAuth() once to configure React Native persistence.
 * Use getAuth() afterward to retrieve that configured instance.
 * Both return a Firebase Auth instance
 */
export const firebaseAuth: Auth = isFirebaseInitialized
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage), // Configures AsyncStorage as the place where login sessions are saved.
    });
