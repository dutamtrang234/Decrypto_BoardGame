import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://decrypto:decrypto@localhost:5432/decrypto",
  reconnectTimeout: 60_000,
  phaseTimers: {
    clue: 120,
    guess: 90,
    interception: 90,
    resolution: 30,
  },
};

export type Config = typeof config;
