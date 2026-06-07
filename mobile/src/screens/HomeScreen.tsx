import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Alert, DeviceEventEmitter } from "react-native";
import Header from "../components/Header";
import IncidentPicker from "../components/IncidentPicker";
import { clearStorage, getUser } from "../utils/Storage";
import socket from "../api/socket";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({
  navigation,
}: Props): React.JSX.Element {
  const [showPicker, setShowPicker] = useState(false);

  // Pulse animation for the Send Report button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let active = true;

    const setupSocket = async () => {
      const user = await getUser();
      const userId = user?._id || user?.id;
      if (!userId) return;

      if (active) {
        socket.connect();
        socket.emit("joinRoom", userId);
        console.log("📡 Mobile socket connected & joined room:", userId);

        socket.on("notification", (notif: { title: string; message: string; reportId: string; status: string }) => {
          console.log("📡 Received status update notification:", notif);
          
          // Display alert popup to the resident
          Alert.alert(notif.title, notif.message, [{ text: "OK" }]);

          // Broadcast notification to other active screens
          DeviceEventEmitter.emit("reportStatusUpdated", notif);
        });
      }
    };

    setupSocket();

    return () => {
      active = false;
      socket.off("notification");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const logout = async (): Promise<void> => {
    await clearStorage();
    navigation.replace("Login");
  };

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Alert Calbayog" showBack />

      <View className="flex-1 items-center justify-center px-8">
        {/* Top messaging */}
        <View className="items-center mb-12">
          <Text className="text-primary text-3xl font-black tracking-tight text-center mb-2">
            Stay Safe, Calbayog
          </Text>
          <Text className="text-textGray text-sm font-medium text-center leading-5">
            Tap the button below to report an incident.{"\n"}Your location will be shared automatically.
          </Text>
        </View>

        {/* Pulsing Send Report Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            className="w-52 h-52 rounded-full items-center justify-center border-4 border-red shadow-2xl shadow-red/30"
            style={{
              backgroundColor: "rgba(185, 28, 28, 0.10)",
            }}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            {/* Inner glow */}
            <View
              className="w-40 h-40 rounded-full items-center justify-center border-2 border-red/40"
              style={{
                backgroundColor: "rgba(185, 28, 28, 0.16)",
              }}
            >
              <Text className="text-red text-lg font-black uppercase tracking-widest text-center">
                Send{"\n"}Report
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Sub-label */}
        <Text className="text-textGray text-xs font-bold uppercase tracking-[3px] mt-8 opacity-60">
          Fire · Medical · Crime · Flood
        </Text>
      </View>

      {/* Bottom section */}
      <View className="px-5 pb-6 gap-3">
        <TouchableOpacity
          className="bg-surface flex-row items-center p-4 rounded-2xl border border-border shadow-sm shadow-slate-900/10"
          onPress={() => navigation.navigate("ReportHistory")}
        >
          <View className="w-9 h-9 rounded-xl bg-background items-center justify-center mr-3 border border-border">
            <Text className="text-sm">📜</Text>
          </View>
          <Text className="flex-1 text-primary font-bold text-sm">Report History</Text>
          <Text className="text-primary/30 text-lg font-bold">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-3 bg-red/10 rounded-2xl border border-red/20"
          onPress={logout}
        >
          <Text className="font-black text-red text-xs uppercase tracking-widest">
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Incident Picker Modal */}
      <IncidentPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        navigation={navigation}
      />
    </View>
  );
}
