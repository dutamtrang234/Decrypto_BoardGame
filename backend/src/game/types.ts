export type Team = "blue" | "red";
export type GamePhase = "clue" | "guess" | "interception" | "resolution" | "finished";
export type RoomState = "waiting" | "playing" | "finished";

export interface PlayerData {
  id: string;
  userId: string;
  nickname: string;
  team: Team;
  seatIndex: number;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
}

export interface RoomData {
  id: string;
  code: string;
  hostId: string;
  state: RoomState;
  players: PlayerData[];
  gameState: GameState | null;
}

export interface TeamGameState {
  codeMasterIndex: number;
  codeMasterId: string;
  teamLeaderIndex: number;
  teamLeaderId: string;
  words: string[];
  interceptionTokens: number;
  mistakes: number;
  clueOrder: number[] | null;
  clues: (string | null)[];
  guess: number[] | null;
  interception: number[] | null;
  guessCorrect: boolean | null;
  interceptionCorrect: boolean | null;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  blue: TeamGameState;
  red: TeamGameState;
  history: RoundRecord[];
  timer: number;
  timerStartedAt: number | null;
  timerEndsAt: number | null;
  winner: Team | null;
  winReason: "interception" | "mistake" | null;
  clueOrder: Team | null;
  players: PlayerData[];
}

export interface RoundRecord {
  round: number;
  blueCodeMasterId: string;
  redCodeMasterId: string;
  blueClues: string[];
  redClues: string[];
  blueClueOrder: number[];
  redClueOrder: number[];
  blueGuess: number[];
  redGuess: number[];
  blueInterception: number[];
  redInterception: number[];
  blueGuessCorrect: boolean;
  redGuessCorrect: boolean;
  blueInterceptionCorrect: boolean;
  redInterceptionCorrect: boolean;
  blueMistakesBefore: number;
  redMistakesBefore: number;
  blueTokensBefore: number;
  redTokensBefore: number;
  blueMistakesAfter: number;
  redMistakesAfter: number;
  blueTokensAfter: number;
  redTokensAfter: number;
}

export interface RoomStateData {
  id: string;
  code: string;
  hostId: string;
  state: RoomState;
  players: PlayerData[];
}

export interface ServerToClientEvents {
  "room:created": (data: RoomData) => void;
  "room:joined": (data: RoomData) => void;
  "room:updated": (data: RoomData) => void;
  "player:joined": (data: { player: PlayerData; players: PlayerData[] }) => void;
  "player:left": (data: { playerId: string; players: PlayerData[]; newHostId?: string }) => void;
  "player:disconnected": (data: { playerId: string; players: PlayerData[] }) => void;
  "player:reconnected": (data: { playerId: string; players: PlayerData[] }) => void;
  "player:moved": (data: { playerId: string; players: PlayerData[] }) => void;
  "player:team-changed": (data: { playerId: string; players: PlayerData[] }) => void;
  "player:ready-changed": (data: { playerId: string; isReady: boolean; players: PlayerData[] }) => void;
  "host:changed": (data: { newHostId: string; players: PlayerData[] }) => void;
  "player:kicked": (data: { reason: string }) => void;
  "chat:message": (data: { id: string; playerId: string; nickname: string; content: string; type: string; target: string; createdAt: string }) => void;
  "chat:typing": (data: { playerId: string; nickname: string; isTyping: boolean }) => void;
  "game:started": (data: GameState) => void;
  "game:state-update": (data: GameState) => void;
  "round:started": (data: { round: number; gameState: GameState }) => void;
  "round:finished": (data: { round: number; record: RoundRecord; gameState: GameState }) => void;
  "game:finished": (data: { winner: Team; winReason: string; gameState: GameState }) => void;
  "room:deleted": () => void;
  error: (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  "room:create": (data: { nickname: string }, callback: (res: { success: boolean; data?: RoomData; error?: string }) => void) => void;
  "room:join": (data: { roomCode: string; nickname: string }, callback: (res: { success: boolean; data?: RoomData; error?: string }) => void) => void;
  "room:leave": (data: {}, callback: (res: { success: boolean; error?: string }) => void) => void;
  "player:reconnect": (data: { userId: string; roomCode: string }, callback: (res: { success: boolean; data?: RoomData; error?: string }) => void) => void;
  "player:ready": (data: { isReady: boolean }) => void;
  "player:team": (data: { team: Team }) => void;
  "player:seat": (data: { seatIndex: number }) => void;
  "player:rename": (data: { nickname: string }) => void;
  "game:start": (data: {}, callback: (res: { success: boolean; error?: string }) => void) => void;
  "game:submit-clue": (data: { clue: string; indices: number[] }, callback: (res: { success: boolean; error?: string }) => void) => void;
  "game:submit-guess": (data: { indices: number[] }, callback: (res: { success: boolean; error?: string }) => void) => void;
  "game:submit-interception": (data: { indices: number[] }, callback: (res: { success: boolean; error?: string }) => void) => void;
  "chat:message": (data: { content: string; target?: string }) => void;
  "chat:typing": (data: { isTyping: boolean }) => void;
}

export interface SocketData {
  userId: string;
  playerId: string;
  roomId: string;
  nickname: string;
  team: Team;
}
