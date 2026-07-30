import type { ReactNode } from "react";
import { useSocket } from "../context/SocketContext";
import ConnectionIndicator from "./common/ConnectionIndicator";

export default function Layout({ children }: { children: ReactNode }) {
  const { connected } = useSocket();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
            Decrypto
          </a>
        </div>
        <ConnectionIndicator connected={connected} />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
