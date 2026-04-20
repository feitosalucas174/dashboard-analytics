import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPIData } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface KPICardProps {
  title:    string;
  value:    string | number;
  subtitle?: string;
  icon:     React.ReactNode;
  color:    'indigo' | 'amber' | 'emerald' | 'red' | 'purple';
  loading:  boolean;
  // Apenas no card de variação
  variation?: Pick<KPIData, 'variation_percent' | 'variation_direction'>;
}

const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',  icon: 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',    icon: 'bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400'   },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20',icon: 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400' },
  red:     { bg: 'bg-red-50 dark:bg-red-900/20',        icon: 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400'           },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',  icon: 'bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400' },
};

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

export default function KPICard({
  title, value, subtitle, icon, color, loading, variation,
}: KPICardProps) {
  if (loading) return <SkeletonCard />;

  const colors = COLOR_MAP[color];

  const VariationIcon =
    variation?.variation_direction === 'up'   ? TrendingUp :
    variation?.variation_direction === 'down' ? TrendingDown : Minus;

  const varColor =
    variation?.variation_direction === 'up'   ? 'text-emerald-500' :
    variation?.variation_direction === 'down' ? 'text-red-500'     : 'text-gray-400';

  return (
    <div className={`rounded-xl p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
          {variation && (
            <div className={`flex items-center gap-1 text-xs font-medium ${varColor}`}>
              <VariationIcon className="w-3.5 h-3.5" />
              <span>{formatPercent(variation.variation_percent)} vs período anterior</span>
            </div>
          )}
        </div>

        <div className={`p-2.5 rounded-lg ${colors.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
