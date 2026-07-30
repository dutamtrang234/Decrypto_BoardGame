import { describe, it, expect } from "vitest";
import { startGame, submitClue, submitGuess, submitInterception, timeoutPhase, advanceAfterResolution } from "../src/game/GameEngine";
import type { PlayerData, GameState } from "../src/game/types";

function makePlayer(id: string, team: "blue" | "red", seatIndex: number): PlayerData {
  return {
    id,
    userId: `user_${id}`,
    nickname: `Player${id}`,
    team,
    seatIndex,
    isReady: true,
    isConnected: true,
    isHost: false,
  };
}

const testPlayers: PlayerData[] = [
  makePlayer("p1", "blue", 0),
  makePlayer("p2", "blue", 1),
  makePlayer("p3", "red", 4),
  makePlayer("p4", "red", 5),
];

describe("GameEngine", () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = startGame(testPlayers);
  });

  it("should start a game with correct initial state", () => {
    expect(gameState.phase).toBe("clue");
    expect(gameState.round).toBe(1);
    expect(gameState.blue.words.length).toBe(4);
    expect(gameState.red.words.length).toBe(4);
    expect(gameState.blue.interceptionTokens).toBe(4);
    expect(gameState.red.interceptionTokens).toBe(4);
    expect(gameState.blue.mistakes).toBe(0);
    expect(gameState.red.mistakes).toBe(0);
    expect(gameState.blue.codeMasterId).toBeTruthy();
    expect(gameState.red.codeMasterId).toBeTruthy();
    expect(gameState.blue.clueOrder?.length).toBe(3);
    expect(gameState.red.clueOrder?.length).toBe(3);
    expect(gameState.blue.clues).toEqual([null, null, null]);
    expect(gameState.red.clues).toEqual([null, null, null]);
  });

  it("should handle clue submission", () => {
    const clues = ["fruity", "sweet", "red"];
    const result = submitClue(gameState, gameState.blue.codeMasterId, "blue", clues);
    expect(result.error).toBeUndefined();
    expect(result.state.blue.clues).toEqual(clues);
  });

  it("should reject clue from non-code-master", () => {
    const nonCodeMaster = testPlayers.find(
      (p) => p.id !== gameState.blue.codeMasterId && p.team === "blue",
    );
    if (!nonCodeMaster) return;
    const result = submitClue(gameState, nonCodeMaster.id, "blue", ["a", "b", "c"]);
    expect(result.error).toBeDefined();
  });

  it("should reject empty clues", () => {
    const result = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["", "b", "c"]);
    expect(result.error).toBeDefined();
  });

  it("should reject wrong number of clues", () => {
    const result = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b"]);
    expect(result.error).toBeDefined();
  });

  it("should advance to guess phase when both clue sets submitted", () => {
    const afterBlue = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b", "c"]);
    const afterRed = submitClue(afterBlue.state, gameState.red.codeMasterId, "red", ["d", "e", "f"]);
    expect(afterRed.state.phase).toBe("guess");
  });

  it("should handle guess submission", () => {
    const afterBlue = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b", "c"]);
    const afterClues = submitClue(afterBlue.state, gameState.red.codeMasterId, "red", ["d", "e", "f"]);

    const guesser = testPlayers.find(
      (p) => p.id !== afterClues.state.blue.codeMasterId && p.team === "blue",
    );
    if (!guesser) return;
    const order = afterClues.state.blue.clueOrder!;
    const result = submitGuess(afterClues.state, guesser.id, "blue", order);
    expect(result.error).toBeUndefined();
    expect(result.state.blue.guess).toEqual(order);
  });

  it("should reject code master guessing", () => {
    const afterBlue = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b", "c"]);
    const afterClues = submitClue(afterBlue.state, gameState.red.codeMasterId, "red", ["d", "e", "f"]);

    const result = submitGuess(afterClues.state, afterClues.state.blue.codeMasterId, "blue", [0, 1, 2]);
    expect(result.error).toBeDefined();
  });

  it("should handle a complete round correctly", () => {
    const c1 = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b", "c"]);
    const c2 = submitClue(c1.state, gameState.red.codeMasterId, "red", ["d", "e", "f"]);
    expect(c2.state.phase).toBe("guess");

    const blueGuesser = testPlayers.find((p) => p.id !== c2.state.blue.codeMasterId && p.team === "blue")!;
    const redGuesser = testPlayers.find((p) => p.id !== c2.state.red.codeMasterId && p.team === "red")!;

    const blueOrder = c2.state.blue.clueOrder!;
    const redOrder = c2.state.red.clueOrder!;

    const g1 = submitGuess(c2.state, blueGuesser.id, "blue", blueOrder);
    const g2 = submitGuess(g1.state, redGuesser.id, "red", redOrder);
    expect(g2.state.phase).toBe("interception");

    const i1 = submitInterception(g2.state, blueGuesser.id, "blue", redOrder);
    const i2 = submitInterception(i1.state, redGuesser.id, "red", blueOrder);
    expect(i2.state.phase).toBe("resolution");

    expect(i2.state.history.length).toBe(1);
    const record = i2.state.history[0];
    expect(record.blueGuessCorrect).toBe(true);
    expect(record.redGuessCorrect).toBe(true);
    expect(record.blueInterceptionCorrect).toBe(true);
    expect(record.redInterceptionCorrect).toBe(true);
  });

  it("should track mistakes correctly", () => {
    const c1 = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b", "c"]);
    const c2 = submitClue(c1.state, gameState.red.codeMasterId, "red", ["d", "e", "f"]);

    const blueGuesser = testPlayers.find((p) => p.id !== c2.state.blue.codeMasterId && p.team === "blue")!;
    const redGuesser = testPlayers.find((p) => p.id !== c2.state.red.codeMasterId && p.team === "red")!;

    const blueOrder = c2.state.blue.clueOrder!;
    const wrongBlueGuess = [...blueOrder].reverse();

    const g1 = submitGuess(c2.state, blueGuesser.id, "blue", wrongBlueGuess);
    const g2 = submitGuess(g1.state, redGuesser.id, "red", [0, 1, 2]);

    const i1 = submitInterception(g2.state, blueGuesser.id, "blue", [0, 1, 2]);
    const i2 = submitInterception(i1.state, redGuesser.id, "red", [0, 1, 2]);

    expect(i2.state.blue.mistakes).toBe(1);
    expect(i2.state.history[0].blueGuessCorrect).toBe(false);
  });

  it("should handle timeout in clue phase", () => {
    const result = timeoutPhase(gameState);
    expect(result.state.phase).toBe("guess");
    expect(result.state.blue.clues).toEqual(["...", "...", "..."]);
    expect(result.state.red.clues).toEqual(["...", "...", "..."]);
  });

  it("should handle timeout in guess phase", () => {
    const c1 = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b", "c"]);
    const c2 = submitClue(c1.state, gameState.red.codeMasterId, "red", ["d", "e", "f"]);
    const result = timeoutPhase(c2.state);
    expect(result.state.phase).toBe("interception");
  });

  it("should handle timeout in interception phase", () => {
    const c1 = submitClue(gameState, gameState.blue.codeMasterId, "blue", ["a", "b", "c"]);
    const c2 = submitClue(c1.state, gameState.red.codeMasterId, "red", ["d", "e", "f"]);
    const g1 = submitGuess(c2.state,
      testPlayers.find((p) => p.id !== c2.state.blue.codeMasterId && p.team === "blue")!.id,
      "blue", [0, 1, 2]);
    const g2 = submitGuess(g1.state,
      testPlayers.find((p) => p.id !== g1.state.red.codeMasterId && p.team === "red")!.id,
      "red", [0, 1, 2]);

    const result = timeoutPhase(g2.state);
    expect(result.state.phase).toBe("resolution");
  });

  it("should detect win by mistakes", () => {
    let state = gameState;

    for (let round = 0; round < 2; round++) {
      const c1 = submitClue(state, state.blue.codeMasterId, "blue", ["a", "b", "c"]);
      const c2 = submitClue(c1.state, state.red.codeMasterId, "red", ["d", "e", "f"]);

      const blueG = testPlayers.find((p) => p.id !== c2.state.blue.codeMasterId && p.team === "blue")!;
      const redG = testPlayers.find((p) => p.id !== c2.state.red.codeMasterId && p.team === "red")!;

      const g1 = submitGuess(c2.state, blueG.id, "blue", [1, 2, 3]);
      const g2 = submitGuess(g1.state, redG.id, "red", [0, 1, 2]);

      const i1 = submitInterception(g2.state, blueG.id, "blue", [0, 1, 3]);
      const i2 = submitInterception(i1.state, redG.id, "red", [0, 1, 3]);

      state = i2.state;

      if (state.phase === "resolution") {
        const adv = advanceAfterResolution(state);
        if (adv.error) break;
        state = adv.state;
      }
    }

    if (state.blue.mistakes >= 2 || state.red.mistakes >= 2) {
      expect(state.phase).toBe("finished");
      expect(state.winner).toBeDefined();
    }
  });
});
