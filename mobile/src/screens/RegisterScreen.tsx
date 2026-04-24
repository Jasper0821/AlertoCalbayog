import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import CustomInput from "../components/CustomInput";
import Header from "../components/Header";
import api from "../api/axios";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

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
    <KeyboardAvoidingView 
      className="flex-1 bg-darkBlue" 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerClassName="flex-grow p-5 justify-center" 
        showsVerticalScrollIndicator={false}
      >
        <Header title="Join Us" showBack />
        
        <View className="bg-surface rounded-3xl p-6 mt-5 border border-border shadow-2xl shadow-black">
          <Text className="text-white text-3xl font-black mb-2 tracking-tight">Create Account</Text>
          <Text className="text-textGray text-sm mb-6">Start securing your community</Text>

          <CustomInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
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

          <TouchableOpacity 
            className="bg-primary py-4 rounded-2xl items-center mt-4 shadow-lg shadow-primary/40" 
            onPress={handleRegister} 
            activeOpacity={0.8}
          >
            <Text className="text-white font-black text-base uppercase tracking-widest">Register Account</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-textGray text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-primary font-bold text-sm">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

  );
}
