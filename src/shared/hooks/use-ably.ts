import { Realtime } from "ably";
import { useEffect } from "react";

import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export function useAbly() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    const client = new Realtime({
      authCallback: async (_params, callback) => {
        try {
          const firebaseToken = await user.getIdToken();
          const tokenRequest = await getAblyToken(firebaseToken);

          callback(null, tokenRequest);
        } catch (error) {
          callback(
            error instanceof Error
              ? error.message
              : "Ably authentication failed.",
            null,
          );
        }
      },
    });

    return () => client.close();
  }, [user]);
}
