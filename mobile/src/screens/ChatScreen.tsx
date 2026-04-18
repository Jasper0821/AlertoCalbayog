import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";

export default function ChatScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Header title="Chat Support" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.icon}>💬</Text>
          <Text style={styles.cardTitle}>Live Chat Support</Text>
          <Text style={styles.text}>Connect with our emergency dispatchers directly. This feature is coming very soon...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    color: COLORS.textGray,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
