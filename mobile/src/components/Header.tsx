import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

interface Props {
  title: string;
  showBack?: boolean;
}

export default function Header({ title, showBack }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View 
      className="pb-6 px-5 w-full flex-row items-center justify-between" 
      style={{ paddingTop: Math.max(insets.top, 20) }}
    >
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-surface border border-border"
          >
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text className="text-white text-2xl font-black tracking-tight">{title}</Text>
          <View className="w-8 h-1 bg-primary rounded-full mt-1" />
        </View>
      </View>
      
      {/* Placeholder for trailing icons like the theme image */}
      <View className="flex-row gap-3">
        <View className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center">
          <Text className="text-xs">🔔</Text>
        </View>
      </View>
    </View>
  );
}
