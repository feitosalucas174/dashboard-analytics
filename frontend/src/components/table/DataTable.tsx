import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import type { TableRow, PaginationMeta, SortConfig } from '../../types';
import { formatDate, formatCurrency, formatPercent } from '../../utils/formatters';

interface DataTableProps {
  data:       TableRow[];
  pagination: PaginationMeta;
  loading:    boolean;
  onPageChange:  (page: number)  => void;
  onLimitChange: (limit: number) => void;
  onSort:        (col: string)   => void;
  onSearch:      (q: string)     => void;
  sort:       SortConfig;
  search:     string;
}

function SortIcon({ column, sort }: { column: string; sort: SortConfig }) {
  if (sort.column !== column) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />;
  return sort.direction === 'ASC'
    ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
    : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />;
}

const COLUMNS: Array<{ key: string; label: string; align?: 'right' }> = [
  { key: 'date',        label: 'Data'          },
  { key: 'category',    label: 'Categoria'     },
  { key: 'metric_name', label: 'Métrica'       },
  { key: 'value',       label: 'Valor',   align: 'right' },
  { key: 'variation',   label: 'Variação',align: 'right' },
];

export default function DataTable({
  data, pagination, loading, onPageChange, onLimitChange,
  onSort, onSearch, sort, search,
}: DataTableProps) {
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearch = (q: string) => {
    setLocalSearch(q);
    onSearch(q);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Busca + Limite */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>Linhas:</span>
          {[10, 25, 50].map((n) => (
            <button
              key={n}
              onClick={() => onLimitChange(n)}
              className={`px-2 py-0.5 rounded ${
                pagination.limit === n
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'variation' && onSort(col.key)}
                  className={`px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.key !== 'variation' ? 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-white' : ''}
                  `}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.label}
                    {col.key !== 'variation' && <SortIcon column={col.key} sort={sort} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800 animate-pulse">
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="px-4 py-2.5">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600">
                  Nenhum dado encontrado
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isNegative = row.variation_percent !== null && row.variation_percent < 0;
                return (
                  <tr
                    key={row.id}
                    className={`border-t border-gray-100 dark:border-gray-800 transition-colors
                      hover:bg-gray-50 dark:hover:bg-gray-800/40
                      ${isNegative ? 'bg-red-50/40 dark:bg-red-900/10' : ''}
                    `}
                  >
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.category_color }} />
                        <span className="text-gray-700 dark:text-gray-300">{row.category}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">
                      {row.metric_name}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(row.value)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-medium whitespace-nowrap
                      ${row.variation_percent === null          ? 'text-gray-400' :
                        row.variation_percent > 0  ? 'text-emerald-600 dark:text-emerald-400' :
                        row.variation_percent < 0  ? 'text-red-600 dark:text-red-400'         :
                        'text-gray-400'
                      }`}
                    >
                      {row.variation_percent !== null
                        ? formatPercent(row.variation_percent)
                        : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {pagination.total > 0 &&
            `${((pagination.page - 1) * pagination.limit) + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total.toLocaleString('pt-BR')}`
          }
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1}
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            «
          </button>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            ‹
          </button>

          {/* Páginas ao redor da atual */}
          {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
            const start = Math.max(1, Math.min(
              pagination.page - 2,
              pagination.total_pages - 4
            ));
            return start + i;
          }).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-2.5 py-1 rounded ${
                p === pagination.page
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages}
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            ›
          </button>
          <button
            onClick={() => onPageChange(pagination.total_pages)}
            disabled={pagination.page >= pagination.total_pages}
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
