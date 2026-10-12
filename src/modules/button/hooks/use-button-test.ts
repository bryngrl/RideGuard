import { createMockButtonEvent } from "../services/button-hardware.service";
import type {
  ButtonColor,
  ButtonHardwareEvent,
  ButtonTestType,
  TestState,
} from "../types/button-test";
import { useEffect, useRef, useState } from "react";

const TEST_TIMEOUT = 3 * 60 * 1000;
const HOLD_DURATION = 3000;

export function useButtonTest(
  testType: ButtonTestType,
  onShortPressComplete: () => void,
) {
  const [state, setState] = useState<TestState>("waiting");
  const [recognizedButtons, setRecognizedButtons] = useState<
    Record<ButtonColor, boolean>
  >({ white: false, red: false });
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [pressedButtons, setPressedButtons] = useState<
    Record<ButtonColor, boolean>
  >({ white: false, red: false });
  const pressStart = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    timeoutRef.current = null;
    progressRef.current = null;
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

    if (type === "pressed") {
      setPressedButtons((current) => ({ ...current, [button]: true }));
      if (testType === "long") {
        pressStart.current = Date.now();
        setIsHolding(true);
        setProgress(0);
        progressRef.current = setInterval(() => {
          const elapsed = Date.now() - (pressStart.current ?? Date.now());
          setProgress(Math.min(elapsed / HOLD_DURATION, 1));
          if (elapsed >= HOLD_DURATION) {
            clearTimers();
            setIsHolding(false);
            setProgress(0);
            setState("success");
            setPressedButtons({ white: false, red: false });
          }
        }, 50);
      }
      return;
    }

    if (testType === "short") {
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
      return;
    }

    clearTimers();
    pressStart.current = null;
    setIsHolding(false);
    setProgress(0);
    setPressedButtons((current) => ({ ...current, [button]: false }));
    resetTimeout();
  };

  // BACKEND INTEGRATION:
  // The mock Pressable currently enters the controller through these event handlers.
  // Replace this input with the physical button event source when available.
  const handleButtonPressStart = (button: ButtonColor) =>
    handleButtonEvent(createMockButtonEvent("pressed", button));

  const handleButtonPressEnd = (button: ButtonColor) =>
    handleButtonEvent(createMockButtonEvent("released", button));

  const handleRetry = () => {
    clearTimers();
    setIsHolding(false);
    setProgress(0);
    setState("waiting");
    setRecognizedButtons({ white: false, red: false });
    setPressedButtons({ white: false, red: false });
    resetTimeout();
  };

  return {
    state,
    recognizedButtons,
    progress,
    isHolding,
    pressedButtons,
    handleButtonPressStart,
    handleButtonPressEnd,
    handleRetry,
  };
}
