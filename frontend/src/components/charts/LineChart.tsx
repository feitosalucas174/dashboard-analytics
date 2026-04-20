import { useState } from 'react';
import {
  LineChart as ReLineChart,
  Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { TimelinePoint } from '../../types';
import { formatDate, yAxisFormatter, tooltipValueFormatter } from '../../utils/formatters';

interface LineChartProps {
  data: TimelinePoint[];
}

// Extrai categorias do primeiro ponto de dados
function getCategories(data: TimelinePoint[]) {
  if (data.length === 0) return [];
  return Object.keys(data[0]).filter(
    (k) => k !== 'date' && !k.endsWith('_color')
  );
}

function getColor(data: TimelinePoint[], category: string): string {
  const colorKey = `${category}_color`;
  const first = data.find((d) => d[colorKey]);
  return (first?.[colorKey] as string) ?? '#6366f1';
}

// Tooltip customizado
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?:  string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {label ? formatDate(label) : ''}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-600 dark:text-gray-300">{p.name}</span>
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {tooltipValueFormatter(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LineChart({ data }: LineChartProps) {
  const categories = getCategories(data);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggleLine = (cat: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // Amostragem para evitar gráfico muito denso (máx 90 pontos)
  const sampled = data.length > 90
    ? data.filter((_, i) => i % Math.ceil(data.length / 90) === 0)
    : data;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ReLineChart data={sampled} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => {
            const [, m, d] = String(v).split('-');
            return `${d}/${m}`;
          }}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={yAxisFormatter}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          onClick={(e) => toggleLine(e.dataKey as string)}
          formatter={(value) => (
            <span className={`text-xs cursor-pointer ${hidden.has(value) ? 'opacity-40' : ''}`}>
              {value}
            </span>
          )}
        />
        {categories.map((cat) => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            stroke={getColor(data, cat)}
            strokeWidth={2}
            dot={false}
            hide={hidden.has(cat)}
            activeDot={{ r: 4 }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
