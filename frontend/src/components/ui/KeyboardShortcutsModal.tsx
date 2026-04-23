import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUTS } from '../../hooks/useKeyboard';

interface Props { onClose: () => void }

export default function KeyboardShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Atalhos de Teclado</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys.join('+')} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-600 dark:text-gray-300">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4 text-xs text-center text-gray-400 dark:text-gray-600">
          Atalhos não funcionam quando o cursor está em campos de texto
        </div>
      </div>
    </div>
  );
}
