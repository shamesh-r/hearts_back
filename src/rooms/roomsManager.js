const { v4: uuidv4 } = require("uuid")
const gameEngine = require("../game/gameEngine")

const rooms = {}

exports.joinRoom = (roomId, socketId, playerName) => {

  if (!rooms[roomId]) {
    rooms[roomId] = gameEngine.createNewGame(roomId)
  }

  const room = rooms[roomId]

  if (room.players.length >= 4) return room

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

  return gameEngine.playCard(room, socketId, card)
}

exports.handleDisconnect = (socketId) => {
  for (let roomId in rooms) {
    rooms[roomId].players =
      rooms[roomId].players.filter(p => p.id !== socketId)
  }
}
