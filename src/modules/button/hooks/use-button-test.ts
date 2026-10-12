import { useButtonRealtime } from "./use-button-realtime";
import type {
  ButtonColor,
  ButtonHardwareEvent,
  ButtonTestType,
  TestState,
} from "../types/button-test";
import { useEffect, useRef, useState } from "react";

const TEST_TIMEOUT = 3 * 60 * 1000;
export function useButtonTest(
  testType: ButtonTestType,
  onShortPressComplete: () => void,
) {
  const [state, setState] = useState<TestState>("waiting");
  const [recognizedButtons, setRecognizedButtons] = useState<
    Record<ButtonColor, boolean>
  >({ white: false, red: false });
  const [pressedButtons, setPressedButtons] = useState<
    Record<ButtonColor, boolean>
  >({ white: false, red: false });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setState("timeout");
    }, TEST_TIMEOUT);
  };

  useEffect(() => {
    resetTimeout();
    return clearTimers;
  }, [testType]);

  const handleButtonEvent = ({ type, button }: ButtonHardwareEvent) => {
    if (state !== "waiting") return;

    if (type === "long-press") {
      if (testType !== "long") return;

      clearTimers();
      setPressedButtons({ white: false, red: false });
      setState("success");
      return;
    }

    if (type !== "pulse" || testType !== "short") return;

    setPressedButtons((current) => ({ ...current, [button]: true }));
    setTimeout(
      () => setPressedButtons((current) => ({ ...current, [button]: false })),
      180,
    );
    setRecognizedButtons((current) => {
      const next = { ...current, [button]: true };
      if (next.white && next.red) {
        clearTimers();
        setState("success");
        setTimeout(onShortPressComplete, 700);
      }
      return next;
    });
  };

  useButtonRealtime(handleButtonEvent);

  const handleRetry = () => {
    clearTimers();
    setState("waiting");
    setRecognizedButtons({ white: false, red: false });
    setPressedButtons({ white: false, red: false });
    resetTimeout();
  };

  return {
    state,
    recognizedButtons,
    pressedButtons,
    handleRetry,
  };
}
