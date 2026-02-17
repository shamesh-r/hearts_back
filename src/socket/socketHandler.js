const matchmaking = require("./matchmaking");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

     matchmaking(io, socket);

    socket.on("joinRoom", ({ roomId, playerName }) => {
      const room = roomManager.joinRoom(roomId, socket.id, playerName);

      socket.join(roomId);

      io.to(roomId).emit("gameState", room);
    });

    socket.on("playCard", ({ roomId, card }) => {
      const updatedRoom = roomManager.playCard(roomId, socket.id, card);

      if (updatedRoom) {
        io.to(roomId).emit("gameState", updatedRoom);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
