import type { Message } from "ably";
import { Realtime } from "ably";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";

import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { sosStore } from "../store/sos.store";

const SOS_UPDATED_EVENT = "sos.updated";

export function useSosRealtime(enabled = true) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const callbackRef = useRef<(() => void) | undefined>(undefined);
  const [connectionState, setConnectionState] = useState<"connecting" | "ready" | "error">("connecting");
  const [retry, setRetry] = useState(0);
  const lastAdoptedSosId = useRef<string | null>(null);

  useFocusEffect(useCallback(() => {
    let dispose: (() => void) | undefined;
    const connect = () => {
      dispose?.(); dispose = undefined;
      if (!enabled || AppState.currentState !== "active") return;
      if (!user) { setConnectionState("error"); return; }
      setConnectionState("connecting");
      let cancelled = false;
      const client = new Realtime({ authCallback: async (_params, done) => {
        try {
          const token = await user.getIdToken();
          if (cancelled) return;
          const request = await getAblyToken(token);
          if (!cancelled) done(null, request);
        } catch {
          if (!cancelled) { setConnectionState("error"); done("Couldn't connect to SOS updates.", null); }
        }
      } });
      const channelName = `rideguard:sos:user:${encodeURIComponent(user.uid)}`;
      const channel = client.channels.get(channelName);
      const onMessage = (message: Message) => {
        if (cancelled || AppState.currentState !== "active") return;
        const data = message.data as { sosId?: string; status?: string } | null;
        if (!data?.sosId) return;
        if (data.sosId === lastAdoptedSosId.current && data.status !== "ended") return;
        lastAdoptedSosId.current = data.sosId;
        void sosStore.getState().adoptExternalSos().then(() => {
          if (cancelled) return;
          const record = sosStore.getState().record;
          if (record && record.sosId === data.sosId && record.status === "active") {
            router.replace("/(app)/sos/active");
          }
        });
      };
      channel.on("attached", () => { if (!cancelled) setConnectionState("ready"); });
      channel.on("failed", () => { if (!cancelled) setConnectionState("error"); });
      channel.on("suspended", () => { if (!cancelled) setConnectionState("error"); });
      client.connection.on((change) => {
        if (cancelled) return;
        if (change.current === "failed" || change.current === "suspended") setConnectionState("error");
        else if (change.current !== "connected") setConnectionState("connecting");
      });
      channel.subscribe(SOS_UPDATED_EVENT, onMessage).catch(() => { if (!cancelled) setConnectionState("error"); });
      dispose = () => {
        cancelled = true;
        channel.unsubscribe(SOS_UPDATED_EVENT, onMessage); channel.off(); client.connection.off(); client.close();
      };
    };
    connect();
    const listener = AppState.addEventListener("change", connect);
    return () => { listener.remove(); dispose?.(); };
  }, [user, retry, enabled, router]));

  return { connectionState, retryConnect: () => setRetry((value) => value + 1) };
}