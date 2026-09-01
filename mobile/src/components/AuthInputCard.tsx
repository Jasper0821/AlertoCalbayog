import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { EyeIcon, EyeOffIcon } from "./SvgIcons";

interface AuthInputCardProps extends TextInputProps {
  label: string;
  icon: React.ReactNode;
  isPassword?: boolean;
}

export default function AuthInputCard({
  label,
  icon,
  isPassword = false,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  ...props
}: AuthInputCardProps): React.JSX.Element {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.iconWrapper}>{icon}</View>

      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          secureTextEntry={isPassword ? !isPasswordVisible : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          {...props}
        />
      </View>

      {isPassword && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          activeOpacity={0.7}
          style={styles.eyeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isPasswordVisible ? (
            <EyeOffIcon size={20} color="#38BDF8" />
          ) : (
            <EyeIcon size={20} color="#64748B" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1728",
    borderWidth: 1,
    borderColor: "#1E2D42",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
    width: 28,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    padding: 0,
    margin: 0,
    height: 24,
  },
  eyeButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
