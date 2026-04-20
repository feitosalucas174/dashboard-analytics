/**
 * Lançamentos — página de importação de dados via planilha
 *
 * ⚠️ MOCK: a etapa de "envio ao servidor" é simulada.
 *    Em produção, o botão "Importar" chamaria POST /api/import
 *    passando os dados parseados. A lógica de leitura do arquivo
 *    e validação é real; apenas o envio é fictício.
 */

import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, Download, CheckCircle2,
  AlertTriangle, X, ChevronRight, Info, RefreshCw,
  Table2, FlaskConical,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { formatDate, formatCurrency } from '../utils/formatters';

// ─── Tipos ────────────────────────────────────────────────

interface ParsedRow {
  linha:      number;
  data:       string;
  categoria:  string;
  metrica:    string;
  valor:      number;
  valid:      boolean;
  erros:      string[];
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

const CATEGORIAS_VALIDAS = ['Vendas', 'Marketing', 'Operações', 'Financeiro', 'RH'];

const CAT_COLORS: Record<string, string> = {
  Vendas:     '#6366f1',
  Marketing:  '#f59e0b',
  Operações:  '#10b981',
  Financeiro: '#ef4444',
  RH:         '#8b5cf6',
};

// ─── Helpers ──────────────────────────────────────────────

function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  // Número serial do Excel (dias desde 1900-01-01)
  if (typeof raw === 'number') {
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  const str = String(raw).trim();
  // DD/MM/YYYY
  const dmy = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return null;
}

function parseValue(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(/[R$\s.]/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

function validateRow(row: Record<string, unknown>, index: number): ParsedRow {
  const erros: string[] = [];

  const data      = parseDate(row['Data'] ?? row['data'] ?? row['DATE']);
  const categoria = String(row['Categoria'] ?? row['categoria'] ?? row['CATEGORIA'] ?? '').trim();
  const metrica   = String(row['Métrica']   ?? row['metrica']   ?? row['Metrica']   ?? row['METRICA'] ?? '').trim();
  const valor     = parseValue(row['Valor'] ?? row['valor']     ?? row['VALOR']);

  if (!data)               erros.push('Data inválida ou ausente');
  if (!categoria)          erros.push('Categoria ausente');
  else if (!CATEGORIAS_VALIDAS.includes(categoria))
    erros.push(`Categoria "${categoria}" inválida`);
  if (!metrica)            erros.push('Métrica ausente');
  if (valor === null)      erros.push('Valor inválido ou ausente');
  if (valor !== null && valor < 0) erros.push('Valor não pode ser negativo');

  return {
    linha:     index + 2,
    data:      data    ?? '',
    categoria: categoria,
    metrica:   metrica,
    valor:     valor   ?? 0,
    valid:     erros.length === 0,
    erros,
  };
}

// ─── Download do template ─────────────────────────────────

async function downloadTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dashboard Analytics';

  // ── Aba 1: Dados ────────────────────────────────────────
  const ws = wb.addWorksheet('Dados', { views: [{ showGridLines: false }] });

  ws.columns = [
    { header: 'Data',      key: 'data',      width: 14 },
    { header: 'Categoria', key: 'categoria', width: 16 },
    { header: 'Métrica',   key: 'metrica',   width: 28 },
    { header: 'Valor',     key: 'valor',     width: 18 },
  ];

  // Estilo do cabeçalho
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border    = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };
  });

  // Linhas de exemplo
  const examples = [
    { data: '15/04/2026', categoria: 'Vendas',     metrica: 'Receita Bruta',      valor: 85000   },
    { data: '15/04/2026', categoria: 'Marketing',  metrica: 'Leads Gerados',       valor: 1200    },
    { data: '15/04/2026', categoria: 'Operações',  metrica: 'Pedidos Processados', valor: 340     },
    { data: '15/04/2026', categoria: 'Financeiro', metrica: 'Faturamento',         valor: 210000  },
    { data: '15/04/2026', categoria: 'RH',         metrica: 'Colaboradores Ativos',valor: 48      },
    { data: '16/04/2026', categoria: 'Vendas',     metrica: 'Receita Bruta',      valor: 91500   },
    { data: '16/04/2026', categoria: 'Marketing',  metrica: 'Impressões',          valor: 54000   },
    { data: '16/04/2026', categoria: 'Operações',  metrica: 'SLA Atingido',        valor: 98      },
    { data: '16/04/2026', categoria: 'Financeiro', metrica: 'Custo Operacional',   valor: 67000   },
    { data: '16/04/2026', categoria: 'RH',         metrica: 'Satisfação',          valor: 87      },
  ];

  examples.forEach((ex, i) => {
    const row = ws.addRow([ex.data, ex.categoria, ex.metrica, ex.valor]);
    const bg  = i % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB';
    row.height = 20;
    row.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font      = { size: 10, name: 'Calibri' };
      cell.border    = {
        top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      cell.alignment = { vertical: 'middle' };
    });
    const catColor = CAT_COLORS[ex.categoria];
    if (catColor) {
      row.getCell(2).font = {
        bold: true, size: 10, name: 'Calibri',
        color: { argb: 'FF' + catColor.replace('#', '').toUpperCase() },
      };
    }
    row.getCell(4).numFmt    = '"R$" #,##0.00';
    row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  // Validação de lista para coluna Categoria (B2:B1000)
  ws.dataValidations.add('B2:B1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"Vendas,Marketing,Operações,Financeiro,RH"'],
    showErrorMessage: true,
    errorTitle: 'Categoria inválida',
    error: 'Escolha uma das opções: Vendas, Marketing, Operações, Financeiro, RH',
  });

  // ── Aba 2: Instruções ───────────────────────────────────
  const wsInfo = wb.addWorksheet('Instruções', {
    tabColor: { argb: 'FFF59E0B' },
    views: [{ showGridLines: false }],
  });
  wsInfo.columns = [{ width: 60 }, { width: 30 }];

  const instrucoes = [
    ['📋 INSTRUÇÕES DE PREENCHIMENTO', ''],
    ['', ''],
    ['Coluna', 'Formato / Valores aceitos'],
    ['Data',      'DD/MM/AAAA  ou  AAAA-MM-DD'],
    ['Categoria', 'Vendas | Marketing | Operações | Financeiro | RH'],
    ['Métrica',   'Nome livre da métrica (ex: Receita Bruta)'],
    ['Valor',     'Número positivo (ex: 1500,50 ou 1500.50)'],
    ['', ''],
    ['⚠️  IMPORTANTE', ''],
    ['• Não altere os nomes das colunas da linha 1', ''],
    ['• Datas inválidas serão rejeitadas na validação', ''],
    ['• Categorias fora da lista serão rejeitadas', ''],
    ['• Valores negativos serão rejeitados', ''],
    ['• Máximo de 5.000 linhas por importação', ''],
    ['', ''],
    ['💡 DICA', ''],
    ['Use a aba "Dados" como modelo e apenas substitua os valores de exemplo.', ''],
  ];

  instrucoes.forEach((row, i) => {
    const wsRow = wsInfo.addRow(row);
    wsRow.height = 22;
    if (i === 0) {
      wsRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF6366F1' }, name: 'Calibri' };
    } else if (i === 2) {
      wsRow.getCell(1).font = { bold: true, size: 11, name: 'Calibri' };
      wsRow.getCell(2).font = { bold: true, size: 11, name: 'Calibri' };
      wsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      wsRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    } else if (row[0]?.toString().startsWith('⚠️') || row[0]?.toString().startsWith('💡')) {
      wsRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFCA8A04' }, name: 'Calibri' };
    }
  });

  // Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = 'modelo-lancamento-dashboard.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Componente principal ─────────────────────────────────

export default function Lancamentos() {
  const [step,        setStep]        = useState<Step>('upload');
  const [rows,        setRows]        = useState<ParsedRow[]>([]);
  const [fileName,    setFileName]    = useState('');
  const [dragging,    setDragging]    = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows   = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  // ── Parse do arquivo ──────────────────────────────────
  const parseFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Formato não suportado. Use .xlsx, .xls ou .csv');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data    = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb      = XLSX.read(data, { type: 'array', cellDates: false });
      // Usa primeira aba que não seja "Instruções"
      const sheetName = wb.SheetNames.find((n) => n !== 'Instruções') ?? wb.SheetNames[0];
      const ws        = wb.Sheets[sheetName];
      const jsonRows  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const parsed    = jsonRows.slice(0, 5000).map((r, i) => validateRow(r, i));
      setRows(parsed);
      setStep('preview');
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // ── Mock de importação ────────────────────────────────
  const handleImport = () => {
    setStep('importing');
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) {
        clearInterval(interval);
        setProgress(100);
        setImportedCount(validRows.length);
        setTimeout(() => setStep('done'), 400);
      } else {
        setProgress(Math.min(p, 99));
      }
    }, 180);
  };

  const reset = () => {
    setStep('upload');
    setRows([]);
    setFileName('');
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">

      {/* Título */}
      <div className="flex items-center gap-3">
        <Upload className="w-5 h-5 text-indigo-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Lançamento de Dados
        </h2>
        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
          <FlaskConical className="w-3 h-3" /> PROTÓTIPO / MOCK
        </span>
      </div>

      {/* Banner de aviso */}
      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold mb-1">Esta funcionalidade é um protótipo demonstrativo.</p>
          <p className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
            A leitura e validação da planilha são reais (feitas no navegador). Porém o botão
            <strong> "Importar para o Sistema"</strong> simula o envio — nenhum dado é gravado
            no banco de dados. Em produção, este passo chamaria <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">POST /api/import</code> com os
            registros validados.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <StepIndicator current={step} />

      {/* ── ETAPA 1: Upload ── */}
      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Download do modelo */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                1. Baixe o modelo
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use nossa planilha modelo com exemplos e validações já configuradas.
              Tem dropdown para Categoria e instruções na segunda aba.
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {['Data (DD/MM/AAAA)', 'Categoria (lista validada)', 'Métrica (texto livre)', 'Valor (número positivo)'].map((col) => (
                <div key={col} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                  {col}
                </div>
              ))}
            </div>
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar modelo .xlsx
            </button>
          </div>

          {/* Zona de upload */}
          <div className="lg:col-span-2">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-4 h-full min-h-[200px]
                border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${dragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10'
                }
              `}
            >
              <div className={`p-4 rounded-full transition-colors ${dragging ? 'bg-indigo-100 dark:bg-indigo-800/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Upload className={`w-8 h-8 ${dragging ? 'text-indigo-600' : 'text-gray-400'}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {dragging ? 'Solte para carregar' : 'Arraste o arquivo aqui'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                  .xlsx · .xls · .csv · máx. 5.000 linhas
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ETAPA 2: Preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">

          {/* Resumo do arquivo */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm">
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
            </div>
            <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
              {rows.length} linhas lidas
            </span>
            <span className="text-xs px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
              ✓ {validRows.length} válidas
            </span>
            {invalidRows.length > 0 && (
              <span className="text-xs px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-medium">
                ✗ {invalidRows.length} com erros
              </span>
            )}
            <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-3.5 h-3.5" /> Trocar arquivo
            </button>
          </div>

          {/* Erros de validação */}
          {invalidRows.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {invalidRows.length} linha(s) com erros — serão ignoradas na importação
                </p>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {invalidRows.slice(0, 15).map((r) => (
                  <p key={r.linha} className="text-xs text-red-600 dark:text-red-400">
                    <span className="font-semibold">Linha {r.linha}:</span> {r.erros.join(' · ')}
                  </p>
                ))}
                {invalidRows.length > 15 && (
                  <p className="text-xs text-red-500">… e mais {invalidRows.length - 15} erros.</p>
                )}
              </div>
            </div>
          )}

          {/* Tabela de preview */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Table2 className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Preview — {validRows.length > 0 ? `mostrando ${Math.min(50, validRows.length)} de ${validRows.length} registros válidos` : 'sem registros válidos'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60">
                    {['', 'Data', 'Categoria', 'Métrica', 'Valor'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row) => (
                    <tr
                      key={row.linha}
                      className={`border-t border-gray-100 dark:border-gray-800 ${
                        !row.valid ? 'bg-red-50/60 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-3 py-2">
                        {row.valid
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          : (
                            <span title={row.erros.join('\n')}>
                              <X className="w-3.5 h-3.5 text-red-500" />
                            </span>
                          )
                        }
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {row.data ? formatDate(row.data) : <span className="text-red-400">—</span>}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.categoria ? (
                          <span
                            className="inline-flex items-center gap-1 font-medium"
                            style={{ color: CAT_COLORS[row.categoria] ?? '#6B7280' }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: CAT_COLORS[row.categoria] ?? '#6B7280' }}
                            />
                            {row.categoria}
                          </span>
                        ) : <span className="text-red-400">inválida</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                        {row.metrica || <span className="text-red-400">—</span>}
                      </td>
                      <td className="px-4 py-2 font-mono font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                        {row.valor > 0
                          ? formatCurrency(row.valor)
                          : <span className="text-red-400">inválido</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botão importar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>O envio é simulado — nenhum dado será gravado no banco.</span>
            </div>
            <button
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar {validRows.length} registro{validRows.length !== 1 ? 's' : ''} para o sistema
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── ETAPA 3: Importando ── */}
      {step === 'importing' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <RefreshCw className="w-16 h-16 text-indigo-500 animate-spin" style={{ animationDuration: '1.2s' }} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Enviando dados…
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Processando {validRows.length} registros válidos
            </p>
          </div>
          {/* Barra de progresso */}
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5" />
            Simulação — nenhum dado real está sendo gravado
          </p>
        </div>
      )}

      {/* ── ETAPA 4: Concluído ── */}
      {step === 'done' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Importação concluída!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-semibold text-indigo-500">{importedCount} registros</span> foram
              processados com sucesso.
            </p>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            {[
              { label: 'Registros enviados', value: importedCount,               color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Com erros (ignorados)', value: invalidRows.length,        color: 'text-red-500' },
              { label: 'Total lido',            value: rows.length,               color: 'text-gray-700 dark:text-gray-300' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
            <FlaskConical className="w-3.5 h-3.5 flex-shrink-0" />
            Lembrete: esta foi uma simulação. Nenhum dado foi gravado no MySQL.
          </div>

          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Nova importação
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stepper visual ───────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step | 'done'; label: string }[] = [
    { key: 'upload',    label: 'Upload'    },
    { key: 'preview',   label: 'Revisar'   },
    { key: 'importing', label: 'Importar'  },
    { key: 'done',      label: 'Concluído' },
  ];

  const idx = (s: Step) => steps.findIndex((x) => x.key === s);
  const cur  = idx(current);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done   = i < cur;
        const active = i === cur;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done   ? 'bg-indigo-500 text-white' : ''}
                ${active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50' : ''}
                ${!done && !active ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500' : ''}
              `}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : done ? 'text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 rounded transition-all ${i < cur ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
