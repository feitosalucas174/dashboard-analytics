import {
  PieChart as RePieChart,
  Pie, Cell, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { CategoryDistribution } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PieChartProps {
  data: CategoryDistribution[];
}

function CustomTooltip({ active, payload }: {
  active?:  boolean;
  payload?: Array<{ payload: CategoryDistribution }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
        <span className="font-semibold text-gray-900 dark:text-white">{d.category}</span>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        Valor: <span className="font-semibold">{formatCurrency(d.total)}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        Participação: <span className="font-semibold">{d.percentage.toFixed(2)}%</span>
      </p>
    </div>
  );
}

// Label customizada com percentual dentro do gráfico
function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percentage,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percentage: number;
}) {
  if (percentage < 5) return null; // Oculta labels muito pequenas
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={700}
    >
      {`${percentage.toFixed(1)}%`}
    </text>
  );
}

export default function PieChart({ data }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          outerRadius={100}
          dataKey="total"
          labelLine={false}
          label={renderCustomLabel}
          animationBegin={0}
          animationDuration={600}
        >
          {data.map((entry) => (
            <Cell key={entry.category} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
          )}
        />
      </RePieChart>
    </ResponsiveContainer>
  );
}
