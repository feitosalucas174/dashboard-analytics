// ─── Formatação de números, moeda e datas ──────────────────

/** Formata valor monetário em BRL */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

/** Abrevia números grandes: 1500 → 1.5K, 1500000 → 1.5M */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

/** Formata número com separadores pt-BR */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Formata percentual: -3.5 → "-3.50%" */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** ISO date → DD/MM/YYYY */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** ISO date → "Jan 2024" */
export function formatDateShort(iso: string): string {
  const [year, month] = iso.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[Number(month) - 1]} ${year}`;
}

/** Date → HH:MM:SS */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Valor do eixo Y para gráficos Recharts */
export function yAxisFormatter(value: number): string {
  return formatCompact(value);
}

/** Tooltip customizado — formata valor de acordo com magnitude */
export function tooltipValueFormatter(value: number): string {
  if (value >= 1_000) return formatCurrency(value);
  return formatNumber(value);
}
