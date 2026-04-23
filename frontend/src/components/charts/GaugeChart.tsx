import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface GaugeChartProps {
  value: number;   // 0–100 (percentual)
  color: string;
  size?: number;
}

export default function GaugeChart({ value, color, size = 150 }: GaugeChartProps) {
  const safe = Math.min(100, Math.max(0, value));

  // Background: arco cinza fixo em 100
  // Foreground: arco colorido no valor real
  const data = [{ value: 100, fill: 'var(--gauge-bg, #e5e7eb)' }];
  const fgData = [{ value: safe, fill: color }];

  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.33;
  const outerR = size * 0.47;
  // Só mostramos a metade superior → corte de altura
  const displayHeight = size * 0.58;

  return (
    <div
      className="relative flex justify-center overflow-hidden"
      style={{ height: displayHeight, width: size }}
    >
      {/* Arco de fundo */}
      <RadialBarChart
        width={size}
        height={size}
        cx={cx}
        cy={cy}
        innerRadius={innerR}
        outerRadius={outerR}
        startAngle={180}
        endAngle={0}
        data={data}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar dataKey="value" cornerRadius={6} />
      </RadialBarChart>

      {/* Arco de progresso */}
      <RadialBarChart
        width={size}
        height={size}
        cx={cx}
        cy={cy}
        innerRadius={innerR}
        outerRadius={outerR}
        startAngle={180}
        endAngle={0}
        data={fgData}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar dataKey="value" cornerRadius={6} />
      </RadialBarChart>

      {/* Percentual centralizado na base */}
      <div
        className="absolute flex items-end justify-center"
        style={{ bottom: 2, left: 0, right: 0 }}
      >
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {safe.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
