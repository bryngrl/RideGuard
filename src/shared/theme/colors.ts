export const BrandColors = {
  primary: "#1A2B4C",
  secondary: "#FFFFFF",
  accent: "#0046CE",
  error: "#D81A1A",
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
    textInactive: "#C4C4C4",
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
    errorBackground: "#FDE2E2",
    success: BrandColors.success,
    warning: BrandColors.warning,
  },

  // BLOCKED: dark theme
  dark: {
    primary: "#3B82F6",
    secondary: BrandColors.secondary,
    accent: "#60A5FA",

    text: "#FFFFFF",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textInactive: "#C4C4C4",
    textInverse: "#1A2B4C",

    background: "#0D1525",
    backgroundElement: "#152037",
    backgroundSelected: "#1E2D4E",
    card: "#152037",

    border: "#2A3A5E",
    borderFocus: "#60A5FA",

    inputBackground: "#101A2F",

    error: "#F87171",
    errorBackground: "#451A1A",
    success: "#34D399",
    warning: "#FBBF24",
  },
} as const;

export type ThemeColor =
  keyof typeof Colors.light & keyof typeof Colors.dark;