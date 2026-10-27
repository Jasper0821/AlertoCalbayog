/**
 * Design tokens for the emergency report flow. Calm, high-contrast and built for
 * people under stress: every text colour here passes 4.5:1 on its background.
 */
export const colors = {
  background: "#F3F5F4",
  card: "#FFFFFF",
  border: "#E1E6E3",
  text: "#15201B",
  textSecondary: "#4E5A54",
  medical: "#0B6B4F",
  badgeBg: "#E3F3EC",
  badgeText: "#0B5C43",
  urgent: "#C2361E",
  destructive: "#A12E19",
  inputBorder: "#C9D3CE",
  placeholder: "#6B7580",
  white: "#FFFFFF",
  muted: "#E6ECE9",
  disabled: "#A9B4AE",
  // Status tints: amber while GPS is still searching, red when location is off.
  amberBg: "#FDF1D8",
  amberText: "#7A4A00",
  dangerBg: "#FBE9E5",
  urgentPressed: "#A52C17",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 22,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 24,
} as const;

/** Loaded in App.tsx via @expo-google-fonts/public-sans. */
export const fonts = {
  regular: "PublicSans_400Regular",
  semibold: "PublicSans_600SemiBold",
  bold: "PublicSans_700Bold",
  extrabold: "PublicSans_800ExtraBold",
} as const;

/** Every touchable is at least this tall/wide. */
export const MIN_TOUCH = 44;

/** White card used for every section of the report flow. */
export const card = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.lg,
  padding: spacing.lg,
} as const;

export const cardTitle = {
  fontFamily: fonts.extrabold,
  fontSize: fontSize.lg,
  color: colors.text,
} as const;
