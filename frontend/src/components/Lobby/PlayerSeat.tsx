import { useSocket } from "../../context/SocketContext";
import type { PlayerData } from "../../types";

interface Props {
  player: PlayerData | null;
  seatIndex: number;
  isOwn: boolean;
}

export default function PlayerSeat({ player, seatIndex, isOwn }: Props) {
  const { setSeat, setTeam } = useSocket();

  const handleClick = () => {
    if (!player) {
      setSeat(seatIndex);
    }
  };

  const handleTeamToggle = () => {
    if (player && isOwn) {
      setTeam(player.team === "blue" ? "red" : "blue");
    }
  };

  const bgColor = player?.team === "blue"
    ? "bg-blue-900/50 border-blue-700"
    : player?.team === "red"
      ? "bg-red-900/50 border-red-700"
      : "bg-gray-800/50 border-gray-700";

  return (
    <div
      onClick={handleClick}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:opacity-80 ${bgColor} ${
        isOwn ? "ring-2 ring-yellow-500" : ""
      }`}
    >
      <div className="text-xs text-gray-500 mb-1">Seat {seatIndex + 1}</div>
      {player ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm truncate">
              {player.nickname}
            </span>
            {player.isHost && (
              <span className="badge bg-yellow-700 text-yellow-200 text-xs">Host</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                player.team === "blue"
                  ? "bg-blue-700 text-blue-200"
                  : "bg-red-700 text-red-200"
              }`}
            >
              {player.team}
            </span>
            {!player.isConnected && (
              <span className="text-xs text-red-400">Disconnected</span>
            )}
            {player.isReady && (
              <span className="text-xs text-green-400">Ready</span>
            )}
          </div>
          {isOwn && (
            <button
              onClick={(e) => { e.stopPropagation(); handleTeamToggle(); }}
              className="text-xs text-gray-400 hover:text-white mt-1 underline"
            >
              Switch team
            </button>
          )}
        </div>
      ) : (
        <div className="text-gray-600 text-sm italic">Empty</div>
      )}
    </div>
  );
}
