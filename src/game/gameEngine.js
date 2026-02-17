const deckUtil = require("./deck")
const rules = require("./rules")

exports.createNewGame = (roomId) => ({
  roomId,
  players: [],
  currentTurn: null,
  currentTrick: [],
  heartsBroken: false,
  scores: {},
  phase: "waiting",
})

exports.startGame = (room) => {

  const deck = deckUtil.createDeck()
  deckUtil.shuffle(deck)

  room.players.forEach((player, index) => {
    player.hand = deck.splice(0, 13)
    room.scores[player.id] = 0
  })

  room.phase = "playing"
  room.currentTurn = room.players[0].id
}

exports.playCard = (room, socketId, card) => {

  const player = room.players.find(p => p.id === socketId)
  if (!player) return room

  // Validate move
  if (!rules.isValidMove(room, player, card)) {
    return room
  }

  // Remove card
  player.hand = player.hand.filter(c => c.id !== card.id)

  room.currentTrick.push({
    playerId: socketId,
    card
  })

  if (room.currentTrick.length === 4) {
    rules.resolveTrick(room)
  } else {
    rules.moveToNextPlayer(room)
  }

  return room
}
