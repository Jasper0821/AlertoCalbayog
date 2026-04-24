import React from "react";
import { View, Text, ScrollView } from "react-native";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";

export default function StatusUpdatesScreen(): React.JSX.Element {
  const statuses = [
    { id: 1, title: 'Pending', description: 'Your report has been received and is awaiting review.', color: COLORS.primary },
    { id: 2, title: 'Responding', description: 'Emergency units have been dispatched to your location.', color: COLORS.blue },
    { id: 3, title: 'Resolved', description: 'The emergency situation has been handled and cleared.', color: COLORS.green },
    { id: 4, title: 'Closed', description: 'This report is archived and no further action is needed.', color: COLORS.textGray },
  ];

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Status Meanings" showBack />
      
      <ScrollView contentContainerClassName="p-5 pt-0" showsVerticalScrollIndicator={false}>
        <Text className="text-textGray text-sm mb-6 leading-5 font-medium">
          Understanding the lifecycle of your emergency report:
        </Text>

        {statuses.map((status) => (
          <View key={status.id} className="flex-row bg-surface rounded-2xl p-5 mb-4 border border-border items-center shadow-2xl shadow-black">
            <View className="w-1.5 self-stretch rounded-full mr-5" style={{ backgroundColor: status.color }} />
            <View className="flex-1">
              <Text className="text-lg font-black mb-1 tracking-tight" style={{ color: status.color }}>{status.title}</Text>
              <Text className="text-white text-sm leading-5 font-medium opacity-80">{status.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
