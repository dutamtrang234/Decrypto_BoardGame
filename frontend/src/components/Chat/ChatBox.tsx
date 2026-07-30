import { useState, useRef, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import type { Team } from "../../types";

interface Props {
  teamChat?: boolean;
}

export default function ChatBox({ teamChat }: Props) {
  const { messages, playerId, sendMessage, sendTyping, typingUsers, roomData } = useSocket();
  const [input, setInput] = useState("");
  const [chatTarget, setChatTarget] = useState<"all" | Team>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const player = roomData?.players.find((p) => p.id === playerId);

  const filteredMessages = teamChat && player
    ? messages.filter((m) => m.target === player.team || m.target === "all")
    : messages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim(), teamChat ? player?.team : chatTarget);
    setInput("");
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(false), 2000);
  };

  return (
    <div className="card flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-300 mb-2">
        {teamChat ? "Team Chat" : "Chat"}
      </h3>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">
        {filteredMessages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isOwn={msg.playerId === playerId}
          />
        ))}
      </div>

      <TypingIndicator users={typingUsers} />

      <form onSubmit={handleSubmit} className="flex gap-2">
        {!teamChat && player && (
          <select
            value={chatTarget}
            onChange={(e) => setChatTarget(e.target.value as "all" | Team)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
          >
            <option value="all">All</option>
            {player.team && <option value={player.team}>{player.team} team</option>}
          </select>
        )}
        <input
          type="text"
          value={input}
          onChange={handleInput}
          onBlur={() => sendTyping(false)}
          placeholder="Type a message..."
          className="flex-1 text-sm"
          maxLength={500}
        />
        <button type="submit" className="btn-primary text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
