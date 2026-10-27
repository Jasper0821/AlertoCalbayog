import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { TriangleAlert } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from "../components/Header";
import HotlineCard from "../components/HotlineCard";
import LocationStatusChip from "../components/LocationStatusChip";
import { getUser } from "../utils/Storage";
import socket, { connectSocket } from "../api/socket";
import { useReportLocation } from "../hooks/useReportLocation";
import { getEmergencyType } from "../constants/emergencyTypes";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { colors, fonts, fontSize, radius, spacing } from "../theme";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
}

// Shortcuts that skip the type list. Keys match the backend's emergencyType enum.
const SHORTCUTS: { key: string; label: string }[] = [
  { key: "fire", label: "Fire" },
  { key: "medical", label: "Medical" },
  { key: "crime", label: "Crime" },
  { key: "flood", label: "Flood" },
];

export default function HomeScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Live GPS status for the chip; the warm fix also means less waiting on the report screen.
  const location = useReportLocation();
  // Tracked by hand: NativeWind drops Pressable style functions on native.
  const [pressed, setPressed] = useState(false);

  // Live report updates for this resident, relayed to the header badge and to
  // the status and notifications screens.
  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getUser();
      const userId = user?._id || user?.id;
      if (!userId || !active) return;

      const joinUserRoom = () => socket.emit("joinRoom", userId);
      socket.off("connect", joinUserRoom);
      socket.on("connect", joinUserRoom);
      connectSocket();

      socket.on("notification", (notif: { title: string; message: string; reportId: string; status: string }) => {
        DeviceEventEmitter.emit("reportStatusUpdated", notif);
      });
    })();

    return () => {
      active = false;
      socket.off("connect");
      socket.off("notification");
      socket.disconnect();
    };
  }, []);

  // The main button may shrink on small phones so the shortcuts stay on screen.
  const size = width < 360 || height < 700 ? 168 : 200;

  const openTypeList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate("ChooseEmergencyType");
  };

  const startReport = (emergencyType: string) => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate("EmergencyReport", { emergencyType });
  };

  return (
    <View style={styles.screen}>
      <Header title="Alerto Calbayog" variant="plain" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <LocationStatusChip
          status={location.status}
          hasPosition={location.position !== null}
          barangay={location.barangay}
          accuracy={location.accuracy}
          onEnable={location.enableLocation}
        />

        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">
            Need help now?
          </Text>
          <Text style={styles.subtitle}>
            Tap the button, then choose what's happening. Your location is shared automatically.
          </Text>
        </View>

        <View style={styles.buttonArea}>
          <View style={[styles.ring, { width: size + 64, height: size + 64, backgroundColor: "#FBE7E2" }]}>
            <View style={[styles.ring, { width: size + 32, height: size + 32, backgroundColor: "#F6D2C9" }]}>
              <Pressable
                onPress={openTypeList}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                accessibilityRole="button"
                accessibilityLabel="Send report"
                accessibilityHint="Opens the list of emergency types"
                style={[
                  styles.mainButton,
                  { width: size, height: size, borderRadius: size / 2 },
                  pressed && styles.mainButtonPressed,
                ]}
              >
                <TriangleAlert size={40} color={colors.white} strokeWidth={2} />
                <Text style={styles.mainLabel} maxFontSizeMultiplier={1.3} numberOfLines={2}>
                  Send report
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.shortcutsLabel}>Or report a specific emergency</Text>
        <View style={styles.shortcuts}>
          {SHORTCUTS.map(({ key, label }) => {
            const type = getEmergencyType(key);
            const Icon = type.Icon;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={key}
                onPress={() => startReport(key)}
                accessibilityRole="button"
                accessibilityLabel={`Report ${label.toLowerCase()} emergency`}
                style={[styles.shortcut, { backgroundColor: type.tint }]}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: type.color }]}>
                  <Icon size={20} color={colors.white} strokeWidth={2} />
                </View>
                <Text style={styles.shortcutLabel} numberOfLines={1} maxFontSizeMultiplier={1.4}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.hotline}>
          <HotlineCard />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  title: {
    textAlign: "center",
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.text,
  },
  subtitle: {
    maxWidth: 300,
    marginTop: spacing.sm,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  // Takes the remaining height so the button sits centred between heading and shortcuts.
  buttonArea: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  ring: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.urgent,
    boxShadow: "0 8px 24px rgba(194, 54, 30, 0.35)",
  },
  mainButtonPressed: {
    backgroundColor: colors.urgentPressed,
    transform: [{ scale: 0.97 }],
  },
  mainLabel: {
    textAlign: "center",
    fontFamily: fonts.extrabold,
    fontSize: fontSize.xxl,
    color: colors.white,
  },
  shortcutsLabel: {
    marginBottom: spacing.sm,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  shortcuts: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  shortcut: {
    flex: 1,
    minHeight: 84,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radius.md,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  hotline: {
    marginTop: spacing.lg,
  },
});
