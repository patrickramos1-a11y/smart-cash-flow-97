import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle, 
  ArrowRight, ArrowLeft, Database, Calendar, Loader2,
  FolderSync, Users, Building2, Layers, CreditCard, Tag, Link2, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSmartImport, type CategoryMapping } from '@/hooks/useSmartImport';
import { useTransactionCategories } from '@/hooks/useFinancialConfig';

interface SmartImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileContent?: string;
  fileBuffer?: ArrayBuffer;
}

type WizardStep = 'mode' | 'upload' | 'preview' | 'categories' | 'periods' | 'analysis' | 'import' | 'complete';

export function SmartImportWizard({ open, onOpenChange, fileContent, fileBuffer }: SmartImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('mode');
  const [importMode, setImportMode] = useState<'reset' | 'incremental'>('incremental');
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [importStats, setImportStats] = useState<Record<string, number> | null>(null);
  const [localFileBuffer, setLocalFileBuffer] = useState<ArrayBuffer | undefined>();
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
  const [selectedUnlinked, setSelectedUnlinked] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingCategories } = useTransactionCategories();

  const {
    isLoading,
    parsedData,
    setParsedData,
    analysisResult,
    setAnalysisResult,
    categoryMappings,
    setCategoryMappings,
    parseFileContent,
    parseXlsxFile,
    analyzeData,
    resetDatabase,
    executeImport
  } = useSmartImport();

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLocalFileBuffer(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    }
  };

  const handleParseFile = useCallback(() => {
    try {
      let data;
      const bufferToUse = localFileBuffer || fileBuffer;
      
      if (bufferToUse) {
        data = parseXlsxFile(bufferToUse);
      } else if (fileContent) {
        data = parseFileContent(fileContent);
      } else {
        toast.error('Nenhum arquivo fornecido');
        return;
      }

      setParsedData(data);
      setSelectedYears(Array.from(data.years));
      setCurrentStep('preview');
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Erro ao processar arquivo');
    }
  }, [fileContent, fileBuffer, localFileBuffer, parseFileContent, parseXlsxFile, setParsedData]);

  const handleModeConfirm = async () => {
    if (importMode === 'reset') {
      if (!confirmReset) {
        toast.error('Confirme que deseja zerar o sistema');
        return;
      }
      const success = await resetDatabase();
      if (!success) return;
    }
    setCurrentStep('upload');
  };

  const toggleYear = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort()
    );
  };

  const handleAnalyze = async () => {
    if (!parsedData || selectedYears.length === 0) {
      toast.error('Selecione pelo menos um período');
      return;
    }
    const result = await analyzeData(parsedData, selectedYears);
    setAnalysisResult(result);
    setCurrentStep('categories');
  };

  // Update a category mapping
  const updateMapping = (idx: number, updates: Partial<CategoryMapping>) => {
    const updated = [...categoryMappings];
    updated[idx] = { ...updated[idx], ...updates };
    setCategoryMappings(updated);
  };

  // Assign bulk category to unlinked transactions
  const handleBulkAssign = () => {
    if (!bulkCategoryId || !parsedData || selectedUnlinked.size === 0) return;
    const cat = existingCategories?.find(c => c.id === bulkCategoryId);
    if (!cat) return;
    
    // Update the rows with the selected category name
    const updatedRows = [...parsedData.rows];
    selectedUnlinked.forEach(idx => {
      if (analysisResult?.unlinkedTransactions[idx]) {
        const originalRow = analysisResult.unlinkedTransactions[idx];
        const rowIdx = updatedRows.indexOf(originalRow);
        if (rowIdx >= 0) {
          updatedRows[rowIdx] = { ...updatedRows[rowIdx], categoria: cat.name, mappedCategoryId: cat.id };
        }
      }
    });

    setParsedData({ ...parsedData, rows: updatedRows });
    setSelectedUnlinked(new Set());
    toast.success(`${selectedUnlinked.size} transações vinculadas à categoria "${cat.name}"`);
  };

  const handleExecuteImport = async () => {
    if (!parsedData || !analysisResult) return;
    setCurrentStep('import');
    const result = await executeImport(parsedData, analysisResult, selectedYears);
    
    if (result.success) {
      setImportStats(result.stats);
      setCurrentStep('complete');
    } else {
      setCurrentStep('analysis');
    }
  };

  const handleClose = () => {
    setCurrentStep('mode');
    setImportMode('incremental');
    setConfirmReset(false);
    setSelectedYears([]);
    setParsedData(null);
    setAnalysisResult(null);
    setImportStats(null);
    setLocalFileBuffer(undefined);
    setSelectedUnlinked(new Set());
    setBulkCategoryId('');
    onOpenChange(false);
  };

  const hasFile = !!(localFileBuffer || fileBuffer || fileContent);

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'mode', label: 'Modo' },
    { key: 'upload', label: 'Upload' },
    { key: 'preview', label: 'Preview' },
    { key: 'categories', label: 'Categorias' },
    { key: 'periods', label: 'Períodos' },
    { key: 'analysis', label: 'Análise' },
    { key: 'import', label: 'Importar' },
    { key: 'complete', label: 'Concluído' }
  ];

  const stepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderSync className="w-5 h-5 text-primary" />
            Importação Inteligente por Categoria
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2 px-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, idx) => (
              <span key={step.key} className={cn("transition-colors", idx <= stepIndex ? "text-primary font-medium" : "")}>
                {step.label}
              </span>
            ))}
          </div>
          <Progress value={(stepIndex / (steps.length - 1)) * 100} className="h-2" />
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* Step: Mode Selection */}
          {currentStep === 'mode' && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                A importação é orientada por <strong>Categoria</strong>. Conta, centro de custo e tipo são herdados automaticamente.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={cn("cursor-pointer transition-all", importMode === 'reset' ? "border-destructive bg-destructive/5" : "hover:border-muted-foreground")}
                  onClick={() => setImportMode('reset')}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-destructive" />
                      <CardTitle className="text-base">Zerar e Implantar</CardTitle>
                    </div>
                    <CardDescription>Primeira implantação ou reset completo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Apaga todos os dados existentes</li>
                      <li>• Ideal para começar do zero</li>
                      <li>• Requer confirmação explícita</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card 
                  className={cn("cursor-pointer transition-all", importMode === 'incremental' ? "border-primary bg-primary/5" : "hover:border-muted-foreground")}
                  onClick={() => setImportMode('incremental')}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base">Importação Incremental</CardTitle>
                    </div>
                    <CardDescription>Adicionar dados sem duplicar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Mantém dados existentes</li>
                      <li>• Detecta duplicados automaticamente</li>
                      <li>• Vincula por categoria existente</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {importMode === 'reset' && (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox id="confirmReset" checked={confirmReset} onCheckedChange={(checked) => setConfirmReset(checked as boolean)} />
                      <label htmlFor="confirmReset" className="text-sm leading-relaxed cursor-pointer">
                        <strong className="text-destructive">ATENÇÃO:</strong> Confirmo que desejo APAGAR TODOS os dados 
                        do sistema antes de iniciar a importação. Esta ação é irreversível.
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step: Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Faça upload da planilha. A <strong>Categoria</strong> é o campo principal — conta e centro de custo são opcionais.
              </p>
              
              <input type="file" ref={fileInputRef} onChange={handleLocalFileSelect} accept=".xlsx,.xls,.csv" className="hidden" />

              <Card 
                className={cn("border-dashed border-2 cursor-pointer transition-all", hasFile ? "border-primary bg-primary/5" : "hover:border-primary")}
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileSpreadsheet className={cn("w-16 h-16 mb-4", hasFile ? "text-primary" : "text-muted-foreground/50")} />
                  <p className="text-lg font-medium mb-2">{hasFile ? 'Arquivo selecionado ✓' : 'Selecione o arquivo XLSX'}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {hasFile ? 'Clique em "Processar" para analisar' : 'Clique aqui ou arraste o arquivo'}
                  </p>
                  <Button 
                    variant={hasFile ? "default" : "outline"}
                    onClick={(e) => { e.stopPropagation(); hasFile ? handleParseFile() : fileInputRef.current?.click(); }} 
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                     hasFile ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    {hasFile ? 'Processar Arquivo' : 'Selecionar Arquivo'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Formato esperado:</p>
                  <p className="text-xs text-muted-foreground">
                    Colunas obrigatórias: <strong>Categoria</strong> | Valor | Data
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Colunas opcionais: Tipo de Lançamento | Conta | Centro de Custo | Pago? | Empresa
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Preview */}
          {currentStep === 'preview' && parsedData && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">Arquivo processado. Resumo dos dados encontrados:</p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card><CardContent className="pt-4 text-center">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{parsedData.summary.totalRows}</p>
                  <p className="text-xs text-muted-foreground">Registros</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 text-center">
                  <Tag className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{parsedData.summary.totalCategories}</p>
                  <p className="text-xs text-muted-foreground">Categorias</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 text-center">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{parsedData.summary.totalAccounts}</p>
                  <p className="text-xs text-muted-foreground">Contas</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">{parsedData.summary.totalCostCenters}</p>
                  <p className="text-xs text-muted-foreground">Centros Custo</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{parsedData.summary.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </CardContent></Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Anos Detectados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(parsedData.years).sort().map(year => (
                      <Badge key={year} variant="secondary" className="text-lg px-4 py-1">{year}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">Categorias encontradas na planilha</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(parsedData.categories.keys()).map(cat => (
                      <Badge key={cat} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Categories - Category-centric mapping */}
          {currentStep === 'categories' && analysisResult && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Mapeie as categorias da planilha. Categorias existentes serão vinculadas automaticamente, novas serão criadas.
              </p>

              {/* Linked categories */}
              {categoryMappings.filter(m => m.action === 'link').length > 0 && (
                <Card className="border-income/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-income">
                      <Link2 className="w-4 h-4" />
                      Categorias Existentes ({categoryMappings.filter(m => m.action === 'link').length})
                    </CardTitle>
                    <CardDescription>Serão vinculadas automaticamente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {categoryMappings.filter(m => m.action === 'link').map(m => (
                        <Badge key={m.originalName} variant="secondary" className="text-income">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {m.originalName}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New categories */}
              {categoryMappings.filter(m => m.action === 'create').length > 0 && (
                <Card className="border-warning/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-warning">
                      <Plus className="w-4 h-4" />
                      Novas Categorias ({categoryMappings.filter(m => m.action === 'create').length})
                    </CardTitle>
                    <CardDescription>
                      Serão criadas automaticamente. Ou vincule a uma categoria existente:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryMappings.map((mapping, idx) => {
                      if (mapping.action !== 'create') return null;
                      return (
                        <div key={mapping.originalName} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                          <Badge variant="outline" className="shrink-0">{mapping.originalName}</Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <Select 
                            value={mapping.existingCategoryId || '__create__'}
                            onValueChange={(v) => {
                              if (v === '__create__') {
                                updateMapping(idx, { action: 'create', existingCategoryId: undefined });
                              } else {
                                updateMapping(idx, { action: 'link', existingCategoryId: v });
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1 h-8 text-xs">
                              <SelectValue placeholder="Criar nova" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__create__">
                                <div className="flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> Criar nova categoria
                                </div>
                              </SelectItem>
                              {existingCategories?.filter(c => c.active).map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }} />
                                    {c.name}
                                    <span className="text-muted-foreground text-xs">({c.type})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Unlinked transactions */}
              {analysisResult.unlinkedTransactions.length > 0 && (
                <Card className="border-destructive/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      Transações Sem Categoria ({analysisResult.unlinkedTransactions.length})
                    </CardTitle>
                    <CardDescription>Selecione e atribua uma categoria em massa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingCategories?.filter(c => c.active).map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleBulkAssign} disabled={!bulkCategoryId || selectedUnlinked.size === 0}>
                        Atribuir ({selectedUnlinked.size})
                      </Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {analysisResult.unlinkedTransactions.slice(0, 20).map((row, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs p-1 rounded hover:bg-muted/50">
                          <Checkbox 
                            checked={selectedUnlinked.has(idx)}
                            onCheckedChange={(checked) => {
                              const next = new Set(selectedUnlinked);
                              checked ? next.add(idx) : next.delete(idx);
                              setSelectedUnlinked(next);
                            }}
                          />
                          <span className="text-muted-foreground">{row.dataPagamento?.toLocaleDateString('pt-BR') || '—'}</span>
                          <span className="flex-1 truncate">{row.tipoLancamento}</span>
                          <span className="font-medium">R$ {row.valor.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step: Period Selection */}
          {currentStep === 'periods' && parsedData && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">Selecione o(s) período(s) que deseja importar:</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from(parsedData.years).sort().map(year => (
                  <Card key={year} className={cn("cursor-pointer transition-all", selectedYears.includes(year) ? "border-primary bg-primary/5" : "hover:border-muted-foreground")} onClick={() => toggleYear(year)}>
                    <CardContent className="pt-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Checkbox checked={selectedYears.includes(year)} onCheckedChange={() => toggleYear(year)} />
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">{year}</p>
                      <p className="text-xs text-muted-foreground">
                        {parsedData.rows.filter(r => r.dataPagamento?.getFullYear() === year).length} registros
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedYears.length > 0 && (
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm"><strong>Períodos selecionados:</strong> {selectedYears.join(', ')}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {parsedData.rows.filter(r => r.dataPagamento && selectedYears.includes(r.dataPagamento.getFullYear())).length} registros
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step: Analysis */}
          {currentStep === 'analysis' && analysisResult && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">Análise concluída. Revise antes de importar:</p>

              <div className="grid grid-cols-3 gap-4">
                <Card className="border-income/50 bg-income/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-income">
                      <CheckCircle2 className="w-4 h-4" />
                      Novos (serão importados)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Categorias: {analysisResult.newItems.categories.length}</p>
                    <p>Contas: {analysisResult.newItems.accounts.length}</p>
                    <p>Centros Custo: {analysisResult.newItems.costCenters.length}</p>
                    <p>Clientes: {analysisResult.newItems.clients.length}</p>
                    <p className="font-bold pt-2 border-t">Transações: {analysisResult.newItems.transactions.length}</p>
                  </CardContent>
                </Card>

                <Card className="border-muted-foreground/50 bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      Duplicados (ignorados)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Categorias: {analysisResult.duplicates.categories.length}</p>
                    <p>Contas: {analysisResult.duplicates.accounts.length}</p>
                    <p>Centros Custo: {analysisResult.duplicates.costCenters.length}</p>
                    <p>Clientes: {analysisResult.duplicates.clients.length}</p>
                    <p className="font-bold pt-2 border-t">Transações: {analysisResult.duplicates.transactions.length}</p>
                  </CardContent>
                </Card>

                <Card className="border-warning/50 bg-warning/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-warning">
                      <AlertCircle className="w-4 h-4" />
                      Sem Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>{analysisResult.unlinkedTransactions.length} transações sem vínculo</p>
                    <p className="text-xs text-muted-foreground pt-2">
                      {analysisResult.unlinkedTransactions.length > 0 
                        ? 'Volte ao passo anterior para atribuir' 
                        : 'Tudo vinculado ✓'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {currentStep === 'import' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Importando dados...</p>
              <p className="text-sm text-muted-foreground">Categorias → Contas → Transações</p>
            </div>
          )}

          {/* Step: Complete */}
          {currentStep === 'complete' && importStats && (
            <div className="space-y-4 py-4">
              <div className="text-center mb-6">
                <CheckCircle2 className="w-16 h-16 text-income mx-auto mb-4" />
                <h3 className="text-xl font-bold">Importação Concluída!</h3>
                <p className="text-muted-foreground">Períodos: {selectedYears.join(', ')}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Categorias', value: importStats.categories, color: 'text-primary' },
                  { label: 'Centros de Custo', value: importStats.costCenters, color: 'text-income' },
                  { label: 'Contas', value: importStats.accounts, color: 'text-info' },
                  { label: 'Clientes', value: importStats.clients, color: 'text-warning' },
                  { label: 'Transações', value: importStats.transactions, color: 'text-primary' },
                ].map(item => (
                  <Card key={item.label}>
                    <CardContent className="pt-4 text-center">
                      <p className={cn("text-3xl font-bold", item.color)}>{item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
                {importStats.errors > 0 && (
                  <Card className="border-destructive">
                    <CardContent className="pt-4 text-center">
                      <p className="text-3xl font-bold text-destructive">{importStats.errors}</p>
                      <p className="text-sm text-muted-foreground">Erros</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              const prevStep = steps[stepIndex - 1]?.key;
              if (prevStep) setCurrentStep(prevStep);
            }}
            disabled={stepIndex === 0 || currentStep === 'import'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {currentStep === 'complete' && (
              <Button variant="outline" onClick={handleClose}>Fechar</Button>
            )}
            {currentStep === 'mode' && (
              <Button onClick={handleModeConfirm} disabled={importMode === 'reset' && !confirmReset}>
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {currentStep === 'preview' && (
              <Button onClick={handleAnalyze} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Analisar Categorias
              </Button>
            )}
            {currentStep === 'categories' && (
              <Button onClick={() => setCurrentStep('periods')}>
                Selecionar Períodos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {currentStep === 'periods' && (
              <Button onClick={() => setCurrentStep('analysis')} disabled={selectedYears.length === 0}>
                Revisar Análise <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {currentStep === 'analysis' && (
              <Button onClick={handleExecuteImport} disabled={isLoading} className="bg-income hover:bg-income/90 text-income-foreground">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Executar Importação
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
