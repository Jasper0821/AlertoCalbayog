import React, { useEffect, useRef, useState } from "react";
import { View, Text, Alert, TouchableOpacity, Platform } from "react-native";
import * as Location from "expo-location";
import Header from "../components/Header";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";

// Conditionally import MapView to prevent Web crashes
let MapView: any;
let Marker: any;
let UrlTile: any;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  UrlTile = Maps.UrlTile;
}

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
  const [currentLocation, setCurrentLocation] = useState({ latitude, longitude });
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      startTracking();
    }

    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  const getEmergencyColor = (): string => {
    switch (emergencyType) {
      case "fire":
        return "#EF4444";
      case "flood":
        return "#3B82F6";
      case "medical":
        return "#22C55E";
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
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setCurrentLocation(newCoords);

          try {
            await api.post(
              "/tracking/update",
              {
                reportId,
                latitude: newCoords.latitude,
                longitude: newCoords.longitude,
                role: "resident",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
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
        <View className="mb-5 flex-row items-center justify-between rounded-3xl border border-border bg-surface p-5 shadow-lg shadow-black/20">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-textGray mb-0.5">Tracking Status</Text>
            <Text className="text-base font-bold text-white tracking-tight">Active Connection</Text>
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

        <View className="flex-1 overflow-hidden rounded-[32px] border border-border shadow-2xl shadow-black bg-surface">
          {Platform.OS === "web" ? (
            <View className="flex-1 items-center justify-center p-8">
              <View className="w-16 h-16 rounded-full bg-darkBlue items-center justify-center mb-4 border border-border">
                <Text className="text-2xl">📱</Text>
              </View>
              <Text className="text-center text-sm font-medium text-textGray leading-5">
                Map features are optimized for mobile phones only. Please use the mobile app for live tracking.
              </Text>
            </View>
          ) : (
            <MapView
              style={{ flex: 1 }}
              mapType="satellite"
              region={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={currentLocation} title="Your Location" />
            </MapView>
          )}
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