import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { COLORS } from "../styles/colors";
import { PhoneIcon, MessageIcon, CloseIcon, ShieldCheckIcon } from "./SvgIcons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────────
interface HotlineEntry {
  agency: string;
  number: string;         // display number (e.g. "0905-4254-511")
  dialNumber: string;     // tel-ready (e.g. "+639054254511")
  icon: string;
  color: string;
  category: string;
}

interface ActionSheetProps {
  visible: boolean;
  hotline: HotlineEntry | null;
  onClose: () => void;
}

// ── Haptic helper (uses built-in Vibration API) ──────────────
const triggerHaptic = () => {
  try {
    if (Platform.OS !== "web") {
      const { Vibration } = require("react-native");
      Vibration.vibrate(50);
    }
  } catch {
    // silently ignore
  }
};

// ── Bottom Action Sheet ──────────────────────────────────────
function ActionSheet({ visible, hotline, onClose }: ActionSheetProps): React.JSX.Element | null {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  // Debounced action handler – prevents accidental double-taps
  const handleAction = useCallback(
    async (url: string) => {
      if (busy) return;
      setBusy(true);
      triggerHaptic();

      try {
        await Linking.openURL(url);
      } catch (err) {
        console.warn("Failed to open URL:", err);
      }

      // Re-enable after 1.5s to prevent rapid repeat presses
      setTimeout(() => setBusy(false), 1500);
    },
    [busy]
  );

  if (!hotline) return null;

  const callUrl = `tel:${hotline.dialNumber}`;
  const smsUrl = Platform.select({
    ios: `sms:${hotline.dialNumber}&body=${encodeURIComponent(
      "Emergency Alert: I need assistance from ALERTO CALBAYOG system."
    )}`,
    default: `sms:${hotline.dialNumber}?body=${encodeURIComponent(
      "Emergency Alert: I need assistance from ALERTO CALBAYOG system."
    )}`,
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(4,17,43,0.72)", opacity: backdropAnim },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>Emergency Action</Text>
            <Text style={styles.sheetSubtitle}>{hotline.agency}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close action sheet"
          >
            <CloseIcon size={28} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Selected number display */}
        <View style={[styles.numberDisplay, { borderColor: hotline.color + "30" }]}>
          <View style={[styles.numberIconWrap, { backgroundColor: hotline.color + "15" }]}>
            <Text style={{ fontSize: 28 }}>{hotline.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.numberLabel}>Selected Hotline</Text>
            <Text style={[styles.numberValue, { color: hotline.color }]}>
              {hotline.number}
            </Text>
            <Text style={styles.categoryLabel}>{hotline.category}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* CALL BUTTON — Primary */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={() => handleAction(callUrl)}
            disabled={busy}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Call ${hotline.agency} at ${hotline.number}`}
            accessibilityHint="Opens phone dialer with the emergency number"
          >
            <View style={styles.actionBtnInner}>
              <View style={styles.actionIconWrap}>
                <PhoneIcon size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.callBtnLabel}>Call Now</Text>
                <Text style={styles.callBtnSub}>Opens phone dialer</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* SMS BUTTON — Secondary */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.smsBtn]}
            onPress={() => handleAction(smsUrl!)}
            disabled={busy}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Send SMS to ${hotline.agency} at ${hotline.number}`}
            accessibilityHint="Opens messaging app with pre-filled emergency message"
          >
            <View style={styles.actionBtnInner}>
              <View style={[styles.actionIconWrap, styles.smsIconWrap]}>
                <MessageIcon size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smsBtnLabel}>Send SMS</Text>
                <Text style={styles.smsBtnSub}>Pre-filled emergency message</Text>
              </View>
              <Text style={[styles.actionArrow, { color: COLORS.primary }]}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningRow}>
          <ShieldCheckIcon size={16} color={COLORS.red} />
          <Text style={styles.warningText}>
            Use only for real emergencies.
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Hotlines Data ────────────────────────────────────────────
const HOTLINES: HotlineEntry[] = [
  {
    agency: "PNP Calbayog",
    number: "0905-4254-511",
    dialNumber: "+639054254511",
    icon: "🚓",
    color: "#3B82F6",
    category: "Police · Law Enforcement",
  },
  {
    agency: "BFP Calbayog",
    number: "0927-1279-488",
    dialNumber: "+639271279488",
    icon: "🚒",
    color: "#EF4444",
    category: "Fire · Rescue Services",
  },
  {
    agency: "CDRRMO",
    number: "0917-1779-215",
    dialNumber: "+639171779215",
    icon: "🚑",
    color: "#10B981",
    category: "Disaster · Medical Response",
  },
  {
    agency: "National Emergency",
    number: "911",
    dialNumber: "911",
    icon: "🆘",
    color: "#B91C1C",
    category: "National Emergency Hotline",
  },
  {
    agency: "Red Cross Samar",
    number: "143",
    dialNumber: "143",
    icon: "🏥",
    color: "#DC2626",
    category: "Humanitarian Aid",
  },
];

// ── Main Component ───────────────────────────────────────────
interface EmergencyHotlineSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmergencyHotlineSheet({
  visible,
  onClose,
}: EmergencyHotlineSheetProps): React.JSX.Element {
  const [selectedHotline, setSelectedHotline] = useState<HotlineEntry | null>(null);
  const [showAction, setShowAction] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleSelectHotline = useCallback((hotline: HotlineEntry) => {
    triggerHaptic();
    setSelectedHotline(hotline);
    setShowAction(true);
  }, []);

  const handleCloseAction = useCallback(() => {
    setShowAction(false);
    setSelectedHotline(null);
  }, []);

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(4,17,43,0.65)", opacity: fadeAnim },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Main bottom sheet */}
        <Animated.View
          style={[
            styles.mainSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.mainHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.mainTitleEmergency}>Emergency</Text>
              </View>
              <Text style={styles.mainTitleHotlines}>Hotlines</Text>
              <Text style={styles.mainSubtitle}>
                Tap a hotline to call or send SMS
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.mainCloseBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close emergency hotlines"
            >
              <CloseIcon size={30} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Hotline Cards */}
          <View style={styles.hotlineList}>
            {HOTLINES.map((hotline, index) => (
              <TouchableOpacity
                key={index}
                style={styles.hotlineCard}
                onPress={() => handleSelectHotline(hotline)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${hotline.agency}, ${hotline.number}. ${hotline.category}`}
                accessibilityHint="Tap to call or send SMS"
              >
                {/* Left color accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: hotline.color }]} />

                {/* Icon */}
                <View style={[styles.cardIcon, { backgroundColor: hotline.color + "12" }]}>
                  <Text style={{ fontSize: 26 }}>{hotline.icon}</Text>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardAgency}>{hotline.agency}</Text>
                  <Text style={[styles.cardNumber, { color: hotline.color }]}>
                    {hotline.number}
                  </Text>
                  <Text style={styles.cardCategory}>{hotline.category}</Text>
                </View>

                {/* Arrow */}
                <View style={[styles.cardArrowWrap, { backgroundColor: hotline.color + "12" }]}>
                  <Text style={[styles.cardArrow, { color: hotline.color }]}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer warning */}
          <View style={styles.footerWarning}>
            <ShieldCheckIcon size={14} color={COLORS.red} />
            <Text style={styles.footerWarningText}>
              For real emergencies only · ALERTO CALBAYOG
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Action Sheet (Call / SMS) */}
      <ActionSheet
        visible={showAction}
        hotline={selectedHotline}
        onClose={handleCloseAction}
      />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* ── Shared ── */
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },

  /* ── Main Sheet ── */
  mainSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    shadowColor: "#04112B",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mainTitleEmergency: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 1,
  },
  mainTitleHotlines: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.red,
    marginTop: -2,
  },
  mainSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "500",
  },
  mainCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  /* ── Hotline Cards ── */
  hotlineList: {
    gap: 10,
  },
  hotlineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#0A1E3F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardAgency: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardCategory: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  cardArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardArrow: {
    fontSize: 22,
    fontWeight: "700",
  },

  /* ── Footer ── */
  footerWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerWarningText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  /* ── Action Sheet ── */
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    shadowColor: "#04112B",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 25,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  /* ── Number Display ── */
  numberDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
  },
  numberIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  numberLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  numberValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  categoryLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },

  /* ── Action Buttons ── */
  actionsContainer: {
    gap: 12,
  },
  actionBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  actionBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  smsIconWrap: {
    backgroundColor: COLORS.primary + "12",
  },
  actionArrow: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    opacity: 0.7,
  },

  /* Call button */
  callBtn: {
    backgroundColor: "#B91C1C",
    shadowColor: "#B91C1C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  callBtnLabel: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  callBtnSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginTop: 1,
  },

  /* SMS button */
  smsBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  smsBtnLabel: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.primary,
  },
  smsBtnSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 1,
  },

  /* ── Warning ── */
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.red,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
