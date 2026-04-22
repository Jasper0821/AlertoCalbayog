import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import CustomInput from "../components/CustomInput";
import Header from "../components/Header";
import api from "../api/axios";
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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [agreed, setAgreed] = useState<boolean>(false);

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
    <KeyboardAvoidingView
      className="flex-1 bg-darkBlue"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-5"
        showsVerticalScrollIndicator={false}
      >
        <Header title="AlertoCalbayog" />

        <View className="mt-5 rounded-3xl border border-border bg-surface p-6 shadow-2xl shadow-black">
          <Text className="mb-2 text-3xl font-black text-white tracking-tight">Sign In</Text>
          <Text className="mb-6 text-textGray text-sm">Welcome back, secure your area.</Text>

          <CustomInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View className="mt-4 flex-row items-start">
            <TouchableOpacity
              onPress={() => setAgreed(!agreed)}
              className={`mr-3 mt-1 h-5 w-5 items-center justify-center rounded-lg border ${
                agreed ? "border-primary bg-primary" : "border-border bg-darkBlue"
              }`}
              activeOpacity={0.8}
            >
              {agreed && <Text className="text-xs font-bold text-white">✓</Text>}
            </TouchableOpacity>

            <Text className="flex-1 text-sm leading-5 text-textGray">
              I agree to the{" "}
              <Text
                className="font-bold text-primary"
                onPress={() => navigation.navigate("UserAgreement")}
              >
                User Agreement
              </Text>{" "}
              and acknowledge the terms of use.
            </Text>
          </View>

          <TouchableOpacity
            className={`mt-6 items-center rounded-2xl py-4 shadow-lg ${
              agreed ? "bg-primary shadow-primary/40" : "bg-primary/30"
            }`}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={!agreed}
          >
            <Text className="text-base font-black uppercase tracking-widest text-white">
              Login
            </Text>
          </TouchableOpacity>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-textGray">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text className="text-sm font-bold text-primary">
                Register Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

  );
}