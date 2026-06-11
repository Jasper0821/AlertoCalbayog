import { Platform } from "react-native";
import axios from "axios";
import Constants from "expo-constants";

// Dynamically retrieve the host PC's IP address from Expo Constants
const getBackendHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(":")[0];
  }
  // Fallback to the detected PC IP
  return "192.168.1.12";
};

export const backendHost = getBackendHost();

const api = axios.create({
    baseURL: `http://${backendHost}:5000/api`
});

export default api;