import { useState } from 'react';
import { FileText } from 'lucide-react';
import FilterBar from '../components/filters/FilterBar';
import ChartCard from '../components/charts/ChartCard';
import LineChart  from '../components/charts/LineChart';
import BarChart   from '../components/charts/BarChart';
import PieChart   from '../components/charts/PieChart';
import DataTable  from '../components/table/DataTable';
import { useFilters }  from '../hooks/useFilters';
import { useMetrics }  from '../hooks/useMetrics';
import type { SortConfig } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Relatorios() {
  const { filters, pendingFilters, applyFilters, clearFilters, setPreset, setDateRange, toggleCategory } = useFilters();

  const [tablePage, setTablePage]   = useState(1);
  const [tableLimit, setTableLimit] = useState(25);
  const [tableSort, setTableSort]   = useState<SortConfig>({ column: 'date', direction: 'DESC' });
  const [tableSearch, setTableSearch] = useState('');

  const tableParams = {
    page:      tablePage,
    limit:     tableLimit,
    sortBy:    tableSort.column,
    sortOrder: tableSort.direction,
    search:    tableSearch,
  };

  const { kpis, timeline, distribution, comparison, table, loading } =
    useMetrics(filters, tableParams);

  const handleSort = (col: string) => {
    setTableSort((prev) => ({
      column:    col,
      direction: prev.column === col && prev.direction === 'DESC' ? 'ASC' : 'DESC',
    }));
    setTablePage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-indigo-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Relatórios Detalhados</h2>
      </div>

      <FilterBar
        pending={pendingFilters}
        onPreset={setPreset}
        onDateChange={setDateRange}
        onToggleCat={toggleCategory}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* Resumo do período */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total do Período', value: formatCurrency(kpis.total)         },
            { label: 'Média Diária',     value: formatCurrency(kpis.daily_average) },
            { label: 'Maior Registro',   value: formatCurrency(kpis.max_value)     },
            { label: 'Período',          value: `${formatDate(filters.startDate)} — ${formatDate(filters.endDate)}` },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráficos em grade 3 colunas no desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Evolução Temporal"
          loading={loading && !timeline}
          isEmpty={!loading && (timeline?.length ?? 0) === 0}
        >
          {timeline && <LineChart data={timeline} />}
        </ChartCard>

        <ChartCard
          title="Comparação por Categoria"
          loading={loading && !comparison}
          isEmpty={!loading && (comparison?.length ?? 0) === 0}
        >
          {comparison && <BarChart data={comparison} />}
        </ChartCard>

        <ChartCard
          title="Distribuição"
          loading={loading && !distribution}
          isEmpty={!loading && (distribution?.length ?? 0) === 0}
        >
          {distribution && <PieChart data={distribution} />}
        </ChartCard>
      </div>

      {/* Tabela com mais linhas por página */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dados Completos</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {table?.pagination.total.toLocaleString('pt-BR') ?? '...'} registros encontrados
          </p>
        </div>
        <DataTable
          data={table?.data ?? []}
          pagination={table?.pagination ?? { page: 1, limit: 25, total: 0, total_pages: 0 }}
          loading={loading && !table}
          onPageChange={setTablePage}
          onLimitChange={(l) => { setTableLimit(l); setTablePage(1); }}
          onSort={handleSort}
          onSearch={(q) => { setTableSearch(q); setTablePage(1); }}
          sort={tableSort}
          search={tableSearch}
        />
      </div>
    </div>
  );
}
