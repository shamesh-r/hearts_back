exports.isValidMove = (room, player, card) => {
  // Placeholder validation. Add Hearts constraints here.
  // TODO:
  // - turn validation
  // - follow suit
  // - hearts broken rule
  return true
}

exports.moveToNextPlayer = (room) => {
  // Move turn pointer circularly through active room players.
  const currentIndex =
    room.players.findIndex(p => (p.socketId || p.id) === room.currentTurn)

  if (currentIndex < 0 || room.players.length === 0) {
    room.currentTurn = null
    return
  }

  const nextIndex = (currentIndex + 1) % room.players.length
  room.currentTurn = room.players[nextIndex].socketId || room.players[nextIndex].id
}

exports.resolveTrick = (room) => {
  // TODO: replace with real trick winner resolution by lead suit/high card.
  const winner = room.currentTrick[0].playerId

  room.currentTurn = winner
  room.currentTrick = []
}
