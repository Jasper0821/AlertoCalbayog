import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon } from "../components/SvgIcons";
import api, { backendUrl } from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";

type OtpVerificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OtpVerification"
>;

type OtpVerificationScreenRouteProp = RouteProp<
  RootStackParamList,
  "OtpVerification"
>;

interface Props {
  navigation: OtpVerificationScreenNavigationProp;
  route: OtpVerificationScreenRouteProp;
}

export default function OtpVerificationScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const email = route.params?.email || "user@gmail.com";
  const mode = route.params?.mode || "registration"; // 'registration' | 'forgot_password'
  const registerData = route.params?.registerData;

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);

  const fullCode = otpDigits.join("");

  const handleKeyPress = (digit: string) => {
    if (digit === "BACKSPACE") {
      const lastIndex = otpDigits.reduce((acc, cur, idx) => (cur !== "" ? idx : acc), -1);
      if (lastIndex !== -1) {
        const nextDigits = [...otpDigits];
        nextDigits[lastIndex] = "";
        setOtpDigits(nextDigits);
      }
      return;
    }

    if (digit === "CLEAR") {
      setOtpDigits(["", "", "", "", "", ""]);
      return;
    }

    const firstEmptyIndex = otpDigits.findIndex((d) => d === "");
    if (firstEmptyIndex !== -1) {
      const nextDigits = [...otpDigits];
      nextDigits[firstEmptyIndex] = digit;
      setOtpDigits(nextDigits);
    }
  };

  const handleContinue = async () => {
    if (fullCode.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "registration") {
        // Step 1: Verify Registration OTP with backend
        const verifyRes = await api.post("/auth/verify-registration-otp", {
          email: email.trim().toLowerCase(),
          code: fullCode,
        });

        const registrationToken = verifyRes.data.registrationToken;

        if (registerData) {
          // Step 2: Complete user account creation
          const regRes = await api.post("/auth/register", {
            ...registerData,
            email: email.trim().toLowerCase(),
            registrationToken,
          });

          await saveToken(regRes.data.token);
          await saveUser(regRes.data.user);

          Alert.alert("Welcome!", "Account created successfully.");
          navigation.replace("Home");
        } else {
          Alert.alert("Email Verified", "Your email address is verified. Proceed to register.");
          navigation.navigate("Register");
        }
      } else if (mode === "forgot_password") {
        // Verify Forgot Password OTP
        const res = await api.post("/auth/verify-otp", {
          email: email.trim().toLowerCase(),
          otpCode: fullCode,
        });

        const resetToken = res.data?.resetToken;
        if (resetToken) {
          navigation.navigate("ForgotPassword", { step: "reset", resetToken, email });
        } else {
          Alert.alert("OTP Verified", "Code verified successfully.");
        }
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const msg =
        err.response?.data?.message ||
        (err.message === "Network Error"
          ? `Cannot connect to server at ${backendUrl}.`
          : "Invalid or expired OTP code.");
      Alert.alert("Verification Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      if (mode === "registration") {
        await api.post("/auth/request-registration-otp", { email: email.trim().toLowerCase() });
      } else {
        await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      }
      setOtpDigits(["", "", "", "", "", ""]);
      Alert.alert("OTP Resent", `A new 6-digit code was sent to ${email}.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to resend OTP. Please try again.";
      Alert.alert("Resend Failed", msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040C1A" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar with back button */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <ArrowLeftIcon size={18} color="#38BDF8" />
          </TouchableOpacity>
        </View>

        {/* Logo Container matching mock */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>Enter OTP</Text>
          <Text style={styles.headerSubtitle}>
            OTP sent to your email address{"\n"}
            <Text style={styles.emailHighlight}>{email}</Text>. Enter the code to proceed.
          </Text>
        </View>

        {/* OTP Code Boxes */}
        <View style={styles.digitsRow}>
          {otpDigits.map((digit, idx) => {
            const isFilled = digit !== "";
            return (
              <View
                key={idx}
                style={[
                  styles.digitBox,
                  isFilled && styles.digitBoxActive,
                ]}
              >
                <Text style={styles.digitText}>{digit}</Text>
              </View>
            );
          })}
        </View>

        {/* Primary Pill Continue Button */}
        <TouchableOpacity
          style={[styles.continueBtn, loading && styles.btnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#040C1A" size="small" />
          ) : (
            <Text style={styles.continueBtnText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP Link */}
        <View style={styles.resendRow}>
          <Text style={styles.resendPrompt}>Don't receive the OTP? </Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
            <Text style={styles.resendLink}>{resending ? "Sending..." : "Resend OTP"}</Text>
          </TouchableOpacity>
        </View>

        {/* Numeric Keypad Grid */}
        <View style={styles.keypadGrid}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✕"].map((keyVal) => {
            let actionKey = keyVal;
            if (keyVal === "⌫") actionKey = "BACKSPACE";
            if (keyVal === "✕") actionKey = "CLEAR";

            return (
              <TouchableOpacity
                key={keyVal}
                style={styles.keypadBtn}
                onPress={() => handleKeyPress(actionKey)}
                activeOpacity={0.6}
              >
                <Text style={[styles.keypadText, (keyVal === "⌫" || keyVal === "✕") && { color: "#38BDF8" }]}>
                  {keyVal}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0B1728",
    borderWidth: 1,
    borderColor: "#1E2D42",
    justifyContent: "center",
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginVertical: 12,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0A1D38",
    borderWidth: 2,
    borderColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  emailHighlight: {
    color: "#38BDF8",
    fontWeight: "700",
  },
  digitsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 18,
    width: "100%",
  },
  digitBox: {
    width: 44,
    height: 48,
    borderRadius: 22,
    backgroundColor: "#0B1728",
    borderWidth: 1.5,
    borderColor: "#1E2D42",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  digitBoxActive: {
    borderColor: "#38BDF8",
    backgroundColor: "#0F2644",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  digitText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  continueBtn: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#040C1A",
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  resendPrompt: {
    fontSize: 13,
    color: "#94A3B8",
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "800",
    color: "#38BDF8",
  },
  keypadGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  keypadBtn: {
    width: "28%",
    height: 54,
    borderRadius: 27,
    backgroundColor: "#0B1728",
    borderWidth: 1,
    borderColor: "#16273E",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },
  keypadText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
