import { createContext, useCallback, useContext, useEffect, useRef, useState, type RefObject } from "react";
import { Keyboard, Platform, ScrollView, UIManager, View, type KeyboardEvent, type ScrollViewProps } from "react-native";
import { keyboardScrollPosition } from "./keyboard-scroll-position";

type FocusField = (target: number, field?: RefObject<View | null>) => void;
type Props = ScrollViewProps & { keyboardGap?: number };

const FocusedInputContext = createContext<FocusField>(() => undefined);

/** Register a native input, optionally measuring its label and error with it. */
export function useScrollFocusedInput() {
  return useContext(FocusedInputContext);
}

export function KeyboardAwareFormScrollView({
  children, contentContainerStyle, keyboardGap = 20, onScroll, onContentSizeChange, ...props
}: Props) {
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const focused = useRef<{ target: number; field?: RefObject<View | null> } | null>(null);
  const scrollY = useRef(0);
  const contentHeight = useRef(0);
  const keyboardTop = useRef<number | null>(Keyboard.metrics()?.screenY ?? null);
  const frame = useRef<number | null>(null);
  const mounted = useRef(true);
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible());
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);
  const keyboardOpen = useRef(Keyboard.isVisible());

  const reveal = useCallback(() => {
    const current = focused.current;
    if (!mounted.current || !keyboardOpen.current || !current) return;
    viewportRef.current?.measureInWindow((_x, viewportTop, _width, height) => {
      if (!mounted.current || current !== focused.current || height <= 0) return;
      const measureField = (callback: (top: number, height: number) => void) => {
        if (current.field) {
          current.field.current?.measureInWindow((_fx, top, _fw, fieldHeight) => callback(top, fieldHeight));
          return;
        }
        UIManager.measureInWindow(current.target, (_fx, top, _fw, fieldHeight) => callback(top, fieldHeight));
      };
      measureField((fieldTop, fieldHeight) => {
        if (!mounted.current || current !== focused.current || fieldHeight <= 0) return;
        const { overlap, target } = keyboardScrollPosition({
          fieldTop, fieldHeight, viewportTop, viewportHeight: height,
          keyboardTop: keyboardTop.current, gap: keyboardGap,
          scrollY: scrollY.current, contentHeight: contentHeight.current,
        });
        setKeyboardOverlap((previous) => previous === overlap ? previous : overlap);
        if (Math.abs(target - scrollY.current) > 1) scrollRef.current?.scrollTo({ y: target, animated: true });
      });
    });
  }, [keyboardGap]);

  const scheduleReveal = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      reveal();
    });
  }, [reveal]);

  const onInputFocus = useCallback<FocusField>((target, field) => {
    focused.current = { target, field };
    if (keyboardOpen.current) scheduleReveal();
  }, [scheduleReveal]);

  useEffect(() => {
    mounted.current = true;
    const show = (event: KeyboardEvent) => {
      keyboardOpen.current = true;
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardVisible(true);
      scheduleReveal();
    };
    const hide = () => {
      keyboardOpen.current = false;
      keyboardTop.current = null;
      setKeyboardVisible(false);
      setKeyboardOverlap(0);
    };
    const subscriptions = [
      Keyboard.addListener("keyboardDidShow", show),
      Keyboard.addListener("keyboardDidHide", hide),
      Keyboard.addListener("keyboardDidChangeFrame", show),
      ...(Platform.OS === "ios" ? [Keyboard.addListener("keyboardWillChangeFrame", show)] : []),
    ];
    return () => {
      mounted.current = false;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [scheduleReveal]);

  return (
    <FocusedInputContext.Provider value={onInputFocus}>
      <View ref={viewportRef} style={{ flex: 1 }} onLayout={() => {
        if (keyboardOpen.current) scheduleReveal();
      }}>
        <ScrollView {...props} ref={scrollRef} style={[{ flex: 1 }, props.style]}
          contentContainerStyle={contentContainerStyle}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollY.current = event.nativeEvent.contentOffset.y;
            onScroll?.(event);
          }}
          onContentSizeChange={(width, height) => {
            contentHeight.current = height;
            onContentSizeChange?.(width, height);
            if (keyboardOpen.current) scheduleReveal();
          }}>
          {children}
          {keyboardVisible ? <View style={{ height: keyboardGap + keyboardOverlap }} /> : null}
        </ScrollView>
      </View>
    </FocusedInputContext.Provider>
  );
}
