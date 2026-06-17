import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, DeviceEventEmitter } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, BellIcon, HistoryIcon } from "./SvgIcons";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";

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

  const hotlines = [
    { agency: "PNP CALBAYOG", number: "117 / 0905-4254-511", icon: "🚓" },
    { agency: "BFP CALBAYOG", number: "911 / 0927-1279-488", icon: "🚒" },
    { agency: "CDRRMO", number: "0917-1779-215", icon: "🚑" },
  ];

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/70 justify-center items-center px-6"
          onPress={() => setModalVisible(false)}
        >
          <Pressable 
            className="w-full bg-surface border border-border rounded-3xl p-6"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-primary text-2xl font-black">Emergency</Text>
                <Text className="text-red text-xl font-bold">Hotlines</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="w-10 h-10 rounded-full bg-background border border-border items-center justify-center"
              >
                <Text className="text-primary text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              {hotlines.map((hotline, index) => (
                <View 
                  key={index} 
                  className="flex-row items-center bg-background border border-border rounded-2xl p-4"
                >
                  <View className="w-12 h-12 rounded-full bg-surface items-center justify-center mr-4">
                    <Text className="text-2xl">{hotline.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-textGray font-semibold mb-1">{hotline.agency}</Text>
                    <Text className="text-text font-black tracking-wider">{hotline.number}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-8">
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="w-full bg-primary py-4 rounded-full items-center"
              >
                <Text className="text-white font-bold text-lg">Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

