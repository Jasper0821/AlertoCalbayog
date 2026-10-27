import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocateFixed, X } from "lucide-react-native";
import LeafletMap, { type LatLng } from "./LeafletMap";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  visible: boolean;
  /** Where the pin starts: the current pin, else the GPS fix. */
  start: LatLng;
  /** The live GPS fix, for "Use my GPS location". */
  gps: LatLng | null;
  onCancel: () => void;
  /** The chosen point, or null to go back to following GPS. */
  onConfirm: (position: LatLng | null) => void;
}

export default function AdjustPinModal({ visible, start, gps, onCancel, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<LatLng>(start);
  const [usingGps, setUsingGps] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(start);
      setUsingGps(false);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Adjust pin</Text>
            <Text style={styles.subtitle}>Drag the pin, or tap the map where help is needed.</Text>
          </View>
          <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <X size={22} color={colors.text} />
          </Pressable>
        </View>

        {visible && (
          <LeafletMap
            interactive
            position={draft}
            onPinMove={(next) => {
              setDraft(next);
              setUsingGps(false);
            }}
            style={styles.map}
          />
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {gps && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setDraft(gps);
                setUsingGps(true);
              }}
              accessibilityRole="button"
              style={styles.secondary}
            >
              <LocateFixed size={18} color={colors.text} />
              <Text style={styles.secondaryText}>Use my GPS location</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onConfirm(usingGps ? null : draft)}
            accessibilityRole="button"
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Confirm location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    flex: 1,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondary: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  secondaryText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  primary: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.medical,
  },
  primaryText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.lg,
    color: colors.white,
  },
});
