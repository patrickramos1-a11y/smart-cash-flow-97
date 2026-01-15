import { useState, useCallback } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X,
  Eye,
  RefreshCw,
  Download,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export function ImportView() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'processing' | 'complete'>('upload');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      // Simulate preview data
      setPreviewData({
        headers: ['ID', 'Empresa', 'Tipo de Lançamento', 'Origem/Destinatário', 'Conta', 'Categoria', 'Descrição', 'Valor', 'Pago?', 'Data de Pagamento'],
        rows: [
          ['99815379', 'RAMOS ENGENHARIA', 'Recebimentos', 'INTER', 'BANCARIA', 'ACOMPANHAMENTO AMBIENTAL', 'NATURE AMAZON(Recorrente - 12/12)', 'R$ 2.277,00', 'SIM', '10/01/2026'],
          ['99951626', 'RAMOS ENGENHARIA', 'Recebimentos', 'INTER', 'BANCARIA', 'ACOMPANHAMENTO AMBIENTAL', 'AÇAI KAA (Recorrente - 12/12)', 'R$ 3.036,00', 'NÃO', '13/01/2026'],
          ['99951613', 'RAMOS ENGENHARIA', 'Recebimentos', 'INTER', 'BANCARIA', 'ACOMPANHAMENTO AMBIENTAL', '4 ELEMENTOS (Recorrente - 12/12)', 'R$ 2.277,00', 'SIM', '10/01/2026'],
        ],
        totalRows: 127
      });
      setStep('preview');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simulate preview data
      setPreviewData({
        headers: ['ID', 'Empresa', 'Tipo de Lançamento', 'Origem/Destinatário', 'Conta', 'Categoria', 'Descrição', 'Valor', 'Pago?', 'Data de Pagamento'],
        rows: [
          ['99815379', 'RAMOS ENGENHARIA', 'Recebimentos', 'INTER', 'BANCARIA', 'ACOMPANHAMENTO AMBIENTAL', 'NATURE AMAZON(Recorrente - 12/12)', 'R$ 2.277,00', 'SIM', '10/01/2026'],
          ['99951626', 'RAMOS ENGENHARIA', 'Recebimentos', 'INTER', 'BANCARIA', 'ACOMPANHAMENTO AMBIENTAL', 'AÇAI KAA (Recorrente - 12/12)', 'R$ 3.036,00', 'NÃO', '13/01/2026'],
          ['99951613', 'RAMOS ENGENHARIA', 'Recebimentos', 'INTER', 'BANCARIA', 'ACOMPANHAMENTO AMBIENTAL', '4 ELEMENTOS (Recorrente - 12/12)', 'R$ 2.277,00', 'SIM', '10/01/2026'],
        ],
        totalRows: 127
      });
      setStep('preview');
    }
  };

  const handleImport = () => {
    setStep('processing');
    // Simulate processing
    setTimeout(() => {
      setStep('complete');
    }, 2000);
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData(null);
    setStep('upload');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Importar Lançamentos</h2>
        <p className="text-muted-foreground">
          Importe seus lançamentos financeiros a partir de um arquivo Excel (XLSX/XLS)
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4">
        {['upload', 'preview', 'mapping', 'processing', 'complete'].map((s, index) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === s ? "bg-primary text-primary-foreground" :
              ['upload', 'preview', 'mapping', 'processing', 'complete'].indexOf(step) > index 
                ? "bg-income text-income-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {['upload', 'preview', 'mapping', 'processing', 'complete'].indexOf(step) > index ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 4 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center transition-all",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground mb-1">
                Arraste seu arquivo XLSX aqui
              </p>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar
              </p>
            </div>
            <label className="btn-primary cursor-pointer">
              <Upload className="w-4 h-4" />
              Selecionar Arquivo
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && previewData && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {previewData.totalRows} registros encontrados
                </p>
              </div>
            </div>
            <button onClick={resetImport} className="btn-ghost">
              <X className="w-4 h-4" />
              Remover
            </button>
          </div>

          {/* Preview table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview dos Dados
              </h3>
              <span className="text-sm text-muted-foreground">
                Mostrando 3 de {previewData.totalRows} registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {previewData.headers.map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mapping info */}
          <div className="bg-info-muted rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-info mt-0.5" />
              <div>
                <p className="font-medium text-info">Mapeamento Automático</p>
                <p className="text-sm text-info/80 mt-1">
                  As colunas do arquivo foram mapeadas automaticamente. 
                  Valores monetários serão convertidos, datas padronizadas e campos validados.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button onClick={resetImport} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleImport} className="btn-primary">
              Importar {previewData.totalRows} Registros
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Processando Importação</h3>
          <p className="text-muted-foreground">
            Aguarde enquanto os dados são validados e importados...
          </p>
          <div className="w-64 h-2 bg-muted rounded-full mx-auto mt-6 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-income-muted flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-income" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Importação Concluída!</h3>
          <p className="text-muted-foreground mb-6">
            {previewData?.totalRows} registros foram importados com sucesso.
          </p>
          
          <div className="bg-card rounded-xl border border-border p-4 max-w-sm mx-auto mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Importados</p>
                <p className="text-lg font-semibold text-income">{previewData?.totalRows}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Com Erro</p>
                <p className="text-lg font-semibold text-muted-foreground">0</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={resetImport} className="btn-secondary">
              Nova Importação
            </button>
            <button className="btn-primary">
              Ver Lançamentos
            </button>
          </div>
        </div>
      )}

      {/* Import History */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Histórico de Importações</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-income" />
              <div>
                <p className="font-medium text-foreground">categoria-transacao-financeiras.xlsx</p>
                <p className="text-sm text-muted-foreground">15/01/2026 às 14:30 • 127 registros</p>
              </div>
            </div>
            <button className="btn-ghost text-sm">
              <Download className="w-4 h-4" />
              Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
