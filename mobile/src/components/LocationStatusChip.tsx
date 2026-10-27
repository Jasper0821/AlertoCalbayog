import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { LocationStatus } from "../hooks/useReportLocation";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  status: LocationStatus;
  hasPosition: boolean;
  barangay: string;
  accuracy: number | null;
  onEnable: () => void;
}

/** Live GPS state, so residents know their location is ready before they tap. */
export default function LocationStatusChip({ status, hasPosition, barangay, accuracy, onEnable }: Props) {
  if (status === "off") {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onEnable}
        accessibilityRole="button"
        accessibilityLabel="Location off. Tap to enable"
        style={[styles.chip, styles.off]}
      >
        <View style={[styles.dot, { backgroundColor: colors.destructive }]} />
        <Text style={[styles.text, { color: colors.destructive }]}>Location off – tap to enable</Text>
      </TouchableOpacity>
    );
  }

  if (status === "checking" || !hasPosition) {
    return (
      <View style={[styles.chip, styles.finding]} accessibilityLiveRegion="polite">
        <ActivityIndicator size="small" color={colors.amberText} style={styles.spinner} />
        <Text style={[styles.text, { color: colors.amberText }]}>Finding location…</Text>
      </View>
    );
  }

  const parts = ["Location ready"];
  if (barangay) parts.push(`${barangay}, Calbayog`);
  if (accuracy) parts.push(`±${accuracy} m`);

  return (
    <View style={[styles.chip, styles.ready]} accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: colors.medical }]} />
      <Text style={[styles.text, { color: colors.badgeText }]}>{parts.join(" · ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "center",
    maxWidth: "100%",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  ready: {
    backgroundColor: colors.badgeBg,
  },
  finding: {
    backgroundColor: colors.amberBg,
  },
  off: {
    minHeight: 44,
    backgroundColor: colors.dangerBg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spinner: {
    width: 12,
    height: 12,
    transform: [{ scale: 0.7 }],
  },
  text: {
    flexShrink: 1,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
  },
});
