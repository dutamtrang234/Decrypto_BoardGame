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

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  content: string;
  type: string;
  target: string;
  createdAt: string;
}

export interface TypingUser {
  playerId: string;
  nickname: string;
  isTyping: boolean;
}
