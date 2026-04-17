import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import EmergencyButton from "../components/EmergencyButton";
import { COLORS } from "../styles/colors";

const HomeScreen = () => {
  const handleEmergency = (type) => {
    Alert.alert(
      "Confirm Emergency",
      `Are you sure you want to send a ${type} alert?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => console.log(`${type} alert sent`) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AlertoCalbayog</Text>
      <Text style={styles.subtitle}>Choose an emergency type</Text>

      <EmergencyButton title="🔥 FIRE" onPress={() => handleEmergency("Fire")} />
      <EmergencyButton title="🌊 FLOOD" onPress={() => handleEmergency("Flood")} />
      <EmergencyButton title="🚑 MEDICAL" onPress={() => handleEmergency("Medical")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 30
  }
});

export default HomeScreen;