import "@/global.css";

import { Platform } from "react-native";

export const BrandColors = {
  primary: "#1A2B4C",
  secondary: "#FFFFFF",
  accent: "#0046CE",
  error: "#FF0000",
  success: "#00D107",
  warning: "#E9A000",
} as const;

export const Colors = {
  light: {
    primary: BrandColors.primary,
    secondary: BrandColors.secondary,
    accent: BrandColors.accent,
    text: "#1A2B4C",
    textSecondary: BrandColors.secondary,
    textMuted: "#9C9C9C",
    textInverse: "#FFFFFF",
    background: "#FFFFFF",
    backgroundElement: "#F8FAFC",
    backgroundSelected: "#EEF2F6",
    card: "#FFFFFF",
    border: "#D9D9D9",
    borderFocus: BrandColors.accent,
    inputBackground: "#FFFFFF",
    buttonMuted: "#767676",
    error: BrandColors.error,
    success: BrandColors.success,
    warning: BrandColors.warning,
  },
  //BLOCKED: dark themes (MESSY PA DARK THEME)
  dark: {
    primary: "#3B82F6",
    secondary: BrandColors.secondary,
    accent: "#60A5FA",
    text: "#FFFFFF",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textInverse: "#1A2B4C",
    background: "#0D1525",
    backgroundElement: "#152037",
    backgroundSelected: "#1E2D4E",
    card: "#152037",
    border: "#2A3A5E",
    borderFocus: "#60A5FA",
    inputBackground: "#101A2F",
    error: "#F87171",
    success: "#34D399",
    warning: "#FBBF24",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const FontFamily = {
  eloquiaExtraBold: "EloquiaDisplay-ExtraBold",
  eloquiaTextLight: "EloquiaText-ExtraLight",
  geistRegular: "Geist-Regular",
  geistMedium: "Geist-Medium",
  geistSemiBold: "Geist-SemiBold",
  geistThin: "Geist-Thin",
};

export const Typography = {
  largeTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: FontFamily.eloquiaExtraBold,
  },
  h1: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: FontFamily.geistSemiBold,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FontFamily.geistSemiBold,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FontFamily.geistSemiBold,
  },
  h4: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: FontFamily.geistSemiBold,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamily.geistRegular,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.geistRegular,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.geistRegular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.geistMedium,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: FontFamily.geistSemiBold,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontFamily: FontFamily.geistMedium,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FontFamily.geistRegular,
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
