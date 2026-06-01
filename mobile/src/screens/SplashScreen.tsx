import React, { useEffect } from "react";
import { Image, View, Text } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Splash">;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: Props): React.JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2000);

    return () => clearTimeout(timer);
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

