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
import api, { backendUrl } from "../api/axios";
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
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [registrationToken, setRegistrationToken] = useState<string>("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [sendingCode, setSendingCode] = useState<boolean>(false);
  const [verifyingCode, setVerifyingCode] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const getErrorMessage = (error: any, fallback: string): string =>
    error.response?.data?.message ||
    (error.message === "Network Error"
      ? `Cannot connect to server at ${backendUrl}. Please ensure your device is connected to the network.`
      : error.message || fallback);

  const requestVerificationCode = async (): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(cleanEmail)) {
      Alert.alert("Gmail Required", "Please enter a valid Gmail address.");
      return;
    }

    setSendingCode(true);
    try {
      await api.post("/auth/request-registration-otp", { email: cleanEmail });
      setRegistrationToken("");
      setCodeSent(true);
      Alert.alert("Verification Code Sent", `A 6-digit code was sent to ${cleanEmail}.`);
    } catch (error: any) {
      Alert.alert("Gmail Not Verified", getErrorMessage(error, "This Gmail address could not be verified."));
    } finally {
      setSendingCode(false);
    }
  };

  const verifyEmailCode = async (): Promise<void> => {
    if (!codeSent || verificationCode.replace(/\D/g, "").length !== 6) {
      Alert.alert("Verification Required", "Enter the 6-digit code sent to your Gmail address.");
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await api.post("/auth/verify-registration-otp", {
        email: email.trim().toLowerCase(),
        code: verificationCode,
      });
      setRegistrationToken(response.data.registrationToken);
      Alert.alert("Gmail Verified", "Your Gmail address has been verified. You can now register.");
    } catch (error: any) {
      Alert.alert("Verification Failed", getErrorMessage(error, "The verification code is invalid."));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!registrationToken) {
      Alert.alert("Gmail Verification Required", "Verify your Gmail address before creating an account.");
      return;
    }
    try {
      await api.post("/auth/register", {
        fullName,
        email: email.trim().toLowerCase(),
        phoneNumber,
        password,
        registrationToken,
        role: "resident"
      });

      Alert.alert("Success", "Account created successfully");
      navigation.navigate("Login");
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert("Register Failed", getErrorMessage(error, "Registration failed"));
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
              onChangeText={(value) => {
                setEmail(value);
                setRegistrationToken("");
                setCodeSent(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.verificationButton}
              onPress={requestVerificationCode}
              disabled={sendingCode}
              activeOpacity={0.85}
            >
              <Text style={styles.verificationButtonText}>{sendingCode ? "Sending Code..." : codeSent ? "Resend Gmail Code" : "Verify Gmail Address"}</Text>
            </TouchableOpacity>

            {codeSent && (
              <>
                <Text style={styles.fieldLabel}>Gmail Verification Code</Text>
                <CustomInput
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.verificationButton, registrationToken ? styles.verifiedButton : undefined]}
                  onPress={verifyEmailCode}
                  disabled={verifyingCode || Boolean(registrationToken)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.verificationButtonText, registrationToken ? styles.verifiedButtonText : undefined]}>{registrationToken ? "Gmail Verified" : verifyingCode ? "Verifying..." : "Confirm Code"}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Phone Number Field */}
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <CustomInput
              placeholder="Enter your Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
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
  verificationButton: {
    marginTop: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  verifiedButton: {
    backgroundColor: "#15803D",
    borderColor: "#15803D",
  },
  verificationButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  verifiedButtonText: {
    color: "#FFFFFF",
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
