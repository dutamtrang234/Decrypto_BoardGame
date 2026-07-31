import type { GameState, Team } from "../../types";

interface Props {
  gameState: GameState;
  playerTeam: Team | null;
}

function getWordClues(clues: string[], clueOrder: number[]): (string | null)[] {
  const result: (string | null)[] = [null, null, null, null];
  for (let i = 0; i < clueOrder.length; i++) {
    result[clueOrder[i]] = clues[i] || null;
  }
  return result;
}

function TeamHistoryTable({ label, teamColor, records }: {
  label: string;
  teamColor: string;
  records: { round: number; clues: string[]; clueOrder: number[]; guessCorrect: boolean; interceptionCorrect: boolean }[];
}) {
  if (records.length === 0) return null;
  return (
    <div className="card overflow-x-auto flex-1">
      <h3 className={`text-sm font-semibold ${teamColor} mb-3`}>{label} Clue History</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase">
            <th className="text-left py-1 pr-2">Rd</th>
            <th className="py-1 px-1 text-center">#1</th>
            <th className="py-1 px-1 text-center">#2</th>
            <th className="py-1 px-1 text-center">#3</th>
            <th className="py-1 px-1 text-center">#4</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const wordClues = getWordClues(record.clues || [], record.clueOrder || []);
            return (
              <tr key={record.round} className="border-t border-gray-700">
                <td className="py-2 pr-2 text-gray-400 font-mono text-xs">{record.round}</td>
                {wordClues.map((clue, wi) => (
                  <td key={wi} className="py-2 px-1 text-center">
                    <span className="text-gray-300 text-xs block mx-auto whitespace-normal break-words min-w-[80px] max-w-[160px]">
                      {clue || "-"}
                    </span>
                  </td>
                ))}
                <td className="py-2 pl-1 text-[10px] whitespace-nowrap">
                  {record.guessCorrect ? (
                    <span className="text-green-500">G✓</span>
                  ) : (
                    <span className="text-red-500">G✗</span>
                  )}
                  {record.interceptionCorrect ? (
                    <span className="text-green-500 ml-0.5">I✓</span>
                  ) : (
                    <span className="text-red-500 ml-0.5">I✗</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RoundHistory({ gameState, playerTeam }: Props) {
  if (gameState.history.length === 0) return null;

  const ownKey = playerTeam === "blue" ? "blue" : "red";
  const oppKey = playerTeam === "blue" ? "red" : "blue";

  const ownRecords = gameState.history.map((r) => ({
    round: r.round,
    clues: ownKey === "blue" ? r.blueClues : r.redClues,
    clueOrder: ownKey === "blue" ? r.blueClueOrder : r.redClueOrder,
    guessCorrect: ownKey === "blue" ? r.blueGuessCorrect : r.redGuessCorrect,
    interceptionCorrect: ownKey === "blue" ? r.blueInterceptionCorrect : r.redInterceptionCorrect,
  }));

  const oppRecords = gameState.history.map((r) => ({
    round: r.round,
    clues: oppKey === "blue" ? r.blueClues : r.redClues,
    clueOrder: oppKey === "blue" ? r.blueClueOrder : r.redClueOrder,
    guessCorrect: oppKey === "blue" ? r.blueGuessCorrect : r.redGuessCorrect,
    interceptionCorrect: oppKey === "blue" ? r.blueInterceptionCorrect : r.redInterceptionCorrect,
  }));

  return (
    <div className="flex gap-4">
      <TeamHistoryTable
        label={playerTeam === "blue" ? "Blue" : "Red"}
        teamColor={playerTeam === "blue" ? "text-blue-400" : "text-red-400"}
        records={ownRecords}
      />
      <TeamHistoryTable
        label={playerTeam === "blue" ? "Red" : "Blue"}
        teamColor={playerTeam === "blue" ? "text-red-400" : "text-blue-400"}
        records={oppRecords}
      />
    </div>
  );
}