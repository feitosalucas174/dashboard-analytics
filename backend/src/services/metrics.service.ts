import type mysql from 'mysql2/promise';
import pool from '../database/connection';
import type {
  KPIData,
  TimelinePoint,
  CategoryDistribution,
  ComparisonPoint,
  RealtimePoint,
  MetricFilters,
} from '../types';

// ─── Helpers ───────────────────────────────────────────────

function defaultDates(filters: MetricFilters) {
  const endDate   = filters.endDate   || new Date().toISOString().split('T')[0];
  const startDate = filters.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();
  return { startDate, endDate };
}

// Calcula dias entre duas datas ISO
function daysBetween(a: string, b: string): number {
  return Math.max(
    1,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
  );
}

// ─── KPIs ──────────────────────────────────────────────────

export async function getKPIs(filters: MetricFilters): Promise<KPIData> {
  const { startDate, endDate } = defaultDates(filters);
  const periodDays = daysBetween(startDate, endDate);

  // Data do período anterior (mesma duração)
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - periodDays);
  const prevStartStr = prevStart.toISOString().split('T')[0];
  const prevEndStr   = prevEnd.toISOString().split('T')[0];

  const categoryCondition = filters.category
    ? 'AND c.name = ?'
    : '';
  const params = filters.category
    ? [startDate, endDate, filters.category]
    : [startDate, endDate];
  const prevParams = filters.category
    ? [prevStartStr, prevEndStr, filters.category]
    : [prevStartStr, prevEndStr];

  // Período atual
  const [currentRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       COALESCE(SUM(m.value), 0) AS total,
       COALESCE(AVG(m.value), 0) AS avg_val,
       COALESCE(MAX(m.value), 0) AS max_val
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE m.date BETWEEN ? AND ?
     ${categoryCondition}`,
    params
  );

  // Período anterior (para variação %)
  const [prevRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COALESCE(SUM(m.value), 0) AS total
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE m.date BETWEEN ? AND ?
     ${categoryCondition}`,
    prevParams
  );

  const current = currentRows[0];
  const prevTotal = Number(prevRows[0]?.total ?? 0);
  const curTotal  = Number(current?.total ?? 0);

  let variationPercent = 0;
  if (prevTotal > 0) {
    variationPercent = ((curTotal - prevTotal) / prevTotal) * 100;
  }

  return {
    total:               curTotal,
    daily_average:       Number(current?.avg_val ?? 0),
    max_value:           Number(current?.max_val ?? 0),
    variation_percent:   Math.round(variationPercent * 100) / 100,
    variation_direction: variationPercent > 0 ? 'up' : variationPercent < 0 ? 'down' : 'neutral',
    period_days:         periodDays,
  };
}

// ─── Timeline (gráfico de linhas) ──────────────────────────

export async function getTimeline(filters: MetricFilters): Promise<TimelinePoint[]> {
  const { startDate, endDate } = defaultDates(filters);

  const categoryCondition = filters.category ? 'AND c.name = ?' : '';
  const params: unknown[] = [startDate, endDate];
  if (filters.category) params.push(filters.category);

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       DATE_FORMAT(ds.date, '%Y-%m-%d') AS date,
       c.name  AS category,
       c.color AS color,
       SUM(ds.total_value) AS total
     FROM daily_summary ds
     JOIN categories c ON c.id = ds.category_id
     WHERE ds.date BETWEEN ? AND ?
     ${categoryCondition}
     GROUP BY ds.date, c.name, c.color
     ORDER BY ds.date ASC`,
    params
  );

  // Pivota: { date, Vendas: 123, Marketing: 456, ... }
  const map = new Map<string, TimelinePoint>();
  for (const row of rows) {
    if (!map.has(row.date)) {
      map.set(row.date, { date: row.date });
    }
    const point = map.get(row.date)!;
    point[row.category as string] = Number(row.total);
    point[`${row.category as string}_color`] = row.color as string;
  }
  return Array.from(map.values());
}

// ─── Distribuição por categoria (gráfico de pizza) ─────────

export async function getCategoryDistribution(
  filters: MetricFilters
): Promise<CategoryDistribution[]> {
  const { startDate, endDate } = defaultDates(filters);

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       c.name  AS category,
       c.color AS color,
       SUM(m.value) AS total,
       COUNT(m.id)  AS count
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE m.date BETWEEN ? AND ?
     GROUP BY c.name, c.color
     ORDER BY total DESC`,
    [startDate, endDate]
  );

  const grandTotal = rows.reduce((acc, r) => acc + Number(r.total), 0);

  return rows.map((r) => ({
    category:   r.category as string,
    color:      r.color    as string,
    total:      Number(r.total),
    percentage: grandTotal > 0
      ? Math.round((Number(r.total) / grandTotal) * 10000) / 100
      : 0,
    count:      Number(r.count),
  }));
}

// ─── Comparação entre categorias (gráfico de barras) ───────

export async function getComparison(
  filters: MetricFilters
): Promise<ComparisonPoint[]> {
  const { startDate, endDate } = defaultDates(filters);

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       c.name  AS category,
       c.color AS color,
       SUM(m.value) AS total,
       AVG(m.value) AS average,
       MAX(m.value) AS max_val,
       MIN(m.value) AS min_val,
       COUNT(m.id)  AS count
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE m.date BETWEEN ? AND ?
     GROUP BY c.name, c.color
     ORDER BY total DESC`,
    [startDate, endDate]
  );

  return rows.map((r) => ({
    category: r.category as string,
    color:    r.color    as string,
    total:    Number(r.total),
    average:  Math.round(Number(r.average) * 100) / 100,
    max:      Number(r.max_val),
    min:      Number(r.min_val),
    count:    Number(r.count),
  }));
}

// ─── Dados de tempo real simulados ─────────────────────────

export async function getRealtimeData(): Promise<RealtimePoint[]> {
  // Busca os últimos 60 registros do banco (simula 60 minutos)
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       m.date AS date,
       m.value,
       c.name AS category
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     ORDER BY m.date DESC, m.id DESC
     LIMIT 60`
  );

  // Adiciona timestamps simulados retroativos (de 60 em 60 segundos)
  const now = Date.now();
  return rows.map((r, i) => ({
    timestamp: new Date(now - (60 - i) * 60_000).toISOString(),
    value:     Number(r.value),
    category:  r.category as string,
  }));
}

// ─── Heatmap — total por dia (últimos 12 meses) ─────────────

export async function getHeatmap(): Promise<{ date: string; total: number }[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       DATE_FORMAT(date, '%Y-%m-%d') AS date,
       SUM(total_value)              AS total
     FROM daily_summary
     WHERE date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
     GROUP BY date
     ORDER BY date ASC`
  );
  return rows.map((r) => ({
    date:  r.date  as string,
    total: Number(r.total),
  }));
}

