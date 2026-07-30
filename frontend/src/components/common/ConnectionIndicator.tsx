interface Props {
  connected: boolean;
}

export default function ConnectionIndicator({ connected }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      <span className={`text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
