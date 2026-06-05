import { Platform } from "react-native";
import axios from "axios";

// ⚠️ Use your PC's actual Wi-Fi IP address so real devices can connect.
// Run `ipconfig` on your PC and look for "IPv4 Address" under your Wi-Fi adapter.
const backendHost = '192.168.1.109';

const api = axios.create({
    baseURL: `http://${backendHost}:5000/api`
});

export default api;