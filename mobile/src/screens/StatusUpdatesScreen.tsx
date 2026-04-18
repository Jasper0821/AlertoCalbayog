import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";

export default function StatusUpdatesScreen(): React.JSX.Element {
  const statuses = [
    { id: 1, title: 'Pending', description: 'Your report has been received and is awaiting review.', color: COLORS.primary },
    { id: 2, title: 'Responding', description: 'Emergency units have been dispatched to your location.', color: COLORS.blue },
    { id: 3, title: 'Resolved', description: 'The emergency situation has been handled and cleared.', color: COLORS.green },
    { id: 4, title: 'Closed', description: 'This report is archived and no further action is needed.', color: COLORS.textGray },
  ];

  return (
    <View style={styles.container}>
      <Header title="Status Meanings" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Understanding the lifecycle of your emergency report:
        </Text>

        {statuses.map((status) => (
          <View key={status.id} style={styles.card}>
            <View style={[styles.indicator, { backgroundColor: status.color }]} />
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: status.color }]}>{status.title}</Text>
              <Text style={styles.description}>{status.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
  },
  intro: {
    color: COLORS.textGray,
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  indicator: {
    width: 6,
    height: '100%',
    borderRadius: 4,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  description: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  }
});