import type { AlertButton, AlertOptions } from "react-native";
import { createStore } from "zustand/vanilla";

type Dialog = { id: number; title: string; message: string; buttons: AlertButton[]; options?: AlertOptions };
let nextId = 0;
export const brandedAlertStore = createStore<{ queue: Dialog[] }>(() => ({ queue: [] }));

/** App-owned dialogs use RideGuard UI; native permission/photo prompts stay native. */
export const BrandedAlert = {
  alert(title: string, message = "", buttons?: AlertButton[], options?: AlertOptions) {
    const actions: AlertButton[] = buttons?.length ? buttons : [{ text: "OK" }];
    // Repeated Back taps must not pile up identical discard confirmations.
    const duplicate = brandedAlertStore.getState().queue.some((dialog) => dialog.title === title && dialog.message === message &&
      dialog.buttons.length === actions.length && dialog.buttons.every((button, index) =>
        button.text === actions[index].text && button.style === actions[index].style));
    if (duplicate) return;
    brandedAlertStore.setState((state) => ({ queue: [...state.queue, {
      id: ++nextId, title, message, buttons: actions, options,
    }] }));
  },
  press(id: number, index: number) {
    const current = brandedAlertStore.getState().queue[0];
    if (current?.id !== id || !current.buttons[index]) return;
    brandedAlertStore.setState((state) => ({ queue: state.queue.slice(1) }));
    // Remove before invoking: repeated taps cannot run a destructive action twice.
    try {
      const result = current.buttons[index].onPress?.();
      Promise.resolve(result).catch(() => BrandedAlert.alert("Action failed", "Please try again."));
    } catch { BrandedAlert.alert("Action failed", "Please try again."); }
  },
  dismiss(id: number) {
    const current = brandedAlertStore.getState().queue[0];
    if (current?.id !== id || current.options?.cancelable === false) return;
    brandedAlertStore.setState((state) => ({ queue: state.queue.slice(1) }));
    current.options?.onDismiss?.();
  },
  clear() { brandedAlertStore.setState({ queue: [] }); },
};
