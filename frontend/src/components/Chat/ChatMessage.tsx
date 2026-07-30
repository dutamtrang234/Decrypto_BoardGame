import type { ChatMessage as ChatMessageType } from "../../types";

interface Props {
  message: ChatMessageType;
  isOwn: boolean;
}

export default function ChatMessage({ message, isOwn }: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const teamColor =
    message.target === "blue"
      ? "text-blue-400"
      : message.target === "red"
        ? "text-red-400"
        : "text-gray-400";

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isOwn ? "bg-blue-700/50" : "bg-gray-700/50"
        }`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-medium ${teamColor}`}>
            {message.nickname}
          </span>
          {message.target !== "all" && (
            <span className="text-xs text-gray-500">(team)</span>
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
