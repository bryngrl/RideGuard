import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { AppModal as Modal } from "@/shared/ui/app-modal";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { CustomTextInput } from "@/shared/ui/text-input";

const RELATIONSHIPS = ["Parent", "Sibling", "Spouse", "Child", "Friend", "Other"];
const MENU_HEIGHT = RELATIONSHIPS.length * 44;

interface RelationshipPickerProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function RelationshipPicker({ value, error, onChange }: RelationshipPickerProps) {
  const theme = useTheme();
  const anchorRef = useRef<View>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { height: screenHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number }>({
    x: Spacing.four, y: 0, width: 0, height: 0,
  });
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reducedMotion ? Number(open) : withTiming(Number(open), {
      duration: open ? 180 : 150,
      easing: Easing.out(Easing.cubic),
    });
    if (!open && mounted) {
      const timeout = setTimeout(() => setMounted(false), reducedMotion ? 0 : 150);
      return () => clearTimeout(timeout);
    }
  }, [open, mounted, progress, reducedMotion]);

  useEffect(() => () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
  }, []);

  const menuMotion = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -6 }],
  }));

  const show = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const measureAndOpen = () => {
      anchorRef.current?.measureInWindow((x, y, width, height) => {
        setAnchor({ x, y, width, height });
        setMounted(true);
        setOpen(true);
      });
    };
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      openTimerRef.current = setTimeout(measureAndOpen, 180);
    } else {
      measureAndOpen();
    }
  };

  const menuTop = anchor.y + anchor.height + 4 + MENU_HEIGHT <= screenHeight
    ? anchor.y + anchor.height + 4
    : Math.max(8, anchor.y - MENU_HEIGHT - 4);

  return (
    <View ref={anchorRef}>
      <CustomTextInput
        onFieldPress={show}
        label="Relationship"
        required
        value={value}
        error={error}
        editable={false}
        rightIcon={<Ionicons name={open ? "caret-up" : "caret-down"} size={12} color={theme.textMuted} />}
        containerStyle={{ paddingBottom: 0 }}
      />
      <Modal
        transparent
        visible={mounted}
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Close relationships" />
          <Animated.View
            style={[
              styles.menu,
              { top: menuTop, left: anchor.x, width: anchor.width, backgroundColor: theme.inputBackground, borderColor: theme.border },
              menuMotion,
            ]}
          >
            {RELATIONSHIPS.map((item) => (
              <Pressable
                key={item}
                style={styles.option}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: value === item }}
              >
                <Text style={[Typography.body, { color: theme.text }]}>{item}</Text>
                {value === item ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    overflow: "hidden",
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  option: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
});
