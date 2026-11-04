import { Realtime } from "ably";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";

import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useDeviceStore } from "@/modules/devices";
import { sosStore } from "../store/sos.store";

export function useButtonCancelRealtime(enabled = true) {
  const user = useAuthStore((state) => state.user);
  const buttonDeviceId = useDeviceStore((state) => state.buttonDeviceId);
  const [retry, setRetry] = useState(0);

  useFocusEffect(useCallback(() => {
    let dispose: (() => void) | undefined;
    const connect = () => {
      dispose?.(); dispose = undefined;
      if (!enabled || AppState.currentState !== "active") return;
      if (!user || !buttonDeviceId) return;
      let cancelled = false;
      const seen = new Set<string>();
      const client = new Realtime({ authCallback: async (_params, done) => {
        try {
          const token = await user.getIdToken();
          if (cancelled) return;
          const request = await getAblyToken(token);
          if (!cancelled) done(null, request);
        } catch {
          if (!cancelled) done("Couldn't connect to Quick Button.", null);
        }
      } });
      const channel = client.channels.get("rideguard:buttons:device");
      const onMessage = (message: { name?: string; data?: unknown; id?: string }) => {
        if (cancelled || AppState.currentState !== "active") return;
        let data = message.data;
        if (typeof data === "string") { try { data = JSON.parse(data); } catch { return; } }
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        const payload = data as Record<string, unknown>;
        if (payload.device_id !== buttonDeviceId) return;
        if (message.name !== "button.pressed" || payload.press_type !== "CANCEL_SOS") return;
        const id = typeof payload.event_id === "string" ? payload.event_id : message.id;
        if (id && seen.has(id)) return;
        if (id) { seen.add(id); if (seen.size > 100) seen.delete(seen.values().next().value!); }
        sosStore.getState().cancelCountdown();
      };
      channel.subscribe(onMessage).catch(() => undefined);
      dispose = () => { cancelled = true; channel.unsubscribe(onMessage); channel.off(); client.connection.off(); client.close(); };
    };
    connect();
    const listener = AppState.addEventListener("change", connect);
    return () => { listener.remove(); dispose?.(); };
  }, [user, buttonDeviceId, retry, enabled]));

  return { retryConnect: () => setRetry((value) => value + 1) };
}