import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Header from "../components/Header";
import EmergencyButton from "../components/EmergencyButton";
import { clearStorage } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({
  navigation,
}: Props): React.JSX.Element {
  const logout = async (): Promise<void> => {
    await clearStorage();
    navigation.replace("Login");
  };

  const handleBack = (): void => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("Login");
    }
  };

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Dashboard" showBack />

      <ScrollView contentContainerClassName="p-5 pt-0 pb-10" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-white text-3xl font-black tracking-tight mb-2">Need help?</Text>
          <Text className="text-textGray text-sm font-medium">Select an emergency type to report immediately.</Text>
        </View>

        <EmergencyButton
          title="Fire Emergency"
          icon="🔥"
          color="#EF4444"
          onPress={() =>
            navigation.navigate("EmergencyReport", { emergencyType: "fire" })
          }
        />

        <EmergencyButton
          title="Flood Emergency"
          icon="🌊"
          color="#0EA5E9"
          onPress={() =>
            navigation.navigate("EmergencyReport", { emergencyType: "flood" })
          }
        />

        <EmergencyButton
          title="Medical Emergency"
          icon="🚑"
          color="#10B981"
          onPress={() =>
            navigation.navigate("EmergencyReport", { emergencyType: "medical" })
          }
        />

        <View className="mt-8 gap-4">
          <Text className="text-textGray font-black text-[10px] uppercase tracking-widest px-1">Resources</Text>
          
          <TouchableOpacity
            className="bg-surface flex-row items-center p-5 rounded-3xl border border-border shadow-lg"
            onPress={() => navigation.navigate("ReportHistory")}
          >
            <View className="w-10 h-10 rounded-xl bg-darkBlue items-center justify-center mr-4 border border-border">
              <Text className="text-lg">📜</Text>
            </View>
            <Text className="flex-1 text-white font-bold text-base">View Report History</Text>
            <Text className="text-white/20 text-xl font-bold">→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface flex-row items-center p-5 rounded-3xl border border-border shadow-lg"
            onPress={() => navigation.navigate("StatusUpdates")}
          >
             <View className="w-10 h-10 rounded-xl bg-darkBlue items-center justify-center mr-4 border border-border">
              <Text className="text-lg">💡</Text>
            </View>
            <Text className="flex-1 text-white font-bold text-base">Status Meanings</Text>
            <Text className="text-white/20 text-xl font-bold">→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-12 items-center py-4 bg-red/10 rounded-2xl border border-red/20"
          onPress={logout}
        >
          <Text className="font-black text-red uppercase tracking-widest">Logout Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}