import axios from 'axios';
import type {
  KPIData,
  CategoryDistribution,
  TimelinePoint,
  ComparisonPoint,
  TableResponse,
  ExportData,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor de erros global ───────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message: string =
      (err.response?.data?.error as string) ||
      err.message ||
      'Erro de comunicação com o servidor';
    return Promise.reject(new Error(message));
  }
);

// ─── Params helper ─────────────────────────────────────────
interface BaseParams {
  startDate?: string;
  endDate?: string;
  category?: string;
}

// ─── Métricas ──────────────────────────────────────────────

export const metricsApi = {
  getKPIs: (params: BaseParams) =>
    api.get<{ success: boolean; data: KPIData }>('/api/metrics/kpis', { params })
       .then((r) => r.data.data),

  getTimeline: (params: BaseParams) =>
    api.get<{ success: boolean; data: TimelinePoint[] }>('/api/metrics/timeline', { params })
       .then((r) => r.data.data),

  getDistribution: (params: BaseParams) =>
    api.get<{ success: boolean; data: CategoryDistribution[] }>('/api/metrics/distribution', { params })
       .then((r) => r.data.data),

  getComparison: (params: BaseParams) =>
    api.get<{ success: boolean; data: ComparisonPoint[] }>('/api/metrics/comparison', { params })
       .then((r) => r.data.data),

  getRealtime: () =>
    api.get<{ success: boolean; data: unknown[]; timestamp: string }>('/api/metrics/realtime')
       .then((r) => r.data),

  getHeatmap: () =>
    api.get<{ success: boolean; data: { date: string; total: number }[] }>('/api/metrics/heatmap')
       .then((r) => r.data.data),
};

// ─── Relatórios ────────────────────────────────────────────

interface TableParams extends BaseParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export const reportsApi = {
  getTable: (params: TableParams) =>
    api.get<TableResponse>('/api/reports/table', { params }).then((r) => r.data),
};

// ─── Exportação ────────────────────────────────────────────

export const exportApi = {
  getPDFData: (params: BaseParams) =>
    api.get<{ success: boolean; data: ExportData }>('/api/export/pdf', { params })
       .then((r) => r.data.data),

  getExcelData: (params: BaseParams) =>
    api.get<{ success: boolean; data: ExportData }>('/api/export/excel', { params })
       .then((r) => r.data.data),
};

export default api;
