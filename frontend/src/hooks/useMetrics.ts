import { useState, useEffect, useCallback, useRef } from 'react';
import { metricsApi, reportsApi } from '../services/api';
import type {
  KPIData,
  TimelinePoint,
  CategoryDistribution,
  ComparisonPoint,
  TableResponse,
  Filters,
} from '../types';
import { formatTime } from '../utils/formatters';

interface MetricsState {
  kpis:         KPIData              | null;
  timeline:     TimelinePoint[]      | null;
  distribution: CategoryDistribution[] | null;
  comparison:   ComparisonPoint[]    | null;
  table:        TableResponse        | null;
  loading:      boolean;
  error:        string | null;
  lastUpdated:  string | null;
}

interface TableParams {
  page:      number;
  limit:     number;
  sortBy:    string;
  sortOrder: 'ASC' | 'DESC';
  search:    string;
}

const REFRESH_INTERVAL = 30_000;

export function useMetrics(filters: Filters, tableParams: TableParams) {
  const [state, setState] = useState<MetricsState>({
    kpis: null, timeline: null, distribution: null,
    comparison: null, table: null,
    loading: true, error: null, lastUpdated: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const params = {
      startDate: filters.startDate,
      endDate:   filters.endDate,
      category:  filters.categories.length > 0 ? filters.categories.join(',') : undefined,
    };

    try {
      // Busca gráficos e tabela em paralelo, mas isola o erro da tabela
      // para não cancelar KPIs/gráficos caso ela falhe
      const [kpis, timeline, distribution, comparison, tableResult] = await Promise.all([
        metricsApi.getKPIs(params),
        metricsApi.getTimeline(params),
        metricsApi.getDistribution(params),
        metricsApi.getComparison(params),
        reportsApi.getTable({
          ...params,
          page:      tableParams.page,
          limit:     tableParams.limit,
          sortBy:    tableParams.sortBy,
          sortOrder: tableParams.sortOrder,
          search:    tableParams.search || undefined,
        }).catch(() => null),   // falha na tabela não derruba o restante
      ]);

      setState({
        kpis, timeline, distribution, comparison,
        table:       tableResult,
        loading:     false,
        error:       null,
        lastUpdated: formatTime(new Date()),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:   err instanceof Error ? err.message : 'Erro desconhecido',
      }));
    }
  }, [filters, tableParams]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return { ...state, refetch: fetchAll };
}
