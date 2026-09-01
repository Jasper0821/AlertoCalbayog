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
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api, { backendUrl } from "../api/axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

interface Props {
  navigation: ForgotPasswordNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"verify" | "reset">("verify");

  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  // Step 1: Verify identity
  const handleVerifyIdentity = async () => {
    const cleanMobile = mobileNumber.trim().replace(/[\s-]/g, "");
    const cleanEmergency = emergencyContactNumber.trim().replace(/[\s-]/g, "");

    if (!cleanMobile) {
      Alert.alert("Input Required", "Please enter your registered mobile number.");
      return;
    }

    if (!cleanEmergency) {
      Alert.alert("Input Required", "Please enter your emergency contact number.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        mobileNumber: cleanMobile,
        emergencyContactNumber: cleanEmergency,
      });

      setResetToken(res.data.resetToken);
      Alert.alert("Identity Verified", "Account identity verified. You may now set your new password.");
      setStep("reset");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const msg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? `Cannot connect to server at ${backendUrl}.`
          : "Identity verification failed. Information does not match account records.");
      Alert.alert("Verification Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Input Required", "Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        resetToken,
        newPassword,
        confirmPassword,
      });

      Alert.alert(
        "Password Reset Successful",
        "Your password has been reset successfully. Please sign in with your new password.",
        [
          {
            text: "Sign In Now",
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040C1A" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 16) + 16, paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Password Recovery</Text>
            <Text style={styles.subtitle}>
              {step === "verify"
                ? "Verify your account identity using your mobile number and emergency contact number."
                : "Create your new account password below."}
            </Text>
          </View>

          <View style={styles.card}>
            {step === "verify" ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>REGISTERED MOBILE NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09XXXXXXXXX"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    maxLength={11}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMERGENCY CONTACT NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09XXXXXXXXX"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    maxLength={11}
                    value={emergencyContactNumber}
                    onChangeText={setEmergencyContactNumber}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyIdentity}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.btnText}>VERIFY IDENTITY</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NEW PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.btnText}>SET NEW PASSWORD</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#0B192C",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  inputGroup: {
    marginBottom: 14,
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
    height: 46,
    paddingHorizontal: 14,
  },
  primaryBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  backBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  backText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "700",
  },
});
