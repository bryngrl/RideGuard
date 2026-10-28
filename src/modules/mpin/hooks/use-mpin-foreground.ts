import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useMpinForeground() {
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => listener.remove();
  }, []);
  return foreground;
}
