import * as Ably from "ably";

import { getAblyToken } from "@/features/auth/auth.api";

export const ablyClient = new Ably.Realtime({
  authCallback: async (_tokenParams, callback) => {
    try {
      const tokenRequest = await getAblyToken();
      callback(null, tokenRequest);
    } catch (error) {
      console.error("Error fetching Ably token:", error);
      callback(error as Ably.ErrorInfo, null);
    }
  },
  autoConnect: false,
});
