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
    inputErrorBackground: "#FFF6F6",
    buttonMuted: "#767676",
    switchOff: "#E2E4E8",
    radioMuted: "#8A8A8A",
    infoBackground: "#F5F8FF",
    contactGradientStart: "#FFFFFF",
    contactGradientEnd: "#E5EDFC",
    previewLightBackground: "#FFFFFF",
    previewDarkBackground: "#000000",
    previewMuted: "#D9D9D9",
    previewGreen: "#00D107",
    previewBlue: "#0046CE",
    switchThumb: "#FFFFFF",
    switchShadow: "#000000",

    error: BrandColors.error,
    errorBackground: "#FDE2E2",
    success: BrandColors.success,
    warning: BrandColors.warning,
    // Alerts-Cards-Warning
    warningHeader: "#BF5300",
    warningStroke: "#FFEFC0",
    warningSubHeader: "#9A6943",
    warningBackground: "#FFFAF0",
    // Alerts-Cards-Danger
    dangerHeader: "#D81A1A",
    dangerStroke: "#FECACA",
    dangerSubHeader: "#CE3838",
    dangerBackground: "#FEF2F2",
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
    inputErrorBackground: "#392126",
    buttonMuted: "#64748B",
    switchOff: "#475569",
    radioMuted: "#94A3B8",
    infoBackground: "#1E2D4E",
    contactGradientStart: "#152037",
    contactGradientEnd: "#243A63",
    previewLightBackground: "#FFFFFF",
    previewDarkBackground: "#000000",
    previewMuted: "#64748B",
    previewGreen: "#34D399",
    previewBlue: "#60A5FA",
    switchThumb: "#FFFFFF",
    switchShadow: "#000000",

    error: "#F87171",
    errorBackground: "#451A1A",
    success: "#34D399",
    warning: "#FBBF24",
    // Alerts-Cards-Warning
    warningHeader: "#BF5300",
    warningStroke: "#FFEFC0",
    warningSubHeader: "#9A6943",
    warningBackground: "#FFFAF0",
    // Alerts-Cards-Danger
    dangerHeader: "#D81A1A",
    dangerStroke: "#FECACA",
    dangerSubHeader: "#CE3838",
    dangerBackground: "#FEF2F2",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
