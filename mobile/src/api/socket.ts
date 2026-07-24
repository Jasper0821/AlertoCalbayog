import { io, Socket } from "socket.io-client";
import { backendUrl } from "./axios";

// Construct the Socket.IO server URL based on the dynamically resolved backend URL.
// We remove the "/api" suffix if it's there to get the root server URL.
const SOCKET_URL = backendUrl.endsWith("/api") 
  ? backendUrl.substring(0, backendUrl.length - 4) 
  : backendUrl;

// Initialise the socket with sensible defaults for React Native / Expo environments.
const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["polling", "websocket"],
  upgrade: true,
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
});

// Add basic listeners to surface connection issues during development.
socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err?.message ?? err);
});

/**
 * Connect the Socket.IO client on demand.
 * This wrapper allows the app to decide when the socket should be established
 * (e.g., after user authentication) and makes testing easier.
 */
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    console.log("Attempting socket connection to", SOCKET_URL);
  }
};

export default socket;
