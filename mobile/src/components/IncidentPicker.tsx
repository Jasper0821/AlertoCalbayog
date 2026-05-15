import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
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

  const handleSelect = async (type: IncidentType) => {
    if (loading) return;
    setLoading(type.key);

    try {
      // Request location permission
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to send a report.");
        setLoading(null);
        return;
      }

      // Get current location
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (locError) {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          // Fallback for emulator — Calbayog City coordinates
          console.log("Providing mock location for emulator testing.");
          location = {
            coords: {
              latitude: 12.0645,
              longitude: 124.595,
            },
          };
        }
      }

      const token = await getToken();

      // Submit report — all types go to CDRRMO
      const res = await api.post(
        "/emergency",
        {
          emergencyType: type.key,
          description: `${type.label} incident reported via AlertoCalbayog`,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Report Sent ✓",
        `Your ${type.label.toLowerCase()} report has been sent to CDRRMO. Agencies have been notified.`
      );

      onClose();

      // Navigate to live tracking
      navigation.navigate("LiveTracking", {
        reportId: res.data.report._id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        emergencyType: type.key,
      });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message || "Failed to send report"
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/80 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-surface border-t border-border rounded-t-[32px] px-6 pt-6 pb-10"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View className="w-12 h-1.5 bg-border rounded-full self-center mb-6" />

          {/* Title */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-black tracking-tight">
              What's happening?
            </Text>
            <Text className="text-textGray text-sm font-medium mt-1">
              Select the type of incident to report to CDRRMO
            </Text>
          </View>

          {/* 2x2 Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                className="w-[48%] rounded-3xl border border-border p-5 items-center"
                style={{ backgroundColor: type.bgColor }}
                onPress={() => handleSelect(type)}
                disabled={loading !== null}
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
                  Tap to Report
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity
            className="mt-6 py-4 rounded-2xl items-center bg-darkBlue border border-border"
            onPress={onClose}
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
