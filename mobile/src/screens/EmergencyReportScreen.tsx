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
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";
import CALBAYOG_BARANGAYS from "../constants/calbayogBarangays";
import { uploadEvidenceImage } from "../api/uploads";
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

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 5;

export default function EmergencyReportScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { emergencyType } = route.params;
  const [description, setDescription] = useState<string>("");
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  // Indices of photos still uploading, so submit can wait for them.
  const [uploadingSlots, setUploadingSlots] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(true);
  // Percentage of the report body uploaded. Photos are sent as base64, so on a
  // weak mobile signal this is the difference between "is it frozen?" and
  // watching real progress during the most stressful moment of the app.
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Address of THE INCIDENT, resolved on-device. The OS geocoder (Google Play
  // Services / Apple) has far better Philippine coverage than the server-side
  // Nominatim fallback, needs no network round-trip from the API host, and runs
  // while the reporter is standing at the scene.
  const [barangay, setBarangay] = useState<string>("");
  const [street, setStreet] = useState<string>("");
  const [purok, setPurok] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [resolvingAddress, setResolvingAddress] = useState<boolean>(false);
  const [showLocationEdit, setShowLocationEdit] = useState<boolean>(false);
  const [showBarangayPicker, setShowBarangayPicker] = useState<boolean>(false);
  const [barangaySearch, setBarangaySearch] = useState<string>("");

  const filteredBarangays = CALBAYOG_BARANGAYS.filter((bgy) =>
    bgy.toLowerCase().includes(barangaySearch.toLowerCase())
  );

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

  /**
   * Resolves the incident's address as soon as the screen opens, so the lookup
   * overlaps the time the reporter spends taking photos and costs them nothing.
   * Everything it finds is editable below — a wrong barangay is worse than none.
   */
  const resolveAddress = useCallback(async () => {
    setResolvingAddress(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        // The report is what responders navigate by, so it gets the best fix we
        // can take. Live tracking already used High while this used Balanced.
        accuracy: Location.Accuracy.High,
      });

      if (typeof position.coords.accuracy === "number") {
        setAccuracy(Math.round(position.coords.accuracy));
      }

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (!place) return;

      // Android usually reports the barangay in `district`; fall back to subregion.
      const detected = (place.district || place.subregion || "").trim();
      const matched = CALBAYOG_BARANGAYS.find(
        (bgy) => bgy.toLowerCase() === detected.toLowerCase()
      );
      if (matched || detected) setBarangay(matched || detected);

      if (place.street) setStreet(place.street.trim());

      // Some geocoders return the purok inside the district/subregion string.
      const purokMatch = `${place.district || ""} ${place.subregion || ""}`.match(
        /purok\s*([\w-]+)/i
      );
      if (purokMatch) setPurok(purokMatch[0].trim());

      // `name` is usually the nearest named feature — a decent landmark seed.
      if (place.name && place.name !== place.street) setLandmark(place.name.trim());
    } catch {
      // Non-fatal: the report still sends with coordinates, and the server will
      // attempt its own lookup. Never block the emergency on an address.
    } finally {
      setResolvingAddress(false);
    }
  }, []);

  useEffect(() => {
    if (locationEnabled) resolveAddress();
  }, [locationEnabled, resolveAddress]);

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
    if (proofPhotos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Maximum Limit Reached",
        `You can upload a maximum of ${MAX_PHOTOS} proof photos per emergency report.`
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

    while (currentCount < MAX_PHOTOS) {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.6,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        break;
      }

      const asset = result.assets[0];

      // Compress and resize photo for sub-second report transmission
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.55, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const imageUri = manipulated.base64
        ? `data:image/jpeg;base64,${manipulated.base64}`
        : manipulated.uri;

      const slot = currentCount;
      setProofPhotos((prev) => [...prev, imageUri]);
      currentCount++;

      // Upload in the background so it overlaps the next capture instead of
      // stacking megabytes of base64 onto the submit request. The hosted URL
      // replaces the inline image in place; on failure the inline image stays.
      setUploadingSlots((prev) => [...prev, slot]);
      uploadEvidenceImage(imageUri, "proof")
        .then((hosted) => {
          if (hosted !== imageUri) {
            setProofPhotos((prev) => prev.map((p, i) => (i === slot ? hosted : p)));
          }
        })
        .finally(() => {
          setUploadingSlots((prev) => prev.filter((i) => i !== slot));
        });

      if (currentCount >= MAX_PHOTOS) {
        Alert.alert(
          "Maximum Limit Reached",
          `You have captured the maximum of ${MAX_PHOTOS} proof photos.`
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
  const photosReady = proofPhotos.length >= MIN_PHOTOS;
  const photosRemaining = Math.max(0, MIN_PHOTOS - proofPhotos.length);
  const isSubmitDisabled =
    loading ||
    !locationEnabled ||
    checkingLocation ||
    // Sending mid-upload would submit a base64 photo that is seconds away from
    // having a hosted URL, bloating the payload for no reason.
    uploadingSlots.length > 0 ||
    proofPhotos.length < MIN_PHOTOS ||
    proofPhotos.length > MAX_PHOTOS;

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

    if (proofPhotos.length < MIN_PHOTOS) {
      Alert.alert(
        "📷 Proof Required",
        `Please take at least ${MIN_PHOTOS} photos of the scene using your camera before submitting your emergency report.`
      );
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch {
        // Only accept a cached fix from the last 5 minutes. An unbounded stale
        // position could put responders wherever the phone was hours ago.
        location = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
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
          // Resolved on-device above. The backend reads all of these and only
          // falls back to its own geocoder for whatever is missing.
          barangay: barangay.trim(),
          street: street.trim(),
          purok: purok.trim(),
          landmark: landmark.trim(),
          accuracy:
            typeof location.coords.accuracy === "number"
              ? Math.round(location.coords.accuracy)
              : accuracy,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          },
        }
      );

      // Straight to live tracking — that screen is itself the confirmation, and
      // an extra "OK" tap is the last thing anyone needs mid-emergency.
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
      setUploadProgress(0);
    }
  };

  const submitLabel = () => {
    if (checkingLocation) return "CHECKING LOCATION…";
    if (!locationEnabled) return "ENABLE LOCATION TO SEND";
    if (!photosReady)
      return `TAKE ${photosRemaining} MORE PHOTO${photosRemaining > 1 ? "S" : ""}`;
    if (uploadingSlots.length > 0) return "UPLOADING PHOTOS…";
    return "SEND EMERGENCY REPORT";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header title="Report Emergency" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Emergency type — the single most important fact on the screen */}
        <View
          style={[
            styles.typeBanner,
            { backgroundColor: theme.bg, borderColor: theme.border },
          ]}
        >
          <View style={[styles.typeIconCircle, { backgroundColor: theme.badgeBg }]}>
            {theme.icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.typeCaption}>YOU ARE REPORTING</Text>
            <Text style={[styles.typeText, { color: theme.text }]}>
              {theme.label}
            </Text>
          </View>
        </View>

        {/* Live GPS state. Previously only ever visible when broken, which left
            residents with no confirmation their location was actually attached. */}
        <View
          style={[
            styles.gpsChip,
            checkingLocation
              ? styles.gpsChipChecking
              : locationEnabled
              ? styles.gpsChipOk
              : styles.gpsChipBad,
          ]}
        >
          {checkingLocation ? (
            <ActivityIndicator size="small" color="#64748B" />
          ) : (
            <View
              style={[
                styles.gpsDot,
                { backgroundColor: locationEnabled ? "#10B981" : "#DC2626" },
              ]}
            />
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={[
                styles.gpsTitle,
                {
                  color: checkingLocation
                    ? "#475569"
                    : locationEnabled
                    ? "#047857"
                    : "#991B1B",
                },
              ]}
            >
              {checkingLocation
                ? "Checking your location…"
                : locationEnabled
                ? "Location ready"
                : "Location services disabled"}
            </Text>
            <Text style={styles.gpsSub}>
              {checkingLocation
                ? "Making sure responders can find you"
                : locationEnabled
                ? accuracy !== null
                  ? `Accurate to about ${accuracy}m`
                  : "Your exact position will be sent with this report"
                : "Responders cannot be dispatched without it"}
            </Text>
          </View>
          {!checkingLocation && !locationEnabled && (
            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              style={styles.gpsFixBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.gpsFixText}>FIX</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Detected address. GPS gets responders to the block; barangay, purok and
            a landmark get them to the door. Everything here is optional and
            pre-filled — ignoring it costs the reporter nothing. */}
        {locationEnabled && (
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressPin}>📍</Text>
              <View style={{ flex: 1 }}>
                {resolvingAddress && !barangay ? (
                  <Text style={styles.addressResolving}>Finding your address…</Text>
                ) : (
                  <Text style={styles.addressText}>
                    {[
                      landmark,
                      street,
                      purok,
                      barangay ? `Brgy. ${barangay.replace(/^brgy\.?\s*/i, "")}` : "",
                    ]
                      .filter(Boolean)
                      .join(", ") || "Address not detected — please add it"}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowLocationEdit(!showLocationEdit)}
                activeOpacity={0.7}
                style={styles.addressEditBtn}
              >
                <Text style={styles.addressEditText}>
                  {showLocationEdit ? "DONE" : "EDIT"}
                </Text>
              </TouchableOpacity>
            </View>

            {showLocationEdit && (
              <View style={styles.addressFields}>
                <Text style={styles.addressLabel}>BARANGAY</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    style={[styles.addressInput, { flex: 1 }]}
                    placeholder="Barangay"
                    placeholderTextColor="#94A3B8"
                    value={barangay}
                    onChangeText={setBarangay}
                    autoCapitalize="words"
                  />
                  <TouchableOpacity
                    style={styles.addressListBtn}
                    onPress={() => setShowBarangayPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addressListText}>LIST</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressLabel}>PUROK / STREET</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="e.g. Purok 3, Rizal Street"
                  placeholderTextColor="#94A3B8"
                  value={purok || street}
                  onChangeText={setPurok}
                />
              </View>
            )}

            <Text style={styles.addressLabel}>NEAREST LANDMARK</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="e.g. beside the blue water tank"
              placeholderTextColor="#94A3B8"
              value={landmark}
              onChangeText={setLandmark}
            />
            <Text style={styles.addressHint}>
              This is what responders use to find you on the last stretch.
            </Text>
          </View>
        )}

        {/* STEP 1 — Photos */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View
              style={[
                styles.stepNumber,
                photosReady && { backgroundColor: "#10B981" },
              ]}
            >
              <Text style={styles.stepNumberText}>{photosReady ? "✓" : "1"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Scene photos</Text>
              <Text style={styles.stepSub}>
                {photosReady
                  ? `${proofPhotos.length} photo${
                      proofPhotos.length > 1 ? "s" : ""
                    } attached — you can add up to ${MAX_PHOTOS}`
                  : `Take ${photosRemaining} more photo${
                      photosRemaining > 1 ? "s" : ""
                    } to continue`}
              </Text>
            </View>
          </View>

          {/* Slot dots make the 2-photo minimum obvious at a glance */}
          <View style={styles.slotRow}>
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.slotPip,
                  i < proofPhotos.length && styles.slotPipFilled,
                  i < MIN_PHOTOS && i >= proofPhotos.length && styles.slotPipRequired,
                ]}
              />
            ))}
            <Text style={styles.slotCaption}>
              {proofPhotos.length}/{MAX_PHOTOS} · {MIN_PHOTOS} required
            </Text>
          </View>

          <View style={styles.photoGrid}>
            {proofPhotos.map((photo, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: photo }} style={styles.thumbnailImage} />
                <TouchableOpacity
                  onPress={() => handleRemovePhoto(index)}
                  style={styles.removePhotoBtn}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Text style={styles.removePhotoIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {proofPhotos.length < MAX_PHOTOS && (
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={[
                  styles.addPhotoCard,
                  !photosReady && styles.addPhotoCardUrgent,
                ]}
                activeOpacity={0.7}
              >
                <CameraIcon size={26} color={photosReady ? "#0284C7" : "#DC2626"} />
                <Text
                  style={[
                    styles.addPhotoText,
                    !photosReady && { color: "#DC2626" },
                  ]}
                >
                  Take Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* STEP 2 — Details */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNumber, styles.stepNumberOptional]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                Details <Text style={styles.optionalTag}>optional</Text>
              </Text>
              <Text style={styles.stepSub}>
                What is happening, and who needs help
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.textAreaInput}
            placeholder="e.g. Kitchen fire on the second floor, one person still inside…"
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.legalNote}>
          False emergency reports are punishable by law. Your identity, device and
          location are recorded with every report.
        </Text>
      </ScrollView>

      {/* Barangay picker — same list and interaction as the registration screen */}
      <Modal visible={showBarangayPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setShowBarangayPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search barangay…"
              placeholderTextColor="#94A3B8"
              value={barangaySearch}
              onChangeText={setBarangaySearch}
            />

            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
              {filteredBarangays.map((bgy) => (
                <TouchableOpacity
                  key={bgy}
                  style={styles.barangayItem}
                  onPress={() => {
                    setBarangay(bgy);
                    setShowBarangayPicker(false);
                    setBarangaySearch("");
                  }}
                >
                  <Text style={styles.barangayItemText}>Brgy. {bgy}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sticky action bar — the send button is never scrolled out of reach */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        {loading && uploadProgress > 0 && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${uploadProgress}%`, backgroundColor: theme.btnBg },
              ]}
            />
          </View>
        )}

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
            <View style={styles.btnRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={[styles.submitBtnText, { marginLeft: 10 }]}>
                {uploadProgress > 0 ? `SENDING… ${uploadProgress}%` : "SENDING…"}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.submitBtnText,
                isSubmitDisabled && styles.submitBtnTextDisabled,
              ]}
            >
              {submitLabel()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },

  /* Emergency type banner */
  typeBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  typeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },
  typeCaption: {
    fontSize: 9.5,
    fontWeight: "900",
    color: COLORS.textGray,
    letterSpacing: 1,
    marginBottom: 2,
  },
  typeText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  /* GPS status chip */
  gpsChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  gpsChipChecking: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  gpsChipOk: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  gpsChipBad: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  gpsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  gpsSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  gpsFixBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  gpsFixText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  /* Detected address */
  addressCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addressPin: {
    fontSize: 15,
    marginRight: 8,
  },
  addressText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  addressResolving: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    fontStyle: "italic",
  },
  addressEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  addressEditText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2563EB",
  },
  addressFields: {
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: COLORS.textGray,
    marginBottom: 5,
    marginTop: 6,
  },
  addressInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: COLORS.primary,
  },
  addressListBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  addressListText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2563EB",
  },
  addressHint: {
    fontSize: 10.5,
    color: "#94A3B8",
    marginTop: 6,
  },

  /* Barangay picker modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: "800",
    color: "#94A3B8",
  },
  modalSearchInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 10,
  },
  barangayItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  barangayItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  /* Step cards */
  stepCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0EA5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberOptional: {
    backgroundColor: "#94A3B8",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  optionalTag: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.textGray,
  },
  stepSub: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },

  /* Photo slot pips */
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  slotPip: {
    width: 26,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    marginRight: 5,
  },
  slotPipFilled: {
    backgroundColor: "#10B981",
  },
  slotPipRequired: {
    backgroundColor: "#FCA5A5",
  },
  slotCaption: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.textGray,
    marginLeft: 6,
  },

  /* Photo grid */
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  thumbnailWrapper: {
    position: "relative",
    width: 84,
    height: 84,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  removePhotoIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  addPhotoCard: {
    width: 84,
    height: 84,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(14, 165, 233, 0.5)",
    backgroundColor: "rgba(14, 165, 233, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoCardUrgent: {
    borderColor: "rgba(220, 38, 38, 0.55)",
    backgroundColor: "rgba(220, 38, 38, 0.06)",
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    marginTop: 5,
  },

  /* Description */
  textAreaInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    minHeight: 90,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
  },

  legalNote: {
    fontSize: 10.5,
    color: "#94A3B8",
    lineHeight: 15,
    textAlign: "center",
    paddingHorizontal: 12,
    marginTop: 4,
  },

  /* Sticky footer */
  footer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
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
