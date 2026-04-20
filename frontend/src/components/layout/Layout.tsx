import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import type { Filters } from '../../types';

interface LayoutProps {
  filters:     Filters;
  lastUpdated: string | null;
  loading:     boolean;
  onRefresh:   () => void;
  darkMode:    boolean;
  onToggleDark: () => void;
}

export default function Layout({
  filters, lastUpdated, loading, onRefresh, darkMode, onToggleDark,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          filters={filters}
          lastUpdated={lastUpdated}
          loading={loading}
          onRefresh={onRefresh}
          darkMode={darkMode}
          onToggleDark={onToggleDark}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
