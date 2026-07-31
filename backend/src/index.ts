import path from "path";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { config } from "./config";
import { createSocketServer } from "./socket";
import healthRouter from "./routes/health";
import { rooms } from "./socket/handlers/roomHandlers";
import { timeoutPhase } from "./game/GameEngine";
import { broadcastGameState } from "./socket/handlers/gameHandlers";

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.use("/api", healthRouter);

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const io = createSocketServer(httpServer);

const timerInterval = setInterval(() => {
  for (const room of rooms.values()) {
    const gs = room.gameState;
    if (!gs || gs.phase === "finished" || !gs.timerEndsAt) continue;

    if (Date.now() >= gs.timerEndsAt) {
      const result = timeoutPhase(gs);
      room.gameState = result.state;

      if (result.state.phase === "finished" && result.state.winner && result.state.winReason) {
        io.to(room.id).emit("game:finished", {
          winner: result.state.winner,
          winReason: result.state.winReason,
          gameState: result.state,
        });
      } else {
        broadcastGameState(io, room);
      }
    }
  }
}, 1000);

httpServer.listen(config.port, () => {
  console.log(`[Decrypto] Server running on port ${config.port}`);
  console.log(`[Decrypto] Environment: ${config.nodeEnv}`);
});

process.on("SIGTERM", () => {
  clearInterval(timerInterval);
  httpServer.close();
  process.exit(0);
});
