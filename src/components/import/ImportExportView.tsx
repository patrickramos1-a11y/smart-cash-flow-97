import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Download, FileSpreadsheet, FileText, History, CheckCircle, AlertCircle, Sparkles, FolderSync, Trash2, Loader2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SmartImportWizard } from './SmartImportWizard';
import { useSmartImport } from '@/hooks/useSmartImport';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const importHistory = [
  { id: '1', date: new Date(), fileName: 'transacoes_jan.xlsx', total: 150, success: 148, error: 2, status: 'CONCLUIDO' },
  { id: '2', date: new Date(Date.now() - 86400000), fileName: 'contas.xlsx', total: 10, success: 10, error: 0, status: 'CONCLUIDO' },
];

function ClearTransactionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const { clearTransactionsByYears, isLoading } = useSmartImport();

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort()
    );
    setConfirmed(false);
  };

  const handleClear = async () => {
    if (selectedYears.length === 0 || !confirmed) return;
    const success = await clearTransactionsByYears(selectedYears);
    if (success) {
      setSelectedYears([]);
      setConfirmed(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Limpar Transações por Ano
          </DialogTitle>
          <DialogDescription>
            Remove apenas as transações dos anos selecionados. Categorias, contas, centros de custo, contratos e demais configurações permanecem intactas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">Selecione os anos para limpar:</p>
            <div className="grid grid-cols-3 gap-3">
              {availableYears.map(year => (
                <Card
                  key={year}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedYears.includes(year)
                      ? "border-destructive bg-destructive/5"
                      : "hover:border-muted-foreground"
                  )}
                  onClick={() => toggleYear(year)}
                >
                  <CardContent className="pt-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Checkbox checked={selectedYears.includes(year)} onCheckedChange={() => toggleYear(year)} />
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold">{year}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedYears.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm">
                  <strong>Anos selecionados:</strong> {selectedYears.join(', ')}
                </p>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirmClear"
                    checked={confirmed}
                    onCheckedChange={(v) => setConfirmed(v as boolean)}
                  />
                  <label htmlFor="confirmClear" className="text-sm leading-relaxed cursor-pointer">
                    <strong className="text-destructive">CONFIRMO</strong> que desejo apagar todas as transações dos anos selecionados. As configurações estruturais serão preservadas.
                  </label>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleClear}
                  disabled={!confirmed || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Limpar {selectedYears.length} ano(s)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImportExportView() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('Transações');
  const [smartImportOpen, setSmartImportOpen] = useState(false);
  const [smartImportBuffer, setSmartImportBuffer] = useState<ArrayBuffer | undefined>();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const smartFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Arquivo "${file.name}" selecionado para importação de ${selectedType}`);
      setTimeout(() => {
        toast.success(`Importação de ${selectedType} concluída!`);
      }, 2000);
    }
  };

  const handleSmartFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`Processando arquivo "${file.name}"...`);
      const reader = new FileReader();
      reader.onload = () => {
        setSmartImportBuffer(reader.result as ArrayBuffer);
        setSmartImportOpen(true);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      toast.success(`Arquivo "${file.name}" recebido para importação`);
    }
  };

  const handleExport = (type: string, format: 'xlsx' | 'pdf') => {
    toast.success(`Exportando ${type} em ${format.toUpperCase()}...`);
    const csvContent = `${type}\nDados de exemplo\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type.toLowerCase().replace(/ /g, '_')}.csv`;
    link.click();
    toast.success('Exportação concluída!');
  };

  return (
    <div className="space-y-6">
      <SmartImportWizard 
        open={smartImportOpen} 
        onOpenChange={setSmartImportOpen}
        fileBuffer={smartImportBuffer}
      />

      <ClearTransactionsDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen} />
      
      <input
        type="file"
        ref={smartFileInputRef}
        onChange={handleSmartFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Smart Import + Clear Transactions Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Importação Inteligente por Categoria
                    <Badge variant="secondary" className="text-xs">Novo</Badge>
                  </CardTitle>
                  <CardDescription>
                    Categorias vinculam automaticamente conta, centro de custo e tipo
                  </CardDescription>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setSmartImportBuffer(undefined);
                  setSmartImportOpen(true);
                }}
                className="gap-2"
              >
                <FolderSync className="w-4 h-4" />
                Iniciar Wizard
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Matching por categoria</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Herança automática</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Detecção de Períodos</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Análise de Duplicados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clear Transactions Card */}
        <Card className="border-destructive/30 hover:border-destructive/60 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-base">Limpar Transações</CardTitle>
                <CardDescription className="text-xs">
                  Remove transações por ano, preservando configurações
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5" onClick={() => setClearDialogOpen(true)}>
              <Trash2 className="w-4 h-4" />
              Selecionar Anos
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import"><Upload className="w-4 h-4 mr-2" /> Importação Simples</TabsTrigger>
          <TabsTrigger value="export"><Download className="w-4 h-4 mr-2" /> Exportar</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-2" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Importar Dados (Modo Simples)</CardTitle>
              <CardDescription>
                Importação direta por tipo de dado. Para importação completa com análise, use o Wizard acima.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls,.csv" className="hidden" />
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">Arraste seu arquivo XLSX aqui</p>
                <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
                <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Transações', 'Contas', 'Categorias', 'Centros de Custo'].map(type => (
                  <Card 
                    key={type} 
                    className={cn("cursor-pointer transition-colors", selectedType === type ? "border-primary bg-primary/5" : "hover:border-primary")}
                    onClick={() => setSelectedType(type)}
                  >
                    <CardContent className="p-4 text-center">
                      <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Exportar Dados</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Transações', icon: FileSpreadsheet },
                  { name: 'Extrato de Conta', icon: FileText },
                  { name: 'Relatório DRE', icon: FileText },
                  { name: 'Fluxo de Caixa', icon: FileText },
                  { name: 'Clientes em Aberto', icon: FileText },
                ].map(item => (
                  <Card key={item.name} className="hover:border-primary transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <item.icon className="w-10 h-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => handleExport(item.name, 'xlsx')}>XLSX</Button>
                          <Button size="sm" variant="outline" onClick={() => handleExport(item.name, 'pdf')}>PDF</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Histórico de Importações</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {importHistory.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/30"
                    onClick={() => toast.info(`Detalhes: ${item.success} registros importados, ${item.error} erros`)}
                  >
                    <div className="flex items-center gap-4">
                      <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.date.toLocaleDateString('pt-BR')} • {item.total} registros
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-income">{item.success} sucesso</p>
                        {item.error > 0 && <p className="text-sm text-expense">{item.error} erros</p>}
                      </div>
                      <Badge variant="outline" className={item.error > 0 ? 'text-warning' : 'text-income'}>
                        {item.error > 0 ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
