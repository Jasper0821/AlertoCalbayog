import React, { useState } from "react";
import { TextInput, StyleSheet, View, type TextInputProps } from "react-native";
import { COLORS } from "../styles/colors";

export default function CustomInput(props: TextInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor={COLORS.textGray}
        style={[
          styles.input,
          isFocused && styles.inputFocused
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  }
});