import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../styles/colors";
import {
  PhoneIcon,
  HistoryIcon,
  SettingsIcon,
  LogoutIcon,
  CloseIcon,
  UserIcon,
} from "./SvgIcons";
import EmergencyHotlineSheet from "./EmergencyHotlineSheet";
import { getUser, clearStorage } from "../utils/Storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HamburgerMenuSheet({ visible, onClose }: Props): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [showHotlines, setShowHotlines] = useState(false);
  const [userName, setUserName] = useState<string>("User");
  const [userRole, setUserRole] = useState<string>("Resident");
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      getUser().then((user) => {
        if (user) {
          setUserName(user.fullName || "User");
          setUserRole(user.role ? user.role.toUpperCase() : "RESIDENT");
          setIsVerified(Boolean(user.isEmailVerified || user.googleId || user.authProvider === "google"));
        }
      });

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleNavigate = (screenName: string) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 150);
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            onClose();
            try {
              const { NativeModules } = require("react-native");
              if (NativeModules.RNGoogleSignin) {
                const { GoogleSignin } = require("@react-native-google-signin/google-signin");
                await GoogleSignin.signOut();
              }
            } catch (e) {
              // Ignore
            }
            await clearStorage();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]
    );
  };

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
            { backgroundColor: "rgba(4, 17, 43, 0.65)", opacity: fadeAnim },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Bottom Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handlebar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Alerto Calbayog</Text>
              <Text style={styles.headerSubtitle}>Main Navigation Menu</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <CloseIcon size={26} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <UserIcon size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{userName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{userRole}</Text>
                </View>
                {isVerified && (
                  <View style={[styles.roleBadge, { backgroundColor: "#DCFCE7", marginLeft: 6 }]}>
                    <Text style={[styles.roleBadgeText, { color: "#166534", fontWeight: "900" }]}>
                      ✓ GOOGLE VERIFIED
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Menu Items List */}
          <View style={styles.menuList}>
            {/* 1. Emergency Hotlines */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                setTimeout(() => setShowHotlines(true), 200);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: "#FEF2F2" }]}>
                <PhoneIcon size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Emergency Hotlines</Text>
                <Text style={styles.itemSub}>Direct access to rescue & police numbers</Text>
              </View>
              <Text style={styles.itemArrow}>›</Text>
            </TouchableOpacity>

            {/* 2. Report History */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate("ReportHistory")}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: "#EFF6FF" }]}>
                <HistoryIcon size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Report History</Text>
                <Text style={styles.itemSub}>View status of your previous reports</Text>
              </View>
              <Text style={styles.itemArrow}>›</Text>
            </TouchableOpacity>

            {/* 3. Settings */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate("Settings")}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: "#F3F4F6" }]}>
                <SettingsIcon size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Settings</Text>
                <Text style={styles.itemSub}>Profile picture, account info & password</Text>
              </View>
              <Text style={styles.itemArrow}>›</Text>
            </TouchableOpacity>

            {/* 4. Logout */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: "#FEF2F2" }]}>
                <LogoutIcon size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: "#DC2626" }]}>Logout</Text>
                <Text style={styles.itemSub}>Sign out from your account</Text>
              </View>
              <Text style={[styles.itemArrow, { color: "#DC2626" }]}>›</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* Emergency Hotlines Modal */}
      <EmergencyHotlineSheet
        visible={showHotlines}
        onClose={() => setShowHotlines(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: "#04112B",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  menuList: {
    gap: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutItem: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF5F5",
  },
  itemIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  itemSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  itemArrow: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
});
