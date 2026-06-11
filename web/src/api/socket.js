import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  || `http://${window.location.hostname}:5000`;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["polling", "websocket"],
  upgrade: true,
  timeout: 10000,
});

export default socket;
