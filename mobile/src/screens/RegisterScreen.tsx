import React, { useState } from "react";
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
import api, { backendUrl } from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import CALBAYOG_BARANGAYS from "../constants/calbayogBarangays";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState<string>("");
  const [barangay, setBarangay] = useState<string>("");
  const [completeAddress, setCompleteAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Barangay Picker Modal
  const [showBarangayPicker, setShowBarangayPicker] = useState<boolean>(false);
  const [barangaySearch, setBarangaySearch] = useState<string>("");

  const filteredBarangays = CALBAYOG_BARANGAYS.filter((bgy) =>
    bgy.toLowerCase().includes(barangaySearch.toLowerCase())
  );

  const handleRegister = async (): Promise<void> => {
    const cleanMobile = mobileNumber.trim().replace(/[\s-]/g, "");
    const cleanEmergency = emergencyContactNumber.trim().replace(/[\s-]/g, "");

    if (!fullName.trim()) {
      Alert.alert("Input Required", "Please enter your full name.");
      return;
    }

    if (!cleanMobile || !/^09\d{9}$/.test(cleanMobile)) {
      Alert.alert("Invalid Mobile Number", "Please enter a valid 11-digit mobile number starting with 09.");
      return;
    }

    if (!cleanEmergency || !/^09\d{9}$/.test(cleanEmergency)) {
      Alert.alert("Invalid Emergency Contact", "Please enter a valid 11-digit emergency contact number.");
      return;
    }

    if (!barangay) {
      Alert.alert("Barangay Required", "Please select your Barangay in Calbayog City.");
      return;
    }

    if (!completeAddress.trim()) {
      Alert.alert("Address Required", "Please enter your complete house or street address.");
      return;
    }

    if (!password) {
      Alert.alert("Input Required", "Please enter a password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please try again.");
      return;
    }

    if (!agreeTerms) {
      Alert.alert("Terms Agreement Required", "Please agree to the User Agreement to proceed.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/register", {
        fullName: fullName.trim(),
        mobileNumber: cleanMobile,
        password,
        confirmPassword,
        completeAddress: completeAddress.trim(),
        barangay,
        emergencyContactNumber: cleanEmergency,
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
            <Text style={styles.screenTitle}>Create Resident Account</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Dela Cruz"
                placeholderTextColor="#64748B"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Mobile Number & Emergency Contact */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                <Text style={styles.label}>MOBILE NUMBER *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09123456789"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.label}>EMERGENCY CONTACT *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09987654321"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={emergencyContactNumber}
                  onChangeText={setEmergencyContactNumber}
                />
              </View>
            </View>

            {/* Barangay Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BARANGAY (CALBAYOG) *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowBarangayPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: barangay ? "#FFFFFF" : "#64748B", fontSize: 13, fontWeight: "600" }}>
                  {barangay ? `Brgy. ${barangay}` : "Select Barangay"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Complete Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>COMPLETE ADDRESS *</Text>
              <TextInput
                style={styles.input}
                placeholder="Purok, Street, House No."
                placeholderTextColor="#64748B"
                value={completeAddress}
                onChangeText={setCompleteAddress}
              />
            </View>

            {/* Password & Confirm Password */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                <Text style={styles.label}>PASSWORD *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.label}>CONFIRM PASSWORD *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

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
            <View style={styles.bottomLinkRow}>
              <Text style={styles.bottomPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.bottomLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barangay Selection Modal */}
      <Modal visible={showBarangayPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Barangay in Calbayog</Text>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search barangay..."
              placeholderTextColor="#64748B"
              value={barangaySearch}
              onChangeText={setBarangaySearch}
            />

            <ScrollView style={{ maxHeight: 300 }}>
              {filteredBarangays.map((bgy) => (
                <TouchableOpacity
                  key={bgy}
                  style={styles.barangayItem}
                  onPress={() => {
                    setBarangay(bgy);
                    setShowBarangayPicker(false);
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
  row: {
    flexDirection: "row",
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
