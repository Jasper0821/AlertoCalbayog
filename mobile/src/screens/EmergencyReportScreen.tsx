import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking, AppState } from "react-native";
import * as Location from "expo-location";
import Header from "../components/Header";
import CustomInput from "../components/CustomInput";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";

type EmergencyReportScreenRouteProp = RouteProp<RootStackParamList, "EmergencyReport">;
type EmergencyReportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "EmergencyReport">;

interface Props {
  route: EmergencyReportScreenRouteProp;
  navigation: EmergencyReportScreenNavigationProp;
}

export default function EmergencyReportScreen({ route, navigation }: Props): React.JSX.Element {
  const { emergencyType } = route.params;
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(true);

  const checkLocationStatus = useCallback(async () => {
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
        // Try requesting permission
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

  // Check location on mount
  useEffect(() => {
    checkLocationStatus();
  }, [checkLocationStatus]);

  // Re-check location when the app comes back to the foreground (user may have toggled location in settings)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setCheckingLocation(true);
        checkLocationStatus();
      }
    });

    return () => subscription.remove();
  }, [checkLocationStatus]);

  const getEmergencyStyles = () => {
    switch(emergencyType) {
      case 'fire': return { bg: 'bg-red/10', border: 'border-red', text: 'text-red', btn: 'bg-red' };
      case 'medical': return { bg: 'bg-green/10', border: 'border-green', text: 'text-green', btn: 'bg-green' };
      case 'others': return { bg: 'bg-yellow/10', border: 'border-yellow', text: 'text-yellow', btn: 'bg-yellow' };
      case 'flood': return { bg: 'bg-blue/10', border: 'border-blue', text: 'text-blue', btn: 'bg-blue' };
      case 'emergency': return { bg: 'bg-green/10', border: 'border-green', text: 'text-green', btn: 'bg-green' };
      case 'crime': return { bg: 'bg-purple/10', border: 'border-purple', text: 'text-purple', btn: 'bg-purple' };
      default: return { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary', btn: 'bg-primary' };
    }
  };

  const { bg, border, text, btn } = getEmergencyStyles();

  const isSubmitDisabled = loading || !locationEnabled || checkingLocation;

  const handleSubmit = async () => {
    if (!locationEnabled) {
      Alert.alert(
        "Location Required",
        "Please enable your location services to submit an emergency report.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (locError) {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          Alert.alert(
            "Location Unavailable",
            "Unable to determine your current location. Please make sure your GPS is turned on and try again.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" }
            ]
          );
          setLoading(false);
          return;
        }
      }
      const token = await getToken();

      const res = await api.post(
        "/emergency",
        {
          emergencyType,
          description,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      Alert.alert("Success", "Emergency report sent successfully");

      navigation.navigate("LiveTracking", {
        reportId: res.data.report._id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        emergencyType
      });
    } catch (error: any) {
      const isRateLimit = error.response?.status === 429;
      Alert.alert(
        isRateLimit ? "Spam Protection Active" : "Error",
        error.response?.data?.message || error.message || "Failed to send report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Report Emergency" showBack />

      <View className="flex-1 p-5">
        <View className="bg-surface rounded-3xl p-6 border border-border shadow-2xl shadow-slate-900/10">
          <Text className="text-textGray mb-4 font-black text-[10px] uppercase tracking-widest">Emergency Type</Text>
          <View className={`py-2 px-4 rounded-xl border self-start mb-8 ${bg} ${border}`}>
             <Text className={`text-base font-black tracking-widest ${text}`}>
               {emergencyType.toUpperCase()}
             </Text>
          </View>

          <Text className="text-textGray mb-2 font-black text-[10px] uppercase tracking-widest">Additional Details</Text>
          <CustomInput
            placeholder="Describe the situation briefly..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            className="h-[120px]"
            style={{ textAlignVertical: 'top' }}
          />

          {/* Location warning banner */}
          {!checkingLocation && !locationEnabled && (
            <TouchableOpacity
              className="mt-4 py-3 px-4 rounded-xl bg-red/10 border border-red/30 flex-row items-center"
              onPress={() => Linking.openSettings()}
              activeOpacity={0.7}
            >
              <Text className="text-red text-lg mr-2">⚠️</Text>
              <View className="flex-1">
                <Text className="text-red font-bold text-xs">Location Services Disabled</Text>
                <Text className="text-red/70 text-[10px] mt-0.5">
                  Tap here to enable location in settings to submit a report.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            className={`py-4 rounded-2xl items-center mt-6 shadow-lg ${btn} shadow-slate-900/10`}
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            style={isSubmitDisabled ? { opacity: 0.4 } : undefined}
          >
            {loading ? (
               <ActivityIndicator color="white" />
            ) : checkingLocation ? (
               <View className="flex-row items-center">
                 <ActivityIndicator color="white" size="small" />
                 <Text className="text-white font-black text-base uppercase tracking-widest ml-2">Checking Location...</Text>
               </View>
            ) : (
               <Text className="text-white font-black text-base uppercase tracking-widest">Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
