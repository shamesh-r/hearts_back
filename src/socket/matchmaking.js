const { createRoom } = require("./roomManager");

let waitingPlayers = [];

module.exports = (io, socket) => {

   socket.on("startGame", (data) => {

      const player = {
         socketId: socket.id,
         name: data.name
      };

      console.log(player)

      waitingPlayers.push(player);

      console.log("Waiting players:", waitingPlayers.length);

      if (waitingPlayers.length >= 4) {
         const players = waitingPlayers.splice(0, 4);
         createRoom(io, players);
      }
   });

};
