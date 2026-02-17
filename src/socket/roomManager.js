const { v4: uuidv4 } = require("uuid");

let rooms = {};

function createRoom(io, players) {

   const roomId = uuidv4();

   rooms[roomId] = {
      players
   };

   players.forEach(player => {
      io.sockets.sockets.get(player.socketId)?.join(roomId);
   });

   io.to(roomId).emit("gameCreated", {
      roomId,
      players
   });

   console.log("Room created:", roomId);
}

module.exports = { createRoom };