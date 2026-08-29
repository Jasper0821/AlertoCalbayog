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
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import CustomInput from "../components/CustomInput";
import { GoogleIcon, CloseIcon, UserIcon, LockIcon } from "../components/SvgIcons";
import api from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS } from "../styles/colors";

WebBrowser.maybeCompleteAuthSession();

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
  
  // Google Account Selector & Password Verification State
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState<string>("teorica821@gmail.com");
  const [signingInWithGoogleAccount, setSigningInWithGoogleAccount] = useState<boolean>(false);
  const [requiresPassword, setRequiresPassword] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [bindPassword, setBindPassword] = useState<string>("");

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
          const res = await api.post("/auth/google-login", { idToken });

          await saveToken(res.data.token);
          await saveUser(res.data.user);
          nativeSuccess = true;

          if (res.data.termsAccepted === false) {
            navigation.replace("UserAgreement");
          } else {
            navigation.replace("Home");
          }
          return;
        }
      }
    } catch (err: any) {
      console.log("Native Google Sign-In fallback notice:", err?.message || err);

      // If user manually cancelled native prompt, do not open modal
      if (err?.code === "SIGN_IN_CANCELLED" || err?.message?.includes("cancel")) {
        setLoadingGoogle(false);
        return;
      }
    } finally {
      setLoadingGoogle(false);
    }

    // Fallback for Expo Go (where RNGoogleSignin native binary is not available)
    if (!nativeSuccess) {
      setRequiresPassword(false);
      setIsNewUser(false);
      setBindPassword("");
      setShowGoogleModal(true);
    }
  };

  const handleModalGoogleLogin = async (selectedEmail?: string, pass?: string): Promise<void> => {
    const cleanEmail = (selectedEmail || googleAccountEmail).trim().toLowerCase();

    if (!cleanEmail || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(cleanEmail)) {
      Alert.alert("Invalid Google Email", "Please enter a valid Google (@gmail.com) email address.");
      return;
    }

    setSigningInWithGoogleAccount(true);
    try {
      const res = await api.post("/auth/google-login", {
        googleId: `google_${cleanEmail.replace(/[^a-z0-9]/g, "")}`,
        email: cleanEmail,
        fullName: cleanEmail.split("@")[0].replace(/[._]/g, " "),
        password: pass || bindPassword || undefined,
      });

      if (res.data?.requiresPassword) {
        setRequiresPassword(true);
        setIsNewUser(!!res.data.isNewUser);
        Alert.alert(
          res.data.isNewUser ? "Set Account Password" : "Verify Account Password",
          res.data.message || "Please enter a password to proceed with Google account login."
        );
        return;
      }

      await saveToken(res.data.token);
      await saveUser(res.data.user);
      setShowGoogleModal(false);
      setRequiresPassword(false);
      setIsNewUser(false);
      setBindPassword("");

      if (res.data.termsAccepted === false) {
        navigation.replace("UserAgreement");
      } else {
        navigation.replace("Home");
      }
    } catch (err: any) {
      console.error("Google Account login error:", err);
      Alert.alert(
        "Google Sign-In Failed",
        err.response?.data?.message || err.message || "Failed to sign in with Google account."
      );
    } finally {
      setSigningInWithGoogleAccount(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        className="flex-1"
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
            {/* Greeting */}
            <Text style={styles.heading}>Welcome to Alerto Calbayog</Text>
            <Text style={styles.subheading}>
              Send emergency reports quickly and keep your community safe.
            </Text>

            {/* Subtle divider */}
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

            {/* OR Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR SIGN IN WITH PASSWORD</Text>
              <View style={styles.orLine} />
            </View>

            {/* Password Login Button (Navigates to dedicated screen for more space) */}
            <TouchableOpacity
              style={styles.passwordButton}
              onPress={() => navigation.navigate("PasswordLogin")}
              activeOpacity={0.85}
            >
              <LockIcon size={20} color={COLORS.primary} />
              <Text style={styles.passwordButtonText}>Sign In with Password</Text>
            </TouchableOpacity>

            {/* Register Option */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Bottom tagline ── */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              Public Safety &amp; Emergency Alert System
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sleek Google Account Selector & Password Verification Modal ── */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowGoogleModal(false)} />

          <View style={styles.modalContainer}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              {/* Modal Handle */}
              <View style={styles.modalHandle} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalGoogleBrand}>
                  <GoogleIcon size={26} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.modalTitle}>Sign in with Google</Text>
                    <Text style={styles.modalSubtitle}>to continue to Alerto Calbayog</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowGoogleModal(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              {/* Google Account Selector or Password Verification */}
              {requiresPassword ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.modalSectionLabel}>
                    {isNewUser ? "CREATE ACCOUNT PASSWORD" : "ACCOUNT BINDING & VERIFICATION"}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14, lineHeight: 19 }}>
                    {isNewUser ? (
                      <>
                        Set a password for your account (<Text style={{ fontWeight: "800", color: COLORS.primary }}>{googleAccountEmail}</Text>) to complete registration and secure your login.
                      </>
                    ) : (
                      <>
                        An existing account for <Text style={{ fontWeight: "800", color: COLORS.primary }}>{googleAccountEmail}</Text> was found. Please enter your password to confirm account ownership and bind your Google account.
                      </>
                    )}
                  </Text>

                  <Text style={styles.inputLabel}>
                    {isNewUser ? "CREATE PASSWORD" : "ACCOUNT PASSWORD"}
                  </Text>
                  <CustomInput
                    placeholder={isNewUser ? "Create password (min 6 chars)" : "Enter your password"}
                    secureTextEntry
                    value={bindPassword}
                    onChangeText={setBindPassword}
                  />

                  <TouchableOpacity
                    style={[
                      styles.modalSubmitButton,
                      (!bindPassword || signingInWithGoogleAccount) && styles.buttonDisabled,
                    ]}
                    onPress={() => handleModalGoogleLogin(googleAccountEmail, bindPassword)}
                    activeOpacity={0.85}
                    disabled={!bindPassword || signingInWithGoogleAccount}
                  >
                    {signingInWithGoogleAccount ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.modalSubmitButtonText}>
                        {isNewUser ? "Create Account & Sign In" : "Verify & Bind Google Account"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ alignSelf: "center", marginTop: 12 }}
                    onPress={() => {
                      setRequiresPassword(false);
                      setIsNewUser(false);
                      setBindPassword("");
                    }}
                  >
                    <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: "700" }}>
                      ← Choose another Google account
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.modalSectionLabel}>CHOOSE AN ACCOUNT</Text>

                  <TouchableOpacity
                    style={styles.accountCard}
                    onPress={() => handleModalGoogleLogin(googleAccountEmail)}
                    activeOpacity={0.8}
                    disabled={signingInWithGoogleAccount}
                  >
                    <View style={styles.accountAvatar}>
                      <UserIcon size={22} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountName}>
                        {googleAccountEmail.split("@")[0]}
                      </Text>
                      <Text style={styles.accountEmail}>{googleAccountEmail}</Text>
                    </View>
                    {signingInWithGoogleAccount ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.accountArrow}>›</Text>
                    )}
                  </TouchableOpacity>

                  {/* Manual Email Input option if user wants another Google email */}
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.inputLabel}>OR ENTER ANOTHER GOOGLE EMAIL</Text>
                    <CustomInput
                      placeholder="example@gmail.com"
                      value={googleAccountEmail}
                      onChangeText={setGoogleAccountEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Confirm Google Button */}
                  <TouchableOpacity
                    style={[
                      styles.modalSubmitButton,
                      signingInWithGoogleAccount && styles.buttonDisabled,
                    ]}
                    onPress={() => handleModalGoogleLogin(googleAccountEmail)}
                    activeOpacity={0.85}
                    disabled={signingInWithGoogleAccount}
                  >
                    {signingInWithGoogleAccount ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.modalSubmitButtonText}>
                        Continue with Google Account
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },

  /* ── Brand ── */
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  logo: {
    width: 30,
    height: 30,
  },
  brandTextContainer: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.accent,
    marginLeft: 5,
    letterSpacing: -0.3,
  },

  /* ── Form Section ── */
  formSection: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  heading: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14.5,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginBottom: 4,
  },
  divider: {
    width: 40,
    height: 3.5,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    marginTop: 14,
    marginBottom: 24,
  },

  /* ── Google Button ── */
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: "#04112B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.2,
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
    elevation: 0,
  },

  /* ── OR Divider ── */
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    marginHorizontal: 12,
    letterSpacing: 0.8,
    opacity: 0.6,
  },

  /* ── Password Button ── */
  passwordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  passwordButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.3,
    marginLeft: 8,
  },

  /* ── Register Row ── */
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
  },
  registerText: {
    fontSize: 13.5,
    color: COLORS.textMuted,
  },
  registerLink: {
    fontSize: 13.5,
    fontWeight: "800",
    color: COLORS.accent,
  },

  /* ── Footer ── */
  footer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  footerLine: {
    width: 32,
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    opacity: 0.5,
  },

  /* ── Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 43, 0.65)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "85%",
    shadowColor: "#04112B",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalGoogleBrand: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  modalSectionLabel: {
    fontSize: 10.5,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1.2,
    marginBottom: 10,
    opacity: 0.6,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accountName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  accountEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  accountArrow: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalSubmitButton: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});
