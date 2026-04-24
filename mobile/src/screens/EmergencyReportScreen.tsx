import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
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

  const getEmergencyStyles = () => {
    switch(emergencyType) {
      case 'fire': return { bg: 'bg-red/10', border: 'border-red', text: 'text-red', btn: 'bg-red' };
      case 'flood': return { bg: 'bg-blue/10', border: 'border-blue', text: 'text-blue', btn: 'bg-blue' };
      case 'medical': return { bg: 'bg-green/10', border: 'border-green', text: 'text-green', btn: 'bg-green' };
      default: return { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary', btn: 'bg-primary' };
    }
  };

  const { bg, border, text, btn } = getEmergencyStyles();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        setLoading(false);
        return;
      }

      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (locError) {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          // If even last known position fails, provide a mock location for the emulator
          console.log("Providing mock location for emulator testing.");
          location = {
            coords: {
              latitude: 12.0645, // Calbayog City latitude
              longitude: 124.5950 // Calbayog City longitude
            }
          };
        }
      }
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
      Alert.alert("Error", error.response?.data?.message || error.message || "Failed to send report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-darkBlue">
      <Header title="Report Emergency" showBack />

      <View className="flex-1 p-5">
        <View className="bg-surface rounded-3xl p-6 border border-border shadow-2xl shadow-black">
          <Text className="text-textGray mb-4 font-black text-[10px] uppercase tracking-widest">Emergency Type</Text>
          <View className={`py-2 px-4 rounded-xl border self-start mb-8 ${bg} ${border}`}>
             <Text className={`text-base font-black tracking-widest ${text}`}>
               {emergencyType.toUpperCase()}
             </Text>
          </View>

          <Text className="text-white mb-2 font-light text-[10px] uppercase tracking-widest">Additional Details</Text>
          <CustomInput
            placeholder="Describe the situation briefly..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            className="h-[120px]"
            style={{ textAlignVertical: 'top' }}
          />

          <TouchableOpacity 
            className={`py-4 rounded-2xl items-center mt-6 shadow-lg ${btn} shadow-black/20`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
               <ActivityIndicator color="white" />
            ) : (
               <Text className="text-white font-black text-base uppercase tracking-widest">Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

