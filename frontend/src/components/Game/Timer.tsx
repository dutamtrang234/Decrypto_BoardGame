import { useState, useEffect } from "react";
import type { GamePhase } from "../../types";

interface Props {
  timerEndsAt: number | null;
  phase: GamePhase;
}

export default function Timer({ timerEndsAt, phase }: Props) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!timerEndsAt) return;

    const update = () => {
      const diff = Math.max(0, Math.floor((timerEndsAt - Date.now()) / 1000));
      setRemaining(diff);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerEndsAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= 30;

  return (
    <div className="card flex items-center gap-3">
      <div
        className={`text-2xl font-mono font-bold ${
          isUrgent ? "text-red-400 animate-pulse" : "text-white"
        }`}
      >
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
      <div className="text-xs text-gray-500 capitalize">{phase} phase</div>
    </div>
  );
}
