import {
  BarChart as ReBarChart,
  Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import type { ComparisonPoint } from '../../types';
import { yAxisFormatter, formatCurrency } from '../../utils/formatters';

interface BarChartProps {
  data: ComparisonPoint[];
}

function CustomTooltip({ active, payload }: {
  active?:  boolean;
  payload?: Array<{ payload: ComparisonPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 dark:text-white mb-2">{d.category}</p>
      <div className="space-y-1">
        <p className="text-gray-600 dark:text-gray-300">
          Total: <span className="font-semibold">{formatCurrency(d.total)}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Média: <span className="font-semibold">{formatCurrency(d.average)}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Máximo: <span className="font-semibold">{formatCurrency(d.max)}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Registros: <span className="font-semibold">{d.count.toLocaleString('pt-BR')}</span>
        </p>
      </div>
    </div>
  );
}

export default function BarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ReBarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
        />
        <YAxis
          tickFormatter={yAxisFormatter}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={60}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={entry.color} />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
