import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ExportData } from '../types';
import { formatDate, formatCurrency, formatPercent, formatNumber } from './formatters';

// ─── Geração de nome de arquivo ─────────────────────────────

export function buildFileName(startDate: string, endDate: string, ext: 'pdf' | 'xlsx'): string {
  return `dashboard-${startDate}-${endDate}.${ext}`;
}

// ─── PDF ────────────────────────────────────────────────────

export function generatePDF(exportData: ExportData): void {
  const { period, kpis, byCategory, tableData } = exportData;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primaryColor: [number, number, number] = [99, 102, 241]; // indigo-500

  // Cabeçalho
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard Analytics', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Período: ${formatDate(period.startDate)} a ${formatDate(period.endDate)}`,
    14, 22
  );
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
    130, 22
  );

  doc.setTextColor(30, 30, 30);

  // KPIs
  let y = 36;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo de KPIs', 14, y);
  y += 7;

  const kpiData = [
    ['Total Geral',      formatCurrency(kpis.total)],
    ['Média Diária',     formatCurrency(kpis.daily_average)],
    ['Maior Valor',      formatCurrency(kpis.max_value)],
    ['Variação (%)',     formatPercent(kpis.variation_percent)],
    ['Período (dias)',   String(kpis.period_days)],
  ];
  autoTable(doc, {
    startY:   y,
    head:     [['Indicador', 'Valor']],
    body:     kpiData,
    theme:    'striped',
    headStyles:  { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Distribuição por categoria
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribuição por Categoria', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head:   [['Categoria', 'Total', 'Participação (%)', 'Registros']],
    body:   byCategory.map((c) => [
      c.category,
      formatCurrency(c.total),
      `${c.percentage.toFixed(2)}%`,
      String(c.count),
    ]),
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Dados detalhados — nova página se necessário
  doc.addPage();
  y = 14;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados Detalhados', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head:   [['Data', 'Categoria', 'Métrica', 'Valor', 'Variação']],
    body:   tableData.slice(0, 200).map((r) => [
      formatDate(r.date),
      r.category,
      r.metric_name,
      formatCurrency(r.value),
      r.variation_percent !== null ? formatPercent(r.variation_percent) : '—',
    ]),
    theme:  'striped',
    headStyles:  { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  // Rodapé em todas as páginas
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} — Dashboard Analytics`,
      105, 290, { align: 'center' }
    );
  }

  doc.save(buildFileName(period.startDate, period.endDate, 'pdf'));
}

// ─── Excel ──────────────────────────────────────────────────

export function generateExcel(exportData: ExportData): void {
  const { period, kpis, byCategory, timeline, comparison, tableData } = exportData;
  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo / KPIs
  const summaryData = [
    ['Dashboard Analytics — Resumo'],
    [`Período: ${formatDate(period.startDate)} a ${formatDate(period.endDate)}`],
    [],
    ['Indicador', 'Valor'],
    ['Total Geral',     formatCurrency(kpis.total)],
    ['Média Diária',    formatCurrency(kpis.daily_average)],
    ['Maior Valor',     formatCurrency(kpis.max_value)],
    ['Variação (%)',    formatPercent(kpis.variation_percent)],
    ['Período (dias)',  kpis.period_days],
    ['Direção',         kpis.variation_direction],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  // Aba 2: Por Categoria
  const catHeaders = ['Categoria', 'Total', 'Participação (%)', 'Registros', 'Cor'];
  const catRows    = byCategory.map((c) => [
    c.category,
    c.total,
    c.percentage,
    c.count,
    c.color,
  ]);
  const wsCat = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  wsCat['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsCat, 'Por Categoria');

  // Aba 3: Timeline
  if (timeline.length > 0) {
    const categories = Object.keys(timeline[0]).filter(
      (k) => k !== 'date' && !k.endsWith('_color')
    );
    const tlHeaders = ['Data', ...categories];
    const tlRows    = timeline.map((p) => [
      p.date,
      ...categories.map((c) => (typeof p[c] === 'number' ? p[c] : 0)),
    ]);
    const wsTimeline = XLSX.utils.aoa_to_sheet([tlHeaders, ...tlRows]);
    wsTimeline['!cols'] = tlHeaders.map(() => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(wb, wsTimeline, 'Timeline');
  }

  // Aba 4: Comparação
  const compHeaders = ['Categoria', 'Total', 'Média', 'Máximo', 'Mínimo', 'Registros'];
  const compRows    = comparison.map((c) => [
    c.category, c.total, c.average, c.max, c.min, c.count,
  ]);
  const wsComp = XLSX.utils.aoa_to_sheet([compHeaders, ...compRows]);
  wsComp['!cols'] = compHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, wsComp, 'Comparação');

  // Aba 5: Dados Completos
  const fullHeaders = ['ID', 'Data', 'Categoria', 'Cor', 'Métrica', 'Valor', 'Valor Anterior', 'Variação (%)'];
  const fullRows    = tableData.map((r) => [
    r.id,
    r.date,
    r.category,
    r.category_color,
    r.metric_name,
    r.value,
    r.previous_value ?? '',
    r.variation_percent !== null ? formatNumber(r.variation_percent) : '',
  ]);
  const wsFull = XLSX.utils.aoa_to_sheet([fullHeaders, ...fullRows]);
  wsFull['!cols'] = [
    { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 10 },
    { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFull, 'Dados Completos');

  XLSX.writeFile(wb, buildFileName(period.startDate, period.endDate, 'xlsx'));
}
