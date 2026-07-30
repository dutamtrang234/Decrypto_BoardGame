import type { Socket } from "socket.io";
import type { ServerType } from "../index";
import { getRoomBySocket, type RoomStore } from "./roomHandlers";
import {
  startGame,
  submitClue,
  submitGuess,
  submitInterception,
  advanceAfterResolution,
  timeoutPhase,
} from "../../game/GameEngine";
import type { Team } from "../../game/types";

export function setupGameHandlers(io: ServerType, socket: Socket): void {
  socket.on("game:start", (_, callback) => {
    try {
      const room = getRoomBySocket(socket.id);
      if (!room) {
        callback({ success: false, error: "Not in a room" });
        return;
      }

      const player = room.players.get(socket.data.playerId);
      if (!player || !player.isHost) {
        callback({ success: false, error: "Only the host can start the game" });
        return;
      }

      if (room.state !== "waiting") {
        callback({ success: false, error: "Game already started" });
        return;
      }

      const players = Array.from(room.players.values());
      const blueCount = players.filter((p) => p.team === "blue").length;
      const redCount = players.filter((p) => p.team === "red").length;

      if (players.length < 4) {
        callback({ success: false, error: "Need at least 4 players" });
        return;
      }

      if (blueCount < 2 || redCount < 2) {
        callback({ success: false, error: "Each team needs at least 2 players" });
        return;
      }

      const gameState = startGame(players.map((p) => ({ ...p })));
      room.gameState = gameState;
      room.state = "playing";

      io.to(room.id).emit("game:started", gameState);

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: "Failed to start game" });
    }
  });

  socket.on("game:submit-clue", ({ clues }, callback) => {
    try {
      const room = getRoomBySocket(socket.id);
      if (!room || !room.gameState) {
        callback({ success: false, error: "Not in a game" });
        return;
      }

      const playerId = socket.data.playerId;
      const team = socket.data.team as Team;

      const result = submitClue(room.gameState, playerId, team, clues);
      if (result.error) {
        callback({ success: false, error: result.error });
        return;
      }

      room.gameState = result.state;
      broadcastGameState(io, room);

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: "Failed to submit clue" });
    }
  });

  socket.on("game:submit-guess", ({ indices }, callback) => {
    try {
      const room = getRoomBySocket(socket.id);
      if (!room || !room.gameState) {
        callback({ success: false, error: "Not in a game" });
        return;
      }

      const playerId = socket.data.playerId;
      const team = socket.data.team as Team;

      const result = submitGuess(room.gameState, playerId, team, indices);
      if (result.error) {
        callback({ success: false, error: result.error });
        return;
      }

      room.gameState = result.state;
      broadcastGameState(io, room);

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: "Failed to submit guess" });
    }
  });

  socket.on("game:submit-interception", ({ indices }, callback) => {
    try {
      const room = getRoomBySocket(socket.id);
      if (!room || !room.gameState) {
        callback({ success: false, error: "Not in a game" });
        return;
      }

      const playerId = socket.data.playerId;
      const team = socket.data.team as Team;

      const result = submitInterception(room.gameState, playerId, team, indices);
      if (result.error) {
        callback({ success: false, error: result.error });
        return;
      }

      room.gameState = result.state;

      // Check if game finished
      if (room.gameState.phase === "finished" && room.gameState.winner && room.gameState.winReason) {
        io.to(room.id).emit("game:finished", {
          winner: room.gameState.winner,
          winReason: room.gameState.winReason,
          gameState: room.gameState,
        });
      } else {
        broadcastGameState(io, room);
      }

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: "Failed to submit interception" });
    }
  });

  socket.on("game:advance", (_, callback) => {
    try {
      const room = getRoomBySocket(socket.id);
      if (!room || !room.gameState) {
        callback({ success: false, error: "Not in a game" });
        return;
      }

      const player = room.players.get(socket.data.playerId);
      if (!player || !player.isHost) {
        callback({ success: false, error: "Only the host can advance" });
        return;
      }

      const result = advanceAfterResolution(room.gameState);
      if (result.error) {
        callback({ success: false, error: result.error });
        return;
      }

      room.gameState = result.state;
      broadcastGameState(io, room);

      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: "Failed to advance" });
    }
  });
}

function broadcastGameState(io: ServerType, room: RoomStore): void {
  const players = Array.from(room.players.values());
  for (const p of players) {
    const socketId = room.socketIds.get(p.id);
    if (!socketId) continue;
    const gs = room.gameState;
    if (!gs) continue;

    let view = structuredClone(gs);
    const team = p.team as Team;
    const opp = team === "blue" ? "red" : "blue";

    if (gs.phase === "clue") {
      if (gs[team].codeMasterId !== p.id) {
        view[team].clues = [null, null, null];
        view[team].clueOrder = null;
      }
      view[opp].clues = [null, null, null];
      view[opp].clueOrder = null;
    } else {
      view[opp].words = ["?", "?", "?", "?"];
      view[opp].clueOrder = null;
    }

    io.to(socketId).emit("game:state-update", view);
  }
}

export { broadcastGameState };
