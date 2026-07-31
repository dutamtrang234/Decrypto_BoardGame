import type { ChatMessage as ChatMessageType } from "../../types";

interface Props {
  message: ChatMessageType;
  isOwn: boolean;
  showTeamBadge?: boolean;
}

export default function ChatMessage({ message, isOwn, showTeamBadge }: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const team = (message as any).team;
  const isTeamMessage = message.target === "blue" || message.target === "red";

  const teamColor = showTeamBadge && team
    ? team === "blue" ? "text-blue-400" : "text-red-400"
    : "text-gray-400";

  const teamBorder = showTeamBadge && team
    ? team === "blue" ? "border-l-blue-500" : "border-l-red-500"
    : "";

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 border-l-4 ${
          isOwn ? "bg-blue-700/50" : "bg-gray-700/50"
        } ${showTeamBadge && team ? teamBorder : "border-l-transparent"}`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-medium ${teamColor}`}>
            {message.nickname}
          </span>
          {isTeamMessage && (
            <span className={`text-xs font-semibold ${
              message.target === "blue" ? "text-blue-400" : "text-red-400"
            }`}>
              [{message.target}]
            </span>
          )}
        </div>
        <p className="text-sm text-white whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
      <span className="text-xs text-gray-500 mt-0.5">{time}</span>
    </div>
  );
}