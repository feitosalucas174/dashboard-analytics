import { useState } from 'react';
import {
  DollarSign, TrendingUp, ArrowUpDown, Calendar,
} from 'lucide-react';
import FilterBar from '../components/filters/FilterBar';
import KPICard   from '../components/cards/KPICard';
import ChartCard from '../components/charts/ChartCard';
import LineChart from '../components/charts/LineChart';
import BarChart  from '../components/charts/BarChart';
import PieChart  from '../components/charts/PieChart';
import DataTable from '../components/table/DataTable';
import { useFilters }  from '../hooks/useFilters';
import { useMetrics }  from '../hooks/useMetrics';
import { formatCurrency, formatNumber } from '../utils/formatters';
import type { SortConfig } from '../types';

interface DashboardProps {
  onMetricsUpdate: (opts: { lastUpdated: string | null; loading: boolean; refetch: () => void }) => void;
}

export default function Dashboard({ onMetricsUpdate }: DashboardProps) {
  const { filters, pendingFilters, applyFilters, clearFilters, setPreset, setDateRange, toggleCategory } = useFilters();

  const [tablePage, setTablePage]   = useState(1);
  const [tableLimit, setTableLimit] = useState(10);
  const [tableSort, setTableSort]   = useState<SortConfig>({ column: 'date', direction: 'DESC' });
  const [tableSearch, setTableSearch] = useState('');

  const tableParams = {
    page:      tablePage,
    limit:     tableLimit,
    sortBy:    tableSort.column,
    sortOrder: tableSort.direction,
    search:    tableSearch,
  };

  const { kpis, timeline, distribution, comparison, table, loading, lastUpdated, refetch } =
    useMetrics(filters, tableParams);

  // Expõe estado para o Layout (Header)
  useState(() => {
    onMetricsUpdate({ lastUpdated, loading, refetch });
  });

  const handleSort = (col: string) => {
    setTableSort((prev) => ({
      column:    col,
      direction: prev.column === col && prev.direction === 'DESC' ? 'ASC' : 'DESC',
    }));
    setTablePage(1);
  };

  const handleSearch = (q: string) => {
    setTableSearch(q);
    setTablePage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filtros */}
      <FilterBar
        pending={pendingFilters}
        onPreset={setPreset}
        onDateChange={setDateRange}
        onToggleCat={toggleCategory}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Geral"
          value={kpis?.total ?? 0}
          subtitle={`Período de ${kpis?.period_days ?? 0} dias`}
          icon={<DollarSign className="w-5 h-5" />}
          color="indigo"
          loading={loading && !kpis}
        />
        <KPICard
          title="Média Diária"
          value={kpis?.daily_average ?? 0}
          subtitle="Por registro"
          icon={<Calendar className="w-5 h-5" />}
          color="amber"
          loading={loading && !kpis}
        />
        <KPICard
          title="Maior Valor"
          value={kpis?.max_value ?? 0}
          subtitle="Pico do período"
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          loading={loading && !kpis}
        />
        <KPICard
          title="Variação"
          value={kpis ? `${kpis.variation_percent > 0 ? '+' : ''}${kpis.variation_percent.toFixed(2)}%` : '—'}
          subtitle="vs período anterior"
          icon={<ArrowUpDown className="w-5 h-5" />}
          color={
            !kpis ? 'indigo' :
            kpis.variation_direction === 'up'   ? 'emerald' :
            kpis.variation_direction === 'down' ? 'red'     : 'indigo'
          }
          loading={loading && !kpis}
          variation={kpis ? {
            variation_percent:   kpis.variation_percent,
            variation_direction: kpis.variation_direction,
          } : undefined}
        />
      </div>

      {/* Gráficos — linha 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          title="Evolução Temporal"
          subtitle="Valores por categoria ao longo do período"
          loading={loading && !timeline}
          isEmpty={!loading && (timeline?.length ?? 0) === 0}
        >
          {timeline && <LineChart data={timeline} />}
        </ChartCard>

        <ChartCard
          title="Comparação entre Categorias"
          subtitle="Total acumulado no período"
          loading={loading && !comparison}
          isEmpty={!loading && (comparison?.length ?? 0) === 0}
        >
          {comparison && <BarChart data={comparison} />}
        </ChartCard>
      </div>

      {/* Gráficos — linha 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          title="Distribuição por Categoria"
          subtitle="Participação percentual no total"
          loading={loading && !distribution}
          isEmpty={!loading && (distribution?.length ?? 0) === 0}
        >
          {distribution && <PieChart data={distribution} />}
        </ChartCard>

        {/* Resumo rápido de categorias */}
        <ChartCard
          title="Resumo por Categoria"
          subtitle="Totais e participação"
          loading={loading && !distribution}
          isEmpty={!loading && (distribution?.length ?? 0) === 0}
        >
          {distribution && (
            <div className="space-y-2 pt-1">
              {distribution.map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">
                    {cat.category}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, background: cat.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white w-16 text-right">
                    {formatCurrency(cat.total)}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dados Detalhados</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Todos os registros com paginação e ordenação por coluna
          </p>
        </div>
        <DataTable
          data={table?.data ?? []}
          pagination={table?.pagination ?? { page: 1, limit: 10, total: 0, total_pages: 0 }}
          loading={loading && !table}
          onPageChange={setTablePage}
          onLimitChange={(l) => { setTableLimit(l); setTablePage(1); }}
          onSort={handleSort}
          onSearch={handleSearch}
          sort={tableSort}
          search={tableSearch}
        />
      </div>
    </div>
  );
}
