import { Download, FileText, FileSpreadsheet, CheckCircle, Info } from 'lucide-react';
import FilterBar    from '../components/filters/FilterBar';
import ExportPDF    from '../components/export/ExportPDF';
import ExportExcel  from '../components/export/ExportExcel';
import { useFilters } from '../hooks/useFilters';
import { useExport }  from '../hooks/useExport';
import { formatDate } from '../utils/formatters';

export default function Exportar() {
  const { filters, pendingFilters, applyFilters, clearFilters, setPreset, setDateRange, toggleCategory } = useFilters();
  const { exportToPDF, exportToExcel, status, toast } = useExport(filters);

  const fileName = `dashboard-${filters.startDate}-${filters.endDate}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <Download className="w-5 h-5 text-indigo-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Exportar Dados</h2>
      </div>

      {/* Filtros */}
      <FilterBar
        pending={pendingFilters}
        onPreset={setPreset}
        onDateChange={setDateRange}
        onToggleCat={toggleCategory}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* Info do arquivo */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-700 dark:text-indigo-300">
          <p>
            Exportando dados de{' '}
            <strong>{formatDate(filters.startDate)}</strong> a{' '}
            <strong>{formatDate(filters.endDate)}</strong>
            {filters.categories.length > 0 && (
              <> — categorias: <strong>{filters.categories.join(', ')}</strong></>
            )}
          </p>
          <p className="text-xs mt-1 text-indigo-500 dark:text-indigo-400">
            Arquivo: <code>{fileName}.pdf</code> / <code>{fileName}.xlsx</code>
          </p>
        </div>
      </div>

      {/* Cards de exportação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PDF */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Relatório PDF</h3>
              <p className="text-xs text-gray-400">Documento formatado para impressão</p>
            </div>
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {[
              'Cabeçalho com período selecionado',
              'Resumo de KPIs',
              'Distribuição por categoria',
              'Tabela de dados detalhados (até 200 linhas)',
              'Rodapé com paginação',
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <ExportPDF onClick={exportToPDF} loading={status === 'loading'} />
        </div>

        {/* Excel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Planilha Excel</h3>
              <p className="text-xs text-gray-400">Múltiplas abas para análise avançada</p>
            </div>
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {[
              'Aba "Resumo" com KPIs',
              'Aba "Por Categoria" com totais',
              'Aba "Timeline" para gráficos',
              'Aba "Comparação" entre categorias',
              'Aba "Dados Completos" com todos os registros',
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <ExportExcel onClick={exportToExcel} loading={status === 'loading'} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`
            fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
            animate-slide-up
            ${toast.type === 'success' ? 'bg-green-500 text-white'  : ''}
            ${toast.type === 'error'   ? 'bg-red-500 text-white'    : ''}
            ${toast.type === 'info'    ? 'bg-indigo-500 text-white' : ''}
          `}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
