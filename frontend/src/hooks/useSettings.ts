import { useState, useCallback } from 'react';

export interface Settings {
  refreshInterval: number;   // ms: 15000 | 30000 | 60000 | 0 (desligado)
  compactNumbers:  boolean;  // 1.5K em vez de 1.500
  showGridLines:   boolean;  // linhas de grade nos gráficos
  defaultPeriod:   '7' | '30' | '90' | '365'; // dias padrão ao abrir
}

const DEFAULTS: Settings = {
  refreshInterval: 30_000,
  compactNumbers:  false,
  showGridLines:   true,
  defaultPeriod:   '30',
};

const KEY = 'dashboard:settings';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    save(DEFAULTS);
    setSettings(DEFAULTS);
  }, []);

  return { settings, update, reset };
}
