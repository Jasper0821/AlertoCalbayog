import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity } from "react-native";
import { MapPin } from "lucide-react-native";
import LeafletMap, { type LatLng } from "./LeafletMap";
import AdjustPinModal from "./AdjustPinModal";
import BarangayPicker from "./BarangayPicker";
import type { LocationStatus } from "../hooks/useReportLocation";
import { card, cardTitle, colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  status: LocationStatus;
  /** Where the incident is: the hand-placed pin, else the GPS fix. */
  position: LatLng | null;
  gpsPosition: LatLng | null;
  accuracy: number | null;
  pinPlaced: boolean;
  street: string;
  barangay: string;
  resolvingAddress: boolean;
  landmark: string;
  onLandmarkChange: (text: string) => void;
  onPinChange: (position: LatLng | null) => void;
  onBarangayChange: (barangay: string) => void;
  onEnableLocation: () => void;
}

export default function LocationCard({
  status,
  position,
  gpsPosition,
  accuracy,
  pinPlaced,
  street,
  barangay,
  resolvingAddress,
  landmark,
  onLandmarkChange,
  onPinChange,
  onBarangayChange,
  onEnableLocation,
}: Props) {
  const [adjusting, setAdjusting] = useState(false);
  const [pickingBarangay, setPickingBarangay] = useState(false);

  const badge =
    status === "off"
      ? { text: "Location off", tone: "warn" as const }
      : !position
      ? { text: "Finding your location…", tone: "neutral" as const }
      : pinPlaced
      ? { text: "Pin set by you", tone: "ok" as const }
      : { text: accuracy ? `GPS locked · ±${accuracy} m` : "GPS locked", tone: "ok" as const };

  return (
    <View style={card}>
      <View style={styles.titleRow}>
        <Text style={cardTitle}>Where are you?</Text>
        <View
          style={[styles.badge, badge.tone === "warn" && styles.badgeWarn, badge.tone === "neutral" && styles.badgeNeutral]}
          accessibilityLiveRegion="polite"
        >
          {badge.tone === "neutral" ? (
            <ActivityIndicator size="small" color={colors.textSecondary} style={styles.badgeSpinner} />
          ) : (
            <View style={[styles.badgeDot, badge.tone === "warn" && styles.badgeDotWarn]} />
          )}
          <Text style={[styles.badgeText, badge.tone === "warn" && styles.badgeTextWarn, badge.tone === "neutral" && styles.badgeTextNeutral]}>
            {badge.text}
          </Text>
        </View>
      </View>

      {status === "off" ? (
        <View style={styles.offBox}>
          <Text style={styles.offTitle}>Turn on location to send</Text>
          <Text style={styles.offText}>
            Responders find you by your phone's GPS. Turn it on and allow location for Alerto Calbayog.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onEnableLocation}
            accessibilityRole="button"
            style={styles.offButton}
          >
            <MapPin size={18} color={colors.white} />
            <Text style={styles.offButtonText}>Turn on location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.mapFrame} pointerEvents="none">
            {position ? (
              <LeafletMap position={position} accuracy={pinPlaced ? null : accuracy} style={styles.map} />
            ) : (
              <View style={[styles.map, styles.mapPlaceholder]}>
                <ActivityIndicator color={colors.medical} />
              </View>
            )}
          </View>

          <View style={styles.addressRow}>
            <View style={styles.addressText}>
              <Text style={styles.street} numberOfLines={2}>
                {street || (resolvingAddress ? "Finding your address…" : "Street not detected")}
              </Text>
              <Pressable
                onPress={() => setPickingBarangay(true)}
                accessibilityRole="button"
                accessibilityLabel={barangay ? `Barangay ${barangay}. Change barangay` : "Choose barangay"}
                hitSlop={8}
              >
                <Text style={styles.barangay}>
                  {barangay ? `Brgy. ${barangay}, Calbayog City · ` : "Barangay not detected · "}
                  <Text style={styles.link}>{barangay ? "Change" : "Choose"}</Text>
                </Text>
              </Pressable>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAdjusting(true)}
              disabled={!position}
              accessibilityRole="button"
              accessibilityState={{ disabled: !position }}
              style={[styles.adjust, !position && styles.adjustDisabled]}
            >
              <Text style={styles.adjustText}>Adjust pin</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.label}>
        Nearest landmark <Text style={styles.labelHint}>· helps responders on the last stretch</Text>
      </Text>
      <TextInput
        value={landmark}
        onChangeText={onLandmarkChange}
        placeholder="e.g. beside the blue water tank"
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        maxLength={120}
        returnKeyType="done"
        accessibilityLabel="Nearest landmark"
      />

      {adjusting && position && (
        <AdjustPinModal
          visible
          start={position}
          gps={gpsPosition}
          onCancel={() => setAdjusting(false)}
          onConfirm={(next) => {
            setAdjusting(false);
            onPinChange(next);
          }}
        />
      )}

      <BarangayPicker
        visible={pickingBarangay}
        current={barangay}
        onClose={() => setPickingBarangay(false)}
        onSelect={(value) => {
          setPickingBarangay(false);
          onBarangayChange(value);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.badgeBg,
    flexShrink: 1,
  },
  badgeWarn: {
    backgroundColor: "#FBE9E5",
  },
  badgeNeutral: {
    backgroundColor: colors.background,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.medical,
  },
  badgeDotWarn: {
    backgroundColor: colors.destructive,
  },
  badgeSpinner: {
    transform: [{ scale: 0.7 }],
    width: 12,
    height: 12,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    color: colors.badgeText,
  },
  badgeTextWarn: {
    color: colors.destructive,
  },
  badgeTextNeutral: {
    color: colors.textSecondary,
  },
  mapFrame: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  map: {
    height: 128,
  },
  mapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  addressText: {
    flex: 1,
  },
  street: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  barangay: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  link: {
    fontFamily: fonts.bold,
    color: colors.badgeText,
    textDecorationLine: "underline",
  },
  adjust: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustDisabled: {
    opacity: 0.5,
  },
  adjustText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  offBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: "#FBE9E5",
    gap: spacing.sm,
  },
  offTitle: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.destructive,
  },
  offText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 19,
    color: colors.text,
  },
  offButton: {
    marginTop: spacing.xs,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.destructive,
  },
  offButtonText: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.md,
    color: colors.white,
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  labelHint: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
