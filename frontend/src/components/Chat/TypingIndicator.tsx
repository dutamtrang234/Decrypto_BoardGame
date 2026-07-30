interface Props {
  users: Map<string, string>;
}

export default function TypingIndicator({ users }: Props) {
  if (users.size === 0) return null;

  const names = Array.from(users.values()).slice(0, 3);
  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.join(", ")} are typing...`;

  return (
    <div className="text-xs text-gray-400 italic px-3 py-1">
      {text}
    </div>
  );
}
