import { useState } from "react";

interface Props {
  words: string[];
  clueOrder: number[] | null;
  onSubmit: (clues: string[]) => void;
  disabled: boolean;
}

export default function ClueEntry({ words, clueOrder, onSubmit, disabled }: Props) {
  const [clues, setClues] = useState<string[]>(["", "", ""]);

  const handleChange = (index: number, value: string) => {
    const next = [...clues];
    next[index] = value;
    setClues(next);
  };

  const handleSubmit = () => {
    if (clues.some((c) => c.trim().length === 0)) return;
    onSubmit(clues.map((c) => c.trim()));
  };

  const allFilled = clues.every((c) => c.trim().length > 0);

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold text-white">Enter Your Clues</h3>

      <p className="text-sm text-gray-400 mb-1">Your team's keywords:</p>
      <div className="grid grid-cols-4 gap-2">
        {words.map((word, i) => (
          <div key={i} className="bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-center">
            <div className="text-xs text-gray-500">{i + 1}</div>
            <div className="text-sm text-gray-200 truncate">{word}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 mt-2">
        Enter clues for these word positions (in order):
      </p>

      {clueOrder && (
        <div className="space-y-3">
          {clueOrder.map((wordIdx, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <label className="block text-sm text-yellow-400 font-semibold mb-1">
                Word #{wordIdx + 1}: <span className="text-yellow-300">{words[wordIdx]}</span>
              </label>
              <input
                type="text"
                value={clues[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={disabled}
                placeholder="Enter your clue..."
                className="w-full"
                maxLength={50}
                autoFocus={i === 0}
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || !allFilled}
        className="w-full btn-success"
      >
        Submit Clues
      </button>
    </div>
  );
}