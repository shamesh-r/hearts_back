const deckUtil = require("./deck");
const rules = require("./rules");

// Create base room state before enough players join.
exports.createNewGame = (roomId) => ({
  roomId,
  players: [],
  currentTurn: null,
  currentTrick: [],
  heartsBroken: false,
  scores: {},
  phase: "waiting",
});

exports.startGame = (room) => {
  // Standard Hearts setup: shuffle 52 cards and deal 13 to each player.
  const deck = deckUtil.createDeck();
  deckUtil.shuffle(deck);

  room.players.forEach((player) => {
    player.hand = deck.splice(0, 13);
    room.scores[player.socketId || player.id] = 0;
  });

  room.phase = "playing";
  room.currentTurn = room.players[0]?.socketId || room.players[0]?.id || null;
};

// Build a deterministic card id for matching played cards.
function getCardId(card) {
  if (!card) {
    return null;
  }
  if (card.id) {
    return card.id;
  }
  if (!card.suit || card.rank === undefined || card.rank === null) {
    return null;
  }
  return `${card.suit}${card.rank}`;
}

exports.playCard = (room, socketId, card) => {
  // Support players identified by either socketId (new flow) or id (legacy flow).
  const player = room.players.find((p) => (p.socketId || p.id) === socketId);
  if (!player) return room;

  if (!rules.isValidMove(room, player, card)) {
    return room;
  }

  const cardId = getCardId(card);
  if (!cardId) {
    return room;
  }

  const cardIndex = player.hand.findIndex((handCard) => getCardId(handCard) === cardId);
  if (cardIndex < 0) {
    return room;
  }

  // Remove exactly one matched card from hand and add it to the trick.
  const [playedCard] = player.hand.splice(cardIndex, 1);

  room.currentTrick.push({
    playerId: socketId,
    card: playedCard,
  });

  if (room.currentTrick.length === 4) {
    // Trick is complete, resolve winner and reset trick.
    rules.resolveTrick(room);
  } else {
    // Continue trick to next player's turn.
    rules.moveToNextPlayer(room);
  }

  return room;
};
