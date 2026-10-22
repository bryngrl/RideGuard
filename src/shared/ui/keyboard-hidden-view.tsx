import React, { useEffect, useState } from "react";
import { Keyboard, View, type ViewProps } from "react-native";

/** Bottom actions stay at their resting position instead of following the keyboard. */
export function KeyboardHiddenView({ children, ...props }: ViewProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    const willShow = Keyboard.addListener("keyboardWillShow", () => setKeyboardVisible(true));
    const willHide = Keyboard.addListener("keyboardWillHide", () => setKeyboardVisible(false));

    return () => {
      show.remove();
      hide.remove();
      willShow.remove();
      willHide.remove();
    };
  }, []);

  if (keyboardVisible) return null;
  return <View {...props}>{children}</View>;
}
