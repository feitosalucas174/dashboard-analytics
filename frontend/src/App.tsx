import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout       from './components/layout/Layout';
import Dashboard    from './pages/Dashboard';
import Relatorios   from './pages/Relatorios';
import Exportar     from './pages/Exportar';
import Lancamentos  from './pages/Lancamentos';
import type { Filters } from './types';

// Filtro padrão — últimos 30 dias, todas as categorias
const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const DEFAULT_FILTERS: Filters = {
  startDate:  daysAgo(30),
  endDate:    today(),
  categories: [],
  preset:     'last30',
};

export default function App() {
  // Tema escuro como padrão — persiste no localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Estado compartilhado do header (atualizado pelo Dashboard)
  const [lastUpdated, setLastUpdated]   = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [refetch, setRefetch]           = useState<() => void>(() => () => undefined);

  const handleMetricsUpdate = useCallback((opts: {
    lastUpdated: string | null;
    loading:     boolean;
    refetch:     () => void;
  }) => {
    setLastUpdated(opts.lastUpdated);
    setMetricsLoading(opts.loading);
    setRefetch(() => opts.refetch);
  }, []);

  // Filtros do Layout são meramente para passar ao Header para exportação
  const [layoutFilters] = useState<Filters>(DEFAULT_FILTERS);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <Layout
              filters={layoutFilters}
              lastUpdated={lastUpdated}
              loading={metricsLoading}
              onRefresh={refetch}
              darkMode={darkMode}
              onToggleDark={() => setDarkMode((v) => !v)}
            />
          }
        >
          <Route
            index
            element={<Dashboard onMetricsUpdate={handleMetricsUpdate} />}
          />
          <Route path="relatorios"  element={<Relatorios />}  />
          <Route path="exportar"    element={<Exportar />}   />
          <Route path="lancamentos" element={<Lancamentos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
