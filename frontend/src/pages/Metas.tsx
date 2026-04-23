import { useState, useEffect } from 'react';
import { Edit2, Save, Target } from 'lucide-react';
import GaugeChart from '../components/charts/GaugeChart';
import { metricsApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import type { CategoryDistribution } from '../types';

interface Goal {
  category: string;
  color:    string;
  target:   number;
}

const GOALS_KEY = 'dashboard:goals';

const DEFAULT_TARGETS: Record<string, number> = {
  Vendas:      1_000_000,
  Financeiro:    800_000,
  Operacional:   600_000,
  Marketing:     400_000,
  RH:            300_000,
};

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export default function Metas() {
  const [distribution, setDistribution] = useState<CategoryDistribution[]>([]);
  const [goals, setGoals]               = useState<Goal[]>(loadGoals);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState<string | null>(null);
  const [editValue, setEditValue]       = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const startDate = start.toISOString().split('T')[0];

    metricsApi
      .getDistribution({ startDate, endDate: today })
      .then((data) => {
        setDistribution(data);
        setGoals((prev) => {
          if (prev.length > 0) return prev;
          const defaults = data.map((cat) => ({
            category: cat.category,
            color:    cat.color,
            target:   DEFAULT_TARGETS[cat.category] ?? 500_000,
          }));
          saveGoals(defaults);
          return defaults;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (category: string, target: number) => {
    setEditing(category);
    setEditValue(String(target));
  };

  const commitEdit = (category: string) => {
    const val = parseFloat(editValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val > 0) {
      setGoals((prev) => {
        const next = prev.map((g) =>
          g.category === category ? { ...g, target: val } : g,
        );
        saveGoals(next);
        return next;
      });
    }
    setEditing(null);
  };

  const getProgress = (category: string) => {
    const dist = distribution.find((d) => d.category === category);
    const goal = goals.find((g) => g.category === category);
    if (!dist || !goal || goal.target === 0) return 0;
    return Math.min(100, (dist.total / goal.target) * 100);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Metas por Categoria</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Acompanhe o progresso em relação às metas definidas · Clique em{' '}
          <Edit2 className="inline w-3 h-3" /> para editar a meta
        </p>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma meta encontrada — aguardando dados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const dist     = distribution.find((d) => d.category === goal.category);
            const progress = getProgress(goal.category);
            const isEditing = editing === goal.category;

            const statusColor =
              progress >= 100 ? '#10b981' :
              progress >= 70  ? '#6366f1' :
              progress >= 40  ? '#f59e0b' : '#ef4444';

            return (
              <div
                key={goal.category}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
              >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: goal.color }}
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {goal.category}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      isEditing ? commitEdit(goal.category) : startEdit(goal.category, goal.target)
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    title={isEditing ? 'Salvar' : 'Editar meta'}
                  >
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Gauge */}
                <div className="flex justify-center my-2">
                  <GaugeChart value={progress} color={statusColor} size={150} />
                </div>

                {/* Detalhes */}
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Realizado (último ano)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(dist?.total ?? 0)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Meta</span>
                    {isEditing ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(goal.category)}
                        onKeyDown={(e) => e.key === 'Enter' && commitEdit(goal.category)}
                        className="w-36 text-right text-xs font-semibold bg-transparent border-b border-indigo-400 outline-none text-gray-900 dark:text-white"
                      />
                    ) : (
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(goal.target)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Atingimento</span>
                    <span className="font-bold" style={{ color: statusColor }}>
                      {progress >= 100 ? '✓ Meta atingida' : `${progress.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
