import { useState, useCallback } from 'react';
import type { KPIData, CategoryDistribution } from '../types';

export interface AlertRule {
  id:        string;
  name:      string;
  category:  string;          // 'Todas' ou nome da categoria
  metric:    'total' | 'variation' | 'daily_average';
  condition: 'above' | 'below';
  threshold: number;
  enabled:   boolean;
}

export interface AlertTrigger {
  ruleId:       string;
  ruleName:     string;
  category:     string;
  currentValue: number;
  threshold:    number;
  condition:    'above' | 'below';
  triggeredAt:  string;
}

const RULES_KEY    = 'dashboard:alert-rules';
const HISTORY_KEY  = 'dashboard:alert-history';

const DEFAULT_RULES: AlertRule[] = [
  {
    id: '1', name: 'Variação muito negativa', category: 'Todas',
    metric: 'variation', condition: 'below', threshold: -15, enabled: true,
  },
  {
    id: '2', name: 'Receita total baixa', category: 'Vendas',
    metric: 'total', condition: 'below', threshold: 500_000, enabled: true,
  },
  {
    id: '3', name: 'Média diária elevada', category: 'Financeiro',
    metric: 'daily_average', condition: 'above', threshold: 200_000, enabled: false,
  },
];

function loadRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_RULES;
  } catch { return DEFAULT_RULES; }
}

function loadHistory(): AlertTrigger[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRules(rules: AlertRule[]) {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function saveHistory(history: AlertTrigger[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

export function useAlerts() {
  const [rules,    setRules]    = useState<AlertRule[]>(loadRules);
  const [triggers, setTriggers] = useState<AlertTrigger[]>(loadHistory);

  // Avalia alertas contra dados atuais
  const evaluate = useCallback((
    kpis:         KPIData | null,
    distribution: CategoryDistribution[] | null,
  ) => {
    if (!kpis || !distribution) return;

    const newTriggers: AlertTrigger[] = [];

    rules.filter((r) => r.enabled).forEach((rule) => {
      const cats = rule.category === 'Todas'
        ? distribution
        : distribution.filter((d) => d.category === rule.category);

      cats.forEach((cat) => {
        let value = 0;
        if (rule.metric === 'total')         value = cat.total;
        if (rule.metric === 'variation')     value = kpis.variation_percent;
        if (rule.metric === 'daily_average') value = kpis.daily_average;

        const fired =
          (rule.condition === 'above' && value > rule.threshold) ||
          (rule.condition === 'below' && value < rule.threshold);

        if (fired) {
          newTriggers.push({
            ruleId:       rule.id,
            ruleName:     rule.name,
            category:     cat.category,
            currentValue: value,
            threshold:    rule.threshold,
            condition:    rule.condition,
            triggeredAt:  new Date().toISOString(),
          });
        }
      });
    });

    if (newTriggers.length > 0) {
      setTriggers((prev) => {
        const merged = [...newTriggers, ...prev].slice(0, 50);
        saveHistory(merged);
        return merged;
      });
    }
  }, [rules]);

  const addRule = useCallback((rule: Omit<AlertRule, 'id'>) => {
    setRules((prev) => {
      const next = [...prev, { ...rule, id: Date.now().toString() }];
      saveRules(next);
      return next;
    });
  }, []);

  const updateRule = useCallback((id: string, patch: Partial<AlertRule>) => {
    setRules((prev) => {
      const next = prev.map((r) => r.id === id ? { ...r, ...patch } : r);
      saveRules(next);
      return next;
    });
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRules(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setTriggers([]);
    saveHistory([]);
  }, []);

  // Badge: alertas disparados nas últimas 24h
  const recentCount = triggers.filter((t) => {
    const age = Date.now() - new Date(t.triggeredAt).getTime();
    return age < 86_400_000;
  }).length;

  return { rules, triggers, recentCount, evaluate, addRule, updateRule, deleteRule, clearHistory };
}
