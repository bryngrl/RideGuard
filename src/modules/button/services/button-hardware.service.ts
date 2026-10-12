import type { ButtonColor, ButtonHardwareEvent } from "../types/button-test";

export interface ButtonHardwareEventSource {
  // BACKEND INTEGRATION:
  // Replace this future event source with the real ESP32/backend subscription.
  // It should report which button (`white` or `red`) was pressed or released.
  subscribe(listener: (event: ButtonHardwareEvent) => void): () => void;
}

// BACKEND INTEGRATION:
// This adapter currently creates local mock events for the Pressable test input.
// Remove it when real hardware events are connected to the test controller.
export function createMockButtonEvent(
  type: ButtonHardwareEvent["type"],
  button: ButtonColor,
): ButtonHardwareEvent {
  return { type, button };
}
