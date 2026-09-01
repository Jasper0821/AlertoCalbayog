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
import AuthInputCard from "../components/AuthInputCard";
import {
  MailIcon,
  LockIcon,
  UserIcon,
  PhoneIcon,
  GoogleIcon,
  FacebookIcon,
  CheckIcon,
} from "../components/SvgIcons";
import api, { backendUrl } from "../api/axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const getErrorMessage = (error: any, fallback: string): string =>
    error.response?.data?.message ||
    (error.message === "Network Error"
      ? `Cannot connect to server at ${backendUrl}. Please check your network connection.`
      : error.message || fallback);

  const handleStartRegistration = async (): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim()) {
      Alert.alert("Input Required", "Please enter your full name.");
      return;
    }

    if (!cleanEmail || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(cleanEmail)) {
      Alert.alert("Gmail Required", "Please enter a valid Gmail address (e.g. name@gmail.com).");
      return;
    }

    if (!password) {
      Alert.alert("Input Required", "Please enter a password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please try again.");
      return;
    }

    if (!agreeTerms) {
      Alert.alert("Terms Agreement Required", "Please agree to the Terms of Service to proceed.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Request OTP code from backend
      await api.post("/auth/request-registration-otp", { email: cleanEmail });

      setLoading(false);

      // Step 2: Navigate to OTP Verification Screen matching Image 3 mockup
      navigation.navigate("OtpVerification", {
        email: cleanEmail,
        mode: "registration",
        registerData: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          password,
          role: "resident",
        },
      });
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Verification Error", getErrorMessage(error, "Could not send verification code."));
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
              paddingTop: Math.max(insets.top, 16) + 10,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Screen Title */}
          <View style={styles.brandHeader}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.screenTitle}>Create Account</Text>
          </View>

          {/* Form Area */}
          <View style={styles.formContainer}>
            <AuthInputCard
              label="Full Name"
              icon={<UserIcon size={20} color="#38BDF8" />}
              placeholder="James Bond"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

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
              label="Phone Number"
              icon={<PhoneIcon size={18} color="#38BDF8" />}
              placeholder="09XXXXXXXXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <AuthInputCard
              label="Password"
              icon={<LockIcon size={20} color="#38BDF8" />}
              isPassword
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />

            <AuthInputCard
              label="Confirm Password"
              icon={<LockIcon size={20} color="#38BDF8" />}
              isPassword
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* Terms of Service Checkbox Row */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                style={styles.termsCheckboxContainer}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <CheckIcon size={12} color="#040C1A" />}
                </View>
                <Text style={styles.termsText}>I agree to the </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("UserAgreement")}>
                <Text style={styles.termsLink}>Terms of Service</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Button: Create Account */}
            <TouchableOpacity
              style={[styles.createBtn, loading && styles.btnDisabled]}
              onPress={handleStartRegistration}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#040C1A" size="small" />
              ) : (
                <Text style={styles.createBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or Create with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Options */}
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.85}
            >
              <GoogleIcon size={20} />
              <Text style={styles.socialBtnText}>Log In with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.85}
            >
              <FacebookIcon size={20} />
              <Text style={styles.socialBtnText}>Log In with Facebook</Text>
            </TouchableOpacity>

            {/* Bottom Link Row */}
            <View style={styles.bottomLinkRow}>
              <Text style={styles.bottomPrompt}>Do you have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.bottomLink}>Log In</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  brandHeader: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0A1D38",
    borderWidth: 2,
    borderColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImage: {
    width: 38,
    height: 38,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 18,
  },
  termsCheckboxContainer: {
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
  termsText: {
    fontSize: 12.5,
    color: "#94A3B8",
    fontWeight: "600",
  },
  termsLink: {
    fontSize: 12.5,
    color: "#38BDF8",
    fontWeight: "700",
  },
  createBtn: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  createBtnText: {
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
    marginVertical: 12,
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
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0B1728",
    borderWidth: 1,
    borderColor: "#1E2D42",
    marginBottom: 10,
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
    marginTop: 14,
    marginBottom: 8,
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
});
