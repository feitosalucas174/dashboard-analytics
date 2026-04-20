import { useState, useCallback } from 'react';
import { exportApi } from '../services/api';
import { generatePDF, generateExcel } from '../utils/exportHelpers';
import type { Filters } from '../types';

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

interface Toast {
  message: string;
  type: 'info' | 'success' | 'error';
}

export function useExport(filters: Filters) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [toast, setToast]   = useState<Toast | null>(null);

  const showToast = (message: string, type: Toast['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const params = {
    startDate: filters.startDate,
    endDate:   filters.endDate,
    category:  filters.categories.length > 0 ? filters.categories.join(',') : undefined,
  };

  const exportToPDF = useCallback(async () => {
    setStatus('loading');
    showToast('Gerando PDF...', 'info');
    try {
      const data = await exportApi.getPDFData(params);
      generatePDF(data);
      setStatus('success');
      showToast('PDF gerado com sucesso!', 'success');
    } catch (err) {
      setStatus('error');
      showToast(
        err instanceof Error ? err.message : 'Erro ao gerar PDF',
        'error'
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const exportToExcel = useCallback(async () => {
    setStatus('loading');
    showToast('Gerando Excel...', 'info');
    try {
      const data = await exportApi.getExcelData(params);
      await generateExcel(data);
      setStatus('success');
      showToast('Excel gerado com sucesso!', 'success');
    } catch (err) {
      setStatus('error');
      showToast(
        err instanceof Error ? err.message : 'Erro ao gerar Excel',
        'error'
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return { exportToPDF, exportToExcel, status, toast };
}
