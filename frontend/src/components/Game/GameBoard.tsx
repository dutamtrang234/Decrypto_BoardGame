import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../hooks/useGame";
import { useRoom } from "../../hooks/useRoom";
import ScoreBoard from "./ScoreBoard";
import ClueEntry from "./ClueEntry";
import GuessPhase from "./GuessPhase";
import InterceptionPhase from "./InterceptionPhase";
import Timer from "./Timer";
import RoundHistory from "./RoundHistory";
import ChatBox from "../Chat/ChatBox";

export default function GameBoard() {
  const {
    gameState,
    roomData,
    submitClue,
    submitGuess,
    submitInterception,
    advanceRound,
  } = useSocket();

  const { playerTeam, isCodeMaster, isTeamLeader, teamState, opponentState } = useGame();
  const { isHost } = useRoom();

  if (!gameState) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading game...</div>
      </div>
    );
  }

  const handleClueSubmit = async (clues: string[]) => {
    try {
      await submitClue(clues);
    } catch (err: any) {
      console.error("Clue submission failed:", err.message);
    }
  };

  const handleGuessSubmit = async (indices: number[]) => {
    try {
      await submitGuess(indices);
    } catch (err: any) {
      console.error("Guess submission failed:", err.message);
    }
  };

  const handleInterceptionSubmit = async (indices: number[]) => {
    try {
      await submitInterception(indices);
    } catch (err: any) {
      console.error("Interception submission failed:", err.message);
    }
  };

  const myTeamState = playerTeam ? gameState[playerTeam] : null;
  const opponentTeamState = playerTeam
    ? gameState[playerTeam === "blue" ? "red" : "blue"]
    : null;

  return (
    <div className="flex-1 grid grid-cols-[1fr_300px] gap-4 p-4">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-4 flex-shrink-0">
            <ScoreBoard gameState={gameState} playerTeam={playerTeam} />
            <Timer
              timerEndsAt={gameState.timerEndsAt}
              phase={gameState.phase}
            />
          </div>
          {myTeamState && opponentTeamState && (
            <div className="space-y-1 flex-1">
              <div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  {playerTeam === "blue" ? "Blue" : "Red"} Keywords
                </div>
                <div className="grid grid-cols-4 gap-0.5">
                  {myTeamState.words.map((word, i) => (
                    <div key={i} className="bg-gray-700/50 border border-gray-600 rounded px-1 py-0.5 text-center">
                      <div className="text-[9px] text-gray-500">{i + 1}</div>
                      <div className="text-[11px] text-gray-200 truncate">{word}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  {playerTeam === "blue" ? "Red" : "Blue"} Keywords
                </div>
                <div className="grid grid-cols-4 gap-0.5">
                  {opponentTeamState.words.map((_, i) => (
                    <div key={i} className="bg-gray-800/50 border border-gray-700 rounded px-1 py-0.5 text-center">
                      <div className="text-[9px] text-gray-500">{i + 1}</div>
                      <div className="text-[11px] text-gray-600">?</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {gameState.phase === "finished" && (
          <div className="card text-center py-8">
            <h2 className="text-2xl font-bold mb-2">
              {gameState.winner === "blue" ? "Blue" : "Red"} Team Wins!
            </h2>
            <p className="text-gray-400 mb-4">
              {gameState.winReason === "interception"
                ? "Victory by interception!"
                : "Victory by miscommunication!"}
            </p>
            <p className="text-sm text-gray-500">
              Game lasted {gameState.round} rounds
            </p>
          </div>
        )}

        {gameState.phase === "clue" && myTeamState && isCodeMaster && (
          <ClueEntry
            words={myTeamState.words}
            clueOrder={myTeamState.clueOrder}
            onSubmit={handleClueSubmit}
            disabled={myTeamState.clues.every((c) => c !== null)}
          />
        )}

        {gameState.phase === "clue" && myTeamState && !isCodeMaster && (
          <div className="card text-center py-8">
            <div className="text-gray-400 text-lg mb-2">
              Waiting for your Code Master to submit clues...
            </div>
            <div className="text-sm text-gray-500">
              Your team's code master is crafting the perfect clues.
            </div>
          </div>
        )}

        {gameState.phase === "guess" && myTeamState && (
          <GuessPhase
            teamState={myTeamState}
            onSubmit={handleGuessSubmit}
            disabled={false}
            submitted={myTeamState.guess !== null}
            isTeamLeader={isTeamLeader}
            isCodeMaster={isCodeMaster}
            teamLeaderName={roomData?.players.find(p => p.id === myTeamState.teamLeaderId)?.nickname}
          />
        )}

        {gameState.phase === "interception" && myTeamState && opponentTeamState && (
          <InterceptionPhase
            opponentClues={opponentTeamState.clues}
            onSubmit={handleInterceptionSubmit}
            disabled={false}
            submitted={myTeamState.interception !== null}
            isTeamLeader={isTeamLeader}
            isCodeMaster={isCodeMaster}
            teamLeaderName={roomData?.players.find(p => p.id === myTeamState.teamLeaderId)?.nickname}
          />
        )}

        {gameState.phase === "resolution" && (
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-white">Round Resolution</h3>
            {gameState.history.length > 0 && (
              <RoundResult history={gameState.history} gameState={gameState} />
            )}
            {isHost && (
              <button onClick={() => advanceRound()} className="w-full btn-primary">
                Next Round
              </button>
            )}
            {!isHost && (
              <div className="text-center text-gray-400 text-sm">
                Waiting for host to advance...
              </div>
            )}
          </div>
        )}

        <RoundHistory gameState={gameState} playerTeam={playerTeam} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="h-[400px]">
          <ChatBox teamChat={false} />
        </div>
        <div className="h-[300px]">
          <ChatBox teamChat={true} />
        </div>
      </div>
    </div>
  );
}

function RoundResult({
  history,
}: {
  history: any[];
  gameState: any;
}) {
  const last = history[history.length - 1];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-900/30 rounded-lg p-3">
          <h4 className="font-bold text-blue-400 mb-2">Blue Team</h4>
          <div className="space-y-1 text-sm">
            <p>Clues:{" "}
              <span className="text-yellow-400">
                {last.blueClues?.join(" | ")}
              </span>
            </p>
            <p>Target order: #{last.blueClueOrder?.map((i: number) => i + 1).join(" → ")}</p>
            <p>
              Guess:{" "}
              <span className={last.blueGuessCorrect ? "text-green-400" : "text-red-400"}>
                #{last.blueGuess?.map((i: number) => i + 1).join(", ") || "N/A"}
                {last.blueGuessCorrect ? " ✓" : " ✗"}
              </span>
            </p>
            <p>
              Interception:{" "}
              <span className={last.blueInterceptionCorrect ? "text-green-400" : "text-red-400"}>
                #{last.blueInterception?.map((i: number) => i + 1).join(", ") || "N/A"}
                {last.blueInterceptionCorrect ? " ✓" : " ✗"}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-red-900/30 rounded-lg p-3">
          <h4 className="font-bold text-red-400 mb-2">Red Team</h4>
          <div className="space-y-1 text-sm">
            <p>Clues:{" "}
              <span className="text-yellow-400">
                {last.redClues?.join(" | ")}
              </span>
            </p>
            <p>Target order: #{last.redClueOrder?.map((i: number) => i + 1).join(" → ")}</p>
            <p>
              Guess:{" "}
              <span className={last.redGuessCorrect ? "text-green-400" : "text-red-400"}>
                #{last.redGuess?.map((i: number) => i + 1).join(", ") || "N/A"}
                {last.redGuessCorrect ? " ✓" : " ✗"}
              </span>
            </p>
            <p>
              Interception:{" "}
              <span className={last.redInterceptionCorrect ? "text-green-400" : "text-red-400"}>
                #{last.redInterception?.map((i: number) => i + 1).join(", ") || "N/A"}
                {last.redInterceptionCorrect ? " ✓" : " ✗"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}