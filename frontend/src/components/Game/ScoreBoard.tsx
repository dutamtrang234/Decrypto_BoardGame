import type { GameState, Team } from "../../types";

interface Props {
  gameState: GameState;
  playerTeam: Team | null;
}

export default function ScoreBoard({ gameState, playerTeam }: Props) {
  const blueTokens = gameState.blue.interceptionTokens;
  const redTokens = gameState.red.interceptionTokens;
  const blueMistakes = gameState.blue.mistakes;
  const redMistakes = gameState.red.mistakes;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm font-semibold text-blue-400">Blue</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-gray-500">Round {gameState.round}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-red-400">Red</span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>
      </div>

      <div className="flex items-center justify-between text-center">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Interception Tokens</div>
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 ${
                  i < blueTokens
                    ? "bg-blue-500 border-blue-400"
                    : "bg-gray-700 border-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="w-8" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Interception Tokens</div>
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 ${
                  i < redTokens
                    ? "bg-red-500 border-red-400"
                    : "bg-gray-700 border-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {playerTeam && (
        <div className="flex items-center justify-between text-center mt-2 pt-2 border-t border-gray-700">
          <div className="flex-1">
            <div className="text-xs text-gray-500">Mistakes</div>
            <div className="text-lg font-bold text-white">{blueMistakes}/2</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-500">Mistakes</div>
            <div className="text-lg font-bold text-white">{redMistakes}/2</div>
          </div>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-500 mb-1">
          Phase: <span className="text-white capitalize">{gameState.phase}</span>
        </div>
      </div>
    </div>
  );
}
