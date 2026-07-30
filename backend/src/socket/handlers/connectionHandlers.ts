import type { Socket } from "socket.io";
import type { ServerType } from "../index";
import { handleDisconnect } from "./roomHandlers";

export function setupConnectionHandlers(io: ServerType, socket: Socket): void {
  socket.on("disconnect", (reason) => {
    handleDisconnect(io, socket);
  });

  socket.on("disconnecting", () => {
    // Will be handled by disconnect
  });
}
