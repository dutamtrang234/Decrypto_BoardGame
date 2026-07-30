import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateRoomCode, pickRandomWords, generateUserId, generatePlayerId } from "../src/game/words";

describe("Room Code Generation", () => {
  it("should generate a 4-character room code", () => {
    const code = generateRoomCode();
    expect(code.length).toBe(4);
  });

  it("should generate unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateRoomCode());
    }
    expect(codes.size).toBeGreaterThan(990);
  });

  it("should only contain valid characters", () => {
    const validChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(validChars).toContain(char);
      }
    }
  });
});

describe("Word Selection", () => {
  it("should pick the requested number of words", () => {
    const words = pickRandomWords(8);
    expect(words.length).toBe(8);
  });

  it("should return unique words", () => {
    const words = pickRandomWords(100);
    const unique = new Set(words);
    expect(unique.size).toBe(words.length);
  });
});

describe("ID Generation", () => {
  it("should generate unique user IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateUserId());
    }
    expect(ids.size).toBe(100);
  });

  it("should generate unique player IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generatePlayerId());
    }
    expect(ids.size).toBe(100);
  });
});
