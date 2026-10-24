import { createContext, useCallback, useContext, useRef, type ComponentProps } from "react";
import { Keyboard } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Props = ComponentProps<typeof KeyboardAwareScrollView>;

const FocusedInputContext = createContext<(target: number) => void>(() => undefined);

/** Ask the surrounding form to bring this field above the keyboard. */
export function useScrollFocusedInput() {
  return useContext(FocusedInputContext);
}

export function KeyboardAwareFormScrollView({ children, onKeyboardDidShow, ...props }: Props) {
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const focusedTarget = useRef<number | null>(null);

  const scrollFocusedInput = useCallback(() => {
    const target = focusedTarget.current;
    if (target === null) return;
    // Wait for Android's adjustResize layout and the scroll view's keyboard
    // inset to settle before measuring the focused native input.
    setTimeout(() => scrollRef.current?.scrollToFocusedInput(target, 24, 0), 60);
  }, []);

  const onInputFocus = useCallback((target: number) => {
    focusedTarget.current = target;
    if (Keyboard.isVisible()) scrollFocusedInput();
  }, [scrollFocusedInput]);

  return (
    <FocusedInputContext.Provider value={onInputFocus}>
      <KeyboardAwareScrollView
        {...props}
        ref={scrollRef}
        onKeyboardDidShow={(event) => {
          onKeyboardDidShow?.(event);
          scrollFocusedInput();
        }}
      >
        {children}
      </KeyboardAwareScrollView>
    </FocusedInputContext.Provider>
  );
}
