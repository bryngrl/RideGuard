import { useLayoutEffect, useState } from "react";
import { Modal, type ModalProps } from "react-native";
import { registerAppModal } from "@/shared/lib/app-modal-visibility";

/** Register before showing the native dialog so its focus change cannot hide the page. */
export function AppModal({ visible = true, ...props }: ModalProps) {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    if (!visible) { setReady(false); return; }
    const release = registerAppModal();
    setReady(true);
    return release;
  }, [visible]);
  return <Modal {...props} visible={visible && ready} />;
}
