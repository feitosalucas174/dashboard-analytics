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
  const endDate   = filters.endDate || new Date().toISOString().split('T')[0];
  const startDate = filters.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();
  return { startDate, endDate };
}

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

  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - periodDays);
  const prevStartStr = prevStart.toISOString().split('T')[0];
  const prevEndStr   = prevEnd.toISOString().split('T')[0];

  const hasCat = !!filters.category;
  const catCondition = hasCat ? 'AND c.name = $3' : '';

  const curParams  = hasCat ? [startDate, endDate, filters.category] : [startDate, endDate];
  const prevParams = hasCat ? [prevStartStr, prevEndStr, filters.category] : [prevStartStr, prevEndStr];

  const curResult = await pool.query(
    `SELECT
       COALESCE(SUM(m.value), 0) AS total,
       COALESCE(AVG(m.value), 0) AS avg_val,
       COALESCE(MAX(m.value), 0) AS max_val
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE m.date BETWEEN $1 AND $2
     ${catCondition}`,
    curParams
  );

  const prevResult = await pool.query(
    `SELECT COALESCE(SUM(m.value), 0) AS total
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE m.date BETWEEN $1 AND $2
     ${catCondition}`,
    prevParams
  );

  const cur      = curResult.rows[0];
  const prevTotal = Number(prevResult.rows[0]?.total ?? 0);
  const curTotal  = Number(cur?.total ?? 0);

  let variationPercent = 0;
  if (prevTotal > 0) {
    variationPercent = ((curTotal - prevTotal) / prevTotal) * 100;
  }

  return {
    total:               curTotal,
    daily_average:       Number(cur?.avg_val ?? 0),
    max_value:           Number(cur?.max_val ?? 0),
    variation_percent:   Math.round(variationPercent * 100) / 100,
    variation_direction: variationPercent > 0 ? 'up' : variationPercent < 0 ? 'down' : 'neutral',
    period_days:         periodDays,
  };
}

// ─── Timeline ──────────────────────────────────────────────

export async function getTimeline(filters: MetricFilters): Promise<TimelinePoint[]> {
  const { startDate, endDate } = defaultDates(filters);

  const hasCat = !!filters.category;
  const catCondition = hasCat ? 'AND c.name = $3' : '';
  const params: unknown[] = [startDate, endDate];
  if (hasCat) params.push(filters.category);

  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,
       c.name  AS category,
       c.color AS color,
       SUM(ds.total_value) AS total
     FROM daily_summary ds
     JOIN categories c ON c.id = ds.category_id
     WHERE ds.date BETWEEN $1 AND $2
     ${catCondition}
     GROUP BY ds.date, c.name, c.color
     ORDER BY ds.date ASC`,
    params
  );

  const map = new Map<string, TimelinePoint>();
  for (const row of rows) {
    if (!map.has(row.date)) map.set(row.date, { date: row.date });
    const point = map.get(row.date)!;
    point[row.category as string] = Number(row.total);
    point[`${row.category as string}_color`] = row.color as string;
  }
  return Array.from(map.values());
}

// ─── Distribuição por categoria ─────────────────────────────

export async function getCategoryDistribution(
  filters: MetricFilters
): Promise<CategoryDistribution[]> {
  const { startDate, endDate } = defaultDates(filters);

  const { rows } = await pool.query(
    `SELECT
       c.name  AS category,
       c.color AS color,
       SUM(m.value) AS total,
       COUNT(m.id)  AS count
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE m.date BETWEEN $1 AND $2
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
    count: Number(r.count),
  }));
}

// ─── Comparação entre categorias ───────────────────────────

export async function getComparison(
  filters: MetricFilters
): Promise<ComparisonPoint[]> {
  const { startDate, endDate } = defaultDates(filters);

  const { rows } = await pool.query(
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
     WHERE m.date BETWEEN $1 AND $2
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
  const { rows } = await pool.query(
    `SELECT
       m.date AS date,
       m.value,
       c.name AS category
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     ORDER BY m.date DESC, m.id DESC
     LIMIT 60`
  );

  const now = Date.now();
  return rows.map((r, i) => ({
    timestamp: new Date(now - (60 - i) * 60_000).toISOString(),
    value:     Number(r.value),
    category:  r.category as string,
  }));
}

// ─── Heatmap — total por dia (últimos 12 meses) ─────────────

export async function getHeatmap(): Promise<{ date: string; total: number }[]> {
  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(date, 'YYYY-MM-DD') AS date,
       SUM(total_value)            AS total
     FROM daily_summary
     WHERE date >= CURRENT_DATE - INTERVAL '1 year'
     GROUP BY date
     ORDER BY date ASC`
  );
  return rows.map((r) => ({
    date:  r.date  as string,
    total: Number(r.total),
  }));
}
