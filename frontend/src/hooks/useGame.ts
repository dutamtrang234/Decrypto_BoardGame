import { useMemo } from "react";
import { useSocket } from "../context/SocketContext";
import type { Team, TeamGameState } from "../types";

export function useGame() {
  const { gameState, playerId, roomData } = useSocket();

  const playerTeam = useMemo<Team | null>(() => {
    if (!roomData || !playerId) return null;
    const player = roomData.players.find((p) => p.id === playerId);
    return player?.team || null;
  }, [roomData, playerId]);

  const isCodeMaster = useMemo(() => {
    if (!gameState || !playerId) return false;
    return gameState.blue.codeMasterId === playerId || gameState.red.codeMasterId === playerId;
  }, [gameState, playerId]);

  const teamState = useMemo<TeamGameState | null>(() => {
    if (!gameState || !playerTeam) return null;
    return gameState[playerTeam];
  }, [gameState, playerTeam]);

  const opponentState = useMemo<TeamGameState | null>(() => {
    if (!gameState || !playerTeam) return null;
    return gameState[playerTeam === "blue" ? "red" : "blue"];
  }, [gameState, playerTeam]);

  const timerRemaining = useMemo(() => {
    if (!gameState || !gameState.timerEndsAt) return null;
    return Math.max(0, Math.floor((gameState.timerEndsAt - Date.now()) / 1000));
  }, [gameState]);

  const canSubmitClue = useMemo(() => {
    return gameState?.phase === "clue" && isCodeMaster && teamState?.clues.some((c) => c === null);
  }, [gameState, isCodeMaster, teamState]);

  const isTeamLeader = useMemo(() => {
    if (!gameState || !playerId || !playerTeam) return false;
    return gameState[playerTeam].teamLeaderId === playerId;
  }, [gameState, playerId, playerTeam]);

  const canSubmitGuess = useMemo(() => {
    return gameState?.phase === "guess" && isTeamLeader && teamState?.guess === null;
  }, [gameState, isTeamLeader, teamState]);

  const canSubmitInterception = useMemo(() => {
    return gameState?.phase === "interception" && isTeamLeader && teamState?.interception === null;
  }, [gameState, isTeamLeader, teamState]);

  return {
    gameState,
    playerId,
    playerTeam,
    isCodeMaster,
    isTeamLeader,
    teamState,
    opponentState,
    timerRemaining,
    canSubmitClue,
    canSubmitGuess,
    canSubmitInterception,
  };
}
