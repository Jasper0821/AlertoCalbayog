import axios from "axios";
import Constants from "expo-constants";

/** Single source of truth for the production backend host. Keep in sync with eas.json. */
const PRODUCTION_API_HOST = "https://alertocalbayog-2.onrender.com";

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

  // 3. Fallback.
  //
  // WARNING: this value is compiled into the APK at build time. Changing the
  // backend host means editing PRODUCTION_API_HOST below AND eas.json, then
  // rebuilding and redistributing the app — already-installed copies keep
  // calling whatever host was baked in when they were built. Pointing this at a
  // domain you control, rather than a host's own subdomain, would make future
  // moves a DNS change instead of a forced reinstall.
  return `${PRODUCTION_API_HOST}/api`;
};

export const backendUrl = getBackendUrl();

const api = axios.create({
    baseURL: backendUrl,
    headers: {
      "X-App-Source": "mobile",
    },
});

// Root of the server, without the trailing "/api" the axios instance uses.
const serverRoot = backendUrl.replace(/\/api\/?$/, "");

let warmUpStartedAt = 0;

/**
 * The backend sleeps on Render's free tier and takes ~20s to answer its first
 * request. A resident who opens the app during an emergency should not pay that
 * cost at the moment they press Register, so we start waking the server as soon
 * as any auth screen mounts and let it boot while they are still typing.
 *
 * Fire-and-forget by design: the caller never awaits this and a failure here
 * must never surface to the user or block the real request that follows.
 */
export const warmUpServer = (): void => {
  const now = Date.now();
  // One wake-up per minute is plenty; repeated mounts should not spam the server.
  if (now - warmUpStartedAt < 60_000) return;
  warmUpStartedAt = now;

  axios
    .get(`${serverRoot}/health`, { timeout: 30000 })
    .catch(() => {
      // Server may still be booting. The real request will retry on its own.
    });
};

export default api;