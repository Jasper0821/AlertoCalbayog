import React, { useEffect, useRef, useState } from "react";
import { View, Text, Alert, TouchableOpacity, Animated, Easing, DeviceEventEmitter } from "react-native";
import * as Location from "expo-location";
import Header from "../components/Header";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { EmergencyIcon } from "../components/SvgIcons";

type LiveTrackingScreenRouteProp = RouteProp<RootStackParamList, "LiveTracking">;
type LiveTrackingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LiveTracking"
>;

interface Props {
  route: LiveTrackingScreenRouteProp;
  navigation: LiveTrackingScreenNavigationProp;
}

export default function LiveTrackingScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const { reportId, latitude, longitude, emergencyType } = route.params;
  const [reportStatus, setReportStatus] = useState<string>("pending");
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const signalAnim = useRef(new Animated.Value(0)).current;

  const getStatusTextAndColor = () => {
    switch (reportStatus?.toLowerCase()) {
      case "verified":
        return { text: "Report Verified", desc: "Your emergency report has been verified by the command center. Dispatching responders now.", color: "#8B5CF6" };
      case "responding":
      case "active":
        return { text: "Rescue on the Way", desc: "Help is coming! A professional responder has been dispatched and is heading to your location. Please stay safe.", color: "#10B981" };
      case "resolved":
      case "responded":
        return { text: "Report Resolved", desc: "The emergency incident has been successfully resolved. Thank you for reporting.", color: "#10B981" };
      case "pending":
      default:
        return { text: "Waiting for Dispatch", desc: "Your emergency report has been successfully sent to the authorities. A dispatcher will assign a responder shortly. Keep your phone nearby.", color: "#B91C1C" };
    }
  };

  const statusInfo = getStatusTextAndColor();

  useEffect(() => {
    startTracking();

    const subscription = DeviceEventEmitter.addListener("reportStatusUpdated", (notif) => {
      if (notif.reportId === reportId && notif.status) {
        console.log("📡 LiveTrackingScreen received status update event:", notif.status);
        setReportStatus(notif.status);
      }
    });

    // Pulse animation for status icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Signal waves animation
    const waves = Animated.loop(
      Animated.timing(signalAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    pulse.start();
    waves.start();

    return () => {
      pulse.stop();
      waves.stop();
      subscription.remove();
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  const getEmergencyColor = (): string => {
    switch (emergencyType) {
      case "fire":
        return "#B91C1C";
      case "flood":
        return "#3B82F6";
      case "medical":
        return "#10B981";
      case "emergency":
        return "#10B981";
      case "crime":
        return "#8B5CF6";
      default:
        return "#3B82F6";
    }
  };

  const startTracking = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const token = await getToken();

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        async (location) => {
          try {
            const response = await api.post(
              "/tracking/update",
              {
                reportId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                role: "resident",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.data.status) {
              setReportStatus(response.data.status);
            }
          } catch (trackingError) {
            console.log("Failed to push tracking update:", trackingError);
          }
        }
      );
    } catch (error: any) {
      console.log(error.response?.data || error.message);
    }
  };

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Live Tracking" showBack />

      <View className="flex-1 px-5 pb-5">
        {/* Header Status Bar */}
        <View className="mb-5 flex-row items-center justify-between rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-slate-900/10">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-widest text-textGray mb-0.5">Response Status</Text>
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: statusInfo.color }}
              />
              <Text className="text-base font-bold text-text tracking-tight">
                {statusInfo.text}
              </Text>
            </View>
          </View>

          <View
            className="rounded-xl px-4 py-2 border"
            style={{ backgroundColor: `${getEmergencyColor()}15`, borderColor: getEmergencyColor() }}
          >
            <Text
              className="font-black tracking-widest text-xs"
              style={{ color: getEmergencyColor() }}
            >
              {emergencyType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Main Notification Card */}
        <View className="flex-1 rounded-[40px] border border-border bg-surface items-center justify-center p-8 overflow-hidden">
          {/* Animated Background Signal */}
          <Animated.View 
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: 150,
              borderWidth: 2,
              borderColor: `${statusInfo.color}20`,
              transform: [{ scale: signalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] }) }],
              opacity: signalAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
            }}
          />
          <Animated.View 
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: 150,
              borderWidth: 2,
              borderColor: `${statusInfo.color}20`,
              transform: [{ scale: signalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.5] }) }],
              opacity: signalAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 0] }),
            }}
          />

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="mb-8">
            <View 
              className="w-28 h-28 rounded-full items-center justify-center border-4"
              style={{ borderColor: statusInfo.color, backgroundColor: `${statusInfo.color}10` }}
            >
              <EmergencyIcon size={60} color={statusInfo.color} />
            </View>
          </Animated.View>

          <View className="items-center">
            <Text 
              className="text-3xl font-black text-center mb-4 tracking-tighter"
              style={{ color: statusInfo.color }}
            >
              {statusInfo.text.toUpperCase()}
            </Text>
            
            <View className="h-1 w-12 bg-border rounded-full mb-6" />

            <Text className="text-textGray text-center text-sm font-medium leading-6 px-4">
              {statusInfo.desc}
            </Text>
          </View>

          {/* Bottom Badge */}
          <View 
            className="absolute bottom-10 px-6 py-2 rounded-full border border-border bg-background"
          >
            <Text className="text-[10px] font-black uppercase tracking-[2px] text-textGray">
              {reportStatus === "responding" || reportStatus === "active" ? "● Priority Dispatch Active" : "● Status Synchronized"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="mt-6 items-center rounded-2xl bg-primary py-4 shadow-lg shadow-primary/40"
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.8}
        >
          <Text className="text-base font-black uppercase tracking-widest text-white">
            Return to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
