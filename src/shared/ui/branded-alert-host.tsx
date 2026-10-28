import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useStore } from "zustand";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { BrandedAlert, brandedAlertStore } from "@/shared/lib/branded-alert";
import { ConfirmationModal } from "./confirmation-modal";
import { useTheme } from "@/shared/hooks/use-theme";

export function BrandedAlertHost() {
  const dialog = useStore(brandedAlertStore, (state) => state.queue[0]);
  const owner = useAuthStore((state) => state.user?.uid ?? null);
  const previousOwner = useRef(owner);
  const theme = useTheme();
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    if (previousOwner.current !== owner) BrandedAlert.clear();
    previousOwner.current = owner;
  }, [owner]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      // Never carry a destructive dialog over the MPIN lock or another account.
      BrandedAlert.clear();
      setForeground(state === "active");
    });
    return () => subscription.remove();
  }, []);
  const primaryIndex = dialog ? Math.max(0, dialog.buttons.findLastIndex((button) => button.style !== "cancel")) : 0;
  const secondaryIndex = dialog?.buttons.findIndex((_button, index) => index !== primaryIndex) ?? -1;
  return <ConfirmationModal visible={foreground && !!dialog} title={dialog?.title ?? ""} description={dialog?.message ?? ""}
    primaryButtonText={dialog?.buttons[primaryIndex]?.text ?? "OK"}
    secondaryButtonText={secondaryIndex >= 0 ? dialog!.buttons[secondaryIndex].text ?? "Cancel" : undefined}
    primaryButtonColor={dialog?.buttons[primaryIndex]?.style === "destructive" ? theme.error : undefined}
    onPrimaryPress={() => { if (dialog) BrandedAlert.press(dialog.id, primaryIndex); }}
    onSecondaryPress={() => { if (dialog && secondaryIndex >= 0) BrandedAlert.press(dialog.id, secondaryIndex); }}
    onRequestClose={() => { if (dialog) BrandedAlert.dismiss(dialog.id); }} />;
}
