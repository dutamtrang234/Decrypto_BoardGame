import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        {title && (
          <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
