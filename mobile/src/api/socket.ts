import { io } from "socket.io-client";

// Reusing the same PC host IP address configured in axios.ts
const backendHost = "192.168.1.12";
const SOCKET_URL = `http://${backendHost}:5000`;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;
