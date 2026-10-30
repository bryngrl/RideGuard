import type { Message } from "ably";
import { Realtime } from "ably";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";

import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useDeviceStore } from "@/modules/devices";
import { BUTTON_EVENTS_CHANNEL, parseButtonEvent } from "../utils/button-events";
import type { ButtonHardwareEvent } from "../types/button-test";

export function useButtonRealtime(onButtonEvent: (event: ButtonHardwareEvent) => void, enabled = true) {
  const user = useAuthStore((state) => state.user);
  const buttonDeviceId = useDeviceStore((state) => state.buttonDeviceId);
  const callback = useRef(onButtonEvent);
  callback.current = onButtonEvent;
  const [connectionState, setConnectionState] = useState<"connecting" | "ready" | "error">("connecting");
  const [retry, setRetry] = useState(0);
  const disposeNow = useRef<(() => void) | undefined>(undefined);

  useFocusEffect(useCallback(() => {
    let dispose: (() => void) | undefined;
    const connect = () => {
      dispose?.(); dispose = undefined;
      if (!enabled || AppState.currentState !== "active") return;
      if (!user || !buttonDeviceId) { setConnectionState("error"); return; }
      setConnectionState("connecting");
      let cancelled = false;
      const seen = new Set<string>();
      const client = new Realtime({ authCallback: async (_params, done) => {
        try {
          const token = await user.getIdToken();
          if (cancelled) return;
          const request = await getAblyToken(token);
          if (!cancelled) done(null, request);
        } catch {
          if (!cancelled) { setConnectionState("error"); done("Couldn't connect to Quick Button.", null); }
        }
      } });
      const channel = client.channels.get(BUTTON_EVENTS_CHANNEL);
      const onMessage = (message: Message) => {
        if (cancelled || AppState.currentState !== "active") return;
        const parsed = parseButtonEvent(message, buttonDeviceId);
        if (!parsed) return;
        const id = parsed.id ?? message.id;
        if (id && seen.has(id)) return;
        if (id) {
          seen.add(id);
          if (seen.size > 100) seen.delete(seen.values().next().value!);
        }
        callback.current(parsed.event);
      };
      channel.on("attached", () => { if (!cancelled) setConnectionState("ready"); });
      channel.on("failed", () => { if (!cancelled) setConnectionState("error"); });
      channel.on("suspended", () => { if (!cancelled) setConnectionState("error"); });
      client.connection.on((change) => {
        if (cancelled) return;
        if (change.current === "failed" || change.current === "suspended") setConnectionState("error");
        else if (change.current !== "connected") setConnectionState("connecting");
      });
      channel.subscribe(onMessage).catch(() => { if (!cancelled) setConnectionState("error"); });
      dispose = () => {
        cancelled = true;
        channel.unsubscribe(onMessage); channel.off(); client.connection.off(); client.close();
      };
      disposeNow.current = dispose;
    };
    connect();
    const listener = AppState.addEventListener("change", connect);
    return () => { listener.remove(); dispose?.(); disposeNow.current = undefined; };
  }, [user, buttonDeviceId, retry, enabled]));

  return { connectionState, retryConnect: () => setRetry((value) => value + 1), stopListening: () => disposeNow.current?.() };
}
