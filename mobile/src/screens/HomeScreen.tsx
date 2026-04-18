import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Header from "../components/Header";
import EmergencyButton from "../components/EmergencyButton";
import { COLORS } from "../styles/colors";
import { clearStorage } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props): React.JSX.Element {
  const logout = async (): Promise<void> => {
    await clearStorage();
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <Header title="AlertoCalbayog" />

      <Text style={styles.subtitle}>Choose an emergency type</Text>

      <EmergencyButton
        title="Fire Emergency"
        icon="🔥"
        color={COLORS.red}
        onPress={() => navigation.navigate("EmergencyReport", { emergencyType: "fire" })}
      />

      <EmergencyButton
        title="Flood Emergency"
        icon="🌊"
        color={COLORS.blue}
        onPress={() => navigation.navigate("EmergencyReport", { emergencyType: "flood" })}
      />

      <EmergencyButton
        title="Medical Emergency"
        icon="🚑"
        color={COLORS.green}
        onPress={() => navigation.navigate("EmergencyReport", { emergencyType: "medical" })}
      />
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("ReportHistory")}
      >
        <Text style={styles.secondaryText}>View Report History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("StatusUpdates")}
      >
        <Text style={styles.secondaryText}>Status Updates</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Chat")}
      >
        <Text style={styles.secondaryText}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
    padding: 20
  },
  subtitle: {
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 24,
    fontSize: 16
  },
  secondaryButton: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12
  },
  secondaryText: {
    color: COLORS.white,
    fontWeight: "600"
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: "center"
  },
  logoutText: {
    color: COLORS.red,
    fontWeight: "700"
  }
});