import type { Socket } from "socket.io";
import type { SocketData } from "../game/types";

export function validateSocket(socket: Socket): SocketData | null {
  const data = socket.data as SocketData;
  if (!data.userId || !data.playerId || !data.roomId) {
    return null;
  }
  return data;
}
