import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

import { env } from "@/lib/config/env";

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

const isFirebaseInitialized = getApps().length > 0;

const app: FirebaseApp = isFirebaseInitialized
  ? getApp()
  : initializeApp(firebaseConfig);
/**
 * Use initializeAuth() once to configure how the login session is stored.
 * inMemoryPersistence keeps the auth state in memory only, so closing or
 * fully reloading the app clears the session and forces a fresh Google login.
 */
export const firebaseAuth: Auth = isFirebaseInitialized
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
