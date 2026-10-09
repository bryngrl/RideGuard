import type { Message } from "ably";
import { Realtime } from "ably";
import { useEffect, useRef } from "react";

import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useDeviceStore } from "@/modules/devices";

import type { ButtonHardwareEvent } from "../types/button-test";

const BUTTON_EVENTS_CHANNEL = "rideguard:buttons:device";
const BUTTON_PRESSED_EVENT = "button.pressed";

type ButtonMessageData = {
  device_id?: unknown;
  press_type?: unknown;
};

function parseMessageData(data: unknown): ButtonMessageData | null {
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as ButtonMessageData)
        : null;
    } catch {
      return null;
    }
  }

  return typeof data === "object" && data !== null
    ? (data as ButtonMessageData)
    : null;
}

function mapMessageToEvent(message: Message): ButtonHardwareEvent | null {
  if (message.name !== BUTTON_PRESSED_EVENT) return null;

  const data = parseMessageData(message.data);
  if (!data || typeof data.press_type !== "string") return null;

  switch (data.press_type) {
    case "START_CAPTURE":
    case "STOP_CAPTURE":
      return { type: "pulse", button: "white" };
    case "FALSE_ALARM":
    case "CANCEL_SOS":
      return { type: "pulse", button: "red" };
    case "SOS":
      return { type: "long-press", button: "red" };
    default:
      return null;
  }
}

export function useButtonRealtime(
  onButtonEvent: (event: ButtonHardwareEvent) => void,
) {
  const user = useAuthStore((state) => state.user);
  const buttonDeviceId = useDeviceStore((state) => state.buttonDeviceId);
  const callbackRef = useRef(onButtonEvent);

  useEffect(() => {
    callbackRef.current = onButtonEvent;
  }, [onButtonEvent]);

  useEffect(() => {
    if (!user || !buttonDeviceId) return;

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

    const channel = client.channels.get(BUTTON_EVENTS_CHANNEL);

    const handleMessage = (message: Message) => {
      const data = parseMessageData(message.data);
      const messageDeviceId =
        typeof data?.device_id === "string" ? data.device_id : message.clientId;

      if (messageDeviceId !== buttonDeviceId) return;

      const event = mapMessageToEvent(message);
      if (event) callbackRef.current(event);
    };

    channel.subscribe(handleMessage).catch((error) => {
      console.error(
        "[Button] Failed to subscribe:",
        BUTTON_EVENTS_CHANNEL,
        error,
      );
    });

    return () => {
      channel.unsubscribe(handleMessage);
      client.close();
    };
  }, [buttonDeviceId, user]);
}
