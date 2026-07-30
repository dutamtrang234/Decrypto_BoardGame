import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../components/common/Toast";

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, connected } = useSocket();
  const { addToast } = useToast();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("decrypto_nickname");
    if (saved) setNickname(saved);
  }, []);

  const handleCreate = async () => {
    if (!nickname.trim()) {
      addToast("Please enter a nickname", "error");
      return;
    }
    if (!connected) {
      addToast("Not connected to server", "error");
      return;
    }
    setLoading(true);
    try {
      const room = await createRoom(nickname.trim());
      localStorage.setItem("decrypto_nickname", nickname.trim());
      navigate(`/room/${room.code}`);
    } catch (err: any) {
      addToast(err.message || "Failed to create room", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      addToast("Please enter a nickname", "error");
      return;
    }
    if (!roomCode.trim()) {
      addToast("Please enter a room code", "error");
      return;
    }
    if (!connected) {
      addToast("Not connected to server", "error");
      return;
    }
    setLoading(true);
    try {
      const room = await joinRoom(roomCode.trim().toUpperCase(), nickname.trim());
      localStorage.setItem("decrypto_nickname", nickname.trim());
      navigate(`/room/${room.code}`);
    } catch (err: any) {
      addToast(err.message || "Failed to join room", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Decrypto</h1>
          <p className="text-gray-400">
            Encrypt your clues, decrypt theirs. A game of coded communication.
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading || !connected}
              className="flex-1 btn-success"
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-500">or join existing</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Room Code"
              className="flex-1 uppercase text-center tracking-widest font-mono"
              maxLength={4}
            />
            <button
              onClick={handleJoin}
              disabled={loading || !connected || roomCode.length !== 4}
              className="btn-primary"
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </div>

        <div className="text-center">
          {!connected && (
            <div className="text-red-400 text-sm animate-pulse">
              Connecting to server...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
