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
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api, { backendUrl } from "../api/axios";
import { saveToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

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
  const insets = useSafeAreaInsets();
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (): Promise<void> => {
    const cleanMobile = mobileNumber.trim().replace(/[\s-]/g, "");

    if (!cleanMobile) {
      Alert.alert("Input Required", "Please enter your registered mobile number.");
      return;
    }

    if (!password) {
      Alert.alert("Input Required", "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        mobileNumber: cleanMobile,
        password,
      });

      await saveToken(res.data.token);
      await saveUser(res.data.user);

      // Instant access to Emergency Dashboard (Home)
      navigation.replace("Home");
    } catch (error: any) {
      console.warn("Mobile Login response:", error.response?.status, error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? `Cannot connect to server at ${backendUrl}. Please check your network connection.`
          : error.message || "Invalid mobile number or password.");
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040C1A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + 20, 40), paddingBottom: Math.max(insets.bottom + 20, 30) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image
                source={require("../../assets/logo.png")}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appTitle}>ALERTO CALBAYOG</Text>
          </View>

          {/* Card Container */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resident Sign In</Text>
            <Text style={styles.cardSubtitle}>
              Sign in with your mobile number and password for instant emergency dispatch access.
            </Text>

            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="09XXXXXXXXX"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                maxLength={11}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.passwordHeaderRow}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeText}>{showPassword ? "HIDE" : "SHOW"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>SIGN IN NOW</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Action */}
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.8}
            >
              <Text style={styles.registerBtnText}>CREATE NEW RESIDENT ACCOUNT</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
  },
  appTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#0B192C",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#94A3B8",
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#040C1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    height: 48,
    paddingHorizontal: 16,
  },
  passwordHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  forgotText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "700",
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  eyeText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "900",
  },
  loginBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1E293B",
  },
  dividerText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    marginHorizontal: 12,
  },
  registerBtn: {
    backgroundColor: "transparent",
    borderRadius: 14,
    height: 46,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  registerBtnText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
