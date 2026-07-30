import { useState } from "react";

interface Props {
  opponentClues: (string | null)[];
  onSubmit: (indices: number[]) => void;
  disabled: boolean;
  submitted: boolean;
}

export default function InterceptionPhase({
  opponentClues,
  onSubmit,
  disabled,
  submitted,
}: Props) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleIndex = (i: number) => {
    if (submitted) return;
    if (selected.includes(i)) {
      setSelected(selected.filter((s) => s !== i));
    } else if (selected.length < 3) {
      setSelected([...selected, i]);
    }
  };

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold text-white">Interception Attempt</h3>
      <p className="text-sm text-gray-400">
        The opposing code master's clues:
      </p>

      <div className="flex items-center justify-center gap-2 py-2">
        {opponentClues.map((clue, i) => (
          <div key={i} className="bg-purple-900/40 border border-purple-700 rounded px-3 py-2 text-center">
            <div className="text-xs text-gray-500 mb-1">Clue #{i + 1}</div>
            <div className="text-purple-300 font-bold">{clue || "..."}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500">
        Which word positions do these clues refer to (in order)?
      </p>

      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((_, i) => {
          const isSelected = selected.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggleIndex(i)}
              disabled={disabled || submitted}
              className={`p-3 rounded-lg border-2 text-center font-medium transition-all ${
                isSelected
                  ? "bg-purple-700/50 border-purple-500 text-purple-200"
                  : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500"
              } ${(disabled || submitted) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="text-lg">Word #{i + 1}</div>
            </button>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Selected order: [{selected.map((s) => s + 1).join(", ")}]
      </div>

      {submitted ? (
        <div className="text-center text-purple-400 font-medium py-2 bg-purple-900/30 rounded">
          Interception Submitted!
        </div>
      ) : (
        <button
          onClick={() => onSubmit(selected)}
          disabled={disabled || selected.length !== 3}
          className="w-full btn-primary"
        >
          Submit Interception ({selected.length}/3)
        </button>
      )}
    </div>
  );
}
