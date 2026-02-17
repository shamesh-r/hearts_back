exports.isValidMove = (room, player, card) => {
  // TODO:
  // - turn validation
  // - follow suit
  // - hearts broken rule
  return true
}

exports.moveToNextPlayer = (room) => {
  const currentIndex =
    room.players.findIndex(p => p.id === room.currentTurn)

  const nextIndex = (currentIndex + 1) % 4
  room.currentTurn = room.players[nextIndex].id
}

exports.resolveTrick = (room) => {
  // Determine winner
  const winner = room.currentTrick[0].playerId

  room.currentTurn = winner
  room.currentTrick = []
}