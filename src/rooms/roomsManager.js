const { v4: uuidv4 } = require("uuid")
const gameEngine = require("../game/gameEngine")

// Legacy room store (object map); current socket flow uses socket/roomManager.js.
const rooms = {}
console.log(rooms)

exports.joinRoom = (roomId, socketId, playerName) => {

  if (!rooms[roomId]) {
    // Lazily create a game when room is first referenced.
    rooms[roomId] = gameEngine.createNewGame(roomId)
  }

  const room = rooms[roomId]

  if (room.players.length >= 4) return room

  // Add player with empty hand; cards are dealt once room reaches 4.
  room.players.push({
    id: socketId,
    name: playerName,
    hand: [],
  })

  if (room.players.length === 4) {
    gameEngine.startGame(room)
  }

  return room
}

exports.playCard = (roomId, socketId, card) => {
  const room = rooms[roomId]
  if (!room) return null

  // Delegate card rules/state updates to game engine.
  return gameEngine.playCard(room, socketId, card)
}

exports.handleDisconnect = (socketId) => {
  // Remove disconnected player from any room they were in.
  for (let roomId in rooms) {
    rooms[roomId].players =
      rooms[roomId].players.filter(p => p.id !== socketId)
  }
}
