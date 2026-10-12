import AsyncStorage from "@react-native-async-storage/async-storage";

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";

import { firebaseConfig } from "./firebase-config";

const { getAuth, initializeAuth } = FirebaseAuth;
const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (
      storage: typeof AsyncStorage,
    ) => FirebaseAuth.Persistence;
  }
).getReactNativePersistence;

let app: FirebaseApp;
let auth: FirebaseAuth.Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };

