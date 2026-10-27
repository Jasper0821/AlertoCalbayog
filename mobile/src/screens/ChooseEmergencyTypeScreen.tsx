import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HotlineCard from "../components/HotlineCard";
import { getEmergencyType } from "../constants/emergencyTypes";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, "ChooseEmergencyType">;
}

// Keys match the backend's emergencyType enum. "Other" sits below the grid.
const GRID: { key: string; label: string }[] = [
  { key: "fire", label: "Fire" },
  { key: "medical", label: "Medical" },
  { key: "crime", label: "Crime" },
  { key: "flood", label: "Flood" },
];

/** Opened from the home screen's Send report button. */
export default function ChooseEmergencyTypeScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const startReport = (emergencyType: string) => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate("EmergencyReport", { emergencyType });
  };

  const other = getEmergencyType("others");
  const OtherIcon = other.Icon;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <ChevronLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Choose emergency type
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What's happening?</Text>
        <Text style={styles.subtitle}>Tap one to start your report. Your location is shared when you send.</Text>

        <View style={styles.grid}>
          {GRID.map(({ key, label }) => {
            const type = getEmergencyType(key);
            const Icon = type.Icon;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={key}
                onPress={() => startReport(key)}
                accessibilityRole="button"
                accessibilityLabel={`${label}. ${type.hint}`}
                style={[styles.tile, { backgroundColor: type.tint, borderColor: type.tintBorder }]}
              >
                <View style={[styles.tileIcon, { backgroundColor: type.color }]}>
                  <Icon size={24} color={colors.white} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.tileLabel}>{label}</Text>
                  <Text style={styles.tileHint}>{type.hint}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => startReport("others")}
          accessibilityRole="button"
          accessibilityLabel={`Other or not sure. ${other.hint}`}
          style={styles.otherRow}
        >
          <View style={styles.otherIcon}>
            <OtherIcon size={22} color={colors.text} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.otherLabel}>Other or not sure</Text>
            <Text style={styles.tileHint}>{other.hint}</Text>
          </View>
          <ChevronRight size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.spacer} />
        <HotlineCard />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingRight: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flexShrink: 1,
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
    marginTop: spacing.lg,
  },
  tile: {
    width: "48.5%",
    minHeight: 132,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  tileHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  otherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  otherIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
  },
  otherLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  spacer: {
    flexGrow: 1,
    minHeight: spacing.xl,
  },
});
