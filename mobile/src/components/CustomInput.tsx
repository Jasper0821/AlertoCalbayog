import React, { useState } from "react";
import { TextInput, TouchableOpacity, View, type TextInputProps } from "react-native";
import { COLORS } from "../styles/colors";
import { EyeIcon, EyeOffIcon } from "./SvgIcons";

export default function CustomInput({
  className,
  secureTextEntry,
  ...props
}: TextInputProps): React.JSX.Element {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const isPasswordInput = Boolean(secureTextEntry);

  return (
    <View className="w-full mb-4">
      <View className="relative">
        <TextInput
          placeholderTextColor={COLORS.textGray}
          selectionColor={COLORS.accent}
          secureTextEntry={isPasswordInput ? !isPasswordVisible : secureTextEntry}
          className={`bg-surface border border-border rounded-xl py-3.5 pl-4 text-text text-base shadow-sm focus:border-accent focus:bg-surfaceAlt ${
            isPasswordInput ? "pr-12" : "pr-4"
          } ${className || ""}`}
          {...props}
        />

        {isPasswordInput && (
          <TouchableOpacity
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
            accessibilityRole="button"
            activeOpacity={0.7}
            className="absolute bottom-0 right-0 top-0 w-12 items-center justify-center"
            onPress={() => setPasswordVisible((visible) => !visible)}
          >
            {isPasswordVisible ? (
              <EyeOffIcon color={COLORS.textGray} size={22} />
            ) : (
              <EyeIcon color={COLORS.textGray} size={22} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
