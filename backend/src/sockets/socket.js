const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("identify", ({ userId, role, sessionId }) => {
      if (userId) {
        socket.join(userId);
        console.log(`Socket ${socket.id} identified as user: ${userId}`);
      }
      if (role) {
        socket.join(role);
        socket.join("all");
        console.log(`Socket ${socket.id} joined role room: ${role}`);
      }
      if (sessionId) {
        socket.join(`session:${sessionId}`);
        console.log(`Socket ${socket.id} joined session room: session:${sessionId}`);
      }
    });

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("leaveRoom", (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = setupSocket;