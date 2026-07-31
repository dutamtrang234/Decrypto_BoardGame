import { useSocket } from "../../context/SocketContext";
import { useState } from "react";

export default function LobbySettings() {
  const { roomData, playerId, setReady, rename } = useSocket();
  const [nickname, setNickname] = useState("");

  const player = roomData?.players.find((p) => p.id === playerId);
  const isReady = player?.isReady || false;

  const handleRename = () => {
    if (nickname.trim()) {
      rename(nickname.trim());
      setNickname("");
    }
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Settings</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
          placeholder={player?.nickname || "Nickname"}
          className="flex-1 text-sm"
          maxLength={20}
        />
        <button onClick={handleRename} className="btn-primary text-sm">
          Rename
        </button>
      </div>

      {isReady ? (
        <div className="space-y-2">
          <div className="w-full btn bg-green-700 text-white cursor-default">
            Ready!
          </div>
          <button
            onClick={() => setReady(false)}
            className="w-full btn bg-gray-700 hover:bg-gray-600 text-gray-300"
          >
            Not Ready
          </button>
        </div>
      ) : (
        <button
          onClick={() => setReady(true)}
          className="w-full btn-success"
        >
          Ready
        </button>
      )}

      {roomData && (
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Room Code</div>
          <div className="text-2xl font-mono font-bold tracking-widest text-white">
            {roomData.code}
          </div>
        </div>
      )}
    </div>
  );
}
