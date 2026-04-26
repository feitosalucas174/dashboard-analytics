import pool from '../database/connection';
import type { TableRow, PaginatedResponse, TableFilters, MetricFilters } from '../types';

// ─── Tabela paginada e ordenável ───────────────────────────

export async function getTableData(
  filters: TableFilters
): Promise<PaginatedResponse<TableRow>> {
  const endDate   = filters.endDate || new Date().toISOString().split('T')[0];
  const startDate = filters.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const page   = Math.max(1, filters.page ?? 1);
  const limit  = [10, 25, 50].includes(filters.limit ?? 10) ? (filters.limit ?? 10) : 10;
  const offset = (page - 1) * limit;

  const ALLOWED_SORT = ['date', 'category', 'metric_name', 'value'];
  const sortBy    = ALLOWED_SORT.includes(filters.sortBy ?? '') ? filters.sortBy! : 'date';
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const conditions: string[] = ['m.date BETWEEN $1 AND $2'];
  const params: unknown[]    = [startDate, endDate];
  let p = 2;

  if (filters.category) {
    conditions.push(`c.name = $${++p}`);
    params.push(filters.category);
  }

  if (filters.search) {
    conditions.push(`(c.name ILIKE $${++p} OR m.metric_name ILIKE $${p})`);
    params.push(`%${filters.search}%`);
  }

  const where    = conditions.join(' AND ');
  const orderCol = sortBy === 'category' ? 'c.name' : `m.${sortBy}`;

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE ${where}`,
    params
  );
  const total      = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = Math.ceil(total / limit);

  // LIMIT e OFFSET são inteiros validados — interpolados diretamente
  const { rows } = await pool.query(
    `SELECT
       m.id,
       TO_CHAR(m.date, 'YYYY-MM-DD') AS date,
       c.name  AS category,
       c.color AS category_color,
       m.metric_name,
       m.value,
       LAG(m.value) OVER (
         PARTITION BY m.category_id, m.metric_name
         ORDER BY m.date
       ) AS previous_value
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE ${where}
     ORDER BY ${orderCol} ${sortOrder}
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const data: TableRow[] = rows.map((r) => {
    const cur  = Number(r.value);
    const prev = r.previous_value !== null ? Number(r.previous_value) : null;
    let variation: number | null = null;
    if (prev !== null && prev > 0) {
      variation = Math.round(((cur - prev) / prev) * 10000) / 100;
    }
    return {
      id:                Number(r.id),
      date:              r.date            as string,
      category:          r.category        as string,
      category_color:    r.category_color  as string,
      metric_name:       r.metric_name     as string,
      value:             cur,
      previous_value:    prev,
      variation_percent: variation,
    };
  });

  return { data, pagination: { page, limit, total, total_pages: totalPages } };
}

// ─── Dados completos para exportação ───────────────────────

export async function getAllDataForExport(
  filters: MetricFilters
): Promise<TableRow[]> {
  const endDate   = filters.endDate || new Date().toISOString().split('T')[0];
  const startDate = filters.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const conditions: string[] = ['m.date BETWEEN $1 AND $2'];
  const params: unknown[]    = [startDate, endDate];

  if (filters.category) {
    conditions.push('c.name = $3');
    params.push(filters.category);
  }

  const where = conditions.join(' AND ');

  const { rows } = await pool.query(
    `SELECT
       m.id,
       TO_CHAR(m.date, 'YYYY-MM-DD') AS date,
       c.name  AS category,
       c.color AS category_color,
       m.metric_name,
       m.value,
       LAG(m.value) OVER (
         PARTITION BY m.category_id, m.metric_name
         ORDER BY m.date
       ) AS previous_value
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE ${where}
     ORDER BY m.date ASC, c.name ASC`,
    params
  );

  return rows.map((r) => {
    const cur  = Number(r.value);
    const prev = r.previous_value !== null ? Number(r.previous_value) : null;
    let variation: number | null = null;
    if (prev !== null && prev > 0) {
      variation = Math.round(((cur - prev) / prev) * 10000) / 100;
    }
    return {
      id:                Number(r.id),
      date:              r.date           as string,
      category:          r.category       as string,
      category_color:    r.category_color as string,
      metric_name:       r.metric_name    as string,
      value:             cur,
      previous_value:    prev,
      variation_percent: variation,
    };
  });
}
