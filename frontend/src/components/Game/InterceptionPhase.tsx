import { useState } from "react";

interface Props {
  opponentClues: (string | null)[];
  onSubmit: (indices: number[]) => void;
  disabled: boolean;
  submitted: boolean;
  isTeamLeader: boolean;
  isCodeMaster: boolean;
  teamLeaderName?: string;
}

export default function InterceptionPhase({
  opponentClues,
  onSubmit,
  disabled,
  submitted,
  isTeamLeader,
  isCodeMaster,
  teamLeaderName,
}: Props) {
  const [selected, setSelected] = useState<(number | null)[]>([null, null, null]);

  const handleSelect = (clueIndex: number, wordIndex: number) => {
    if (submitted || disabled || !isTeamLeader) return;
    const next = [...selected];
    next[clueIndex] = wordIndex;
    setSelected(next);
  };

  const allSelected = selected.every((s) => s !== null);

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold text-white">Opponent's Interception</h3>

      <p className="text-sm text-gray-400 mb-2">Opposing code master's clues — which keyword positions do they refer to?</p>

      <div className="space-y-3">
        {opponentClues.map((clue, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="text-sm text-purple-400 font-semibold mb-1">
              Opponent Clue #{i + 1}: <span className="text-purple-300">{clue || "..."}</span>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((j) => (
                <button
                  key={j}
                  onClick={() => handleSelect(i, j)}
                  disabled={disabled || submitted || !isTeamLeader}
                  className={`flex-1 p-3 rounded-lg border-2 text-center text-lg font-bold transition-all ${
                    selected[i] === j
                      ? "bg-purple-700/50 border-purple-500 text-purple-200"
                      : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500"
                  } ${(disabled || submitted || !isTeamLeader) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {j + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isCodeMaster && (
        <div className="text-center text-gray-400 text-sm py-2 bg-gray-800/50 rounded">
          Waiting for your teammates to submit the interception...
        </div>
      )}

      {!isTeamLeader && !isCodeMaster && teamLeaderName && (
        <div className="text-center text-gray-400 text-sm py-2 bg-gray-800/50 rounded">
          Waiting for <span className="text-purple-400 font-medium">{teamLeaderName}</span> to submit the interception...
        </div>
      )}

      {submitted ? (
        <div className="text-center text-purple-400 font-medium py-2 bg-purple-900/30 rounded">
          Interception Submitted!
        </div>
      ) : isTeamLeader && (
        <button
          onClick={() => onSubmit(selected.filter((s) => s !== null) as number[])}
          disabled={disabled || !allSelected}
          className="w-full btn-primary"
        >
          Submit Interception ({selected.filter((s) => s !== null).length}/3)
        </button>
      )}
    </div>
  );
}