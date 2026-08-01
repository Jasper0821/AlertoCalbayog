import axios from "axios";
import Constants from "expo-constants";

// Dynamically retrieve the host PC's IP address from Expo Constants or process.env
const getBackendUrl = () => {
  // 1. In development (Expo Go / Dev Client), prioritize dynamic host detection so it automatically works
  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000/api`;
  }

  // 2. Check for explicit environment variable (configured in .env or eas.json during build)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, "");
    return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
  }

  // 3. Fallback to Cloudflare tunnel URL
  return "https://dear-catch-agreements-membership.trycloudflare.com/api";
};

export const backendUrl = getBackendUrl();

const api = axios.create({
    baseURL: backendUrl,
    headers: {
      "X-App-Source": "mobile",
    },
});

export default api;