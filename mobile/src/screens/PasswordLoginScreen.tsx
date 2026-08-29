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
import CustomInput from "../components/CustomInput";
import { ArrowLeftIcon, LockIcon, GoogleIcon } from "../components/SvgIcons";
import api, { backendUrl } from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS } from "../styles/colors";

type PasswordLoginNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PasswordLogin"
>;

interface Props {
  navigation: PasswordLoginNavigationProp;
}

export default function PasswordLoginScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handlePasswordLogin = async (): Promise<void> => {
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
          ? `Cannot connect to server at ${backendUrl}. Please check your connection.`
          : error.message || "Invalid email or password.");
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
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
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 24) + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Bar: Back Button & App Badge ── */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              style={styles.backButton}
            >
              <ArrowLeftIcon size={18} color={COLORS.primary} />
            </TouchableOpacity>

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
          </View>

          {/* ── Centered Form Area ── */}
          <View style={styles.formSection}>
            <View style={styles.iconWrap}>
              <LockIcon size={28} color={COLORS.primary} />
            </View>

            <Text style={styles.heading}>Sign In with Password</Text>
            <Text style={styles.subheading}>
              Enter your registered email and password to access your account.
            </Text>

            {/* Subtle divider */}
            <View style={styles.divider} />

            {/* Email Field */}
            <Text style={styles.fieldLabel}>Email Address</Text>
            <CustomInput
              placeholder="Enter your email"
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
            <View style={styles.forgotPassRow}>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handlePasswordLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Secondary Option: Return to Google Sign In */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.googleOptionBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <GoogleIcon size={18} />
              <Text style={styles.googleOptionText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Bottom Tagline ── */}
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

  /* ── Top Bar ── */
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 24,
    height: 24,
  },
  brandTextContainer: {
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.accent,
    marginLeft: 4,
    letterSpacing: -0.3,
  },

  /* ── Form Section ── */
  formSection: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
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
  forgotPassRow: {
    alignItems: "flex-end",
    marginTop: -4,
    marginBottom: 16,
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* ── Login Button ── */
  loginButton: {
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
  loginButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  buttonDisabled: {
    opacity: 0.5,
    elevation: 0,
  },

  /* ── OR Divider ── */
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },

  /* ── Google Option Button ── */
  googleOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 8,
  },

  /* ── Register Row ── */
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.accent,
  },

  /* ── Footer ── */
  footer: {
    alignItems: "center",
    paddingTop: 16,
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
