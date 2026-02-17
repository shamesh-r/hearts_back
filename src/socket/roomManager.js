const { v4: uuidv4 } = require("uuid");
const gameEngine = require("../game/gameEngine");

// In-memory stores for live matches.
const rooms = new Map();
const socketToRoom = new Map();

// Emit both uppercase and lowercase event names to support mixed clients.
function emitCompat(target, eventName, payload) {
  target.emit(eventName, payload);
  if (eventName === "GAME_CREATED") {
    target.emit("gameCreated", payload);
  }
  if (eventName === "GAME_STATE") {
    target.emit("gameState", payload);
  }
}

// Send only public player data in shared game state.
function serializePlayers(room) {
  return room.players.map((player) => ({
    socketId: player.socketId,
    name: player.name,
    handCount: Array.isArray(player.hand) ? player.hand.length : 0,
  }));
}

// Build a player-specific state payload (real hand for self, counts for others).
function buildGameStateForPlayer(room, socketId) {
  const me = room.players.find((player) => player.socketId === socketId);

  return {
    roomId: room.roomId,
    hand: me?.hand || [],
    game: {
      roomId: room.roomId,
      phase: room.phase,
      currentTurn: room.currentTurn,
      players: serializePlayers(room),
      currentTrick: room.currentTrick,
      heartsBroken: room.heartsBroken,
      scores: room.scores,
    },
  };
}

// Notify a single client that their room/lobby is ready.
function emitGameCreatedToPlayer(io, socketId, roomId, players) {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) {
    return;
  }

  emitCompat(socket, "GAME_CREATED", {
    roomId,
    players: players.map((player) => ({
      socketId: player.socketId,
      name: player.name,
    })),
    mySocketId: socketId,
  });
}

// Broadcast individualized game state to each player in the same room.
function emitGameStateToRoom(io, room) {
  room.players.forEach((player) => {
    emitGameStateToPlayer(io, room, player.socketId);
  });
}

function emitGameStateToPlayer(io, room, socketId) {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) {
    return;
  }

  emitCompat(socket, "GAME_STATE", buildGameStateForPlayer(room, socketId));
}

// Create a room from 4 queued players and start the game immediately.
function createRoom(io, queuedPlayers) {
  const roomId = uuidv4();
  const room = gameEngine.createNewGame(roomId);

  room.players = queuedPlayers.map((player) => ({
    id: player.socketId,
    socketId: player.socketId,
    name: player.name,
    hand: [],
  }));

  room.players.forEach((player) => {
    socketToRoom.set(player.socketId, roomId);
    const socket = io.sockets.sockets.get(player.socketId);
    socket?.join(roomId);
  });

  gameEngine.startGame(room);
  rooms.set(roomId, room);

  room.players.forEach((player) => {
    emitGameCreatedToPlayer(io, player.socketId, roomId, room.players);
  });

  emitGameStateToRoom(io, room);
  return room;
}

// Resolve a room from socket id so client APIs do not need to send room id.
function getRoomBySocketId(socketId) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) {
    return null;
  }

  return rooms.get(roomId) || null;
}

// Normalize suit values from different client formats.
function normalizeSuit(value) {
  const source = String(value || "").trim().toUpperCase();
  if (source === "S" || source === "SPADE" || source === "SPADES") {
    return "spades";
  }
  if (source === "H" || source === "HEART" || source === "HEARTS") {
    return "hearts";
  }
  if (source === "D" || source === "DIAMOND" || source === "DIAMONDS") {
    return "diamonds";
  }
  if (source === "C" || source === "CLUB" || source === "CLUBS") {
    return "clubs";
  }
  return null;
}

// Normalize rank values from string/number inputs.
function normalizeRank(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const raw = String(value).trim().toUpperCase();
  if (raw === "A" || raw === "K" || raw === "Q" || raw === "J") {
    return raw;
  }
  if (/^(10|[2-9])$/.test(raw)) {
    return Number(raw);
  }
  return null;
}

// Match an incoming played card against the server hand safely.
function findMatchingCard(hand, card) {
  if (!Array.isArray(hand) || !card) {
    return null;
  }

  if (card.id) {
    const byId = hand.find((item) => item.id === card.id);
    if (byId) {
      return byId;
    }
  }

  const suit = normalizeSuit(card.suit || card.symbol);
  const rank = normalizeRank(card.rank || card.value);

  if (!suit || rank === null) {
    return null;
  }

  return hand.find((item) => {
    const handRank = normalizeRank(item.rank || item.value);
    return item.suit === suit && handRank === rank;
  }) || null;
}

// Process a play request and then emit fresh state.
function playCard(io, socketId, card) {
  const room = getRoomBySocketId(socketId);
  if (!room) {
    return null;
  }

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) {
    return null;
  }

  const resolvedCard = findMatchingCard(player.hand, card);
  if (!resolvedCard) {
    emitGameStateToPlayer(io, room, socketId);
    return room;
  }

  gameEngine.playCard(room, socketId, resolvedCard);
  emitGameStateToRoom(io, room);
  return room;
}

// Remove a disconnected player and keep room state consistent.
function removePlayer(io, socketId) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) {
    return null;
  }

  const room = rooms.get(roomId);
  socketToRoom.delete(socketId);

  if (!room) {
    return null;
  }

  room.players = room.players.filter((player) => player.socketId !== socketId);

  if (!room.players.length) {
    rooms.delete(roomId);
    return null;
  }

  if (!room.players.some((player) => player.socketId === room.currentTurn)) {
    room.currentTurn = room.players[0]?.socketId || null;
  }

  emitGameStateToRoom(io, room);
  return room;
}

module.exports = {
  createRoom,
  playCard,
  removePlayer,
  getRoomBySocketId,
};
