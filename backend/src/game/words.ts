export const WORDS: string[] = [
  "APPLE", "PIRATE", "MOON", "ENGINE",
  "GOLD", "PYRAMID", "CAPTAIN", "WINDOW",
  "SUN", "STAR", "DIAMOND", "NINJA",
  "GHOST", "VOICE", "SHADOW", "RIVER",
  "BRIDGE", "TOWER", "GARDEN", "CASTLE",
  "KNIGHT", "QUEEN", "DRAGON", "SWORD",
  "SHIELD", "CROWN", "THRONE", "MAP",
  "COMPASS", "ANCHOR", "CANNON", "PARROT",
  "TREASURE", "ISLAND", "VOLCANO", "DESERT",
  "JUNGLE", "GLACIER", "CAVE", "WATERFALL",
  "LIGHTNING", "THUNDER", "STORM", "RAINBOW",
  "CLOUD", "MOUNTAIN", "VALLEY", "OCEAN",
  "FOREST", "FLAME", "ASH", "MIRROR",
  "CLOCK", "KEY", "LOCK", "CHAIN",
  "WHEEL", "GEAR", "SPRING", "BELL",
  "HORN", "DRUM", "FLUTE", "LYRE",
  "SCEPTER", "MASK", "ROBE", "ARROW",
  "BOW", "SPEAR", "ARMOR", "HELMET",
  "SADDLE", "BANNER", "CREST", "SEAL",
  "SCROLL", "QUILL", "INK", "WAX",
  "LANTERN", "TORCH", "CANDLE", "VIAL",
  "WELL", "TOMB", "ALTAR", "RUNE",
  "PORTAL", "CRYSTAL", "POTION", "SCARAB",
  "ANKH", "OBELISK", "OASIS", "MIRAGE",
  "PHOENIX", "GRIFFIN", "CENTAUR", "SPHINX",
  "MINOTAUR", "CHIMERA", "HYDRA", "PEGASUS",
  "ANGEL", "DEMON", "WIZARD", "WITCH",
];

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function pickRandomWords(count: number): string[] {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateUserId(): string {
  return "user_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generatePlayerId(): string {
  return "player_" + Math.random().toString(36).substring(2, 15);
}

export function generateRoomId(): string {
  return "room_" + Math.random().toString(36).substring(2, 15);
}
