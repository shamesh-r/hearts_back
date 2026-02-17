const { createRoom } = require("./roomManager");

const MAX_PLAYERS = 4;
// Global waiting queue for players who clicked "start game".
let waitingPlayers = [];

// Emit both event variants until all clients are unified.
function emitCompat(target, eventName, payload) {
  target.emit(eventName, payload);
  if (eventName === "GAME_CREATED") {
    target.emit("gameCreated", payload);
  }
}

// Update an existing queued player or add a new one.
function upsertWaitingPlayer(socketId, name) {
  const trimmedName = String(name || "").trim() || "Player";
  const existingIndex = waitingPlayers.findIndex((player) => player.socketId === socketId);

  if (existingIndex >= 0) {
    waitingPlayers[existingIndex].name = trimmedName;
    return;
  }

  waitingPlayers.push({ socketId, name: trimmedName });
}

// Send current waiting lobby snapshot to each queued player.
function emitWaitingLobby(io) {
  waitingPlayers.forEach((waitingPlayer) => {
    const socket = io.sockets.sockets.get(waitingPlayer.socketId);
    if (!socket) {
      return;
    }

    emitCompat(socket, "GAME_CREATED", {
      roomId: null,
      players: waitingPlayers.map((player) => ({
        socketId: player.socketId,
        name: player.name,
      })),
      mySocketId: waitingPlayer.socketId,
    });
  });
}

// Matchmaking entrypoint: queue player and create rooms in batches of 4.
function registerMatchmaking(io, socket) {
  socket.on("startGame", (data = {}) => {
    const name = typeof data === "string" ? data : data?.name;
    upsertWaitingPlayer(socket.id, name);
    emitWaitingLobby(io);

    while (waitingPlayers.length >= MAX_PLAYERS) {
      const players = waitingPlayers.splice(0, MAX_PLAYERS);
      createRoom(io, players);
    }

    emitWaitingLobby(io);
  });
}

// Remove player from waiting queue and refresh lobby if changed.
registerMatchmaking.removeWaitingPlayer = function removeWaitingPlayer(io, socketId) {
  const before = waitingPlayers.length;
  waitingPlayers = waitingPlayers.filter((player) => player.socketId !== socketId);
  if (waitingPlayers.length !== before) {
    emitWaitingLobby(io);
  }
};

module.exports = registerMatchmaking;
