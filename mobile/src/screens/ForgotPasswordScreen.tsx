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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomInput from "../components/CustomInput";
import { ArrowLeftIcon, LockIcon } from "../components/SvgIcons";
import api, { backendUrl } from "../api/axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { COLORS } from "../styles/colors";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

interface Props {
  navigation: ForgotPasswordNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");

  const [email, setEmail] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  // Step 1: Send OTP to Email
  const handleRequestOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert("Validation Error", "Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: cleanEmail });
      Alert.alert("OTP Sent", `A 6-digit verification code has been sent to ${cleanEmail}.`);
      setStep("verify");
    } catch (error: any) {
      console.error("Request OTP error:", error);
      const msg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? `Cannot connect to server at ${backendUrl}.`
          : "Failed to send reset code.");
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      Alert.alert("Validation Error", "Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otpCode: cleanOtp,
      });

      const token = res.data?.resetToken;
      if (!token) {
        throw new Error("Invalid response from server.");
      }

      setResetToken(token);
      Alert.alert("OTP Verified", "Code verified! Now set your new password.");
      setStep("reset");
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      const msg = error.response?.data?.message || "Invalid or expired OTP code.";
      Alert.alert("Verification Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Validation Error", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Validation Error", "New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        resetToken,
        newPassword,
      });

      Alert.alert(
        "Password Reset Successful",
        "Your password has been reset. Please sign in with your new password.",
        [
          {
            text: "Sign In",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Reset password error:", error);
      const msg = error.response?.data?.message || "Failed to reset password.";
      Alert.alert("Reset Failed", msg);
    } finally {
      setLoading(false);
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
          {/* Back Button */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => {
                if (step === "verify") setStep("request");
                else if (step === "reset") setStep("verify");
                else navigation.goBack();
              }}
              activeOpacity={0.75}
              style={styles.backButton}
            >
              <ArrowLeftIcon size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Form Area */}
          <View style={styles.formSection}>
            <View style={styles.iconWrap}>
              <LockIcon size={32} color={COLORS.primary} />
            </View>

            <Text style={styles.heading}>Password Recovery</Text>

            {step === "request" && (
              <>
                <Text style={styles.subheading}>
                  Enter your registered email address and we'll send you a 6-digit OTP code to reset your password.
                </Text>
                <View style={styles.divider} />

                <Text style={styles.fieldLabel}>Registered Email</Text>
                <CustomInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRequestOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send OTP Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === "verify" && (
              <>
                <Text style={styles.subheading}>
                  Enter the 6-digit verification code sent to <Text style={{ fontWeight: "800", color: COLORS.primary }}>{email}</Text>.
                </Text>
                <View style={styles.divider} />

                <Text style={styles.fieldLabel}>6-Digit OTP Code</Text>
                <CustomInput
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleRequestOtp}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "reset" && (
              <>
                <Text style={styles.subheading}>
                  Create your new account password below.
                </Text>
                <View style={styles.divider} />

                <Text style={styles.fieldLabel}>New Password</Text>
                <CustomInput
                  placeholder="Enter new password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <CustomInput
                  placeholder="Re-enter new password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Return to login link */}
            <View style={styles.loginRow}>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
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
  },
  formSection: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
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
  primaryButton: {
    marginTop: 20,
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
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  resendBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  resendText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
});
