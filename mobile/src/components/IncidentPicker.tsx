import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
} from "react-native";
import * as Location from "expo-location";
import { FireIcon, MedicalIcon, CrimeIcon, FloodIcon } from "./SvgIcons";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
}

interface IncidentType {
  key: "fire" | "medical" | "crime" | "flood";
  label: string;
  subtitle: string;
  icon: React.JSX.Element;
  color: string;
  bgColor: string;
}

const INCIDENT_TYPES: IncidentType[] = [
  {
    key: "fire",
    label: "Fire",
    subtitle: "Report a fire incident",
    icon: <FireIcon size={44} />,
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.12)",
  },
  {
    key: "medical",
    label: "Medical Emergency",
    subtitle: "Medical help needed",
    icon: <MedicalIcon size={44} />,
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.12)",
  },
  {
    key: "crime",
    label: "Crime",
    subtitle: "Report a crime",
    icon: <CrimeIcon size={44} />,
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.12)",
  },
  {
    key: "flood",
    label: "Flood",
    subtitle: "Report a flood",
    icon: <FloodIcon size={44} />,
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.12)",
  },
];

export default function IncidentPicker({
  visible,
  onClose,
  navigation,
}: Props): React.JSX.Element {
  const [loading, setLoading] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(true);
  const abortRef = useRef<boolean>(false);

  // Check if location services and permissions are available
  const checkLocationStatus = useCallback(async () => {
    setCheckingLocation(true);
    try {
      // Check if device location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationEnabled(false);
        setCheckingLocation(false);
        return;
      }

      // Check if the app has location permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        setLocationEnabled(newStatus === "granted");
      } else {
        setLocationEnabled(true);
      }
    } catch {
      setLocationEnabled(false);
    } finally {
      setCheckingLocation(false);
    }
  }, []);

  // Check location every time the modal becomes visible
  useEffect(() => {
    if (visible) {
      checkLocationStatus();
    }
  }, [visible, checkLocationStatus]);

  // Re-check when the app comes back to foreground (user may have toggled location in settings)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && visible) {
        checkLocationStatus();
      }
    });

    return () => subscription.remove();
  }, [visible, checkLocationStatus]);

  // Cancel handler: sets abort flag, resets loading, and closes modal
  const handleCancel = useCallback(() => {
    abortRef.current = true;
    setLoading(null);
    onClose();
  }, [onClose]);

  const handleSelect = (type: IncidentType) => {
    // Block selection if location is not available
    if (!locationEnabled) {
      Alert.alert(
        "⚠️ Location Required",
        "You must turn on your location services before reporting an incident. Your location is needed so responders can find you.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    onClose();

    // Navigate to EmergencyReportScreen to capture camera proof photos
    navigation.navigate("EmergencyReport", {
      emergencyType: type.key,
    });
  };

  const isDisabled = loading !== null || !locationEnabled || checkingLocation;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <Pressable
        className="flex-1 bg-black/80 justify-end"
        onPress={handleCancel}
      >
        <Pressable
          className="bg-surface border-t border-border rounded-t-[32px] px-6 pt-6 pb-10"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View className="w-12 h-1.5 bg-border rounded-full self-center mb-6" />

          {/* Title */}
          <View className="mb-6">
            <Text className="text-primary text-2xl font-black tracking-tight">
              What's happening?
            </Text>
            <Text className="text-textGray text-sm font-medium mt-1">
              Select the type of incident to report to CDRRMO
            </Text>
          </View>

          {/* Location warning banner */}
          {!checkingLocation && !locationEnabled && (
            <TouchableOpacity
              className="mb-4 py-3 px-4 rounded-xl bg-red/10 border border-red/30 flex-row items-center"
              onPress={() => Linking.openSettings()}
              activeOpacity={0.7}
            >
              <Text className="text-red text-lg mr-2">⚠️</Text>
              <View className="flex-1">
                <Text className="text-red font-bold text-xs">
                  Location Services Disabled
                </Text>
                <Text className="text-red/70 text-[10px] mt-0.5">
                  You must turn on your location before reporting an incident. Tap here to open settings.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Checking location indicator */}
          {checkingLocation && (
            <View className="mb-4 py-3 px-4 rounded-xl bg-primary/10 border border-primary/30 flex-row items-center">
              <ActivityIndicator color="#0EA5E9" size="small" />
              <Text className="text-primary font-bold text-xs ml-2">
                Checking location services...
              </Text>
            </View>
          )}

          {/* 2x2 Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-3" style={isDisabled ? { opacity: 0.4 } : undefined}>
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                className="w-[48%] rounded-3xl border border-border p-5 items-center"
                style={{ backgroundColor: type.bgColor }}
                onPress={() => handleSelect(type)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                {loading === type.key ? (
                  <View className="w-[44px] h-[44px] items-center justify-center">
                    <ActivityIndicator color={type.color} size="large" />
                  </View>
                ) : (
                  type.icon
                )}
                <Text
                  className="text-sm font-black mt-3 tracking-tight text-center"
                  style={{ color: type.color }}
                  numberOfLines={2}
                >
                  {type.label}
                </Text>
                <Text className="text-textGray text-[9px] font-bold uppercase tracking-widest mt-1 text-center">
                  {!locationEnabled && !checkingLocation ? "Location Required" : "Tap to Report"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity
            className="mt-6 py-4 rounded-2xl items-center bg-background border border-border"
            onPress={handleCancel}
          >
            <Text className="text-textGray font-black uppercase tracking-widest text-sm">
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
