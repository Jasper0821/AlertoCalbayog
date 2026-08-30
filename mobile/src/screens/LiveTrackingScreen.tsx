import React, { useEffect, useRef, useState } from "react";
import { View, Text, Alert, TouchableOpacity, Animated, Easing, DeviceEventEmitter, Image, Modal, ScrollView } from "react-native";
import * as Location from "expo-location";
import Header from "../components/Header";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import socket from "../api/socket";
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
  const { reportId, latitude, longitude, emergencyType, reportStatus: initialStatus } = route.params;
  const [reportStatus, setReportStatus] = useState<string>(initialStatus || "pending");
  const [reportData, setReportData] = useState<any>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const signalAnim = useRef(new Animated.Value(0)).current;

  const getStatusTextAndColor = () => {
    switch (reportStatus?.toLowerCase()) {
      case "rejected":
        return {
          text: "Report Rejected",
          desc: "Your report was reviewed and rejected. Please contact support if you believe this is a mistake.",
          color: "#EF4444",
          badge: "● Incident Rejected"
        };
      case "responding":
      case "active":
        return {
          text: "Rescue on the Way",
          desc: "Help is coming! A professional responder has been dispatched and is actively heading to your location. Please stay safe.",
          color: "#d6d827da",
          badge: "● Priority Dispatch Active"
        };
      case "resolved":
      case "responded":
        return {
          text: "Scene Action Completed",
          desc: "Responders have arrived on scene, completed operations, and uploaded proof. Report is awaiting final administrative closure.",
          color: "#3B82F6",
          badge: "● Scene Handled — Pending Admin Closure"
        };
      case "closed":
        return {
          text: "Report Resolved & Closed",
          desc: "The emergency incident has been successfully resolved and officially closed by the system administrator. Thank you for reporting.",
          color: "#10B981",
          badge: "● Incident Officially Closed"
        };
      case "pending":
      default:
        return {
          text: "Waiting for Dispatch",
          desc: "Your emergency report has been successfully sent to the authorities. A dispatcher will assign a responder shortly. Keep your phone nearby.",
          color: "#B91C1C",
          badge: "● Waiting for Dispatcher"
        };
    }
  };

  const statusInfo = getStatusTextAndColor();

  const fetchReportStatus = async () => {
    try {
      const token = await getToken();
      const res = await api.get("/emergency/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const matchingReport = res.data.find((r: any) => r._id === reportId);
      if (matchingReport) {
        setReportData(matchingReport);
        if (matchingReport.status) {
          console.log("📡 LiveTrackingScreen fetched report on mount:", matchingReport.status);
          setReportStatus(matchingReport.status);
        }
      }
    } catch (err) {
      console.log("Failed to fetch report status on mount:", err);
    }
  };

  useEffect(() => {
    fetchReportStatus();
    startTracking();

    const handleStatusUpdate = (updatedReport: any) => {
      if (updatedReport) {
        if (updatedReport.status) {
          console.log("📡 LiveTrackingScreen received status update via direct socket:", updatedReport.status);
          setReportStatus(updatedReport.status);
        }
        setReportData(updatedReport);
      }
    };

    socket.on(`statusUpdate-${reportId}`, handleStatusUpdate);

    const subscription = DeviceEventEmitter.addListener("reportStatusUpdated", (notif) => {
      const newStatus = notif.status || notif.metadata?.status;
      if (notif.reportId === reportId && newStatus) {
        console.log("📡 LiveTrackingScreen received status update event:", newStatus);
        setReportStatus(newStatus);
        fetchReportStatus();
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
      socket.off(`statusUpdate-${reportId}`, handleStatusUpdate);
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

  const resolutionEvidence: string[] = Array.isArray(reportData?.resolutionEvidence) ? reportData.resolutionEvidence : [];
  const proofPhotos: string[] = Array.isArray(reportData?.proofPhotos) ? reportData.proofPhotos : [];

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Live Tracking" showBack />

      <ScrollView className="flex-1 px-5 pb-5" showsVerticalScrollIndicator={false}>
        {/* Header Status Bar */}
        <View className="mb-5 flex-row items-center justify-between rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-slate-900/10">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-widest text-textGray mb-0.5">Response Status</Text>
            <View className="flex-row items-center">
              <View 
                className="w-2.5 h-2.5 rounded-full mr-2" 
                style={{ backgroundColor: statusInfo.color }}
              />
              <Text className="text-base font-bold text-text tracking-tight flex-1" numberOfLines={1}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          <View
            className="rounded-xl px-3 py-1.5 border ml-2"
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
        <View className="rounded-[36px] border border-border bg-surface items-center justify-center p-6 overflow-hidden relative">
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

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="my-4">
            <View 
              className="w-24 h-24 rounded-full items-center justify-center border-4"
              style={{ borderColor: statusInfo.color, backgroundColor: `${statusInfo.color}10` }}
            >
              <EmergencyIcon size={50} color={statusInfo.color} />
            </View>
          </Animated.View>

          <View className="items-center w-full px-2">
            <Text 
              className="text-2xl font-black text-center mb-3 tracking-tight"
              style={{ color: statusInfo.color }}
            >
              {statusInfo.text.toUpperCase()}
            </Text>
            
            <View className="h-1 w-12 bg-border rounded-full mb-4" />

            <Text className="text-textGray text-center text-xs font-medium leading-5 px-2 mb-4">
              {statusInfo.desc}
            </Text>

            {/* Responder Resolution Evidence Photos (If available) */}
            {resolutionEvidence.length > 0 && (
              <View className="w-full mt-2 p-4 rounded-2xl bg-darkBlue/50 border border-emerald-500/30">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-emerald-400 font-black text-[11px] uppercase tracking-widest">
                    📷 Responder Resolution Evidence ({resolutionEvidence.length})
                  </Text>
                  <Text className="text-emerald-400 text-[10px] font-bold">Tap to view</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
                  {resolutionEvidence.map((src, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setLightboxImage(src)}
                      activeOpacity={0.8}
                      className="mr-2 w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-800"
                    >
                      <Image source={{ uri: src }} className="w-full h-full" resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Resident Submitted Proof Photos */}
            {proofPhotos.length > 0 && (
              <View className="w-full mt-3 p-4 rounded-2xl bg-darkBlue/30 border border-border">
                <Text className="text-textGray font-black text-[11px] uppercase tracking-widest mb-2">
                  📸 Your Submitted Proof ({proofPhotos.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
                  {proofPhotos.map((src, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setLightboxImage(src)}
                      activeOpacity={0.8}
                      className="mr-2 w-14 h-14 rounded-xl overflow-hidden border border-border bg-slate-800"
                    >
                      <Image source={{ uri: src }} className="w-full h-full" resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Bottom Status Badge */}
          <View className="mt-5 px-5 py-2 rounded-full border border-border bg-background">
            <Text className="text-[10px] font-black uppercase tracking-[1.5px]" style={{ color: statusInfo.color }}>
              {statusInfo.badge}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="mt-5 mb-8 items-center rounded-2xl bg-primary py-4 shadow-lg shadow-primary/40"
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.8}
        >
          <Text className="text-base font-black uppercase tracking-widest text-white">
            Return to Dashboard
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── LIGHTBOX MODAL FOR FULL SCREEN IMAGE VIEWING ── */}
      <Modal
        visible={!!lightboxImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxImage(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLightboxImage(null)}
          className="flex-1 bg-black/90 justify-center items-center p-4 relative"
        >
          <TouchableOpacity
            onPress={() => setLightboxImage(null)}
            className="absolute top-12 right-6 z-50 w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center border border-white/20"
          >
            <Text className="text-white font-black text-base">✕</Text>
          </TouchableOpacity>
          {lightboxImage && (
            <Image
              source={{ uri: lightboxImage }}
              className="w-full h-[75%] rounded-2xl"
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
