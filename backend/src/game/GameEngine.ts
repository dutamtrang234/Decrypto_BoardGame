import { pickRandomWords } from "./words";
import type {
  Team, GamePhase, GameState, TeamGameState, RoundRecord, PlayerData,
} from "./types";

function randomClueOrder(): number[] {
  const indices = [0, 1, 2, 3];
  const shuffled = indices.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function createTeamGameState(words: string[], players: PlayerData[], team: Team): TeamGameState {
  const teamPlayers = players.filter((p) => p.team === team).sort((a, b) => a.seatIndex - b.seatIndex);
  const codeMasterId = teamPlayers.length > 0 ? teamPlayers[0].id : "";
  const teamLeaderIndex = teamPlayers.length > 1 ? 1 : 0;
  return {
    codeMasterIndex: 0,
    codeMasterId,
    teamLeaderIndex,
    teamLeaderId: teamPlayers[teamLeaderIndex]?.id || "",
    words,
    interceptionTokens: 4,
    mistakes: 0,
    clueOrder: null,
    clues: [null, null, null],
    guess: null,
    interception: null,
    guessCorrect: null,
    interceptionCorrect: null,
  };
}

function checkWinCondition(
  state: GameState,
): { winner: Team | null; reason: "interception" | "mistake" | null } {
  if (state.blue.mistakes >= 2) return { winner: "red", reason: "mistake" };
  if (state.red.mistakes >= 2) return { winner: "blue", reason: "mistake" };
  if (state.blue.interceptionTokens <= 0) return { winner: "red", reason: "interception" };
  if (state.red.interceptionTokens <= 0) return { winner: "blue", reason: "interception" };
  return { winner: null, reason: null };
}

function arraysEqual(a: number[] | null | undefined, b: number[] | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function resolveRound(state: GameState): { state: GameState; error?: string } {
  const newState = structuredClone(state);

  const blueGuessCorrect = arraysEqual(newState.blue.guess, newState.blue.clueOrder);
  const redGuessCorrect = arraysEqual(newState.red.guess, newState.red.clueOrder);
  const blueInterceptionCorrect = arraysEqual(newState.blue.interception, newState.red.clueOrder);
  const redInterceptionCorrect = arraysEqual(newState.red.interception, newState.blue.clueOrder);

  newState.blue.guessCorrect = blueGuessCorrect;
  newState.red.guessCorrect = redGuessCorrect;
  newState.blue.interceptionCorrect = blueInterceptionCorrect;
  newState.red.interceptionCorrect = redInterceptionCorrect;

  if (!blueGuessCorrect) newState.blue.mistakes += 1;
  if (!redGuessCorrect) newState.red.mistakes += 1;
  if (redInterceptionCorrect) newState.blue.interceptionTokens -= 1;
  if (blueInterceptionCorrect) newState.red.interceptionTokens -= 1;

  const record: RoundRecord = {
    round: newState.round,
    blueCodeMasterId: newState.blue.codeMasterId,
    redCodeMasterId: newState.red.codeMasterId,
    blueClues: newState.blue.clues.map((c) => c || ""),
    redClues: newState.red.clues.map((c) => c || ""),
    blueClueOrder: newState.blue.clueOrder || [],
    redClueOrder: newState.red.clueOrder || [],
    blueGuess: newState.blue.guess || [],
    redGuess: newState.red.guess || [],
    blueInterception: newState.blue.interception || [],
    redInterception: newState.red.interception || [],
    blueGuessCorrect,
    redGuessCorrect,
    blueInterceptionCorrect,
    redInterceptionCorrect,
    blueMistakesBefore: state.blue.mistakes,
    redMistakesBefore: state.red.mistakes,
    blueTokensBefore: state.blue.interceptionTokens,
    redTokensBefore: state.red.interceptionTokens,
    blueMistakesAfter: newState.blue.mistakes,
    redMistakesAfter: newState.red.mistakes,
    blueTokensAfter: newState.blue.interceptionTokens,
    redTokensAfter: newState.red.interceptionTokens,
  };

  newState.history.push(record);

  const winCheck = checkWinCondition(newState);
  if (winCheck.winner) {
    newState.phase = "finished";
    newState.winner = winCheck.winner;
    newState.winReason = winCheck.reason;
    newState.timerEndsAt = null;
    return { state: newState };
  }

  newState.phase = "resolution";
  newState.timer = 30;
  newState.timerStartedAt = Date.now();
  newState.timerEndsAt = Date.now() + 30_000;

  return { state: newState };
}

export function startGame(players: PlayerData[]): GameState {
  const allWords = pickRandomWords(8);
  const blueWords = allWords.slice(0, 4);
  const redWords = allWords.slice(4, 8);

  const blue = createTeamGameState(blueWords, players, "blue");
  const red = createTeamGameState(redWords, players, "red");

  blue.clueOrder = randomClueOrder();
  red.clueOrder = randomClueOrder();

  return {
    phase: "clue",
    round: 1,
    blue,
    red,
    history: [],
    timer: 120,
    timerStartedAt: null,
    timerEndsAt: null,
    winner: null,
    winReason: null,
    clueOrder: "blue",
    players,
  };
}

export function submitClue(
  state: GameState,
  playerId: string,
  team: Team,
  clues: string[],
): { state: GameState; error?: string } {
  const ts = state[team];
  if (state.phase !== "clue") {
    return { state, error: "Not in clue phase" };
  }
  if (ts.codeMasterId !== playerId) {
    return { state, error: "You are not the code master" };
  }
  if (clues.length !== 3) {
    return { state, error: "Must provide exactly 3 clues" };
  }
  for (let i = 0; i < 3; i++) {
    if (!clues[i] || clues[i].trim().length === 0) {
      return { state, error: `Clue ${i + 1} cannot be empty` };
    }
    if (clues[i].length > 50) {
      return { state, error: `Clue ${i + 1} too long (max 50 chars)` };
    }
  }

  const newState = structuredClone(state);
  newState[team].clues = clues.map((c) => c.trim());

  const bothSubmitted = newState.blue.clues.every((c) => c !== null) && newState.red.clues.every((c) => c !== null);
  if (bothSubmitted) {
    newState.phase = "guess";
    newState.timer = 90;
    newState.timerStartedAt = Date.now();
    newState.timerEndsAt = Date.now() + 90_000;
  } else {
    newState.timerStartedAt = Date.now();
    newState.timerEndsAt = Date.now() + newState.timer * 1000;
  }

  return { state: newState };
}

export function submitGuess(
  state: GameState,
  playerId: string,
  team: Team,
  indices: number[],
): { state: GameState; error?: string } {
  if (state.phase !== "guess") {
    return { state, error: "Not in guess phase" };
  }
  if (state[team].codeMasterId === playerId) {
    return { state, error: "Code master cannot guess" };
  }
  if (state[team].teamLeaderId !== playerId) {
    return { state, error: "Only the team leader can submit the guess" };
  }
  if (indices.length !== 3) {
    return { state, error: "Must select exactly 3 word indices" };
  }
  if (new Set(indices).size !== 3) {
    return { state, error: "Duplicate word indices" };
  }
  if (!indices.every((i) => i >= 0 && i <= 3)) {
    return { state, error: "Invalid word indices" };
  }
  if (state[team].guess !== null) {
    return { state, error: "Guess already submitted" };
  }

  const newState = structuredClone(state);
  newState[team].guess = [...indices];

  const bothGuessed = newState.blue.guess !== null && newState.red.guess !== null;
  if (bothGuessed) {
    newState.phase = "interception";
    newState.timer = 120;
    newState.timerStartedAt = Date.now();
    newState.timerEndsAt = Date.now() + 120_000;
  }

  return { state: newState };
}

export function submitInterception(
  state: GameState,
  playerId: string,
  team: Team,
  indices: number[],
): { state: GameState; error?: string } {
  if (state.phase !== "interception") {
    return { state, error: "Not in interception phase" };
  }
  if (state[team].codeMasterId === playerId) {
    return { state, error: "Code master cannot intercept" };
  }
  if (state[team].teamLeaderId !== playerId) {
    return { state, error: "Only the team leader can submit the interception" };
  }
  if (indices.length !== 3) {
    return { state, error: "Must select exactly 3 word indices" };
  }
  if (new Set(indices).size !== 3) {
    return { state, error: "Duplicate word indices" };
  }
  if (!indices.every((i) => i >= 0 && i <= 3)) {
    return { state, error: "Invalid word indices" };
  }

  const newState = structuredClone(state);
  newState[team].interception = [...indices];

  const bothIntercepted =
    newState.blue.interception !== null && newState.red.interception !== null;

  if (bothIntercepted) {
    return resolveRound(newState);
  }

  return { state: newState };
}

export function advanceAfterResolution(state: GameState): { state: GameState; error?: string } {
  if (state.phase !== "resolution") {
    return { state, error: "Not in resolution phase" };
  }

  const newState = structuredClone(state);
  newState.round += 1;
  newState.phase = "clue";
  newState.timer = 120;
  newState.timerStartedAt = Date.now();
  newState.timerEndsAt = Date.now() + 120_000;

  const blueTeamPlayers = newState.players
    .filter((p) => p.team === "blue")
    .sort((a, b) => a.seatIndex - b.seatIndex);
  const redTeamPlayers = newState.players
    .filter((p) => p.team === "red")
    .sort((a, b) => a.seatIndex - b.seatIndex);

  const nextBlueCM = (newState.blue.codeMasterIndex + 1) % blueTeamPlayers.length;
  newState.blue.codeMasterIndex = nextBlueCM;
  newState.blue.codeMasterId = blueTeamPlayers[nextBlueCM].id;
  newState.blue.teamLeaderIndex = (nextBlueCM + 1) % blueTeamPlayers.length;
  newState.blue.teamLeaderId = blueTeamPlayers[newState.blue.teamLeaderIndex].id;

  const nextRedCM = (newState.red.codeMasterIndex + 1) % redTeamPlayers.length;
  newState.red.codeMasterIndex = nextRedCM;
  newState.red.codeMasterId = redTeamPlayers[nextRedCM].id;
  newState.red.teamLeaderIndex = (nextRedCM + 1) % redTeamPlayers.length;
  newState.red.teamLeaderId = redTeamPlayers[newState.red.teamLeaderIndex].id;

  newState.blue.clueOrder = randomClueOrder();
  newState.blue.clues = [null, null, null];
  newState.blue.guess = null;
  newState.blue.interception = null;
  newState.blue.guessCorrect = null;
  newState.blue.interceptionCorrect = null;
  newState.red.clueOrder = randomClueOrder();
  newState.red.clues = [null, null, null];
  newState.red.guess = null;
  newState.red.interception = null;
  newState.red.guessCorrect = null;
  newState.red.interceptionCorrect = null;

  return { state: newState };
}

export function timeoutPhase(state: GameState): { state: GameState; error?: string } {
  const newState = structuredClone(state);

  switch (state.phase) {
    case "clue": {
      if (newState.blue.clues.some((c) => c === null)) {
        newState.blue.clues = ["...", "...", "..."];
      }
      if (newState.red.clues.some((c) => c === null)) {
        newState.red.clues = ["...", "...", "..."];
      }
      newState.phase = "guess";
      newState.timer = 90;
      newState.timerStartedAt = Date.now();
      newState.timerEndsAt = Date.now() + 90_000;
      break;
    }
    case "guess": {
      if (newState.blue.guess === null) newState.blue.guess = [-1, -1, -1];
      if (newState.red.guess === null) newState.red.guess = [-1, -1, -1];
      newState.phase = "interception";
      newState.timer = 120;
      newState.timerStartedAt = Date.now();
      newState.timerEndsAt = Date.now() + 120_000;
      break;
    }
    case "interception": {
      if (newState.blue.interception === null) newState.blue.interception = [-1, -1, -1];
      if (newState.red.interception === null) newState.red.interception = [-1, -1, -1];
      return resolveRound(newState);
    }
    case "resolution": {
      return advanceAfterResolution(newState);
    }
  }

  return { state: newState };
}

export function getTeamView(state: GameState, team: Team): GameState {
  const view = structuredClone(state);
  if (team === "blue") {
    view.red.words = ["?", "?", "?", "?"];
    view.red.clues = ["?", "?", "?"];
    view.red.clueOrder = null;
  } else {
    view.blue.words = ["?", "?", "?", "?"];
    view.blue.clues = ["?", "?", "?"];
    view.blue.clueOrder = null;
  }
  if (state.phase === "clue") {
    if (team === "blue") view.red.clues = [null, null, null];
    else view.blue.clues = [null, null, null];
  }
  return view;
}

export function getGuesserView(state: GameState, team: Team): GameState {
  const view = getTeamView(state, team);
  if (state.phase === "clue") {
    if (team === "blue") view.blue.clues = [null, null, null];
    else view.red.clues = [null, null, null];
  }
  return view;
}
