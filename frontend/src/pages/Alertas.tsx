import { useState } from 'react';
import { Bell, Plus, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import type { AlertRule } from '../hooks/useAlerts';
import { formatCurrency } from '../utils/formatters';

const CATEGORIES = ['Todas', 'Vendas', 'Financeiro', 'Operacional', 'Marketing', 'RH'];

const METRICS: { value: AlertRule['metric']; label: string }[] = [
  { value: 'total',         label: 'Total do período' },
  { value: 'variation',     label: 'Variação %'       },
  { value: 'daily_average', label: 'Média diária'     },
];

const CONDITIONS: { value: AlertRule['condition']; label: string }[] = [
  { value: 'above', label: 'Acima de'  },
  { value: 'below', label: 'Abaixo de' },
];

const EMPTY_DRAFT = {
  name:      '',
  category:  'Todas',
  metric:    'total'  as AlertRule['metric'],
  condition: 'below'  as AlertRule['condition'],
  threshold: 0,
  enabled:   true,
};

export default function Alertas() {
  const { rules, triggers, recentCount, addRule, updateRule, deleteRule, clearHistory } = useAlerts();
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [showForm, setShowForm]   = useState(false);
  const [draft, setDraft]         = useState({ ...EMPTY_DRAFT });

  const handleAdd = () => {
    if (!draft.name.trim()) return;
    addRule(draft);
    setDraft({ ...EMPTY_DRAFT });
    setShowForm(false);
  };

  const formatTriggerValue = (ruleId: string, value: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule?.metric === 'variation'
      ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
      : formatCurrency(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sistema de Alertas</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure regras e monitore alertas disparados automaticamente
          </p>
        </div>
        {recentCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {recentCount} alerta{recentCount !== 1 ? 's' : ''} nas últimas 24h
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['rules', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'rules' ? 'Regras' : 'Histórico'}
            {tab === 'history' && triggers.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                {triggers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Regras ── */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 && !showForm && (
            <div className="text-center py-16 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma regra configurada</p>
            </div>
          )}

          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {rule.name}
                  </span>
                  {!rule.enabled && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded">
                      inativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {rule.category} ·{' '}
                  {METRICS.find((m) => m.value === rule.metric)?.label} ·{' '}
                  {CONDITIONS.find((c) => c.value === rule.condition)?.label}{' '}
                  {rule.metric === 'variation'
                    ? `${rule.threshold}%`
                    : formatCurrency(rule.threshold)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${
                    rule.enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                  title={rule.enabled ? 'Desativar' : 'Ativar'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      rule.enabled ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
                {/* Delete */}
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remover regra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Formulário nova regra */}
          {showForm && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nova Regra</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                  <input
                    type="text"
                    autoFocus
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Ex: Receita muito baixa"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Métrica</label>
                  <select
                    value={draft.metric}
                    onChange={(e) => setDraft((d) => ({ ...d, metric: e.target.value as AlertRule['metric'] }))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                  >
                    {METRICS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Condição</label>
                  <select
                    value={draft.condition}
                    onChange={(e) => setDraft((d) => ({ ...d, condition: e.target.value as AlertRule['condition'] }))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Limite {draft.metric === 'variation' ? '(%)' : '(R$)'}
                  </label>
                  <input
                    type="number"
                    value={draft.threshold}
                    onChange={(e) => setDraft((d) => ({ ...d, threshold: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!draft.name.trim()}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Salvar regra
                </button>
              </div>
            </div>
          )}

          {/* Botão adicionar */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Nova regra
            </button>
          )}
        </div>
      )}

      {/* ── Histórico ── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {triggers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum alerta disparado ainda</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Limpar histórico
                </button>
              </div>

              {triggers.map((t, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {t.ruleName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {t.category} ·{' '}
                        {t.condition === 'above' ? 'Acima de' : 'Abaixo de'}{' '}
                        {formatCurrency(t.threshold)} · Valor atual:{' '}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatTriggerValue(t.ruleId, t.currentValue)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(t.triggeredAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
