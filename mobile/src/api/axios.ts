import { Platform } from "react-native";
import axios from "axios";

// Automatically use localhost if on web (local testing) or the IP if on mobile
const backendHost = Platform.OS === 'web' ? 'localhost' : '192.168.254.117';

const api = axios.create({
    baseURL: `http://${backendHost}:5000/api`
});

export default api; 