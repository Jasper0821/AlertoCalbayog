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
  return "192.168.254.128";
};

export const backendHost = getBackendHost();
// ⚠️ Use your PC's actual Wi-Fi IP address so real devices can connect.
// Run `ipconfig` on your PC and look for "IPv4 Address" under your Wi-Fi adapter.
const backendHost = '192.168.1.12';

const api = axios.create({
    baseURL: `http://${backendHost}:5000/api`
});

export default api;