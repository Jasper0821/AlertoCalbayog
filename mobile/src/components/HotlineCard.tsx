import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Phone } from "lucide-react-native";
import { HOTLINES } from "./EmergencyHotlineSheet";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

const CDRRMO = HOTLINES.find((h) => h.agency === "CDRRMO");

/** Fallback for residents with no data signal: a phone call still works. */
export default function HotlineCard() {
  if (!CDRRMO) return null;
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>No signal or need to talk?</Text>
        <Text style={styles.text}>Call CDRRMO directly</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => Linking.openURL(`tel:${CDRRMO.dialNumber}`)}
        accessibilityRole="button"
        accessibilityLabel={`Call CDRRMO now, ${CDRRMO.number}`}
        style={styles.button}
      >
        <Phone size={18} color={colors.white} strokeWidth={2} />
        <Text style={styles.buttonText}>Call now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.text,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  text: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: "#C9D3CE",
  },
  button: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.urgent,
  },
  buttonText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.white,
  },
});
