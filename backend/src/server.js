require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const setupSocket = require("./sockets/socket");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

app.set("io", io);
setupSocket(io);

const os = require("os");

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const networkInterfaces = os.networkInterfaces();
const lanIP = Object.values(networkInterfaces)
  .flat()
  .find((iface) => iface.family === "IPv4" && !iface.internal)?.address || "unknown";

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${lanIP}:${PORT}  ← share this with your team`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Stop the other process first, then try again.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});