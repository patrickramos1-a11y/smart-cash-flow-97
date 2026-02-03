import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileSpreadsheet, FileText, History, CheckCircle, AlertCircle, Sparkles, FolderSync } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SmartImportWizard } from './SmartImportWizard';

const importHistory = [
  { id: '1', date: new Date(), fileName: 'transacoes_jan.xlsx', total: 150, success: 148, error: 2, status: 'CONCLUIDO' },
  { id: '2', date: new Date(Date.now() - 86400000), fileName: 'contas.xlsx', total: 10, success: 10, error: 0, status: 'CONCLUIDO' },
];

export function ImportExportView() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('Transações');
  const [smartImportOpen, setSmartImportOpen] = useState(false);
  const [smartImportBuffer, setSmartImportBuffer] = useState<ArrayBuffer | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const smartFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Arquivo "${file.name}" selecionado para importação de ${selectedType}`);
      // Simulate import
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
    
    // Create dummy CSV
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
      {/* Smart Import Wizard */}
      <SmartImportWizard 
        open={smartImportOpen} 
        onOpenChange={setSmartImportOpen}
        fileBuffer={smartImportBuffer}
      />
      
      <input
        type="file"
        ref={smartFileInputRef}
        onChange={handleSmartFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Smart Import Card - Prominent */}
      <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Importação Inteligente por Período
                  <Badge variant="secondary" className="text-xs">Novo</Badge>
                </CardTitle>
                <CardDescription>
                  Reset opcional, detecção de duplicados, importação incremental por ano
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
              <span>Zerar ou Incremental</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Detecção de Períodos</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Análise de Duplicados</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Auditoria Completa</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
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
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedType === type ? "border-primary bg-primary/5" : "hover:border-primary"
                    )}
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
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
            </CardHeader>
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
            <CardHeader>
              <CardTitle>Histórico de Importações</CardTitle>
            </CardHeader>
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
