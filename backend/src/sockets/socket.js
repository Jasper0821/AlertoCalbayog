const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

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