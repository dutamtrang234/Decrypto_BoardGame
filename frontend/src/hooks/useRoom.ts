import { useMemo } from "react";
import { useSocket } from "../context/SocketContext";
import type { PlayerData, Team } from "../types";

export function useRoom() {
  const { roomData, playerId } = useSocket();

  const players = roomData?.players || [];
  const isHost = useMemo(
    () => players.some((p: PlayerData) => p.id === playerId && p.isHost),
    [players, playerId],
  );
  const currentPlayer = useMemo(
    () => players.find((p: PlayerData) => p.id === playerId) || null,
    [players, playerId],
  );

  const teamPlayers = useMemo(
    () => ({
      blue: players.filter((p: PlayerData) => p.team === "blue"),
      red: players.filter((p: PlayerData) => p.team === "red"),
    }),
    [players],
  );

  const allReady = useMemo(
    () => players.length >= 4 && players.every((p: PlayerData) => p.isReady),
    [players],
  );

  const canStart = useMemo(() => {
    if (players.length < 4) return false;
    if (!allReady) return false;
    const blueCount = players.filter((p: PlayerData) => p.team === "blue").length;
    const redCount = players.filter((p: PlayerData) => p.team === "red").length;
    if (blueCount < 2 || redCount < 2) return false;
    return true;
  }, [players, allReady]);

  return {
    roomData,
    players,
    playerId,
    isHost,
    currentPlayer,
    teamPlayers,
    allReady,
    canStart,
  };
}
