import { io, Socket } from "socket.io-client";
import { backendHost } from "./axios";

// Construct the Socket.IO server URL based on the dynamically resolved backend host.
// backendHost is obtained from Expo Constants or falls back to a static LAN IP.
const SOCKET_URL = `http://${backendHost}:5000`;

// Initialise the socket with sensible defaults for React Native / Expo environments.
const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // Manual connection control – call connectSocket() when needed
  transports: ["websocket"], // Force WebSocket transport for better compatibility
});

// Add basic listeners to surface connection issues during development.
socket.on("connect_error", (err) => {
  console.error("⚠️ Socket connection error:", err?.message ?? err);
});

/**
 * Connect the Socket.IO client on demand.
 * This wrapper allows the app to decide when the socket should be established
 * (e.g., after user authentication) and makes testing easier.
 */
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    console.log("🔗 Attempting socket connection to", SOCKET_URL);
  }
};

export default socket;
