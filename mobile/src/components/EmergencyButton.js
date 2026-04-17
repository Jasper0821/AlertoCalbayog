import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS } from "../styles/colors";

const EmergencyButton = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "85%",
    backgroundColor: COLORS.transparentRed,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)"
  },
  text: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold"
  }
});

export default EmergencyButton;