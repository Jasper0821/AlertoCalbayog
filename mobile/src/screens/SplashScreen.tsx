import React, { useEffect } from "react";
import { View, Text } from "react-native";
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
    <View className="flex-1 bg-darkBlue justify-center items-center p-5">
      <View className="w-28 h-28 rounded-3xl bg-surface justify-center items-center mb-8 shadow-2xl shadow-black border border-primary/20">
        <Text className="text-6xl">🛡️</Text>
      </View>
      <Text className="text-white text-5xl font-black tracking-tighter mb-2 italic">ALERTO</Text>
      <Text className="text-primary text-2xl font-black tracking-widest uppercase">Calbayog</Text>
      <View className="w-12 h-1.5 bg-primary rounded-full mt-6" />
      <Text className="text-textGray text-xs font-black uppercase tracking-[4px] mt-10 opacity-50">Secure Your Community</Text>
    </View>
  );
}
