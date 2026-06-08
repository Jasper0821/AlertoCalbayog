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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomInput from "../components/CustomInput";
import api from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS } from "../styles/colors";

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
  const [agreed, setAgreed] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const handleLogin = async (): Promise<void> => {
    if (!agreed) {
      Alert.alert(
        "User Agreement Required",
        "Please agree to the User Agreement before logging in."
      );
      return;
    }

    try {
      const res = await api.post("/auth/login", { email, password });

      await saveToken(res.data.token);
      await saveUser(res.data.user);

      navigation.replace("Home");
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Invalid login"
      );
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
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>
              Sign in to stay informed and keep your community safe.
            </Text>

            {/* Subtle divider */}
            <View style={styles.divider} />

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
                I agree to the{" "}
                <Text
                  style={styles.agreementLink}
                  onPress={() => navigation.navigate("UserAgreement")}
                >
                  User Agreement
                </Text>{" "}
                and acknowledge the terms of use.
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                !agreed && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={!agreed}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>
                Don't have an account?{" "}
              </Text>
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
    paddingVertical: 24,
  },
  heading: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -1,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: 4,
  },
  divider: {
    width: 40,
    height: 3.5,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    marginTop: 14,
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    opacity: 0.65,
  },

  /* ── Agreement ── */
  agreementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 1,
  },
  checkboxChecked: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  agreementText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  agreementLink: {
    fontWeight: "800",
    color: COLORS.accent,
  },

  /* ── Login Button ── */
  loginButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: "rgba(10, 30, 63, 0.2)",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  /* ── Register ── */
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
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
