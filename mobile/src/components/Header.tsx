import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, BellIcon } from "./SvgIcons";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import HamburgerMenuSheet from "./HamburgerMenuSheet";
import { Bell, Menu } from "lucide-react-native";
import * as theme from "../theme";

interface Props {
  title: string;
  showBack?: boolean;
  showActions?: boolean;
  /** "plain": flat white bar used by the redesigned home screen. */
  variant?: "default" | "plain";
}

export default function Header({
  title,
  showBack,
  showActions = true,
  variant = "default",
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isModalVisible, setModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const res = await api.get("/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.log("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    if (!showActions) return;

    fetchUnreadCount();

    const subStatus = DeviceEventEmitter.addListener("reportStatusUpdated", () => {
      fetchUnreadCount();
    });

    const subRead = DeviceEventEmitter.addListener("notificationsRead", () => {
      fetchUnreadCount();
    });

    return () => {
      subStatus.remove();
      subRead.remove();
    };
  }, [showActions]);

  if (variant === "plain") {
    const badge = unreadCount > 99 ? "99+" : String(unreadCount);
    return (
      <>
        <View style={[plain.bar, { paddingTop: insets.top + 8 }]}>
          <Text style={plain.title} accessibilityRole="header">
            {title}
          </Text>
          {showActions && (
            <View style={plain.actions}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications" as never)}
                accessibilityRole="button"
                accessibilityLabel={unreadCount > 0 ? `Notifications, ${badge} unread` : "Notifications"}
                style={plain.icon}
              >
                <Bell size={22} color={theme.colors.text} strokeWidth={2} />
                {unreadCount > 0 && (
                  <View style={plain.badge}>
                    <Text style={plain.badgeText}>{badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Menu"
                style={plain.icon}
              >
                <Menu size={24} color={theme.colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <HamburgerMenuSheet visible={isModalVisible} onClose={() => setModalVisible(false)} />
      </>
    );
  }

  return (
    <>
      <View
        className="pb-6 px-5 w-full flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <View className="flex-row items-center flex-1">
          {showBack && (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-surface border border-border"
              style={styles.backButton}
            >
              <ArrowLeftIcon size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <View>
            <Text className="text-primary text-2xl font-black tracking-tight">{title}</Text>
            <View className="w-8 h-1 bg-primary rounded-full mt-1" />
          </View>
        </View>
        
        {showActions && (
        <View className="flex-row gap-3">
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Text className="text-primary text-lg font-bold">☰</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Notifications" as never)}
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center relative"
            activeOpacity={0.8}
          >
            <BellIcon size={20} color={COLORS.primary} />
            {unreadCount > 0 && (
              <View 
                style={{ backgroundColor: COLORS.red }} 
                className="absolute -top-1 -right-1 rounded-full h-5 min-w-[20px] items-center justify-center px-1 border border-white"
              >
                <Text className="text-white text-[10px] font-black">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        )}
      </View>

      {/* Hamburger Menu Sheet */}
      <HamburgerMenuSheet
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const plain = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    flexShrink: 1,
    fontFamily: theme.fonts.extrabold,
    fontSize: 19,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: "row",
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.urgent,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  badgeText: {
    fontFamily: theme.fonts.extrabold,
    fontSize: 10,
    color: theme.colors.white,
  },
});

const styles = StyleSheet.create({
  backButton: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
