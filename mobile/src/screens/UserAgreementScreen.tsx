import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Header from "../components/Header";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "UserAgreement">;
};

export default function UserAgreementScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="User Agreement" showBack />
      
      <ScrollView contentContainerClassName="p-5 pb-10">
        <View className="bg-surface rounded-3xl p-6 border border-border shadow-2xl shadow-black">
          <Text className="mb-4 text-textGray text-[10px] font-black uppercase tracking-widest">Legal Terms</Text>

          <Text className="mb-6 text-sm leading-6 text-white opacity-90">
            Welcome to AlertoCalbayog. By using this application, you agree to the
            following terms and conditions.
          </Text>

          {[
            "You will use this application responsibly and only for its intended purpose.",
            "You agree not to misuse, disrupt, or attempt unauthorized access to the system.",
            "Your data may be stored securely to improve app functionality and user experience.",
            "The app developers are not liable for misuse or incorrect information submitted by users."
          ].map((term, index) => (
            <View key={index} className="flex-row mb-4">
              <Text className="text-primary font-bold mr-3">{index + 1}.</Text>
              <Text className="flex-1 text-sm leading-6 text-white opacity-80">{term}</Text>
            </View>
          ))}

          <Text className="mt-4 mb-8 text-sm leading-6 text-textGray italic">
            By continuing to use this app, you acknowledge and accept these terms.
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="items-center rounded-2xl bg-primary py-4 shadow-lg shadow-primary/40"
          >
            <Text className="text-base font-black uppercase tracking-widest text-white">Accept & Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}