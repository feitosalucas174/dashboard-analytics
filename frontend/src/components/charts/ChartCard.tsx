import { BarChart2 } from 'lucide-react';

interface ChartCardProps {
  title:    string;
  subtitle?: string;
  loading:  boolean;
  children: React.ReactNode;
  isEmpty?: boolean;
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

export default function ChartCard({ title, subtitle, loading, children, isEmpty }: ChartCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      {!loading && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      {loading  ? <ChartSkeleton /> :
       isEmpty  ? <EmptyState />   :
       children}
    </div>
  );
}
