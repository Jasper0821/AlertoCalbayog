import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from "react-native";
import * as Location from "expo-location";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";
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
type LiveTrackingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "LiveTracking">;

interface Props {
  route: LiveTrackingScreenRouteProp;
  navigation: LiveTrackingScreenNavigationProp;
}

export default function LiveTrackingScreen({ route, navigation }: Props): React.JSX.Element {
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
    switch(emergencyType) {
      case 'fire': return COLORS.red;
      case 'flood': return COLORS.blue;
      case 'medical': return COLORS.green;
      default: return COLORS.primary;
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
          distanceInterval: 5
        },
        async (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          };

          setCurrentLocation(newCoords);

          await api.post(
            "/tracking/update",
            {
              reportId,
              latitude: newCoords.latitude,
              longitude: newCoords.longitude,
              role: "resident"
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }
      );
    } catch (error: any) {
      console.log(error.response?.data || error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Live Tracking" />

      <View style={styles.content}>
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>Tracking active for:</Text>
          <View style={[styles.badge, { backgroundColor: `${getEmergencyColor()}20` }]}>
            <Text style={[styles.badgeText, { color: getEmergencyColor() }]}>
              {emergencyType.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.mapWrapper}>
          {Platform.OS === 'web' ? (
            <View style={styles.webFallbackContainer}>
              <Text style={styles.webFallbackText}>Map features are optimized for mobile phones only.</Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              region={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
              }}
            >
              <UrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
              />
              <Marker coordinate={currentLocation} title="Your Location" />
            </MapView>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.8}
        >
          <Text style={styles.doneText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: 'bold',
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  map: {
    flex: 1,
  },
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
  },
  webFallbackText: {
    color: COLORS.textGray,
    textAlign: 'center',
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: COLORS.glass,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doneText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  }
});