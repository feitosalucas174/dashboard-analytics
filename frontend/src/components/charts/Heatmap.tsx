import { useState } from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface HeatmapProps {
  data: { date: string; total: number }[];
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DAYS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// Gera grade de 53 semanas × 7 dias
function buildGrid(data: { date: string; total: number }[]) {
  const map = new Map(data.map((d) => [d.date, d.total]));

  // Começa do domingo da semana de 1 ano atrás
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 1);
  // Volta até o domingo anterior
  start.setDate(start.getDate() - start.getDay());

  const weeks: Array<Array<{ date: string; total: number; inRange: boolean }>> = [];
  let current = new Date(start);

  while (current <= today) {
    const week: Array<{ date: string; total: number; inRange: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const iso     = current.toISOString().split('T')[0];
      const inRange = current >= new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      week.push({ date: iso, total: map.get(iso) ?? 0, inRange: inRange && current <= today });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getIntensity(total: number, max: number): number {
  if (total === 0 || max === 0) return 0;
  const pct = total / max;
  if (pct < 0.15) return 1;
  if (pct < 0.40) return 2;
  if (pct < 0.70) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  'bg-gray-100 dark:bg-gray-800',           // 0 — vazio
  'bg-indigo-200 dark:bg-indigo-900',       // 1 — baixo
  'bg-indigo-400 dark:bg-indigo-700',       // 2 — médio-baixo
  'bg-indigo-600 dark:bg-indigo-500',       // 3 — médio-alto
  'bg-indigo-800 dark:bg-indigo-400',       // 4 — alto
];

export default function Heatmap({ data }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; total: number; x: number; y: number } | null>(null);

  const weeks = buildGrid(data);
  const max   = Math.max(...data.map((d) => d.total), 1);

  // Calcula rótulos dos meses
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, i) => {
    const firstDay = week.find((d) => d.inRange);
    if (!firstDay) return;
    const month = Number(firstDay.date.split('-')[1]) - 1;
    if (i === 0 || month !== Number(weeks[i - 1].find((d) => d.inRange)?.date.split('-')[1] ?? -2) - 1) {
      if (!monthLabels.find((m) => m.label === MONTHS[month])) {
        monthLabels.push({ label: MONTHS[month], col: i });
      }
    }
  });

  return (
    <div className="relative">
      {/* Rótulos de meses */}
      <div className="flex mb-1 pl-8">
        {weeks.map((_, i) => {
          const ml = monthLabels.find((m) => m.col === i);
          return (
            <div key={i} className="w-3 flex-shrink-0 mr-0.5">
              {ml && <span className="text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{ml.label}</span>}
            </div>
          );
        })}
      </div>

      <div className="flex gap-0.5">
        {/* Rótulos de dias */}
        <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0">
          {DAYS.map((d, i) => (
            <div key={d} className="h-3 flex items-center">
              {i % 2 === 1 && (
                <span className="text-[9px] text-gray-400 dark:text-gray-500 w-7 text-right">{d}</span>
              )}
            </div>
          ))}
        </div>

        {/* Grade */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((cell) => {
              const intensity = cell.inRange ? getIntensity(cell.total, max) : -1;
              return (
                <div
                  key={cell.date}
                  className={`w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125
                    ${intensity === -1
                      ? 'bg-transparent'
                      : INTENSITY_CLASSES[intensity]
                    }`}
                  onMouseEnter={(e) => {
                    if (!cell.inRange) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ date: cell.date, total: cell.total, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-gray-400">Menos</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-gray-400">Mais</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-xl"
          style={{ left: tooltip.x + 16, top: tooltip.y - 40 }}
        >
          <p className="font-semibold">{formatDate(tooltip.date)}</p>
          <p className="text-gray-300 dark:text-gray-600">
            {tooltip.total > 0 ? formatCurrency(tooltip.total) : 'Sem dados'}
          </p>
        </div>
      )}
    </div>
  );
}
