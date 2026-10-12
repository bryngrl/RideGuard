// TODO: gotta clean it up pa 
export const FontFamily = {
  eloquiaExtraBold: "EloquiaDisplay-ExtraBold",
  eloquiaTextLight: "EloquiaText-ExtraLight",

  geistRegular: "Geist-Regular",
  geistMedium: "Geist-Medium",
  geistSemiBold: "Geist-SemiBold",
  geistThin: "Geist-Thin",
} as const;

export const Typography = {
  // Headings
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

  // Body
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

  // UI
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
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.geistMedium,
  },

  // Weight-based styles
  medium: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.geistMedium,
  },
  semibold: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: FontFamily.geistSemiBold,
  },
} as const;