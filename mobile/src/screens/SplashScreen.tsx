import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../styles/colors";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Splash">;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: Props): React.JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoIcon}>🛡️</Text>
      </View>
      <Text style={styles.title}>AlertoCalbayog</Text>
      <Text style={styles.subtitle}>Emergency Response System</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  logoIcon: {
    fontSize: 50,
  },
  title: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textGray,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  }
});