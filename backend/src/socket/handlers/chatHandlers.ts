import type { Socket } from "socket.io";
import type { ServerType } from "../index";
import { getRoomBySocket } from "./roomHandlers";
import { v4 as uuid } from "uuid";
import { prisma } from "../../db";

export function setupChatHandlers(io: ServerType, socket: Socket): void {
  socket.on("chat:message", ({ content, target }) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const playerId = socket.data.playerId;
    const player = room.players.get(playerId);
    if (!player) return;

    const text = (content || "").trim();
    if (text.length === 0 || text.length > 500) return;

    const msgTarget = target || "all";
    if (msgTarget !== "all" && msgTarget !== "blue" && msgTarget !== "red") return;

    if (msgTarget !== "all" && msgTarget !== player.team) return;

    const msg = {
      id: uuid(),
      playerId: player.id,
      nickname: player.nickname,
      content: text,
      type: "chat",
      target: msgTarget,
      team: player.team,
      createdAt: new Date().toISOString(),
    };

    if (msgTarget === "all") {
      io.to(room.id).emit("chat:message", msg);
    } else {
      const teamPlayers = Array.from(room.players.values()).filter(
        (p) => p.team === msgTarget,
      );
      for (const tp of teamPlayers) {
        const sid = room.socketIds.get(tp.id);
        if (sid) {
          io.to(sid).emit("chat:message", msg);
        }
      }
    }

    try {
      prisma.message.create({
        data: {
          id: msg.id,
          roomId: room.id,
          playerId: player.id,
          content: text,
          type: "chat",
          target: msgTarget,
        },
      }).catch(() => {});
    } catch {}
  });

  socket.on("chat:typing", ({ isTyping }) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.players.get(socket.data.playerId);
    if (!player) return;

    socket.to(room.id).emit("chat:typing", {
      playerId: player.id,
      nickname: player.nickname,
      isTyping,
    });
  });
}
