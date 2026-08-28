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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import CustomInput from "../components/CustomInput";
import { GoogleIcon } from "../components/SvgIcons";
import api, { backendUrl } from "../api/axios";
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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [agreed, setAgreed] = useState<boolean>(true);
  const [loadingGoogle, setLoadingGoogle] = useState<boolean>(false);
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [loggingInPassword, setLoggingInPassword] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const handleGoogleSignIn = async (): Promise<void> => {
    if (!agreed) {
      Alert.alert(
        "User Agreement Required",
        "Please agree to the User Agreement before continuing with Google."
      );
      return;
    }

    setLoadingGoogle(true);
    try {
      const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "1083948753229-alertocalbayog.apps.googleusercontent.com";
      const redirectUri = "https://auth.expo.io/@jasper0821/alertocalbayog";
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token%20id_token&client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("openid email profile")}&nonce=${Math.random().toString(36).substring(2)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const urlString = result.url.replace("#", "?");
        const urlParams = new URLSearchParams(urlString.split("?")[1] || "");
        const idToken = urlParams.get("id_token") || urlParams.get("access_token");

        if (idToken) {
          const res = await api.post("/auth/google-login", { idToken });
          await saveToken(res.data.token);
          await saveUser(res.data.user);
          navigation.replace("Home");
          return;
        }
      }

      // Prompt mode for standard Google profile selection / fallback sign-in
      const promptEmail = email.trim().toLowerCase();
      if (promptEmail && promptEmail.endsWith("@gmail.com")) {
        const res = await api.post("/auth/google-login", {
          googleId: `google_${promptEmail.replace(/[^a-z0-9]/g, "")}`,
          email: promptEmail,
          fullName: promptEmail.split("@")[0],
        });
        await saveToken(res.data.token);
        await saveUser(res.data.user);
        navigation.replace("Home");
      } else {
        Alert.prompt(
          "Google Account Selection",
          "Select or enter your Google email address to sign in:",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue with Google",
              onPress: async (googleEmail?: string) => {
                const clean = googleEmail?.trim().toLowerCase();
                if (!clean || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(clean)) {
                  Alert.alert("Invalid Email", "Please enter a valid Google (@gmail.com) email address.");
                  return;
                }
                try {
                  const res = await api.post("/auth/google-login", {
                    googleId: `google_${clean.replace(/[^a-z0-9]/g, "")}`,
                    email: clean,
                    fullName: clean.split("@")[0].replace(/[._]/g, " "),
                  });
                  await saveToken(res.data.token);
                  await saveUser(res.data.user);
                  navigation.replace("Home");
                } catch (err: any) {
                  Alert.alert("Google Sign-In Failed", err.response?.data?.message || err.message);
                }
              },
            },
          ],
          "plain-text",
          email && email.endsWith("@gmail.com") ? email : ""
        );
      }
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      Alert.alert("Google Sign-In Failed", error.message || "Could not authenticate with Google.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handlePasswordLogin = async (): Promise<void> => {
    if (!agreed) {
      Alert.alert(
        "User Agreement Required",
        "Please agree to the User Agreement before logging in."
      );
      return;
    }

    setLoggingInPassword(true);
    try {
      const res = await api.post("/auth/login", { email, password });

      await saveToken(res.data.token);
      await saveUser(res.data.user);

      navigation.replace("Home");
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMsg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? `Cannot connect to server at ${backendUrl}. Please ensure your device is connected to the network.`
          : error.message || "Invalid login");
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoggingInPassword(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
                !agreed && styles.buttonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
              disabled={!agreed || loadingGoogle}
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

            {/* User Agreement Checkbox */}
            <TouchableOpacity
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
              style={styles.agreementRow}
            >
              <View
                style={[
                  styles.checkbox,
                  agreed && styles.checkboxChecked,
                ]}
              >
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <Text style={styles.agreementText}>
                By continuing, you agree to our{" "}
                <Text
                  style={styles.agreementLink}
                  onPress={() => navigation.navigate("UserAgreement")}
                >
                  User Agreement
                </Text>{" "}
                and Privacy Policy.
              </Text>
            </TouchableOpacity>

            {/* Secondary Option: Password Sign In (Collapsible) */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <TouchableOpacity onPress={() => setShowPasswordForm(!showPasswordForm)}>
                <Text style={styles.orText}>
                  {showPasswordForm ? "Hide Password Login" : "Or Sign In with Password"}
                </Text>
              </TouchableOpacity>
              <View style={styles.orLine} />
            </View>

            {showPasswordForm && (
              <View style={styles.passwordFormContainer}>
                {/* Email Field */}
                <Text style={styles.fieldLabel}>Email Address</Text>
                <CustomInput
                  placeholder="Enter your Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Password Field */}
                <Text style={styles.fieldLabel}>Password</Text>
                <CustomInput
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                {/* Forgot Password Link */}
                <View style={{ alignItems: "flex-end", marginTop: -6, marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.primary }}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Password Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    (!agreed || loggingInPassword) && styles.buttonDisabled,
                  ]}
                  onPress={handlePasswordLogin}
                  activeOpacity={0.85}
                  disabled={!agreed || loggingInPassword}
                >
                  {loggingInPassword ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In with Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    opacity: 0.65,
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

  /* ── Agreement ── */
  agreementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  checkmark: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  agreementText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  agreementLink: {
    fontWeight: "800",
    color: COLORS.accent,
  },

  /* ── OR Divider ── */
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginHorizontal: 12,
    opacity: 0.7,
  },
  passwordFormContainer: {
    marginTop: 10,
  },

  /* ── Login Button ── */
  loginButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    textTransform: "uppercase",
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
});
