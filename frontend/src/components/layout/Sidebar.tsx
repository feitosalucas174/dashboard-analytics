import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Download,
  BarChart3,
  X,
} from 'lucide-react';

interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/relatorios',icon: FileText,        label: 'Relatórios' },
  { to: '/exportar',  icon: Download,        label: 'Exportar'   },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              Analytics
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Versão */}
        <div className="absolute bottom-4 left-0 right-0 px-6">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Dashboard Analytics v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
