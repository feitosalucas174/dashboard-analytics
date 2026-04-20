// ============================================================
// Tipos do frontend — espelham os tipos do backend
// ============================================================

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface KPIData {
  total: number;
  daily_average: number;
  max_value: number;
  variation_percent: number;
  variation_direction: 'up' | 'down' | 'neutral';
  period_days: number;
}

export interface CategoryDistribution {
  category: string;
  color: string;
  total: number;
  percentage: number;
  count: number;
}

export interface TimelinePoint {
  date: string;
  [key: string]: number | string;
}

export interface ComparisonPoint {
  category: string;
  color: string;
  total: number;
  average: number;
  max: number;
  min: number;
  count: number;
}

export interface TableRow {
  id: number;
  date: string;
  category: string;
  category_color: string;
  metric_name: string;
  value: number;
  previous_value: number | null;
  variation_percent: number | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface TableResponse {
  success: boolean;
  data: TableRow[];
  pagination: PaginationMeta;
}

export interface ExportData {
  period: { startDate: string; endDate: string };
  kpis: KPIData;
  byCategory: CategoryDistribution[];
  timeline: TimelinePoint[];
  comparison: ComparisonPoint[];
  tableData: TableRow[];
}

// ─── Filtros da UI ──────────────────────────────────────────

export type DatePreset =
  | 'today'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'last3months'
  | 'thisYear'
  | 'custom';

export interface Filters {
  startDate: string;
  endDate:   string;
  categories: string[];
  preset:     DatePreset;
}

// ─── Estado de carregamento ─────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
}

// ─── Colunas da DataTable ───────────────────────────────────

export type SortOrder = 'ASC' | 'DESC';

export interface SortConfig {
  column:    string;
  direction: SortOrder;
}
