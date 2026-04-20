import { useState } from 'react';
import { Menu, Sun, Moon, Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { useExport } from '../../hooks/useExport';
import type { Filters } from '../../types';

interface HeaderProps {
  onMenuClick: () => void;
  filters:     Filters;
  lastUpdated: string | null;
  loading:     boolean;
  onRefresh:   () => void;
  darkMode:    boolean;
  onToggleDark: () => void;
}

export default function Header({
  onMenuClick, filters, lastUpdated, loading, onRefresh, darkMode, onToggleDark,
}: HeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const { exportToPDF, exportToExcel, status, toast } = useExport(filters);

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        {/* Esquerda */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white hidden sm:block">
            Dashboard Analytics
          </h1>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-2">
          {/* Indicador de última atualização */}
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:block">
              Atualizado às {lastUpdated}
            </span>
          )}

          {/* Botão refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Atualizar dados"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle dark mode */}
          <button
            onClick={onToggleDark}
            title="Alternar tema"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Dropdown exportar */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => { exportToPDF(); setExportOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => { exportToExcel(); setExportOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-500" />
                    Exportar Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Toast notification */}
      {toast && (
        <div
          className={`
            fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
            animate-slide-up
            ${toast.type === 'success' ? 'bg-green-500 text-white'  : ''}
            ${toast.type === 'error'   ? 'bg-red-500 text-white'    : ''}
            ${toast.type === 'info'    ? 'bg-indigo-500 text-white' : ''}
          `}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
