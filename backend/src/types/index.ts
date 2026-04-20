// ============================================================
// Tipos compartilhados entre backend e frontend (via API)
// ============================================================

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Metric {
  id: number;
  category: string;
  category_color: string;
  metric_name: string;
  value: number;
  date: string;
  created_at: string;
}

export interface DailySummary {
  id: number;
  date: string;
  total_value: number;
  total_count: number;
  category_id: number;
  category_name: string;
  category_color: string;
  created_at: string;
}

// KPIs retornados pelo endpoint /api/metrics/kpis
export interface KPIData {
  total: number;
  daily_average: number;
  max_value: number;
  variation_percent: number;
  variation_direction: 'up' | 'down' | 'neutral';
  period_days: number;
}

// Dado para gráfico de pizza/distribuição
export interface CategoryDistribution {
  category: string;
  color: string;
  total: number;
  percentage: number;
  count: number;
}

// Dado para gráfico de linha (timeline)
export interface TimelinePoint {
  date: string;
  [category: string]: number | string;
}

// Dado para gráfico de barras (comparação)
export interface ComparisonPoint {
  category: string;
  color: string;
  total: number;
  average: number;
  max: number;
  min: number;
  count: number;
}

// Linha da tabela detalhada
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

// Resposta paginada para a tabela
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Dados simulados de tempo real
export interface RealtimePoint {
  timestamp: string;
  value: number;
  category: string;
}

// Filtros de query params
export interface MetricFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
}

export interface TableFilters extends MetricFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

// Estrutura de dados para exportação
export interface ExportData {
  period: { startDate: string; endDate: string };
  kpis: KPIData;
  byCategory: CategoryDistribution[];
  timeline: TimelinePoint[];
  comparison: ComparisonPoint[];
  tableData: TableRow[];
}
