import type mysql from 'mysql2/promise';
import pool from '../database/connection';
import type { TableRow, PaginatedResponse, TableFilters, MetricFilters } from '../types';

// ─── Tabela paginada e ordenável ───────────────────────────

export async function getTableData(
  filters: TableFilters
): Promise<PaginatedResponse<TableRow>> {
  const endDate   = filters.endDate   || new Date().toISOString().split('T')[0];
  const startDate = filters.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const page    = Math.max(1, filters.page  ?? 1);
  const limit   = [10, 25, 50].includes(filters.limit ?? 10)
    ? (filters.limit ?? 10)
    : 10;
  const offset  = (page - 1) * limit;

  // Colunas permitidas para evitar SQL injection em ORDER BY
  const ALLOWED_SORT = ['date', 'category', 'metric_name', 'value'];
  const sortBy    = ALLOWED_SORT.includes(filters.sortBy ?? '') ? filters.sortBy! : 'date';
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const conditions: string[] = ['m.date BETWEEN ? AND ?'];
  const params: unknown[]    = [startDate, endDate];

  if (filters.category) {
    conditions.push('c.name = ?');
    params.push(filters.category);
  }

  if (filters.search) {
    conditions.push('(c.name LIKE ? OR m.metric_name LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const where = conditions.join(' AND ');

  // Total para paginação
  const [countRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM metrics m
     JOIN categories c ON c.id = m.category_id
     WHERE ${where}`,
    params
  );
  const total      = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.ceil(total / limit);

  // Dados paginados com LAG para variação vs dia anterior
  // LIMIT e OFFSET são interpolados diretamente pois são inteiros já validados —
  // o driver mysql2 com prepared statements rejeita números JS em LIMIT/OFFSET
  const orderCol = sortBy === 'category' ? 'c.name' : `m.${sortBy}`;
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       m.id,
       DATE_FORMAT(m.date, '%Y-%m-%d') AS date,
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
      id:               Number(r.id),
      date:             r.date as string,
      category:         r.category as string,
      category_color:   r.category_color as string,
      metric_name:      r.metric_name as string,
      value:            cur,
      previous_value:   prev,
      variation_percent: variation,
    };
  });

  return {
    data,
    pagination: { page, limit, total, total_pages: totalPages },
  };
}

// ─── Dados completos para exportação ───────────────────────

export async function getAllDataForExport(
  filters: MetricFilters
): Promise<TableRow[]> {
  const endDate   = filters.endDate   || new Date().toISOString().split('T')[0];
  const startDate = filters.startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const conditions: string[] = ['m.date BETWEEN ? AND ?'];
  const params: unknown[]    = [startDate, endDate];

  if (filters.category) {
    conditions.push('c.name = ?');
    params.push(filters.category);
  }

  const where = conditions.join(' AND ');

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       m.id,
       DATE_FORMAT(m.date, '%Y-%m-%d') AS date,
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
      id:               Number(r.id),
      date:             r.date as string,
      category:         r.category as string,
      category_color:   r.category_color as string,
      metric_name:      r.metric_name as string,
      value:            cur,
      previous_value:   prev,
      variation_percent: variation,
    };
  });
}
