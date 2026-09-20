import "firebase/auth";
import type { Persistence, ReactNativeAsyncStorage } from "firebase/auth";

// Firebase exports this at runtime on React Native, but its shared types omit it.
declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
