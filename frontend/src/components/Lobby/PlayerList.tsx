import PlayerSeat from "./PlayerSeat";
import type { PlayerData } from "../../types";

interface Props {
  players: PlayerData[];
  playerId: string | null;
  hostId: string | null;
  gameInProgress: boolean;
}

export default function PlayerList({ players, playerId, hostId, gameInProgress }: Props) {
  const currentPlayer = players.find((p) => p.id === playerId);
  const userIsHost = currentPlayer?.isHost || false;

  const seats = Array.from({ length: 8 }, (_, i) => {
    const player = players.find((p) => p.seatIndex === i) || null;
    return { player, seatIndex: i, isOwn: player?.id === playerId };
  });

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Players</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <div className="text-xs text-blue-400 font-medium mb-1">Blue Team</div>
          {seats
            .filter((s) => s.player?.team === "blue")
            .map((s) => (
              <PlayerSeat key={s.seatIndex} {...s} isHost={userIsHost} canKick={!gameInProgress} />
            ))}
          {seats
            .filter((s) => !s.player)
            .slice(0, 2)
            .map((s) => (
              <PlayerSeat key={`empty-${s.seatIndex}`} {...s} isHost={userIsHost} canKick={false} />
            ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs text-red-400 font-medium mb-1">Red Team</div>
          {seats
            .filter((s) => s.player?.team === "red")
            .map((s) => (
              <PlayerSeat key={s.seatIndex} {...s} isHost={userIsHost} canKick={!gameInProgress} />
            ))}
          {seats
            .filter((s) => !s.player)
            .slice(2, 4)
            .map((s) => (
              <PlayerSeat key={`empty-${s.seatIndex}`} {...s} isHost={userIsHost} canKick={false} />
            ))}
        </div>
      </div>
    </div>
  );
}