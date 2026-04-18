import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import Header from "../components/Header";
import CustomInput from "../components/CustomInput";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";

type EmergencyReportScreenRouteProp = RouteProp<RootStackParamList, "EmergencyReport">;
type EmergencyReportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "EmergencyReport">;

interface Props {
  route: EmergencyReportScreenRouteProp;
  navigation: EmergencyReportScreenNavigationProp;
}

export default function EmergencyReportScreen({ route, navigation }: Props): React.JSX.Element {
  const { emergencyType } = route.params;
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const getEmergencyColor = (): string => {
    switch(emergencyType) {
      case 'fire': return COLORS.red;
      case 'flood': return COLORS.blue;
      case 'medical': return COLORS.green;
      default: return COLORS.primary;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const token = await getToken();

      const res = await api.post(
        "/emergency",
        {
          emergencyType,
          description,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      Alert.alert("Success", "Emergency report sent successfully");

      navigation.navigate("LiveTracking", {
        reportId: res.data.report._id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        emergencyType
      });
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Report Emergency" />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Emergency Type</Text>
          <View style={[styles.typeBadge, { backgroundColor: `${getEmergencyColor()}20`, borderColor: getEmergencyColor() }]}>
             <Text style={[styles.typeText, { color: getEmergencyColor() }]}>
               {emergencyType.toUpperCase()}
             </Text>
          </View>

          <Text style={styles.label}>Additional Details (Optional)</Text>
          <CustomInput
            placeholder="Describe the situation briefly..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: getEmergencyColor(), shadowColor: getEmergencyColor() }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
               <ActivityIndicator color={COLORS.white} />
            ) : (
               <Text style={styles.buttonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
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
    padding: 20,
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    color: COLORS.white,
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 16,
  },
  typeBadge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  }
});