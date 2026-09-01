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
import AuthInputCard from "../components/AuthInputCard";
import { MailIcon, LockIcon, GoogleIcon, FacebookIcon, CheckIcon, CloseIcon } from "../components/SvgIcons";
import api, { backendUrl } from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
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
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingGoogle, setLoadingGoogle] = useState<boolean>(false);

  // Google & Facebook Account Selector & Profile completion modal state
  const [showGoogleAccountModal, setShowGoogleAccountModal] = useState<boolean>(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState<string>("teorica821@gmail.com");
  const [showFacebookAccountModal, setShowFacebookAccountModal] = useState<boolean>(false);
  const [selectedFacebookEmail, setSelectedFacebookEmail] = useState<string>("jasper.teorica@facebook.com");
  const [loadingFacebook, setLoadingFacebook] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [googleRegToken, setGoogleRegToken] = useState<string>("");
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [facebookRegToken, setFacebookRegToken] = useState<string>("");
  const [facebookUser, setFacebookUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"google" | "facebook">("google");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [barangay, setBarangay] = useState<string>("");
  const [completeAddress, setCompleteAddress] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [showBarangayPicker, setShowBarangayPicker] = useState<boolean>(false);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password) {
      Alert.alert("Input Required", "Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      await saveToken(res.data.token);
      await saveUser(res.data.user);

      if (res.data.termsAccepted === false) {
        navigation.replace("UserAgreement");
      } else {
        navigation.replace("Home");
      }
    } catch (error: any) {
      console.error("Password Login error:", error);
      const errorMsg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? `Cannot connect to server at ${backendUrl}. Please check your network.`
          : error.message || "Invalid email or password.");
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
        setGoogleRegToken(res.data.googleRegistrationToken);
        setGoogleUser(res.data.googleUser);
        setAuthMode("google");
        setShowProfileModal(true);
        setLoadingGoogle(false);
        return;
      }

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
      console.error("Google auth error:", err);
      Alert.alert(
        "Authentication Failed",
        err.response?.data?.message || err.message || "Failed to authenticate Google account."
      );
    }
  };

  const handleFacebookSignIn = (): void => {
    setShowFacebookAccountModal(true);
  };

  const handleSelectFacebookAccount = async (emailToUse?: string): Promise<void> => {
    const targetEmail = (emailToUse || selectedFacebookEmail).trim().toLowerCase();

    if (!targetEmail || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(targetEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid Facebook email address.");
      return;
    }

    setShowFacebookAccountModal(false);
    await handleBackendFacebookLogin({
      email: targetEmail,
      name: targetEmail.split("@")[0].replace(/[._]/g, " "),
      facebookId: `fb_${targetEmail.replace(/[^a-z0-9]/g, "")}`,
    });
  };

  const handleBackendFacebookLogin = async (payload: { email: string; name: string; facebookId: string }) => {
    try {
      setLoadingFacebook(true);
      const res = await api.post("/auth/facebook-login", payload);

      if (res.data?.isNewResident || res.data?.requiresProfileCompletion) {
        setFacebookRegToken(res.data.facebookRegistrationToken);
        setFacebookUser(res.data.facebookUser);
        setAuthMode("facebook");
        setShowProfileModal(true);
        setLoadingFacebook(false);
        return;
      }

      await saveToken(res.data.token);
      await saveUser(res.data.user);
      setLoadingFacebook(false);

      if (res.data.termsAccepted === false) {
        navigation.replace("UserAgreement");
      } else {
        navigation.replace("Home");
      }
    } catch (err: any) {
      setLoadingFacebook(false);
      console.error("Facebook auth error:", err);
      Alert.alert(
        "Authentication Failed",
        err.response?.data?.message || err.message || "Failed to authenticate Facebook account."
      );
    }
  };

  const handleFinishProfileRegistration = async (): Promise<void> => {
    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, "");

    if (!cleanPhone || !/^09\d{9}$/.test(cleanPhone)) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 11-digit mobile number starting with 09.");
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
      let res;
      if (authMode === "facebook") {
        res = await api.post("/auth/facebook-register", {
          facebookRegistrationToken: facebookRegToken,
          phoneNumber: cleanPhone,
          barangay,
          completeAddress: completeAddress.trim(),
        });
      } else {
        res = await api.post("/auth/google-register", {
          googleRegistrationToken: googleRegToken,
          phoneNumber: cleanPhone,
          barangay,
          completeAddress: completeAddress.trim(),
        });
      }

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
      <StatusBar barStyle="light-content" backgroundColor="#040C1A" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Container Section */}
          <View style={styles.brandHeader}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.screenTitle}>Log In</Text>
          </View>

          {/* Input Cards */}
          <View style={styles.formContainer}>
            <AuthInputCard
              label="Email"
              icon={<MailIcon size={20} color="#38BDF8" />}
              placeholder="jamesbond123@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AuthInputCard
              label="Password"
              icon={<LockIcon size={20} color="#38BDF8" />}
              isPassword
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />

            {/* Checkbox and Forgotten Password row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <CheckIcon size={12} color="#040C1A" />}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgotten Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Pill Log In Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#040C1A" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or Log in with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
              disabled={loadingGoogle}
            >
              {loadingGoogle ? (
                <ActivityIndicator color="#38BDF8" size="small" />
              ) : (
                <>
                  <GoogleIcon size={20} />
                  <Text style={styles.socialBtnText}>Log In with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleFacebookSignIn}
              activeOpacity={0.85}
              disabled={loadingFacebook}
            >
              {loadingFacebook ? (
                <ActivityIndicator color="#38BDF8" size="small" />
              ) : (
                <>
                  <FacebookIcon size={20} />
                  <Text style={styles.socialBtnText}>Log In with Facebook</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register Navigation Link */}
            <View style={styles.bottomLinkRow}>
              <Text style={styles.bottomPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.bottomLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Account Selector Modal */}
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
              >
                <CloseIcon size={22} color="#38BDF8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.inputLabel}>CHOOSE AN ACCOUNT</Text>

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

            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>OR ENTER ANOTHER GOOGLE EMAIL</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="example@gmail.com"
                  placeholderTextColor="#64748B"
                  value={selectedGoogleEmail}
                  onChangeText={setSelectedGoogleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

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
          </View>
        </View>
      </Modal>

      {/* Facebook Account Selector Modal */}
      <Modal
        visible={showFacebookAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFacebookAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowFacebookAccountModal(false)}
          />

          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalGoogleBrand}>
                <FacebookIcon size={26} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Sign in with Facebook</Text>
                  <Text style={styles.modalSubtitle}>to continue to Alerto Calbayog</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowFacebookAccountModal(false)}
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={22} color="#38BDF8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.inputLabel}>CHOOSE FACEBOOK ACCOUNT</Text>

            <TouchableOpacity
              style={styles.accountCard}
              onPress={() => handleSelectFacebookAccount("jasper.teorica@facebook.com")}
              activeOpacity={0.7}
            >
              <View style={[styles.accountAvatar, { backgroundColor: "#1877F2" }]}>
                <Text style={styles.avatarLetter}>F</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>Jasper Teorica</Text>
                <Text style={styles.accountEmail}>jasper.teorica@facebook.com</Text>
              </View>
              <Text style={styles.accountArrow}>›</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>OR ENTER YOUR FACEBOOK EMAIL</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="your.email@facebook.com"
                  placeholderTextColor="#64748B"
                  value={selectedFacebookEmail}
                  onChangeText={setSelectedFacebookEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitButton, { backgroundColor: "#1877F2" }]}
                onPress={() => handleSelectFacebookAccount(selectedFacebookEmail)}
                activeOpacity={0.85}
              >
                <Text style={[styles.modalSubmitButtonText, { color: "#FFFFFF" }]}>
                  Continue with Facebook Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal for New Social Residents */}
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
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalGoogleBrand}>
                {authMode === "facebook" ? <FacebookIcon size={26} /> : <GoogleIcon size={26} />}
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Complete Resident Profile</Text>
                  <Text style={styles.modalSubtitle}>
                    {authMode === "facebook" ? facebookUser?.facebook_email : googleUser?.google_email}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={styles.modalCloseBtn}
              >
                <CloseIcon size={22} color="#38BDF8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <Text style={styles.inputLabel}>MOBILE NUMBER (REQUIRED)</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="09XXXXXXXXX"
                  placeholderTextColor="#64748B"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <Text style={styles.inputLabel}>BARANGAY (REQUIRED)</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowBarangayPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectButtonText, !barangay && { color: "#64748B" }]}>
                  {barangay ? `Brgy. ${barangay}` : "Select Barangay in Calbayog"}
                </Text>
                <Text style={styles.selectButtonArrow}>▼</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>COMPLETE ADDRESS (REQUIRED)</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="Purok, Street, House / Building No."
                  placeholderTextColor="#64748B"
                  value={completeAddress}
                  onChangeText={setCompleteAddress}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  savingProfile && styles.btnDisabled,
                ]}
                onPress={handleFinishProfileRegistration}
                activeOpacity={0.85}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#040C1A" size="small" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>
                    Finish Registration
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barangay Picker Modal */}
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
                <CloseIcon size={20} color="#38BDF8" />
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
    backgroundColor: "#040C1A",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "space-around",
  },
  brandHeader: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0A1D38",
    borderWidth: 2,
    borderColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  formContainer: {
    width: "100%",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 18,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
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
  rememberText: {
    fontSize: 12.5,
    color: "#94A3B8",
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 12.5,
    color: "#38BDF8",
    fontWeight: "700",
  },
  loginBtn: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#040C1A",
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#16273E",
  },
  dividerText: {
    fontSize: 12,
    color: "#64748B",
    marginHorizontal: 12,
    fontWeight: "600",
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0B1728",
    borderWidth: 1,
    borderColor: "#1E2D42",
    marginBottom: 12,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E2E8F0",
    marginLeft: 10,
  },
  bottomLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  bottomPrompt: {
    fontSize: 13,
    color: "#94A3B8",
  },
  bottomLink: {
    fontSize: 13,
    fontWeight: "800",
    color: "#38BDF8",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4, 12, 26, 0.8)",
  },
  modalContainer: {
    backgroundColor: "#0B1728",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#1E2D42",
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#334155",
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
    color: "#FFFFFF",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#1E2D42",
    marginVertical: 14,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F213A",
    borderWidth: 1,
    borderColor: "#1E3352",
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
    color: "#FFFFFF",
  },
  accountEmail: {
    fontSize: 12,
    color: "#94A3B8",
  },
  accountArrow: {
    fontSize: 22,
    fontWeight: "700",
    color: "#38BDF8",
    paddingLeft: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  inputCard: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E2D42",
    backgroundColor: "#0F213A",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  inputCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalSubmitButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#040C1A",
  },
  selectButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E2D42",
    backgroundColor: "#0F213A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectButtonArrow: {
    fontSize: 10,
    color: "#38BDF8",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 12, 26, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContainer: {
    width: "100%",
    backgroundColor: "#0B1728",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E2D42",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  pickerItemSelected: {
    backgroundColor: "#0F2644",
  },
  pickerItemText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  pickerItemTextSelected: {
    color: "#38BDF8",
    fontWeight: "700",
  },
});
