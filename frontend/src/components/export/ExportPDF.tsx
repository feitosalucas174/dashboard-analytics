import { FileText, Loader2 } from 'lucide-react';

interface ExportPDFProps {
  onClick:  () => void;
  loading:  boolean;
}

export default function ExportPDF({ onClick, loading }: ExportPDFProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <FileText className="w-4 h-4" />
      }
      {loading ? 'Gerando PDF...' : 'Exportar PDF'}
    </button>
  );
}
