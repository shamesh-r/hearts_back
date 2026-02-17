const matchmaking = require("./matchmaking");
const roomManager = require("./roomManager");

module.exports = (io) => {
  // Register per-socket listeners on each new websocket connection.
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handles queue join and automatic room creation.
    matchmaking(io, socket);

    // Client only needs to send card; room is resolved by socket id.
    socket.on("playCard", ({ card } = {}) => {
      roomManager.playCard(io, socket.id, card);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Remove from both waiting queue and active room state.
      matchmaking.removeWaitingPlayer(io, socket.id);
      roomManager.removePlayer(io, socket.id);
    });
  });
};
