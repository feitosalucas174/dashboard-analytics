import { useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface FullscreenModalProps {
  title:    string;
  onClose:  () => void;
  children: React.ReactNode;
}

export default function FullscreenModal({ title, onClose, children }: FullscreenModalProps) {
  // Fecha com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Conteúdo — ocupa o espaço restante */}
      <div className="flex-1 p-6 overflow-auto">
        {children}
      </div>
      <p className="text-center text-xs text-gray-300 dark:text-gray-700 pb-2">
        Pressione <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono text-[10px]">ESC</kbd> para fechar
      </p>
    </div>
  );
}
