import React, { useEffect } from "react";
import { Image, View, Text } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { getToken, saveUser, clearStorage } from "../utils/Storage";
import api from "../api/axios";

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Splash">;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: Props): React.JSX.Element {
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) navigation.replace("Login");
          return;
        }

        // Verify session token with backend endpoint
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && res.data.valid && res.data.user) {
          await saveUser(res.data.user);
          if (isMounted) navigation.replace("Home");
        } else {
          await clearStorage();
          if (isMounted) navigation.replace("Login");
        }
      } catch (err: any) {
        console.log("Session check error:", err?.message || err);
        // If offline / network error but stored token exists, maintain persistent session
        const token = await getToken();
        if (token) {
          if (isMounted) navigation.replace("Home");
        } else {
          await clearStorage();
          if (isMounted) navigation.replace("Login");
        }
      }
    };

    const timer = setTimeout(() => {
      checkSession();
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View className="flex-1 bg-splash justify-center items-center p-5">
      <View className="w-32 h-32 rounded-[32px] bg-white/10 justify-center items-center mb-8 shadow-2xl shadow-black border border-blue/20">
        <Image
          source={require("../../assets/logo.png")}
          className="h-24 w-24"
          resizeMode="contain"
        />
      </View>
      <Text className="text-white text-5xl font-black tracking-tighter mb-2 italic">ALERTO</Text>
      <Text className="text-blue text-2xl font-black tracking-widest uppercase">Calbayog</Text>
      <View className="w-12 h-1.5 bg-blue rounded-full mt-6" />
      <Text className="text-slate-400 text-xs font-black uppercase tracking-[4px] mt-10 opacity-80">Secure Your Community</Text>
    </View>
  );
}

