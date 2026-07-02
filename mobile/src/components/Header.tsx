import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, BellIcon, HistoryIcon } from "./SvgIcons";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import EmergencyHotlineSheet from "./EmergencyHotlineSheet";

interface Props {
  title: string;
  showBack?: boolean;
  showActions?: boolean;
}

export default function Header({
  title,
  showBack,
  showActions = true,
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
            accessibilityLabel="Open emergency hotlines"
          >
            <Text className="text-primary text-lg">☰</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate("ReportHistory" as never)}
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
            activeOpacity={0.8}
          >
            <HistoryIcon size={20} color={COLORS.primary} />
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

      {/* Emergency Hotline Bottom Sheet */}
      <EmergencyHotlineSheet
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
