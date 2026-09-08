import { io } from "socket.io-client";
import { API_HOST } from "./config.js";

const socket = io(API_HOST, {
  autoConnect: false,
  transports: ["polling", "websocket"],
  upgrade: true,
  timeout: 10000,
});

export default socket;
