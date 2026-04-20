import { FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportExcelProps {
  onClick:  () => void;
  loading:  boolean;
}

export default function ExportExcel({ onClick, loading }: ExportExcelProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <FileSpreadsheet className="w-4 h-4" />
      }
      {loading ? 'Gerando Excel...' : 'Exportar Excel'}
    </button>
  );
}
