import { Filter, X } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import CategoryFilter from './CategoryFilter';
import type { Filters, DatePreset } from '../../types';

interface FilterBarProps {
  pending:      Filters;
  onPreset:     (p: DatePreset) => void;
  onDateChange: (start: string, end: string) => void;
  onToggleCat:  (cat: string) => void;
  onApply:      () => void;
  onClear:      () => void;
}

export default function FilterBar({
  pending, onPreset, onDateChange, onToggleCat, onApply, onClear,
}: FilterBarProps) {
  const hasFilters =
    pending.categories.length > 0 || pending.preset !== 'last30';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:flex-wrap">

        {/* Período */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Período
          </label>
          <DateRangePicker
            pending={pending}
            onPreset={onPreset}
            onDateChange={onDateChange}
          />
        </div>

        {/* Separador */}
        <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-800" />

        {/* Categorias */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Categorias
            <span className="ml-1 text-gray-400">(todas se vazio)</span>
          </label>
          <CategoryFilter selected={pending.categories} onToggle={onToggleCat} />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 md:ml-auto">
          {hasFilters && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
          <button
            onClick={onApply}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
