import "firebase/auth";

import type { Persistence, ReactNativeAsyncStorage } from "firebase/auth";

declare module "firebase/auth" {
  /**
   * This exists in Firebase for React Native,
   * but TypeScript does not recognize it yet.
   *
   * Remove this when Firebase fixes the type definitions.
   * issue link:
   * https://github.com/firebase/firebase-js-sdk/issues/9316
   */
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
