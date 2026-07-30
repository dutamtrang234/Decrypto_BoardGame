import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../game/types";
import { config } from "../config";
import { setupRoomHandlers } from "./handlers/roomHandlers";
import { setupGameHandlers } from "./handlers/gameHandlers";
import { setupChatHandlers } from "./handlers/chatHandlers";
import { setupConnectionHandlers } from "./handlers/connectionHandlers";

export type ServerType = Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

export function createSocketServer(httpServer: HttpServer): ServerType {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 10_000,
    pingTimeout: 5_000,
  });

  io.on("connection", (socket) => {
    setupConnectionHandlers(io, socket);
    setupRoomHandlers(io, socket);
    setupGameHandlers(io, socket);
    setupChatHandlers(io, socket);
  });

  return io;
}
