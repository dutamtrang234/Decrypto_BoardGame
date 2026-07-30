import { useState } from "react";
import type { TeamGameState } from "../../types";

interface Props {
  teamState: TeamGameState;
  onSubmit: (indices: number[]) => void;
  disabled: boolean;
  submitted: boolean;
}

export default function GuessPhase({ teamState, onSubmit, disabled, submitted }: Props) {
  const [selected, setSelected] = useState<(number | null)[]>([null, null, null]);

  const handleSelect = (clueIndex: number, wordIndex: number) => {
    if (submitted || disabled) return;
    const next = [...selected];
    next[clueIndex] = wordIndex;
    setSelected(next);
  };

  const allSelected = selected.every((s) => s !== null);

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold text-white">Guess Your Code Master's Words</h3>

      <p className="text-sm text-gray-400 mb-1">Your team's keywords:</p>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {teamState.words.map((word, i) => (
          <div key={i} className="bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-center">
            <div className="text-xs text-gray-500">{i + 1}</div>
            <div className="text-sm text-gray-200 truncate">{word}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 mb-2">Your code master's clues — match each to a keyword number:</p>

      <div className="space-y-3">
        {teamState.clues.map((clue, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-sm text-yellow-400 font-semibold mb-1">
              Clue #{i + 1}: <span className="text-yellow-300">{clue}</span>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((j) => (
                <button
                  key={j}
                  onClick={() => handleSelect(i, j)}
                  disabled={disabled || submitted}
                  className={`flex-1 p-3 rounded-lg border-2 text-center text-lg font-bold transition-all ${
                    selected[i] === j
                      ? "bg-green-700/50 border-green-500 text-green-200"
                      : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500"
                  } ${(disabled || submitted) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {j + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {submitted ? (
        <div className="text-center text-green-400 font-medium py-2 bg-green-900/30 rounded">
          Guess Submitted!
        </div>
      ) : (
        <button
          onClick={() => onSubmit(selected as number[])}
          disabled={disabled || !allSelected}
          className="w-full btn-success"
        >
          Submit Guess ({selected.filter((s) => s !== null).length}/3)
        </button>
      )}
    </div>
  );
}
