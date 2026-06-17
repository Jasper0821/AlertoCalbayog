import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,

  StyleSheet,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomInput from "../components/CustomInput";
import { ArrowLeftIcon } from "../components/SvgIcons";
import api from "../api/axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS } from "../styles/colors";

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const insets = useSafeAreaInsets();

  const handleRegister = async (): Promise<void> => {
    try {
      await api.post("/auth/register", {
        fullName,
        email,
        password,
        role: "resident"
      });

      Alert.alert("Success", "Account created successfully");
      navigation.navigate("Login");
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Registration failed";
      Alert.alert("Register Failed", errorMsg);
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
          {/* ── Back Button ── */}
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
          </View>

          {/* ── Centered Form Area ── */}
          <View style={styles.formSection}>
            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.subheading}>
              Start securing your community and getting help fast.
            </Text>

            {/* Subtle divider */}
            <View style={styles.divider} />

            {/* Full Name Field */}
            <Text style={styles.fieldLabel}>Full Name</Text>
            <CustomInput
              placeholder="Enter your Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

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

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.registerButtonText}>Register Account</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Sign In</Text>
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

  /* ── Top Row ── */
  topRow: {
    flexDirection: "row",
    alignItems: "center",
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
    marginRight: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  /* ── Form Section ── */
  formSection: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 12,
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

  /* ── Register Button ── */
  registerButton: {
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
  registerButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  /* ── Login Link ── */
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loginLink: {
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
