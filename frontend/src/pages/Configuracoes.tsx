import { Hash, RefreshCw, Calendar, Grid3x3, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useState } from 'react';

const REFRESH_OPTIONS = [
  { value: 0,      label: 'Desligado'   },
  { value: 15_000, label: '15 segundos' },
  { value: 30_000, label: '30 segundos' },
  { value: 60_000, label: '1 minuto'   },
];

const PERIOD_OPTIONS = [
  { value: '7',   label: 'Últimos 7 dias'  },
  { value: '30',  label: 'Últimos 30 dias' },
  { value: '90',  label: 'Últimos 90 dias' },
  { value: '365', label: 'Último ano'      },
];

function Toggle({
  value,
  onChange,
}: {
  value:    boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${
        value ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export default function Configuracoes() {
  const { settings, update, reset } = useSettings();
  const [saved, setSaved] = useState(false);

  const handleUpdate = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) => {
    update(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Personalize o comportamento do dashboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvo
            </span>
          )}
          <button
            onClick={() => { reset(); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar padrões
          </button>
        </div>
      </div>

      {/* Painel de configurações */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">

        {/* Atualização automática */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Atualização automática
              </p>
              <p className="text-xs text-gray-400">
                Frequência de busca de novos dados
              </p>
            </div>
          </div>
          <select
            value={settings.refreshInterval}
            onChange={(e) => handleUpdate('refreshInterval', Number(e.target.value))}
            className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
          >
            {REFRESH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Números compactos */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Números compactos
              </p>
              <p className="text-xs text-gray-400">
                Exibe <span className="font-mono">1,5M</span> em vez de{' '}
                <span className="font-mono">R$ 1.500.000</span>
              </p>
            </div>
          </div>
          <Toggle
            value={settings.compactNumbers}
            onChange={(v) => handleUpdate('compactNumbers', v)}
          />
        </div>

        {/* Linhas de grade */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Grid3x3 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Linhas de grade
              </p>
              <p className="text-xs text-gray-400">
                Exibe grade de referência nos gráficos de linha e barra
              </p>
            </div>
          </div>
          <Toggle
            value={settings.showGridLines}
            onChange={(v) => handleUpdate('showGridLines', v)}
          />
        </div>

        {/* Período padrão */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Período padrão
              </p>
              <p className="text-xs text-gray-400">
                Intervalo carregado ao abrir o dashboard
              </p>
            </div>
          </div>
          <select
            value={settings.defaultPeriod}
            onChange={(e) =>
              handleUpdate('defaultPeriod', e.target.value as '7' | '30' | '90' | '365')
            }
            className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        As configurações são salvas automaticamente no navegador e persistem entre sessões.
        Nenhum dado é enviado ao servidor.
      </p>
    </div>
  );
}
