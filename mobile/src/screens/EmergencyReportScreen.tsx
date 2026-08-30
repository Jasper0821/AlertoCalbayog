import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking, AppState, Image, ScrollView } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
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
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
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

  const handleTakePhoto = async () => {
    if (proofPhotos.length >= 5) {
      Alert.alert("Maximum Limit Reached", "You can upload a maximum of 5 proof photos per emergency report.");
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Camera permission is required to capture photos of the emergency scene as proof for responders."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const imageUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      setProofPhotos((prev) => [...prev, imageUri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setProofPhotos((prev) => prev.filter((_, i) => i !== index));
  };

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

  const isSubmitDisabled = loading || !locationEnabled || checkingLocation || proofPhotos.length < 2 || proofPhotos.length > 5;

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

    if (proofPhotos.length < 2) {
      Alert.alert(
        "📷 Proof Required",
        "Please take at least 2 photos of the scene using your camera before submitting your emergency report."
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
          description: description.trim() || `${emergencyType.toUpperCase()} incident reported with ${proofPhotos.length} proof photos`,
          proofPhotos,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      Alert.alert("Success ✓", "Emergency report with proof photos submitted successfully.");

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

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        <View className="bg-surface rounded-3xl p-6 border border-border shadow-2xl shadow-slate-900/10 mb-8">
          <Text className="text-textGray mb-4 font-black text-[10px] uppercase tracking-widest">Emergency Type</Text>
          <View className={`py-2 px-4 rounded-xl border self-start mb-6 ${bg} ${border}`}>
             <Text className={`text-base font-black tracking-widest ${text}`}>
               {emergencyType.toUpperCase()}
             </Text>
          </View>

          {/* ── CAMERA PROOF PHOTOS SECTION ── */}
          <View className="mb-6 p-4 rounded-2xl bg-darkBlue/40 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-black text-[11px] uppercase tracking-widest">
                📷 Scene Proof Photos <Text className="text-red font-bold">*</Text>
              </Text>
              <View className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40">
                <Text className="text-accent text-[10px] font-bold">
                  {proofPhotos.length} / 5 photos
                </Text>
              </View>
            </View>

            <Text className="text-textGray text-[11px] mb-3 leading-tight">
              Please take <Text className="text-white font-bold">2 to 5 clear photos</Text> of the emergency scene using your camera as proof for responders.
            </Text>

            {/* Photo Preview Grid */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {proofPhotos.map((photo, index) => (
                <View key={index} className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-border bg-slate-800">
                  <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red/90 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-[10px] font-black">✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {proofPhotos.length < 5 && (
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-accent/60 bg-accent/10 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-accent text-xl mb-0.5">📷</Text>
                  <Text className="text-accent font-bold text-[9px]">Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {proofPhotos.length < 2 && (
              <Text className="text-red/90 text-[10px] font-semibold">
                ⚠️ Take at least {2 - proofPhotos.length} more photo{2 - proofPhotos.length > 1 ? "s" : ""} to enable submission.
              </Text>
            )}
          </View>

          <Text className="text-textGray mb-2 font-black text-[10px] uppercase tracking-widest">Additional Details (Optional)</Text>
          <CustomInput
            placeholder="Describe the situation briefly..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            className="h-[100px]"
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
               <Text className="text-white font-black text-base uppercase tracking-widest">
                 {proofPhotos.length < 2 ? "Take 2+ Photos to Submit" : "Submit Report"}
               </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
