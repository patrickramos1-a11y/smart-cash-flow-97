import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle, 
  ArrowRight, ArrowLeft, Database, Calendar, Loader2,
  FolderSync, Users, Building2, Layers, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSmartImport } from '@/hooks/useSmartImport';

interface SmartImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileContent?: string;
  fileBuffer?: ArrayBuffer;
}

type WizardStep = 'mode' | 'upload' | 'preview' | 'periods' | 'analysis' | 'import' | 'complete';

export function SmartImportWizard({ open, onOpenChange, fileContent, fileBuffer }: SmartImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('mode');
  const [importMode, setImportMode] = useState<'reset' | 'incremental'>('incremental');
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [importStats, setImportStats] = useState<Record<string, number> | null>(null);
  const [localFileBuffer, setLocalFileBuffer] = useState<ArrayBuffer | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isLoading,
    parsedData,
    setParsedData,
    analysisResult,
    setAnalysisResult,
    parseFileContent,
    parseXlsxFile,
    analyzeData,
    resetDatabase,
    executeImport
  } = useSmartImport();

  // Handle file upload within wizard
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLocalFileBuffer(reader.result as ArrayBuffer);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle file content when provided
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

  // Handle mode selection and proceed
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

  // Handle year toggle
  const toggleYear = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort()
    );
  };

  // Handle analysis
  const handleAnalyze = async () => {
    if (!parsedData || selectedYears.length === 0) {
      toast.error('Selecione pelo menos um período');
      return;
    }

    const result = await analyzeData(parsedData, selectedYears);
    setAnalysisResult(result);
    setCurrentStep('analysis');
  };

  // Handle import execution
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

  // Reset wizard
  const handleClose = () => {
    setCurrentStep('mode');
    setImportMode('incremental');
    setConfirmReset(false);
    setSelectedYears([]);
    setParsedData(null);
    setAnalysisResult(null);
    setImportStats(null);
    setLocalFileBuffer(undefined);
    onOpenChange(false);
  };

  const hasFile = !!(localFileBuffer || fileBuffer || fileContent);

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'mode', label: 'Modo' },
    { key: 'upload', label: 'Upload' },
    { key: 'preview', label: 'Preview' },
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
            Importação Inteligente por Período
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2 px-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, idx) => (
              <span 
                key={step.key} 
                className={cn(
                  "transition-colors",
                  idx <= stepIndex ? "text-primary font-medium" : ""
                )}
              >
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
                Escolha como deseja realizar a importação:
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={cn(
                    "cursor-pointer transition-all",
                    importMode === 'reset' ? "border-destructive bg-destructive/5" : "hover:border-muted-foreground"
                  )}
                  onClick={() => setImportMode('reset')}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-destructive" />
                      <CardTitle className="text-base">Zerar e Implantar</CardTitle>
                    </div>
                    <CardDescription>
                      Primeira implantação ou reset completo
                    </CardDescription>
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
                  className={cn(
                    "cursor-pointer transition-all",
                    importMode === 'incremental' ? "border-primary bg-primary/5" : "hover:border-muted-foreground"
                  )}
                  onClick={() => setImportMode('incremental')}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base">Importação Incremental</CardTitle>
                    </div>
                    <CardDescription>
                      Adicionar dados sem duplicar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Mantém dados existentes</li>
                      <li>• Detecta duplicados automaticamente</li>
                      <li>• Permite importar outros anos</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {importMode === 'reset' && (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="confirmReset"
                        checked={confirmReset}
                        onCheckedChange={(checked) => setConfirmReset(checked as boolean)}
                      />
                      <label htmlFor="confirmReset" className="text-sm leading-relaxed cursor-pointer">
                        <strong className="text-destructive">ATENÇÃO:</strong> Confirmo que desejo APAGAR TODOS os dados 
                        do sistema (clientes, contratos, transações, contas, categorias, centros de custo, 
                        configurações) antes de iniciar a importação. Esta ação é irreversível.
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
                Faça upload da planilha principal com as transações e estrutura financeira:
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLocalFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />

              <Card 
                className={cn(
                  "border-dashed border-2 cursor-pointer transition-all",
                  hasFile ? "border-primary bg-primary/5" : "hover:border-primary"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileSpreadsheet className={cn(
                    "w-16 h-16 mb-4",
                    hasFile ? "text-primary" : "text-muted-foreground/50"
                  )} />
                  <p className="text-lg font-medium mb-2">
                    {hasFile ? 'Arquivo selecionado ✓' : 'Selecione o arquivo XLSX'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {hasFile 
                      ? 'Clique em "Processar" para analisar o arquivo'
                      : 'Clique aqui ou arraste o arquivo'}
                  </p>
                  <Button 
                    variant={hasFile ? "default" : "outline"}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (hasFile) {
                        handleParseFile();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : hasFile ? (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {hasFile ? 'Processar Arquivo' : 'Selecionar Arquivo'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Formato esperado:</p>
                  <p className="text-xs text-muted-foreground">
                    Colunas: Tipo de Lançamento | Conta | Categoria | Valor | Centro de Custo | Pago? | Data | Empresa
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Preview */}
          {currentStep === 'preview' && parsedData && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Arquivo processado com sucesso. Resumo dos dados encontrados:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{parsedData.summary.totalRows}</p>
                    <p className="text-xs text-muted-foreground">Registros</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{parsedData.summary.totalAccounts}</p>
                    <p className="text-xs text-muted-foreground">Contas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{parsedData.summary.totalCategories}</p>
                    <p className="text-xs text-muted-foreground">Categorias</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{parsedData.summary.totalCostCenters}</p>
                    <p className="text-xs text-muted-foreground">Centros Custo</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{parsedData.summary.totalClients}</p>
                    <p className="text-xs text-muted-foreground">Clientes</p>
                  </CardContent>
                </Card>
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
                      <Badge key={year} variant="secondary" className="text-lg px-4 py-1">
                        {year}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="categories">
                <TabsList>
                  <TabsTrigger value="categories">Categorias</TabsTrigger>
                  <TabsTrigger value="costCenters">Centros de Custo</TabsTrigger>
                  <TabsTrigger value="accounts">Contas</TabsTrigger>
                  <TabsTrigger value="clients">Clientes</TabsTrigger>
                </TabsList>
                <TabsContent value="categories" className="max-h-48 overflow-auto">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(parsedData.categories.keys()).map(cat => (
                      <Badge key={cat} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="costCenters" className="max-h-48 overflow-auto">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(parsedData.costCenters).map(cc => (
                      <Badge key={cc} variant="outline">{cc}</Badge>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="accounts" className="max-h-48 overflow-auto">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(parsedData.accounts).map(acc => (
                      <Badge key={acc} variant="outline">{acc}</Badge>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="clients" className="max-h-48 overflow-auto">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(parsedData.clients).map(client => (
                      <Badge key={client} variant="outline">{client}</Badge>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step: Period Selection */}
          {currentStep === 'periods' && parsedData && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Selecione o(s) período(s) que deseja importar:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from(parsedData.years).sort().map(year => (
                  <Card 
                    key={year}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedYears.includes(year) 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-muted-foreground"
                    )}
                    onClick={() => toggleYear(year)}
                  >
                    <CardContent className="pt-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Checkbox 
                          checked={selectedYears.includes(year)}
                          onCheckedChange={() => toggleYear(year)}
                        />
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">{year}</p>
                      <p className="text-xs text-muted-foreground">
                        {parsedData.rows.filter(r => 
                          r.dataPagamento?.getFullYear() === year
                        ).length} registros
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedYears.length > 0 && (
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm">
                      <strong>Períodos selecionados:</strong> {selectedYears.join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total de registros a processar: {
                        parsedData.rows.filter(r => 
                          r.dataPagamento && selectedYears.includes(r.dataPagamento.getFullYear())
                        ).length
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step: Analysis */}
          {currentStep === 'analysis' && analysisResult && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Análise de duplicidade concluída. Revise os resultados:
              </p>

              <div className="grid grid-cols-3 gap-4">
                <Card className="border-green-500/50 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Novos (serão importados)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Contas: {analysisResult.newItems.accounts.length}</p>
                    <p>Categorias: {analysisResult.newItems.categories.length}</p>
                    <p>Centros Custo: {analysisResult.newItems.costCenters.length}</p>
                    <p>Clientes: {analysisResult.newItems.clients.length}</p>
                    <p className="font-bold pt-2 border-t">
                      Transações: {analysisResult.newItems.transactions.length}
                    </p>
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
                    <p>Contas: {analysisResult.duplicates.accounts.length}</p>
                    <p>Categorias: {analysisResult.duplicates.categories.length}</p>
                    <p>Centros Custo: {analysisResult.duplicates.costCenters.length}</p>
                    <p>Clientes: {analysisResult.duplicates.clients.length}</p>
                    <p className="font-bold pt-2 border-t">
                      Transações: {analysisResult.duplicates.transactions.length}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/50 bg-yellow-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      Conflitos (revisar)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Contas: {analysisResult.conflicts.accounts.length}</p>
                    <p>Categorias: {analysisResult.conflicts.categories.length}</p>
                    <p>Centros Custo: {analysisResult.conflicts.costCenters.length}</p>
                    <p>Clientes: {analysisResult.conflicts.clients.length}</p>
                    <p className="font-bold pt-2 border-t">
                      Transações: {analysisResult.conflicts.transactions.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {analysisResult.newItems.categories.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Novas categorias a criar:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.newItems.categories.map(cat => (
                        <Badge key={cat} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {currentStep === 'import' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Importando dados...</p>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto os registros são criados no sistema
              </p>
            </div>
          )}

          {/* Step: Complete */}
          {currentStep === 'complete' && importStats && (
            <div className="space-y-4 py-4">
              <div className="text-center mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Importação Concluída!</h3>
                <p className="text-muted-foreground">
                  Períodos: {selectedYears.join(', ')}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{importStats.costCenters}</p>
                    <p className="text-sm text-muted-foreground">Centros de Custo</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{importStats.accounts}</p>
                    <p className="text-sm text-muted-foreground">Contas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">{importStats.categories}</p>
                    <p className="text-sm text-muted-foreground">Categorias</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">{importStats.clients}</p>
                    <p className="text-sm text-muted-foreground">Clientes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-primary">{importStats.transactions}</p>
                    <p className="text-sm text-muted-foreground">Transações</p>
                  </CardContent>
                </Card>
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
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
            )}

            {currentStep === 'mode' && (
              <Button 
                onClick={handleModeConfirm}
                disabled={importMode === 'reset' && !confirmReset}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {currentStep === 'preview' && (
              <Button onClick={() => setCurrentStep('periods')}>
                Selecionar Períodos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {currentStep === 'periods' && (
              <Button 
                onClick={handleAnalyze}
                disabled={selectedYears.length === 0 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Analisar Dados
              </Button>
            )}

            {currentStep === 'analysis' && (
              <Button 
                onClick={handleExecuteImport}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
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
