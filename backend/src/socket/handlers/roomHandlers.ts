import type { Socket } from "socket.io";
import type { ServerType } from "../index";
import type { RoomData, PlayerData, GameState } from "../../game/types";
import { generateRoomCode, generateUserId, generatePlayerId, generateRoomId } from "../../game/words";
import { v4 as uuid } from "uuid";
import { prisma } from "../../db";

export interface RoomStore {
  id: string;
  code: string;
  hostId: string;
  state: "waiting" | "playing" | "finished";
  players: Map<string, PlayerData>;
  gameState: GameState | null;
  socketIds: Map<string, string>;
  disconnectTimers: Map<string, NodeJS.Timeout>;
}

export const rooms = new Map<string, RoomStore>();
const roomByCode = new Map<string, string>();
const socketToRoom = new Map<string, string>();
const userToRoom = new Map<string, string>();

export function getRoom(roomId: string): RoomStore | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): RoomStore | undefined {
  const id = roomByCode.get(code);
  if (!id) return undefined;
  return rooms.get(id);
}

export function getRoomBySocket(socketId: string): RoomStore | undefined {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function getRoomByUser(userId: string): RoomStore | undefined {
  const roomId = userToRoom.get(userId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function getAllRooms(): RoomStore[] {
  return Array.from(rooms.values());
}

export function roomDataToJSON(room: RoomStore): RoomData {
  const players = Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex);
  return {
    id: room.id,
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    players,
    gameState: room.gameState,
  };
}

export function setupRoomHandlers(io: ServerType, socket: Socket): void {
  socket.on("room:create", async ({ nickname }, callback) => {
    try {
      let code = generateRoomCode();
      while (roomByCode.has(code)) {
        code = generateRoomCode();
      }

      const userId = generateUserId();
      const playerId = generatePlayerId();
      const roomId = generateRoomId();

      const playerData: PlayerData = {
        id: playerId,
        userId,
        nickname: nickname || "Player",
        team: "blue",
        seatIndex: 0,
        isReady: false,
        isConnected: true,
        isHost: true,
      };

      const room: RoomStore = {
        id: roomId,
        code,
        hostId: playerId,
        state: "waiting",
        players: new Map([[playerId, playerData]]),
        gameState: null,
        socketIds: new Map([[playerId, socket.id]]),
        disconnectTimers: new Map(),
      };

      rooms.set(roomId, room);
      roomByCode.set(code, roomId);
      socketToRoom.set(socket.id, roomId);
      userToRoom.set(userId, roomId);

      socket.data.userId = userId;
      socket.data.playerId = playerId;
      socket.data.roomId = roomId;
      socket.data.nickname = nickname;
      socket.data.team = "blue";

      socket.join(roomId);

      try {
        await prisma.room.create({
          data: {
            id: roomId,
            code,
            hostId: playerId,
            state: "waiting",
          },
        });
      } catch {
        // Non-critical
      }

      callback({ success: true, data: roomDataToJSON(room) });
    } catch {
      callback({ success: false, error: "Failed to create room" });
    }
  });

  socket.on("room:join", async ({ roomCode, nickname }, callback) => {
    try {
      const code = (roomCode || "").toUpperCase().trim();
      const room = getRoomByCode(code);

      if (!room) {
        callback({ success: false, error: "Room not found" });
        return;
      }

      if (room.state !== "waiting") {
        callback({ success: false, error: "Game already in progress" });
        return;
      }

      if (room.players.size >= 8) {
        callback({ success: false, error: "Room is full" });
        return;
      }

      const userId = generateUserId();
      const playerId = generatePlayerId();
      const takenSeats = new Set(Array.from(room.players.values()).map((p) => p.seatIndex));
      let seatIndex = 0;
      while (takenSeats.has(seatIndex)) seatIndex++;

      const team: "blue" | "red" = seatIndex < 4 ? "blue" : "red";

      const playerData: PlayerData = {
        id: playerId,
        userId,
        nickname: nickname || "Player",
        team,
        seatIndex,
        isReady: false,
        isConnected: true,
        isHost: false,
      };

      room.players.set(playerId, playerData);
      room.socketIds.set(playerId, socket.id);
      socketToRoom.set(socket.id, room.id);
      userToRoom.set(userId, room.id);

      socket.data.userId = userId;
      socket.data.playerId = playerId;
      socket.data.roomId = room.id;
      socket.data.nickname = nickname;
      socket.data.team = team;

      socket.join(room.id);

      io.to(room.id).emit("player:joined", {
        player: playerData,
        players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
      });

      callback({ success: true, data: { ...roomDataToJSON(room), joinedPlayerId: playerId } });
    } catch {
      callback({ success: false, error: "Failed to join room" });
    }
  });

  socket.on("room:kick", ({ targetPlayerId }, callback) => {
    try {
      const room = getRoomBySocket(socket.id);
      if (!room) {
        callback({ success: false, error: "Not in a room" });
        return;
      }
      if (room.hostId !== socket.data.playerId) {
        callback({ success: false, error: "Only the host can kick players" });
        return;
      }
      if (room.state !== "waiting") {
        callback({ success: false, error: "Cannot kick during a game" });
        return;
      }

      const kickedPlayer = room.players.get(targetPlayerId);
      if (!kickedPlayer) {
        callback({ success: false, error: "Player not found" });
        return;
      }

      const kickedSocketId = room.socketIds.get(targetPlayerId);
      if (kickedSocketId) {
        const kickedSocket = io.sockets.sockets.get(kickedSocketId);
        if (kickedSocket) {
          kickedSocket.leave(room.id);
          kickedSocket.emit("player:kicked", { reason: "You have been removed by the host" });
        }
      }

      room.players.delete(targetPlayerId);
      room.socketIds.delete(targetPlayerId);
      userToRoom.delete(kickedPlayer.userId);

      io.to(room.id).emit("player:left", {
        playerId: targetPlayerId,
        players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
      });

      callback({ success: true });
    } catch {
      callback({ success: false, error: "Failed to kick player" });
    }
  });

  socket.on("room:leave", async (_, callback) => {
    try {
      const room = getRoomBySocket(socket.id);
      if (!room) {
        callback({ success: false, error: "Not in a room" });
        return;
      }

      const playerId = socket.data.playerId;
      const userId = socket.data.userId;
      const wasHost = room.hostId === playerId;

      room.players.delete(playerId);
      room.socketIds.delete(playerId);
      socketToRoom.delete(socket.id);
      userToRoom.delete(userId);

      socket.leave(room.id);

      if (room.players.size === 0) {
        rooms.delete(room.id);
        roomByCode.delete(room.code);
        io.to(room.id).emit("room:deleted");
        try { await prisma.room.delete({ where: { id: room.id } }).catch(() => {}); } catch {}
        callback({ success: true });
        return;
      }

      if (wasHost) {
        migrateHost(io, room);
      }

      io.to(room.id).emit("player:left", {
        playerId,
        players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
        newHostId: wasHost ? room.hostId : undefined,
      });

      callback({ success: true });
    } catch {
      callback({ success: false, error: "Failed to leave room" });
    }
  });

  socket.on("player:reconnect", async ({ userId, roomCode }, callback) => {
    try {
      const code = (roomCode || "").toUpperCase().trim();
      const room = getRoomByCode(code);
      if (!room) {
        callback({ success: false, error: "Room not found" });
        return;
      }

      const playerEntry = Array.from(room.players.entries()).find(
        ([_, p]) => p.userId === userId,
      );
      if (!playerEntry) {
        callback({ success: false, error: "Player not found in room" });
        return;
      }

      const [playerId, playerData] = playerEntry;
      const oldSocketId = room.socketIds.get(playerId);

      if (oldSocketId && oldSocketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.leave(room.id);
        }
      }

      const timer = room.disconnectTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        room.disconnectTimers.delete(playerId);
      }

      playerData.isConnected = true;
      room.socketIds.set(playerId, socket.id);
      socketToRoom.set(socket.id, room.id);
      userToRoom.set(userId, room.id);

      socket.data.userId = userId;
      socket.data.playerId = playerId;
      socket.data.roomId = room.id;
      socket.data.nickname = playerData.nickname;
      socket.data.team = playerData.team;

      socket.join(room.id);

      io.to(room.id).emit("player:reconnected", {
        playerId,
        players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
      });

      callback({ success: true, data: roomDataToJSON(room) });
    } catch {
      callback({ success: false, error: "Failed to reconnect" });
    }
  });

  socket.on("player:ready", ({ isReady }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.state !== "waiting") return;

    const player = room.players.get(socket.data.playerId);
    if (!player) return;

    player.isReady = isReady;

    io.to(room.id).emit("player:ready-changed", {
      playerId: player.id,
      isReady,
      players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
    });
  });

  socket.on("player:team", ({ team }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.state !== "waiting") return;

    const player = room.players.get(socket.data.playerId);
    if (!player) return;

    const blueCount = Array.from(room.players.values()).filter(
      (p) => p.team === "blue" && p.id !== player.id,
    ).length;
    const redCount = Array.from(room.players.values()).filter(
      (p) => p.team === "red" && p.id !== player.id,
    ).length;

    if (team === "blue" && blueCount >= 4) return;
    if (team === "red" && redCount >= 4) return;

    player.team = team;
    socket.data.team = team;

    io.to(room.id).emit("player:team-changed", {
      playerId: player.id,
      players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
    });
  });

  socket.on("player:seat", ({ seatIndex }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.state !== "waiting") return;

    const player = room.players.get(socket.data.playerId);
    if (!player || seatIndex < 0 || seatIndex >= 8) return;

    const existingPlayer = Array.from(room.players.values()).find(
      (p) => p.seatIndex === seatIndex && p.id !== player.id,
    );
    if (existingPlayer) return;

    player.seatIndex = seatIndex;

    io.to(room.id).emit("player:moved", {
      playerId: player.id,
      players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
    });
  });

  socket.on("player:rename", ({ nickname }) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.players.get(socket.data.playerId);
    if (!player || !nickname || nickname.trim().length === 0) return;

    player.nickname = nickname.trim().slice(0, 20);
    socket.data.nickname = player.nickname;

    const data = roomDataToJSON(room);
    io.to(room.id).emit("room:updated", data);
  });
}

function migrateHost(io: ServerType, room: RoomStore): void {
  const remainingPlayers = Array.from(room.players.values());
  if (remainingPlayers.length === 0) return;

  const newHost = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
  room.hostId = newHost.id;
  const player = room.players.get(newHost.id);
  if (player) player.isHost = true;

  io.to(room.id).emit("host:changed", {
    newHostId: newHost.id,
    players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
  });
}

export function handleDisconnect(io: ServerType, socket: Socket): void {
  const room = getRoomBySocket(socket.id);
  if (!room) return;

  const playerId = socket.data.playerId;
  const player = room.players.get(playerId);
  if (!player) return;

  player.isConnected = false;
  socketToRoom.delete(socket.id);

  io.to(room.id).emit("player:disconnected", {
    playerId,
    players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
  });

  const wasHost = room.hostId === playerId;

  room.players.delete(playerId);
  room.socketIds.delete(playerId);
  userToRoom.delete(player.userId);

  if (room.players.size === 0) {
    rooms.delete(room.id);
    roomByCode.delete(room.code);
    io.to(room.id).emit("room:deleted");
    try { prisma.room.delete({ where: { id: room.id } }).catch(() => {}); } catch {}
    return;
  }

  if (wasHost) {
    migrateHost(io, room);
  }

  io.to(room.id).emit("player:left", {
    playerId,
    players: Array.from(room.players.values()).sort((a, b) => a.seatIndex - b.seatIndex),
    newHostId: wasHost ? room.hostId : undefined,
  });
}
