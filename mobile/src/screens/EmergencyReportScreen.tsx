import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";
import {
  FireIcon,
  MedicalIcon,
  CrimeIcon,
  FloodIcon,
  OthersIcon,
  CameraIcon,
} from "../components/SvgIcons";
import api, { backendUrl } from "../api/axios";
import { getToken } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";

type EmergencyReportScreenRouteProp = RouteProp<
  RootStackParamList,
  "EmergencyReport"
>;
type EmergencyReportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EmergencyReport"
>;

interface Props {
  route: EmergencyReportScreenRouteProp;
  navigation: EmergencyReportScreenNavigationProp;
}

export default function EmergencyReportScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { emergencyType } = route.params;
  const [description, setDescription] = useState<string>("");
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(true);

  const checkLocationStatus = useCallback(async () => {
    try {
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationEnabled(false);
        setCheckingLocation(false);
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
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

  useEffect(() => {
    checkLocationStatus();
  }, [checkLocationStatus]);

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
      Alert.alert(
        "Maximum Limit Reached",
        "You can upload a maximum of 5 proof photos per emergency report."
      );
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

    let currentCount = proofPhotos.length;

    while (currentCount < 5) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        break;
      }

      const asset = result.assets[0];
      const imageUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      setProofPhotos((prev) => [...prev, imageUri]);
      currentCount++;

      if (currentCount >= 5) {
        Alert.alert(
          "Maximum Limit Reached",
          "You have captured the maximum of 5 proof photos."
        );
        break;
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setProofPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getEmergencyTheme = () => {
    switch (emergencyType.toLowerCase()) {
      case "fire":
        return {
          bg: "rgba(239, 68, 68, 0.08)",
          border: "#FCA5A5",
          text: "#DC2626",
          badgeBg: "#EF4444",
          btnBg: "#DC2626",
          label: "FIRE EMERGENCY",
          icon: <FireIcon size={22} color="#DC2626" />,
        };
      case "medical":
        return {
          bg: "rgba(16, 185, 129, 0.08)",
          border: "#A7F3D0",
          text: "#059669",
          badgeBg: "#10B981",
          btnBg: "#059669",
          label: "MEDICAL EMERGENCY",
          icon: <MedicalIcon size={22} color="#059669" />,
        };
      case "flood":
        return {
          bg: "rgba(14, 165, 233, 0.08)",
          border: "#BAE6FD",
          text: "#0284C7",
          badgeBg: "#0EA5E9",
          btnBg: "#0284C7",
          label: "FLOOD EMERGENCY",
          icon: <FloodIcon size={22} color="#0284C7" />,
        };
      case "crime":
        return {
          bg: "rgba(139, 92, 246, 0.08)",
          border: "#DDD6FE",
          text: "#7C3AED",
          badgeBg: "#8B5CF6",
          btnBg: "#7C3AED",
          label: "CRIME / POLICE REPORT",
          icon: <CrimeIcon size={22} color="#7C3AED" />,
        };
      case "others":
        return {
          bg: "rgba(245, 158, 11, 0.08)",
          border: "#FDE68A",
          text: "#D97706",
          badgeBg: "#F59E0B",
          btnBg: "#D97706",
          label: "OTHER EMERGENCY",
          icon: <OthersIcon size={22} color="#D97706" />,
        };
      default:
        return {
          bg: "rgba(59, 130, 246, 0.08)",
          border: "#BFDBFE",
          text: "#2563EB",
          badgeBg: "#3B82F6",
          btnBg: "#2563EB",
          label: `${emergencyType.toUpperCase()} EMERGENCY`,
          icon: <OthersIcon size={22} color="#2563EB" />,
        };
    }
  };

  const theme = getEmergencyTheme();
  const isSubmitDisabled =
    loading ||
    !locationEnabled ||
    checkingLocation ||
    proofPhotos.length < 2 ||
    proofPhotos.length > 5;

  const handleSubmit = async () => {
    if (!locationEnabled) {
      Alert.alert(
        "Location Required",
        "Please enable your location services to submit an emergency report.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" },
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
      } catch {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          Alert.alert(
            "Location Unavailable",
            "Unable to determine your current location. Please make sure your GPS is turned on and try again.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" },
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
          description:
            description.trim() ||
            `${emergencyType.toUpperCase()} incident reported with ${proofPhotos.length} proof photos`,
          proofPhotos,
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
        "Report Submitted ✓",
        "Your emergency report with photo proof has been sent to responders."
      );

      navigation.navigate("LiveTracking", {
        reportId: res.data.report._id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        emergencyType,
      });
    } catch (error: any) {
      const isRateLimit = error.response?.status === 429;
      const isServiceUnavailable = error.response?.status === 503;

      let errorMsg = error.response?.data?.message;
      if (!errorMsg) {
        if (isServiceUnavailable) {
          errorMsg = "Database connection is currently establishing. Please wait a few seconds and tap Submit Report again.";
        } else if (error.message === "Network Error") {
          errorMsg = `Cannot connect to server at ${backendUrl}. Please check your connection.`;
        } else {
          errorMsg = error.message || "Failed to send report. Please try again.";
        }
      }

      Alert.alert(
        isRateLimit ? "Spam Protection Active" : "Submission Failed",
        errorMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Civic Header */}
      <Header title="Report Emergency" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Clean Card */}
        <View style={styles.mainCard}>
          {/* Emergency Type Badge */}
          <Text style={styles.sectionLabel}>EMERGENCY TYPE</Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <View style={styles.iconContainer}>{theme.icon}</View>
            <Text style={[styles.typeText, { color: theme.text }]}>
              {theme.label}
            </Text>
          </View>

          {/* Camera Proof Section */}
          <View style={styles.photoBoxContainer}>
            <View style={styles.photoHeaderRow}>
              <Text style={styles.photoTitleText}>
                📷 Scene Proof Photos <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {proofPhotos.length} / 5 photos
                </Text>
              </View>
            </View>

            <Text style={styles.photoInstructionsText}>
              Please take{" "}
              <Text style={styles.instructionHighlight}>2 to 5 clear photos</Text> of
              the emergency scene using your camera as proof for responders.
            </Text>

            {/* Thumbnails Grid */}
            <View style={styles.photoGrid}>
              {proofPhotos.map((photo, index) => (
                <View key={index} style={styles.thumbnailWrapper}>
                  <Image source={{ uri: photo }} style={styles.thumbnailImage} />
                  <TouchableOpacity
                    onPress={() => handleRemovePhoto(index)}
                    style={styles.removePhotoBtn}
                    activeOpacity={0.8}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Text style={styles.removePhotoIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {proofPhotos.length < 5 && (
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  style={styles.addPhotoCard}
                  activeOpacity={0.7}
                >
                  <CameraIcon size={24} color="#0284C7" />
                  <Text style={styles.addPhotoText}>Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {proofPhotos.length < 2 && (
              <Text style={styles.warningPhotoText}>
                ⚠️ Take at least {2 - proofPhotos.length} more photo
                {2 - proofPhotos.length > 1 ? "s" : ""} to enable submission.
              </Text>
            )}
          </View>

          {/* Description Section */}
          <Text style={styles.sectionLabel}>ADDITIONAL DETAILS (OPTIONAL)</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textAreaInput}
              placeholder="Describe the situation briefly (e.g. Landmark, condition)..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location Disabled Banner */}
          {!checkingLocation && !locationEnabled && (
            <TouchableOpacity
              style={styles.locationBanner}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.8}
            >
              <Text style={styles.locationWarningIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationBannerTitle}>
                  Location Services Disabled
                </Text>
                <Text style={styles.locationBannerSub}>
                  Tap here to enable location in settings to submit a report.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: theme.btnBg },
              isSubmitDisabled && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : checkingLocation ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color="#64748B" size="small" />
                <Text style={[styles.submitBtnText, styles.submitBtnTextDisabled]}>
                  Checking Location...
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.submitBtnText,
                  isSubmitDisabled && styles.submitBtnTextDisabled,
                ]}
              >
                {proofPhotos.length < 2
                  ? "TAKE 2+ PHOTOS TO SUBMIT"
                  : "SUBMIT REPORT"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textGray,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 8,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  photoBoxContainer: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  photoHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  photoTitleText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  requiredAsterisk: {
    color: "#EF4444",
    fontWeight: "900",
  },
  countBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },
  photoInstructionsText: {
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 19,
    marginBottom: 14,
  },
  instructionHighlight: {
    color: "#0F172A",
    fontWeight: "800",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  thumbnailWrapper: {
    position: "relative",
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  removePhotoIcon: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  addPhotoCard: {
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(14, 165, 233, 0.5)",
    backgroundColor: "rgba(14, 165, 233, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    marginTop: 4,
  },
  warningPhotoText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 6,
  },
  textAreaWrapper: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  textAreaInput: {
    height: 95,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  locationWarningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationBannerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
  },
  locationBannerSub: {
    fontSize: 11,
    color: "#B91C1C",
    marginTop: 2,
  },
  submitBtn: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  submitBtnTextDisabled: {
    color: "#64748B",
  },
});
