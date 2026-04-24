import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface Props {
  title: string;
  icon: string;
  onPress: () => void;
  color: string;
}

export default function EmergencyButton({ title, icon, onPress, color }: Props): React.JSX.Element {
  return (
    <TouchableOpacity 
      className="bg-surface flex-row items-center p-5 rounded-3xl mb-4 border border-border shadow-2xl shadow-black"
      style={{ borderLeftWidth: 6, borderLeftColor: color }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View 
        className="w-14 h-14 rounded-2xl items-center justify-center mr-4" 
        style={{ backgroundColor: `${color}15` }}
      >
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-lg font-black tracking-tight">{title}</Text>
        <Text className="text-textGray text-xs font-medium uppercase tracking-wider mt-0.5">Report Immediately</Text>
      </View>
      <Text className="text-white/20 text-xl font-bold">→</Text>
    </TouchableOpacity>
  );
}

