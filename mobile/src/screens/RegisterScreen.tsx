import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import api, { backendUrl, warmUpServer } from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import CALBAYOG_BARANGAYS from "../constants/calbayogBarangays";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

type RegisterScreenRouteProp = RouteProp<RootStackParamList, "Register">;

interface Props {
  navigation: RegisterScreenNavigationProp;
  route: RegisterScreenRouteProp;
}

/**
 * Accepts every way a Filipino resident might type their number under stress —
 * 09171234567, +639171234567, 639171234567, 9171234567, or any of those with
 * spaces or dashes — and normalises to the 09XXXXXXXXX form the backend stores.
 * Returns null when the input cannot be a valid PH mobile number.
 */
const normalizePhMobile = (raw: string): string | null => {
  let digits = raw.replace(/[^\d+]/g, "").replace(/^\+/, "");

  if (digits.startsWith("63")) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length === 10 && digits.startsWith("9")) {
    digits = `0${digits}`;
  }

  return /^09\d{9}$/.test(digits) ? digits : null;
};

export default function RegisterScreen({ navigation, route }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  // When these are present the resident already authenticated with Google, so
  // their name and email are verified and no password is needed.
  const googleRegistrationToken = route.params?.googleRegistrationToken;
  const googleUser = route.params?.googleUser;
  const isGoogleFlow = Boolean(googleRegistrationToken);

  // Required — the minimum the backend needs to create a dispatchable account.
  const [fullName, setFullName] = useState<string>(googleUser?.full_name || "");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Optional — helpful for responders, but never worth blocking a report on.
  const [emergencyContactNumber, setEmergencyContactNumber] = useState<string>("");
  const [barangay, setBarangay] = useState<string>("");
  const [completeAddress, setCompleteAddress] = useState<string>("");
  const [showOptional, setShowOptional] = useState<boolean>(false);

  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);

  // Barangay Picker Modal
  const [showBarangayPicker, setShowBarangayPicker] = useState<boolean>(false);
  const [barangaySearch, setBarangaySearch] = useState<string>("");

  const mobileRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const filteredBarangays = CALBAYOG_BARANGAYS.filter((bgy) =>
    bgy.toLowerCase().includes(barangaySearch.toLowerCase())
  );

  // Start waking the backend while the resident is still typing, so pressing
  // Register does not stall on a cold server.
  useEffect(() => {
    warmUpServer();
  }, []);

  /**
   * Fills barangay and street address from GPS. This is the slowest part of the
   * form to type and the part a panicking user is most likely to get wrong, so
   * one tap is worth a lot here.
   */
  const handleUseMyLocation = async (): Promise<void> => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Needed",
          "Allow location access to fill in your barangay and address automatically, or type them in manually."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (!place) {
        Alert.alert("Location Not Found", "We could not read your address. Please type it in manually.");
        return;
      }

      // Android usually reports the barangay in `district`; fall back to subregion.
      const detected = (place.district || place.subregion || "").trim();
      const matched = CALBAYOG_BARANGAYS.find(
        (bgy) => bgy.toLowerCase() === detected.toLowerCase()
      );
      if (matched || detected) {
        setBarangay(matched || detected);
      }

      const streetParts = [place.streetNumber, place.street, place.name].filter(
        (part) => Boolean(part) && part !== detected
      );
      const uniqueParts = Array.from(new Set(streetParts));
      if (uniqueParts.length > 0) {
        setCompleteAddress(uniqueParts.join(" "));
      }

      if (!matched && !detected && uniqueParts.length === 0) {
        Alert.alert("Location Not Found", "We could not read your address. Please type it in manually.");
      }
    } catch (err: any) {
      Alert.alert(
        "Location Unavailable",
        "We could not get your location right now. You can type your address instead, or skip it entirely."
      );
    } finally {
      setLocating(false);
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!fullName.trim()) {
      Alert.alert("Input Required", "Please enter your full name.");
      return;
    }

    const cleanMobile = normalizePhMobile(mobileNumber);
    if (!cleanMobile) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid Philippine mobile number, for example 09123456789."
      );
      return;
    }

    if (!isGoogleFlow && password.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    if (!agreeTerms) {
      Alert.alert("Terms Agreement Required", "Please agree to the User Agreement to proceed.");
      return;
    }

    // Optional field, but if it was filled in it should still be a real number.
    const cleanEmergency = emergencyContactNumber.trim()
      ? normalizePhMobile(emergencyContactNumber)
      : "";
    if (cleanEmergency === null) {
      Alert.alert(
        "Invalid Emergency Contact",
        "Please enter a valid Philippine mobile number for your emergency contact, or leave it blank."
      );
      return;
    }

    setLoading(true);

    try {
      const res = isGoogleFlow
        ? await api.post("/auth/google-register", {
            googleRegistrationToken,
            phoneNumber: cleanMobile,
            barangay: barangay.trim(),
            completeAddress: completeAddress.trim(),
            termsAccepted: true,
          })
        : await api.post("/auth/register", {
            fullName: fullName.trim(),
            mobileNumber: cleanMobile,
            password,
            completeAddress: completeAddress.trim(),
            barangay: barangay.trim(),
            emergencyContactNumber: cleanEmergency,
            // Recorded server-side so the resident is not stopped by the User
            // Agreement screen on their next launch.
            termsAccepted: true,
          });

      await saveToken(res.data.token);
      await saveUser(res.data.user);

      // Instant access to Emergency Dashboard (Home)
      navigation.replace("Home");
    } catch (error: any) {
      setLoading(false);
      const errorMsg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? `Cannot connect to server at ${backendUrl}. Please check your network connection.`
          : error.message || "Registration failed. Please try again.");
      Alert.alert("Registration Failed", errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040C1A" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 10,
              paddingBottom: Math.max(insets.bottom, 16) + 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.screenTitle}>
              {isGoogleFlow ? "One Last Step" : "Create Resident Account"}
            </Text>
            <Text style={styles.screenSubTitle}>
              {isGoogleFlow
                ? "Add a mobile number so responders can reach you"
                : "Takes about 30 seconds"}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {isGoogleFlow ? (
              <View style={styles.verifiedBanner}>
                <Text style={styles.verifiedBadge}>✓ VERIFIED BY GOOGLE</Text>
                <Text style={styles.verifiedName}>{googleUser?.full_name}</Text>
                <Text style={styles.verifiedEmail}>{googleUser?.google_email}</Text>
              </View>
            ) : (
              /* Full Name */
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#64748B"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                  onSubmitEditing={() => mobileRef.current?.focus()}
                  submitBehavior="submit"
                />
              </View>
            )}

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOBILE NUMBER *</Text>
              <TextInput
                ref={mobileRef}
                style={styles.input}
                placeholder="09123456789"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={13}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                returnKeyType={isGoogleFlow ? "go" : "next"}
                onSubmitEditing={() =>
                  isGoogleFlow ? handleRegister() : passwordRef.current?.focus()
                }
                submitBehavior="submit"
              />
            </View>

            {/* Password with visibility toggle — Google accounts do not need one */}
            {!isGoogleFlow && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD *</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, styles.passwordInput]}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeText}>{showPassword ? "HIDE" : "SHOW"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Optional details, collapsed by default */}
            <TouchableOpacity
              style={styles.optionalToggle}
              onPress={() => setShowOptional(!showOptional)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionalToggleText}>
                {showOptional ? "−" : "+"}  Address & emergency contact (optional)
              </Text>
            </TouchableOpacity>

            {showOptional && (
              <View style={styles.optionalBlock}>
                <TouchableOpacity
                  style={[styles.locationBtn, locating && styles.btnDisabled]}
                  onPress={handleUseMyLocation}
                  disabled={locating}
                  activeOpacity={0.85}
                >
                  {locating ? (
                    <ActivityIndicator color="#38BDF8" size="small" />
                  ) : (
                    <Text style={styles.locationBtnText}>📍  USE MY LOCATION</Text>
                  )}
                </TouchableOpacity>

                {/* Emergency Contact — google-register does not persist this field */}
                {!isGoogleFlow && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>EMERGENCY CONTACT</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="09987654321"
                      placeholderTextColor="#64748B"
                      keyboardType="phone-pad"
                      maxLength={13}
                      value={emergencyContactNumber}
                      onChangeText={setEmergencyContactNumber}
                    />
                  </View>
                )}

                {/* Barangay Input & Selector */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>BARANGAY</Text>
                    <TouchableOpacity onPress={() => setShowBarangayPicker(true)}>
                      <Text style={styles.selectFromListText}>SELECT FROM LIST</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Type your Barangay (or pick from list)"
                      placeholderTextColor="#64748B"
                      value={barangay}
                      onChangeText={setBarangay}
                      autoCapitalize="words"
                    />
                    <TouchableOpacity
                      style={styles.listBtn}
                      onPress={() => setShowBarangayPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.listBtnText}>LIST</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Complete Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>COMPLETE ADDRESS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Purok, Street, House No."
                    placeholderTextColor="#64748B"
                    value={completeAddress}
                    onChangeText={setCompleteAddress}
                  />
                </View>
              </View>
            )}

            {/* Terms Row */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>User Agreement</Text> &amp; emergency telemetry.
              </Text>
            </TouchableOpacity>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.createBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createBtnText}>REGISTER &amp; ACCESS DASHBOARD</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            {!isGoogleFlow && (
              <View style={styles.bottomLinkRow}>
                <Text style={styles.bottomPrompt}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.bottomLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barangay Selection Modal */}
      <Modal visible={showBarangayPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.labelRow}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setShowBarangayPicker(false)}>
                <Text style={{ color: "#94A3B8", fontSize: 16, fontWeight: "800" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search or type custom barangay..."
              placeholderTextColor="#64748B"
              value={barangaySearch}
              onChangeText={setBarangaySearch}
            />

            {barangaySearch.trim().length > 0 &&
              !filteredBarangays.some((b) => b.toLowerCase() === barangaySearch.trim().toLowerCase()) && (
                <TouchableOpacity
                  style={styles.customBarangayBtn}
                  onPress={() => {
                    setBarangay(barangaySearch.trim());
                    setShowBarangayPicker(false);
                    setBarangaySearch("");
                  }}
                >
                  <Text style={{ color: "#38BDF8", fontSize: 13, fontWeight: "700" }}>
                    Use custom: "{barangaySearch.trim()}"
                  </Text>
                </TouchableOpacity>
              )}

            <ScrollView style={{ maxHeight: 300 }}>
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
                  <Text style={styles.barangayText}>Brgy. {bgy}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowBarangayPicker(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040C1A",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#0A1D38",
    borderWidth: 1,
    borderColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  screenSubTitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#38BDF8",
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: "#0B192C",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  inputGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#040C1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    height: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  verifiedBanner: {
    backgroundColor: "#040C1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 14,
    marginBottom: 14,
  },
  verifiedBadge: {
    color: "#10B981",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  verifiedName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  verifiedEmail: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eyeText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "900",
  },
  optionalToggle: {
    paddingVertical: 10,
  },
  optionalToggleText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "800",
  },
  optionalBlock: {
    borderTopWidth: 1,
    borderTopColor: "#16273E",
    paddingTop: 14,
    marginBottom: 4,
  },
  locationBtn: {
    flexDirection: "row",
    backgroundColor: "#0A1D38",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#38BDF8",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  locationBtnText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  selectFromListText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
  },
  listBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  listBtnText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "900",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  checkmark: {
    color: "#040C1A",
    fontSize: 11,
    fontWeight: "900",
  },
  termsText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    flex: 1,
  },
  termsLink: {
    color: "#38BDF8",
    fontWeight: "700",
  },
  createBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  bottomLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  bottomPrompt: {
    fontSize: 12,
    color: "#94A3B8",
  },
  bottomLink: {
    fontSize: 12,
    fontWeight: "800",
    color: "#38BDF8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#0B192C",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  modalSearchInput: {
    backgroundColor: "#040C1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
    color: "#FFFFFF",
    fontSize: 13,
    height: 42,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  customBarangayBtn: {
    backgroundColor: "#0A1D38",
    borderColor: "#38BDF8",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  barangayItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#16273E",
  },
  barangayText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
  },
  modalCloseBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});
