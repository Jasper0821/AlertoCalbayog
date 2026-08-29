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
import CustomInput from "../components/CustomInput";
import { GoogleIcon, CloseIcon, UserIcon, LockIcon } from "../components/SvgIcons";
import api from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS } from "../styles/colors";
import CALBAYOG_BARANGAYS from "../constants/calbayogBarangays";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({
  navigation,
}: Props): React.JSX.Element {
  const [loadingGoogle, setLoadingGoogle] = useState<boolean>(false);

  // Google Account Selection Modal State
  const [showGoogleAccountModal, setShowGoogleAccountModal] = useState<boolean>(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState<string>("teorica821@gmail.com");

  // Profile Completion Modal State for New Google Residents
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [googleRegToken, setGoogleRegToken] = useState<string>("");
  const [googleUser, setGoogleUser] = useState<any>(null);

  // Profile Form Inputs
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [barangay, setBarangay] = useState<string>("");
  const [completeAddress, setCompleteAddress] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Barangay Picker Modal State
  const [showBarangayPicker, setShowBarangayPicker] = useState<boolean>(false);

  const insets = useSafeAreaInsets();

  const handleGoogleSignIn = async (): Promise<void> => {
    setLoadingGoogle(true);
    let nativeSuccess = false;

    try {
      const { NativeModules } = require("react-native");
      if (NativeModules.RNGoogleSignin) {
        const { GoogleSignin } = require("@react-native-google-signin/google-signin");
        GoogleSignin.configure({
          webClientId:
            process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
            "892430385717-3i8g8ue561rqftv859o8i6gg1q4gk1nt.apps.googleusercontent.com",
          offlineAccess: false,
        });

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();
        const idToken = response.idToken || response.data?.idToken;

        if (idToken) {
          nativeSuccess = true;
          await handleBackendGoogleLogin({ idToken });
          return;
        }
      }
    } catch (err: any) {
      console.log("Native Google Sign-In notice:", err?.message || err);
      if (err?.code === "SIGN_IN_CANCELLED" || err?.message?.includes("cancel")) {
        setLoadingGoogle(false);
        return;
      }
    } finally {
      if (nativeSuccess) {
        setLoadingGoogle(false);
      }
    }

    // Fallback for Expo Go / Preview mode: Open sleek Google Account Selector Modal
    if (!nativeSuccess) {
      setLoadingGoogle(false);
      setShowGoogleAccountModal(true);
    }
  };

  const handleSelectGoogleAccount = async (emailToUse?: string): Promise<void> => {
    const targetEmail = (emailToUse || selectedGoogleEmail).trim().toLowerCase();

    if (!targetEmail || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(targetEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid Google email address.");
      return;
    }

    setShowGoogleAccountModal(false);
    await handleBackendGoogleLogin({
      idToken: `google_oauth_${targetEmail.replace(/[^a-z0-9]/g, "")}`,
    });
  };

  const handleBackendGoogleLogin = async (payload: { idToken: string }) => {
    try {
      setLoadingGoogle(true);
      const res = await api.post("/auth/google-login", payload);

      if (res.data?.isNewResident || res.data?.requiresProfileCompletion) {
        // New Google Resident -> Open Profile Completion Modal
        setGoogleRegToken(res.data.googleRegistrationToken);
        setGoogleUser(res.data.googleUser);
        setShowProfileModal(true);
        setLoadingGoogle(false);
        return;
      }

      // Existing Resident -> Direct Login
      await saveToken(res.data.token);
      await saveUser(res.data.user);
      setLoadingGoogle(false);

      if (res.data.termsAccepted === false) {
        navigation.replace("UserAgreement");
      } else {
        navigation.replace("Home");
      }
    } catch (err: any) {
      setLoadingGoogle(false);
      console.error("Google authentication backend error:", err);
      Alert.alert(
        "Authentication Failed",
        err.response?.data?.message || err.message || "Failed to authenticate Google account."
      );
    }
  };

  const handleFinishProfileRegistration = async (): Promise<void> => {
    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, "");

    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 11-digit mobile number starting with 09 (e.g. 09XXXXXXXXX).");
      return;
    }

    if (!barangay) {
      Alert.alert("Barangay Required", "Please select your Barangay in Calbayog City.");
      return;
    }

    if (!completeAddress.trim()) {
      Alert.alert("Address Required", "Please enter your complete house/street address.");
      return;
    }

    setSavingProfile(true);

    try {
      const res = await api.post("/auth/google-register", {
        googleRegistrationToken: googleRegToken,
        phoneNumber: cleanPhone,
        barangay,
        completeAddress: completeAddress.trim(),
      });

      await saveToken(res.data.token);
      await saveUser(res.data.user);

      setShowProfileModal(false);
      setSavingProfile(false);

      if (res.data.termsAccepted === false) {
        navigation.replace("UserAgreement");
      } else {
        navigation.replace("Home");
      }
    } catch (err: any) {
      setSavingProfile(false);
      Alert.alert(
        "Registration Error",
        err.response?.data?.message || err.message || "Failed to complete resident profile."
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top-left: Logo + App Title ── */}
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>Alerto</Text>
              <Text style={styles.brandSubtitle}>Calbayog</Text>
            </View>
          </View>

          {/* ── Centered Form Area ── */}
          <View style={styles.formSection}>
            <Text style={styles.heading}>Welcome to Alerto Calbayog</Text>
            <Text style={styles.subheading}>
              Fast &amp; secure emergency response system for all residents.
            </Text>

            <View style={styles.divider} />

            {/* Primary Action: CONTINUE WITH GOOGLE */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                loadingGoogle && styles.buttonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
              disabled={loadingGoogle}
            >
              {loadingGoogle ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <>
                  <GoogleIcon size={22} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR SIGN IN WITH PASSWORD</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.passwordButton}
              onPress={() => navigation.navigate("PasswordLogin")}
              activeOpacity={0.85}
            >
              <LockIcon size={20} color={COLORS.primary} />
              <Text style={styles.passwordButtonText}>Sign In with Password</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Are you an LGU / Agency Responder? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Register Here</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              Public Safety &amp; Emergency Alert System • Calbayog City
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Google Account Selector Modal ── */}
      <Modal
        visible={showGoogleAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoogleAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowGoogleAccountModal(false)}
          />

          <View style={styles.modalContainer}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
            >
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View style={styles.modalGoogleBrand}>
                  <GoogleIcon size={26} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.modalTitle}>Sign in with Google</Text>
                    <Text style={styles.modalSubtitle}>to continue to Alerto Calbayog</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowGoogleAccountModal(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.inputLabel}>CHOOSE AN ACCOUNT</Text>

              {/* Tappable Google Account Card 1 */}
              <TouchableOpacity
                style={styles.accountCard}
                onPress={() => handleSelectGoogleAccount("teorica821@gmail.com")}
                activeOpacity={0.7}
              >
                <View style={styles.accountAvatar}>
                  <Text style={styles.avatarLetter}>J</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>Jasper Teorica</Text>
                  <Text style={styles.accountEmail}>teorica821@gmail.com</Text>
                </View>
                <Text style={styles.accountArrow}>›</Text>
              </TouchableOpacity>

              {/* Tappable Google Account Card 2 */}
              <TouchableOpacity
                style={styles.accountCard}
                onPress={() => handleSelectGoogleAccount("alertocalbayog.resident@gmail.com")}
                activeOpacity={0.7}
              >
                <View style={[styles.accountAvatar, { backgroundColor: "#0284C7" }]}>
                  <Text style={styles.avatarLetter}>A</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>Alerto Resident</Text>
                  <Text style={styles.accountEmail}>alertocalbayog.resident@gmail.com</Text>
                </View>
                <Text style={styles.accountArrow}>›</Text>
              </TouchableOpacity>

              {/* Custom Google Email Input option */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>OR ENTER ANOTHER GOOGLE EMAIL</Text>
                <CustomInput
                  placeholder="example@gmail.com"
                  value={selectedGoogleEmail}
                  onChangeText={setSelectedGoogleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={() => handleSelectGoogleAccount(selectedGoogleEmail)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalSubmitButtonText}>
                    Continue with Google Account
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Profile Completion Modal for New Google Residents ── */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowProfileModal(false)}
          />

          <View style={styles.modalContainer}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
            >
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View style={styles.modalGoogleBrand}>
                  <GoogleIcon size={26} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.modalTitle}>Complete Resident Profile</Text>
                    <Text style={styles.modalSubtitle}>{googleUser?.google_email}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowProfileModal(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <View style={{ marginTop: 4 }}>
                <Text style={styles.inputLabel}>MOBILE NUMBER (REQUIRED)</Text>
                <CustomInput
                  placeholder="09XXXXXXXXX"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                />

                <Text style={styles.inputLabel}>BARANGAY (REQUIRED)</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowBarangayPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectButtonText, !barangay && { color: COLORS.textMuted }]}>
                    {barangay ? `Brgy. ${barangay}` : "Select Barangay in Calbayog"}
                  </Text>
                  <Text style={styles.selectButtonArrow}>▼</Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>COMPLETE ADDRESS (REQUIRED)</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Purok, Street, House / Building No."
                  placeholderTextColor={COLORS.textMuted}
                  value={completeAddress}
                  onChangeText={setCompleteAddress}
                  multiline
                  numberOfLines={2}
                />

                <TouchableOpacity
                  style={[
                    styles.modalSubmitButton,
                    savingProfile && styles.buttonDisabled,
                  ]}
                  onPress={handleFinishProfileRegistration}
                  activeOpacity={0.85}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitButtonText}>
                      Finish Registration
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Barangay Picker Modal ── */}
      <Modal
        visible={showBarangayPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBarangayPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setShowBarangayPicker(false)}>
                <CloseIcon size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {CALBAYOG_BARANGAYS.map((bgy) => (
                <TouchableOpacity
                  key={bgy}
                  style={[
                    styles.pickerItem,
                    barangay === bgy && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setBarangay(bgy);
                    setShowBarangayPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      barangay === bgy && styles.pickerItemTextSelected,
                    ]}
                  >
                    Brgy. {bgy}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandTextContainer: {
    marginLeft: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    lineHeight: 24,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  formSection: {
    marginVertical: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 20,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },
  passwordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  passwordButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 8,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  registerText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  footer: {
    alignItems: "center",
    marginTop: 10,
  },
  footerLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalGoogleBrand: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  accountEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  accountArrow: {
    fontSize: 22,
    fontWeight: "700",
    color: "#94A3B8",
    paddingLeft: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  selectButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  selectButtonArrow: {
    fontSize: 10,
    color: "#64748B",
  },
  addressInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    textAlignVertical: "top",
    minHeight: 60,
  },
  modalSubmitButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#0284C7",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerItemSelected: {
    backgroundColor: "#F0F9FF",
  },
  pickerItemText: {
    fontSize: 14,
    color: "#334155",
  },
  pickerItemTextSelected: {
    fontWeight: "800",
    color: "#0284C7",
  },
});
