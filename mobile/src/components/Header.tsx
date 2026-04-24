import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

interface Props {
  title: string;
  showBack?: boolean;
}

export default function Header({ title, showBack }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isModalVisible, setModalVisible] = useState(false);

  const hotlines = [
    { agency: "PNP (Police)", number: "117 / 0911-123-4567", icon: "🚓" },
    { agency: "BFP (Fire)", number: "911 / 0922-123-4567", icon: "🚒" },
    { agency: "CDRRMO (Rescue)", number: "0933-123-4567", icon: "🚑" },
    { agency: "Hospital / Medical", number: "0944-123-4567", icon: "🏥" },
  ];

  return (
    <>
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
        
        <View className="flex-row gap-3">
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
          >
            <Text className="text-white text-lg">☰</Text>
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center">
            <Text className="text-xs">🔔</Text>
          </View>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/70 justify-center items-center px-6"
          onPress={() => setModalVisible(false)}
        >
          <Pressable 
            className="w-full bg-surface border border-border rounded-3xl p-6"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white text-2xl font-black">Emergency</Text>
                <Text className="text-primary text-xl font-bold">Hotlines</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="w-10 h-10 rounded-full bg-background border border-border items-center justify-center"
              >
                <Text className="text-white text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              {hotlines.map((hotline, index) => (
                <View 
                  key={index} 
                  className="flex-row items-center bg-background border border-border rounded-2xl p-4"
                >
                  <View className="w-12 h-12 rounded-full bg-surface items-center justify-center mr-4">
                    <Text className="text-2xl">{hotline.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-text font-semibold mb-1">{hotline.agency}</Text>
                    <Text className="text-white font-black tracking-wider">{hotline.number}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-8">
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="w-full bg-primary py-4 rounded-full items-center"
              >
                <Text className="text-white font-bold text-lg">Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

