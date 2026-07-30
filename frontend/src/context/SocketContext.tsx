import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import type { RoomData, GameState, ChatMessage, PlayerData, Team, RoundRecord } from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  userId: string | null;
  playerId: string | null;
  roomData: RoomData | null;
  gameState: GameState | null;
  messages: ChatMessage[];
  typingUsers: Map<string, string>;

  createRoom: (nickname: string) => Promise<RoomData>;
  joinRoom: (roomCode: string, nickname: string) => Promise<RoomData>;
  leaveRoom: () => Promise<void>;
  reconnect: (userId: string, roomCode: string) => Promise<RoomData>;
  setReady: (isReady: boolean) => void;
  setTeam: (team: Team) => void;
  setSeat: (seatIndex: number) => void;
  rename: (nickname: string) => void;
  startGame: () => Promise<void>;
  submitClue: (clues: string[]) => Promise<void>;
  submitGuess: (indices: number[]) => Promise<void>;
  submitInterception: (indices: number[]) => Promise<void>;
  advanceRound: () => Promise<void>;
  sendMessage: (content: string, target?: string) => void;
  sendTyping: (isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}

function getStoredUserId(): string | null {
  return localStorage.getItem("decrypto_userId");
}

function setStoredUserId(id: string): void {
  localStorage.setItem("decrypto_userId", id);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [userId] = useState<string | null>(getStoredUserId);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  const roomDataRef = useRef<RoomData | null>(null);
  const gameStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("connect_error", () => {
      setConnected(false);
    });

    newSocket.on("room:updated", (data: RoomData) => {
      setRoomData(data);
      roomDataRef.current = data;
    });

    newSocket.on("room:created", (data: RoomData) => {
      setRoomData(data);
      roomDataRef.current = data;
    });

    newSocket.on("room:joined", (data: RoomData) => {
      setRoomData(data);
      roomDataRef.current = data;
    });

    newSocket.on("player:joined", (data: { player: PlayerData; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, players: data.players } : prev);
    });

    newSocket.on("player:left", (data: { playerId: string; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, players: data.players } : prev);
    });

    newSocket.on("player:disconnected", (data: { playerId: string; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, players: data.players } : prev);
    });

    newSocket.on("player:reconnected", (data: { playerId: string; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, players: data.players } : prev);
    });

    newSocket.on("player:moved", (data: { playerId: string; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, players: data.players } : prev);
    });

    newSocket.on("player:team-changed", (data: { playerId: string; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, players: data.players } : prev);
    });

    newSocket.on("player:ready-changed", (data: { playerId: string; isReady: boolean; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, players: data.players } : prev);
    });

    newSocket.on("host:changed", (data: { newHostId: string; players: PlayerData[] }) => {
      setRoomData((prev) => prev ? { ...prev, hostId: data.newHostId, players: data.players } : prev);
    });

    newSocket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on("chat:typing", (data: { playerId: string; nickname: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (data.isTyping) {
          next.set(data.playerId, data.nickname);
        } else {
          next.delete(data.playerId);
        }
        return next;
      });
    });

    newSocket.on("game:started", (gs: GameState) => {
      setGameState(gs);
      gameStateRef.current = gs;
    });

    newSocket.on("game:state-update", (gs: GameState) => {
      setGameState(gs);
      gameStateRef.current = gs;
    });

    newSocket.on("round:started", (data: { round: number; gameState: GameState }) => {
      setGameState(data.gameState);
      gameStateRef.current = data.gameState;
    });

    newSocket.on("round:finished", (data: { round: number; record: RoundRecord; gameState: GameState }) => {
      setGameState(data.gameState);
      gameStateRef.current = data.gameState;
    });

    newSocket.on("game:finished", (data: { winner: Team; winReason: string; gameState: GameState }) => {
      setGameState(data.gameState);
      gameStateRef.current = data.gameState;
    });

    newSocket.on("room:deleted", () => {
      setRoomData(null);
      setGameState(null);
      setMessages([]);
      roomDataRef.current = null;
      gameStateRef.current = null;
    });

    newSocket.on("error", (data: { message: string }) => {
      console.error("Socket error:", data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = useCallback(async (nickname: string): Promise<RoomData> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("room:create", { nickname }, (res: any) => {
        if (res.success) {
          const uid = res.data.players[0]?.userId;
          if (uid) setStoredUserId(uid);
          setPlayerId(res.data.players[0]?.id || null);
          setRoomData(res.data);
          roomDataRef.current = res.data;
          resolve(res.data);
        } else {
          reject(new Error(res.error));
        }
      });
    });
  }, [socket]);

  const joinRoom = useCallback(async (roomCode: string, nickname: string): Promise<RoomData> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("room:join", { roomCode, nickname }, (res: any) => {
        if (res.success) {
          const player = res.data.players.find((p: PlayerData) => p.nickname === nickname && p.isConnected);
          if (player) {
            setPlayerId(player.id);
            setStoredUserId(player.userId);
          }
          setRoomData(res.data);
          roomDataRef.current = res.data;
          resolve(res.data);
        } else {
          reject(new Error(res.error));
        }
      });
    });
  }, [socket]);

  const leaveRoom = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("room:leave", {}, (res: any) => {
        if (res.success) {
          setRoomData(null);
          setGameState(null);
          setMessages([]);
          roomDataRef.current = null;
          gameStateRef.current = null;
          resolve();
        } else {
          reject(new Error(res.error));
        }
      });
    });
  }, [socket]);

  const reconnect = useCallback(async (uid: string, roomCode: string): Promise<RoomData> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("player:reconnect", { userId: uid, roomCode }, (res: any) => {
        if (res.success) {
          const player = res.data.players.find((p: PlayerData) => p.userId === uid);
          if (player) setPlayerId(player.id);
          setRoomData(res.data);
          roomDataRef.current = res.data;
          resolve(res.data);
        } else {
          reject(new Error(res.error));
        }
      });
    });
  }, [socket]);

  const setReady = useCallback((isReady: boolean) => {
    socket?.emit("player:ready", { isReady });
  }, [socket]);

  const setTeam = useCallback((team: Team) => {
    socket?.emit("player:team", { team });
  }, [socket]);

  const setSeat = useCallback((seatIndex: number) => {
    socket?.emit("player:seat", { seatIndex });
  }, [socket]);

  const rename = useCallback((nickname: string) => {
    socket?.emit("player:rename", { nickname });
  }, [socket]);

  const startGame = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("game:start", {}, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });
  }, [socket]);

  const submitClue = useCallback(async (clues: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("game:submit-clue", { clues }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });
  }, [socket]);

  const submitGuess = useCallback(async (indices: number[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("game:submit-guess", { indices }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });
  }, [socket]);

  const submitInterception = useCallback(async (indices: number[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("game:submit-interception", { indices }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });
  }, [socket]);

  const advanceRound = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket) { reject(new Error("Not connected")); return; }
      socket.emit("game:advance", {}, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });
  }, [socket]);

  const sendMessage = useCallback((content: string, target?: string) => {
    socket?.emit("chat:message", { content, target });
  }, [socket]);

  const sendTyping = useCallback((isTyping: boolean) => {
    socket?.emit("chat:typing", { isTyping });
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        userId: getStoredUserId(),
        playerId,
        roomData,
        gameState,
        messages,
        typingUsers,
        createRoom,
        joinRoom,
        leaveRoom,
        reconnect,
        setReady,
        setTeam,
        setSeat,
        rename,
        startGame,
        submitClue,
        submitGuess,
        submitInterception,
        advanceRound,
        sendMessage,
        sendTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
