import axios from "axios";

import { env } from "@/lib/config/env";
import { firebaseAuth } from "@/lib/firebase";
import { TEN_SECONDS_IN_MILLISECONDS } from "@/shared/constants/time-constants";

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: TEN_SECONDS_IN_MILLISECONDS,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    // Firebase automatically refreshes the token when necessary.
    const firebaseToken = await user.getIdToken();
    console.log("Firebase Token:", firebaseToken); // REMOVE THIS LINE AFTER TESTING
    config.headers.set("Authorization", `Bearer ${firebaseToken}`);
  }

  return config;
});
