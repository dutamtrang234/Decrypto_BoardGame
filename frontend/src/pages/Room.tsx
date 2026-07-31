import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useRoom } from "../hooks/useRoom";
import { useToast } from "../components/common/Toast";
import PlayerList from "../components/Lobby/PlayerList";
import LobbySettings from "../components/Lobby/LobbySettings";
import GameBoard from "../components/Game/GameBoard";
import ChatBox from "../components/Chat/ChatBox";
import type { Team } from "../types";

export default function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { roomData, gameState, playerId, connected, joinRoom, leaveRoom, startGame, reconnect } = useSocket();
  const { players, isHost, canStart } = useRoom();
  const { addToast } = useToast();
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!roomCode || !connected) return;

    const storedNickname = localStorage.getItem("decrypto_nickname") || "Player";
    const storedUserId = localStorage.getItem("decrypto_userId");

    const init = async () => {
      try {
        if (storedUserId) {
          try {
            await reconnect(storedUserId, roomCode);
            setJoining(false);
            return;
          } catch {
          }
        }
        await joinRoom(roomCode, storedNickname);
      } catch (err: any) {
        addToast(err.message || "Failed to join room", "error");
        navigate("/");
      } finally {
        setJoining(false);
      }
    };

    init();
  }, [roomCode, connected]);

  const isInGame = gameState !== null;

  const playerTeamBadge = useMemo<Team | null>(() => {
    if (!isInGame || !playerId) return null;
    const pool = gameState?.players || players;
    const p = pool.find((pl) => pl.id === playerId);
    return p?.team || null;
  }, [isInGame, playerId, players, gameState]);

  const handleLeave = async () => {
    try {
      await leaveRoom();
    } catch {
    }
    navigate("/");
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (err: any) {
      addToast(err.message || "Failed to start game", "error");
    }
  };

  if (joining) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">Joining room...</div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Failed to join room</div>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Room:</span>
          <span className="font-mono font-bold text-white tracking-widest">
            {roomData.code}
          </span>
          {!isInGame && (
            <span className="text-xs text-gray-500">
              ({players.length}/8 players)
            </span>
          )}
          {playerTeamBadge && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
              playerTeamBadge === "blue"
                ? "bg-blue-700 text-blue-200"
                : "bg-red-700 text-red-200"
            }`}>
              {playerTeamBadge} team
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isInGame && isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="btn-success text-sm"
            >
              Start Game
            </button>
          )}
          <button onClick={handleLeave} className="btn-ghost text-sm">
            Leave
          </button>
        </div>
      </div>

      {isInGame ? (
        <GameBoard />
      ) : (
        <div className="flex-1 grid grid-cols-[1fr_300px_300px] gap-4 p-4">
          <PlayerList players={players} playerId={playerId} hostId={roomData.hostId} gameInProgress={false} />
          <LobbySettings />
          <ChatBox />
        </div>
      )}
    </div>
  );
}