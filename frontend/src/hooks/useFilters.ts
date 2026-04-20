import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import type { Filters, DatePreset } from '../types';

const today     = () => format(new Date(), 'yyyy-MM-dd');
const daysAgo   = (n: number) => format(subDays(new Date(), n), 'yyyy-MM-dd');

const PRESET_MAP: Record<DatePreset, () => { startDate: string; endDate: string }> = {
  today:       () => ({ startDate: today(), endDate: today() }),
  last7:       () => ({ startDate: daysAgo(7),  endDate: today() }),
  last30:      () => ({ startDate: daysAgo(30), endDate: today() }),
  thisMonth:   () => ({ startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'), endDate: today() }),
  last3months: () => ({ startDate: daysAgo(90), endDate: today() }),
  thisYear:    () => ({ startDate: format(startOfYear(new Date()),  'yyyy-MM-dd'), endDate: today() }),
  custom:      () => ({ startDate: daysAgo(30), endDate: today() }),
};

const DEFAULT_FILTERS: Filters = {
  ...PRESET_MAP.last30(),
  categories: [],
  preset:     'last30',
};

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lê filtros da URL na montagem
  const filtersFromURL = (): Filters => {
    const start  = searchParams.get('startDate');
    const end    = searchParams.get('endDate');
    const cats   = searchParams.get('categories');
    const preset = (searchParams.get('preset') as DatePreset) || 'last30';
    return {
      startDate:  start  || DEFAULT_FILTERS.startDate,
      endDate:    end    || DEFAULT_FILTERS.endDate,
      categories: cats   ? cats.split(',').filter(Boolean) : [],
      preset,
    };
  };

  const [filters, setFilters]         = useState<Filters>(filtersFromURL);
  const [pendingFilters, setPending]  = useState<Filters>(filtersFromURL);

  // Sincroniza filtros aplicados com a URL
  useEffect(() => {
    const params: Record<string, string> = {
      startDate:  filters.startDate,
      endDate:    filters.endDate,
      preset:     filters.preset,
    };
    if (filters.categories.length > 0) {
      params.categories = filters.categories.join(',');
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const applyFilters = useCallback(() => {
    setFilters(pendingFilters);
  }, [pendingFilters]);

  const clearFilters = useCallback(() => {
    const def = { ...DEFAULT_FILTERS };
    setPending(def);
    setFilters(def);
  }, []);

  const setPreset = useCallback((preset: DatePreset) => {
    const dates = PRESET_MAP[preset]();
    setPending((prev) => ({ ...prev, ...dates, preset }));
  }, []);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setPending((prev) => ({ ...prev, startDate, endDate, preset: 'custom' }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setPending((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  }, []);

  // Converte categorias selecionadas em string para a API
  const categoryParam = filters.categories.length > 0
    ? filters.categories.join(',')
    : undefined;

  return {
    filters,
    pendingFilters,
    applyFilters,
    clearFilters,
    setPreset,
    setDateRange,
    toggleCategory,
    categoryParam,
  };
}
