import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import type { ExportData, CategoryDistribution } from '../types';
import { formatDate, formatCurrency, formatPercent } from './formatters';

// ─── Nome do arquivo ────────────────────────────────────────

export function buildFileName(startDate: string, endDate: string, ext: 'pdf' | 'xlsx'): string {
  return `dashboard-${startDate}-${endDate}.${ext}`;
}

// ═══════════════════════════════════════════════════════════
//  PDF
// ═══════════════════════════════════════════════════════════

export function generatePDF(exportData: ExportData): void {
  const { period, kpis, byCategory, tableData } = exportData;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PRIMARY: [number, number, number] = [99, 102, 241];

  // Cabeçalho colorido
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Dashboard Analytics', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${formatDate(period.startDate)} a ${formatDate(period.endDate)}`, 14, 22);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
    130, 22
  );
  doc.setTextColor(30, 30, 30);

  let y = 36;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo de KPIs', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head:   [['Indicador', 'Valor']],
    body:   [
      ['Total Geral',    formatCurrency(kpis.total)],
      ['Média Diária',   formatCurrency(kpis.daily_average)],
      ['Maior Valor',    formatCurrency(kpis.max_value)],
      ['Variação (%)',   formatPercent(kpis.variation_percent)],
      ['Período (dias)', String(kpis.period_days)],
    ],
    theme: 'striped',
    headStyles:    { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles:  { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribuição por Categoria', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head:   [['Categoria', 'Total', 'Participação (%)', 'Registros']],
    body:   byCategory.map((c) => [
      c.category, formatCurrency(c.total), `${c.percentage.toFixed(2)}%`, String(c.count),
    ]),
    theme: 'striped',
    headStyles:   { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

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
      formatDate(r.date), r.category, r.metric_name,
      formatCurrency(r.value),
      r.variation_percent !== null ? formatPercent(r.variation_percent) : '—',
    ]),
    theme: 'striped',
    headStyles:   { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} — Dashboard Analytics`, 105, 290, { align: 'center' });
  }

  doc.save(buildFileName(period.startDate, period.endDate, 'pdf'));
}

// ═══════════════════════════════════════════════════════════
//  EXCEL com ExcelJS — formatação rica
// ═══════════════════════════════════════════════════════════

// ─── Helpers de estilo ──────────────────────────────────────

/** Hex #RRGGBB → ARGB 'FFRRGGBB' */
function toArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

/** Clareia uma cor hex misturando com branco (fator 0–1) */
function lightenHex(hex: string, factor = 0.82): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return 'FF' + [lr, lg, lb].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

const BRAND   = '6366F1'; // indigo-500
const GRAY_50 = 'FFF9FAFB';
const GRAY_100 = 'FFF3F4F6';
const WHITE   = 'FFFFFFFF';

const borderThin: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD1D5DB' } };
const allBorders: Partial<ExcelJS.Borders> = {
  top: borderThin, left: borderThin, bottom: borderThin, right: borderThin,
};

function fillSolid(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

/** Aplica estilo de cabeçalho principal (fundo indigo, texto branco) */
function styleHeader(row: ExcelJS.Row, cols: number, bgArgb = `FF${BRAND}`) {
  row.height = 30;
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.fill   = fillSolid(bgArgb);
    cell.font   = { bold: true, color: { argb: WHITE }, size: 11, name: 'Calibri' };
    cell.border = allBorders;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  }
}

/** Aplica estilo de linha de dados */
function styleDataRow(
  row: ExcelJS.Row,
  cols: number,
  bgArgb: string = WHITE,
  options: { bold?: boolean } = {}
) {
  row.height = 20;
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.fill   = fillSolid(bgArgb);
    cell.font   = { size: 10, name: 'Calibri', bold: options.bold ?? false };
    cell.border = allBorders;
    cell.alignment = { vertical: 'middle' };
  }
}

/** Adiciona linha de título com célula mesclada */
function addTitle(ws: ExcelJS.Worksheet, title: string, cols: number) {
  const titleRow = ws.addRow([title]);
  ws.mergeCells(titleRow.number, 1, titleRow.number, cols);
  titleRow.height = 36;
  const cell = titleRow.getCell(1);
  cell.fill      = fillSolid(`FF${BRAND}`);
  cell.font      = { bold: true, size: 14, color: { argb: WHITE }, name: 'Calibri' };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  cell.border    = allBorders;
}

/** Adiciona linha de subtítulo (fundo cinza claro) */
function addSubtitle(ws: ExcelJS.Worksheet, text: string, cols: number) {
  const row = ws.addRow([text]);
  ws.mergeCells(row.number, 1, row.number, cols);
  row.height = 22;
  const cell = row.getCell(1);
  cell.fill      = fillSolid(GRAY_100);
  cell.font      = { italic: true, size: 10, color: { argb: 'FF6B7280' }, name: 'Calibri' };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  cell.border    = allBorders;
}

// ─── Geração principal ──────────────────────────────────────

export async function generateExcel(exportData: ExportData): Promise<void> {
  const { period, kpis, byCategory, timeline, comparison, tableData } = exportData;

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Dashboard Analytics';
  wb.created  = new Date();
  wb.modified = new Date();

  // Mapa cor por categoria para uso nas abas
  const catColorMap = new Map<string, string>(
    byCategory.map((c) => [c.category, c.color])
  );

  // ── Aba 1: Resumo ──────────────────────────────────────────
  buildSummarySheet(wb, period, kpis, byCategory);

  // ── Aba 2: Por Categoria ───────────────────────────────────
  buildCategorySheet(wb, byCategory);

  // ── Aba 3: Timeline ────────────────────────────────────────
  buildTimelineSheet(wb, timeline, catColorMap);

  // ── Aba 4: Comparação ──────────────────────────────────────
  buildComparisonSheet(wb, comparison);

  // ── Aba 5: Dados Completos ─────────────────────────────────
  buildFullDataSheet(wb, tableData, catColorMap);

  // Salva como download no browser
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = buildFileName(period.startDate, period.endDate, 'xlsx');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Aba 1: Resumo / KPIs ──────────────────────────────────

function buildSummarySheet(
  wb: ExcelJS.Workbook,
  period: { startDate: string; endDate: string },
  kpis: ExportData['kpis'],
  byCategory: CategoryDistribution[]
) {
  const ws = wb.addWorksheet('Resumo', {
    tabColor: { argb: `FF${BRAND}` },
    views: [{ showGridLines: false }],
  });
  ws.columns = [
    { width: 28 }, { width: 24 },
  ];

  addTitle(ws, '  Dashboard Analytics', 2);
  addSubtitle(ws, `  Período: ${formatDate(period.startDate)} a ${formatDate(period.endDate)}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 2);
  ws.addRow([]);

  // KPIs
  const kpiHeader = ws.addRow(['  Indicador', 'Valor']);
  styleHeader(kpiHeader, 2);
  kpiHeader.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

  const kpiRows: [string, string | number][] = [
    ['  Total Geral',      kpis.total],
    ['  Média Diária',     kpis.daily_average],
    ['  Maior Valor',      kpis.max_value],
    ['  Período (dias)',   kpis.period_days],
    ['  Variação (%)',     kpis.variation_percent],
  ];

  kpiRows.forEach(([label, val], i) => {
    const row = ws.addRow([label, val]);
    styleDataRow(row, 2, i % 2 === 0 ? WHITE : GRAY_50);
    const cell = row.getCell(2);
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    // Formata moeda ou percentual
    if (typeof val === 'number' && label.includes('%')) {
      cell.numFmt = '+0.00"%";"−"0.00"%"';
    } else if (typeof val === 'number' && !label.includes('dias')) {
      cell.numFmt = '"R$" #,##0.00';
      cell.value  = val;
    }
  });

  ws.addRow([]);

  // Mini-tabela de distribuição por categoria
  const catHeader = ws.addRow(['  Categoria', 'Participação (%)']);
  styleHeader(catHeader, 2, lightenHex(`#${BRAND}`, 0.3));
  catHeader.getCell(1).font = { bold: true, size: 11, name: 'Calibri', color: { argb: WHITE } };

  byCategory.forEach((cat, i) => {
    const row = ws.addRow([`  ${cat.category}`, cat.percentage / 100]);
    styleDataRow(row, 2, i % 2 === 0 ? WHITE : lightenHex(cat.color, 0.92));
    // Bolinha de cor na célula da categoria (background suave)
    row.getCell(1).fill = fillSolid(lightenHex(cat.color, 0.88));
    row.getCell(1).font = { bold: true, size: 10, name: 'Calibri', color: { argb: toArgb(cat.color) } };
    row.getCell(2).numFmt   = '0.00"%"';
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  });
}

// ─── Aba 2: Por Categoria ──────────────────────────────────

function buildCategorySheet(wb: ExcelJS.Workbook, byCategory: CategoryDistribution[]) {
  const ws = wb.addWorksheet('Por Categoria', {
    tabColor: { argb: 'FFF59E0B' },
    views: [{ state: 'frozen', ySplit: 3, showGridLines: false }],
  });
  ws.columns = [
    { width: 20 }, { width: 22 }, { width: 20 }, { width: 14 }, { width: 14 },
  ];

  const COLS = 5;
  addTitle(ws, '  Distribuição por Categoria', COLS);
  const header = ws.addRow(['  Categoria', 'Total (R$)', 'Participação (%)', 'Registros', 'Cor Hex']);
  styleHeader(header, COLS);
  header.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  header.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  header.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

  // Linha de total no final
  let grandTotal = 0;
  let grandCount = 0;

  byCategory.forEach((cat) => {
    grandTotal += cat.total;
    grandCount += cat.count;

    const lightBg = lightenHex(cat.color, 0.88);
    const row     = ws.addRow([
      `  ${cat.category}`, cat.total, cat.percentage / 100, cat.count, cat.color,
    ]);
    styleDataRow(row, COLS, lightBg);
    row.getCell(1).font = { bold: true, size: 10, name: 'Calibri', color: { argb: toArgb(cat.color) } };
    row.getCell(2).numFmt    = '"R$" #,##0.00';
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(3).numFmt    = '0.00"%"';
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(5).font      = { color: { argb: 'FF9CA3AF' }, size: 9, name: 'Calibri' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Linha de total
  const totalRow = ws.addRow(['  TOTAL', grandTotal, 1, grandCount, '']);
  styleDataRow(totalRow, COLS, `FF${BRAND}`, { bold: true });
  totalRow.eachCell((c) => { c.font = { bold: true, size: 10, name: 'Calibri', color: { argb: WHITE } }; });
  totalRow.getCell(2).numFmt    = '"R$" #,##0.00';
  totalRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(3).numFmt    = '0.00"%"';
  totalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
}

// ─── Aba 3: Timeline ───────────────────────────────────────

function buildTimelineSheet(
  wb: ExcelJS.Workbook,
  timeline: ExportData['timeline'],
  catColorMap: Map<string, string>
) {
  if (timeline.length === 0) return;

  const categories = Object.keys(timeline[0]).filter(
    (k) => k !== 'date' && !k.endsWith('_color')
  );

  const ws = wb.addWorksheet('Timeline', {
    tabColor: { argb: 'FF10B981' },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2, showGridLines: false }],
  });

  const COLS = 1 + categories.length;
  ws.columns = [
    { width: 14 },
    ...categories.map(() => ({ width: 18 })),
  ];

  addTitle(ws, '  Evolução Temporal por Categoria', COLS);

  const header = ws.addRow(['  Data', ...categories]);
  styleHeader(header, COLS);
  for (let i = 2; i <= COLS; i++) {
    const cat   = categories[i - 2];
    const color = catColorMap.get(cat);
    if (color) {
      header.getCell(i).fill = fillSolid(toArgb(color));
    }
    header.getCell(i).alignment = { horizontal: 'right', vertical: 'middle' };
  }

  timeline.forEach((point, idx) => {
    const values = categories.map((c) => (typeof point[c] === 'number' ? point[c] : 0));
    const row    = ws.addRow([point.date, ...values]);
    styleDataRow(row, COLS, idx % 2 === 0 ? WHITE : GRAY_50);
    row.getCell(1).numFmt    = 'DD/MM/YYYY';
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    for (let c = 2; c <= COLS; c++) {
      row.getCell(c).numFmt    = '"R$" #,##0.00';
      row.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
    }
  });
}

// ─── Aba 4: Comparação ─────────────────────────────────────

function buildComparisonSheet(wb: ExcelJS.Workbook, comparison: ExportData['comparison']) {
  const ws = wb.addWorksheet('Comparação', {
    tabColor: { argb: 'FFEF4444' },
    views: [{ state: 'frozen', ySplit: 2, showGridLines: false }],
  });

  const COLS = 6;
  ws.columns = [
    { width: 18 }, { width: 20 }, { width: 18 },
    { width: 18 }, { width: 18 }, { width: 12 },
  ];

  addTitle(ws, '  Comparação entre Categorias', COLS);
  const header = ws.addRow(['  Categoria', 'Total (R$)', 'Média (R$)', 'Máximo (R$)', 'Mínimo (R$)', 'Registros']);
  styleHeader(header, COLS);
  for (let i = 2; i <= COLS; i++) {
    header.getCell(i).alignment = { horizontal: 'right', vertical: 'middle' };
  }

  comparison.forEach((cat, idx) => {
    const lightBg = lightenHex(cat.color, 0.88);
    const row     = ws.addRow([`  ${cat.category}`, cat.total, cat.average, cat.max, cat.min, cat.count]);
    styleDataRow(row, COLS, idx % 2 === 0 ? WHITE : lightBg);
    row.getCell(1).font = { bold: true, size: 10, name: 'Calibri', color: { argb: toArgb(cat.color) } };
    row.getCell(1).fill = fillSolid(lightBg);
    for (let c = 2; c <= 5; c++) {
      row.getCell(c).numFmt    = '"R$" #,##0.00';
      row.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
    }
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  // Linha de totais
  const totals = ws.addRow([
    '  TOTAL / MÉDIA',
    comparison.reduce((s, c) => s + c.total, 0),
    comparison.reduce((s, c) => s + c.average, 0) / (comparison.length || 1),
    Math.max(...comparison.map((c) => c.max)),
    Math.min(...comparison.map((c) => c.min)),
    comparison.reduce((s, c) => s + c.count, 0),
  ]);
  styleDataRow(totals, COLS, `FF${BRAND}`, { bold: true });
  totals.eachCell((c) => { c.font = { bold: true, size: 10, name: 'Calibri', color: { argb: WHITE } }; });
  for (let c = 2; c <= 5; c++) {
    totals.getCell(c).numFmt    = '"R$" #,##0.00';
    totals.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
  }
  totals.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
}

// ─── Aba 5: Dados Completos ────────────────────────────────

function buildFullDataSheet(
  wb: ExcelJS.Workbook,
  tableData: ExportData['tableData'],
  catColorMap: Map<string, string>
) {
  const ws = wb.addWorksheet('Dados Completos', {
    tabColor: { argb: 'FF8B5CF6' },
    views: [{ state: 'frozen', ySplit: 2, showGridLines: false }],
  });

  const COLS = 7;
  ws.columns = [
    { width: 14 }, // Data
    { width: 16 }, // Categoria
    { width: 24 }, // Métrica
    { width: 20 }, // Valor
    { width: 20 }, // Valor Anterior
    { width: 16 }, // Variação (%)
    { width: 12 }, // ID
  ];

  addTitle(ws, '  Dados Completos', COLS);
  const header = ws.addRow(['  Data', '  Categoria', '  Métrica', 'Valor (R$)', 'Valor Anterior', 'Variação (%)', 'ID']);
  styleHeader(header, COLS);
  header.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  header.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
  header.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  header.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };

  tableData.forEach((row, idx) => {
    const color   = catColorMap.get(row.category) ?? '#6B7280';
    const lightBg = lightenHex(color, 0.90);
    const isNeg   = row.variation_percent !== null && row.variation_percent < 0;
    // Faixas alternadas: branco ou levemente colorido pela categoria
    const rowBg   = idx % 2 === 0 ? WHITE : lightenHex(color, 0.96);

    const exRow = ws.addRow([
      row.date,
      `  ${row.category}`,
      `  ${row.metric_name}`,
      row.value,
      row.previous_value ?? null,
      row.variation_percent !== null ? row.variation_percent / 100 : null,
      row.id,
    ]);
    styleDataRow(exRow, COLS, rowBg);

    // Data
    exRow.getCell(1).numFmt    = 'DD/MM/YYYY';
    exRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    // Categoria — fundo colorido suave + texto na cor da categoria
    exRow.getCell(2).fill = fillSolid(lightBg);
    exRow.getCell(2).font = { bold: true, size: 10, name: 'Calibri', color: { argb: toArgb(color) } };

    // Valor e Valor Anterior
    exRow.getCell(4).numFmt    = '"R$" #,##0.00';
    exRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    exRow.getCell(5).numFmt    = '"R$" #,##0.00';
    exRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

    // Variação — verde se positivo, vermelho se negativo
    const varCell = exRow.getCell(6);
    varCell.numFmt    = '+0.00%;[Red]-0.00%';
    varCell.alignment = { horizontal: 'right', vertical: 'middle' };
    if (isNeg) {
      varCell.font = { size: 10, name: 'Calibri', color: { argb: 'FFDC2626' } }; // red-600
    } else if (row.variation_percent !== null && row.variation_percent > 0) {
      varCell.font = { size: 10, name: 'Calibri', color: { argb: 'FF16A34A' } }; // green-600
    }

    exRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    exRow.getCell(7).font      = { size: 9, name: 'Calibri', color: { argb: 'FF9CA3AF' } };
  });
}
