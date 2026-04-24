import { Platform } from "react-native";
import axios from "axios";

// Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator/Web
// (If testing on a physical device, replace with your PC's Wi-Fi IP address)
const backendHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const api = axios.create({
    baseURL: `http://${backendHost}:5000/api`
});

export default api; 