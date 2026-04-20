import type { DatePreset, Filters } from '../../types';

interface DateRangePickerProps {
  pending:      Filters;
  onPreset:     (p: DatePreset) => void;
  onDateChange: (start: string, end: string) => void;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today',       label: 'Hoje'           },
  { value: 'last7',       label: 'Últimos 7 dias' },
  { value: 'last30',      label: 'Últimos 30 dias'},
  { value: 'thisMonth',   label: 'Este mês'       },
  { value: 'last3months', label: 'Últimos 3 meses'},
  { value: 'thisYear',    label: 'Este ano'       },
];

export default function DateRangePicker({ pending, onPreset, onDateChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPreset(p.value)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors
              ${pending.preset === p.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Inputs de datas */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={pending.startDate}
          onChange={(e) => onDateChange(e.target.value, pending.endDate)}
          className="px-2 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span className="text-xs text-gray-400">até</span>
        <input
          type="date"
          value={pending.endDate}
          min={pending.startDate}
          onChange={(e) => onDateChange(pending.startDate, e.target.value)}
          className="px-2 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
