import React from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { COLORS } from "../styles/colors";

export default function CustomInput(props: TextInputProps): React.JSX.Element {

  return (
    <View className="w-full mb-4">
      <TextInput
        placeholderTextColor={COLORS.textGray}
        className={`bg-surface border border-border rounded-xl px-4 py-3.5 text-white text-base shadow-sm focus:border-primary focus:bg-blue-500/5`}
        {...props}
      />
    </View>
  );
}