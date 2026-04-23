import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout              from './components/layout/Layout';
import Dashboard           from './pages/Dashboard';
import Relatorios          from './pages/Relatorios';
import Exportar            from './pages/Exportar';
import Lancamentos         from './pages/Lancamentos';
import Metas               from './pages/Metas';
import Alertas             from './pages/Alertas';
import Configuracoes       from './pages/Configuracoes';
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal';
import { useAlerts }       from './hooks/useAlerts';
import { useKeyboard }     from './hooks/useKeyboard';
import type { Filters }    from './types';

const today   = () => new Date().toISOString().split('T')[0];
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

// ── Componente interno — pode usar hooks do React Router ──────
function AppRoutes() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [lastUpdated, setLastUpdated]     = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [refetch, setRefetch]             = useState<() => void>(() => () => undefined);
  const [layoutFilters]                   = useState<Filters>(DEFAULT_FILTERS);

  const { recentCount } = useAlerts();

  useKeyboard({
    onRefresh:       refetch,
    onToggleDark:    () => setDarkMode((v) => !v),
    onShowShortcuts: () => setShowShortcuts(true),
  });

  const handleMetricsUpdate = useCallback((opts: {
    lastUpdated: string | null;
    loading:     boolean;
    refetch:     () => void;
  }) => {
    setLastUpdated(opts.lastUpdated);
    setMetricsLoading(opts.loading);
    setRefetch(() => opts.refetch);
  }, []);

  return (
    <>
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
              alertCount={recentCount}
            />
          }
        >
          <Route
            index
            element={<Dashboard onMetricsUpdate={handleMetricsUpdate} />}
          />
          <Route path="relatorios"    element={<Relatorios />}   />
          <Route path="exportar"      element={<Exportar />}     />
          <Route path="lancamentos"   element={<Lancamentos />}  />
          <Route path="metas"         element={<Metas />}        />
          <Route path="alertas"       element={<Alertas />}      />
          <Route path="configuracoes" element={<Configuracoes />}/>
        </Route>
      </Routes>

      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
