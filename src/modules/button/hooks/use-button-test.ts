import { useButtonRealtime } from "./use-button-realtime";
import type {
  ButtonColor,
  ButtonHardwareEvent,
  ButtonTestType,
  TestState,
} from "../types/button-test";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";

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
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const active = useRef(false);
  const phase = useRef<TestState>("waiting");
  const recognized = useRef({ white: false, red: false });
  const complete = useRef(onShortPressComplete);
  complete.current = onShortPressComplete;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    timeoutRef.current = null;
  };

  const schedule = (work: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (active.current) work();
    }, delay);
    timers.current.add(timer);
    return timer;
  };

  const resetTimeout = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timers.current.delete(timeoutRef.current); }
    timeoutRef.current = schedule(() => {
      clearTimers();
      phase.current = "timeout";
      setState("timeout");
    }, TEST_TIMEOUT);
  };

  useFocusEffect(useCallback(() => {
    const resume = () => {
      active.current = true;
      phase.current = "waiting";
      recognized.current = { white: false, red: false };
      setState("waiting");
      setRecognizedButtons(recognized.current);
      setPressedButtons({ white: false, red: false });
      resetTimeout();
    };
    if (AppState.currentState === "active") resume();
    const subscription = AppState.addEventListener("change", (state) => {
      active.current = false;
      clearTimers();
      if (state === "active") resume();
    });
    return () => { subscription.remove(); active.current = false; clearTimers(); };
  }, [testType]));

  const handleButtonEvent = ({ type, button }: ButtonHardwareEvent) => {
    if (!active.current || phase.current !== "waiting") return;

    if (type === "hold-start" || type === "hold-end") {
      if (testType === "long") setPressedButtons({ white: false, red: type === "hold-start" });
      return;
    }

    if (type === "long-press") {
      if (testType !== "long" || button !== "red") return;

      clearTimers();
      setPressedButtons({ white: false, red: true });
      phase.current = "success";
      setState("success");
      return;
    }

    if (type !== "pulse" || testType !== "short") return;

    setPressedButtons((current) => ({ ...current, [button]: true }));
    schedule(
      () => setPressedButtons((current) => ({ ...current, [button]: false })),
      180,
    );
    const next = { ...recognized.current, [button]: true };
    recognized.current = next;
    setRecognizedButtons(next);
    if (next.white && next.red) {
      clearTimers();
      phase.current = "success";
      setState("success");
      schedule(() => setPressedButtons({ white: false, red: false }), 180);
      schedule(() => complete.current(), 700);
    }
  };

  const { connectionState, retryConnect } = useButtonRealtime(handleButtonEvent);

  const handleRetry = () => {
    if (!active.current) return;
    clearTimers();
    phase.current = "waiting";
    recognized.current = { white: false, red: false };
    setState("waiting");
    setRecognizedButtons({ white: false, red: false });
    setPressedButtons({ white: false, red: false });
    resetTimeout();
    retryConnect();
  };

  return {
    state,
    recognizedButtons,
    pressedButtons,
    connectionState,
    handleRetry,
  };
}
