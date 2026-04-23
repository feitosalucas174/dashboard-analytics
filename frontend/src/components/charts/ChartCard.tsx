import { useState } from 'react';
import { BarChart2, Maximize2 } from 'lucide-react';
import FullscreenModal from '../ui/FullscreenModal';

interface ChartCardProps {
  title:      string;
  subtitle?:  string;
  loading:    boolean;
  children:   React.ReactNode;
  isEmpty?:   boolean;
  expandable?: boolean;
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
      <BarChart2 className="w-12 h-12 mb-2 opacity-30" />
      <p className="text-sm">Nenhum dado para o período selecionado</p>
    </div>
  );
}

export default function ChartCard({
  title,
  subtitle,
  loading,
  children,
  isEmpty,
  expandable = true,
}: ChartCardProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        {!loading && (
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {expandable && !isEmpty && (
              <button
                onClick={() => setFullscreen(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex-shrink-0 ml-2"
                title="Expandir gráfico"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {loading  ? <ChartSkeleton /> :
         isEmpty  ? <EmptyState />   :
         children}
      </div>

      {fullscreen && (
        <FullscreenModal title={title} onClose={() => setFullscreen(false)}>
          {children}
        </FullscreenModal>
      )}
    </>
  );
}
