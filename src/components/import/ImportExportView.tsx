import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileSpreadsheet, FileText, History, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const importHistory = [
  { id: '1', date: new Date(), fileName: 'transacoes_jan.xlsx', total: 150, success: 148, error: 2, status: 'CONCLUIDO' },
  { id: '2', date: new Date(Date.now() - 86400000), fileName: 'contas.xlsx', total: 10, success: 10, error: 0, status: 'CONCLUIDO' },
];

export function ImportExportView() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import"><Upload className="w-4 h-4 mr-2" /> Importar</TabsTrigger>
          <TabsTrigger value="export"><Download className="w-4 h-4 mr-2" /> Exportar</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-2" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Importar Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={() => setDragActive(false)}
              >
                <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">Arraste seu arquivo XLSX aqui</p>
                <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
                <Button><Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo</Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Transações', 'Contas', 'Categorias', 'Centros de Custo'].map(type => (
                  <Card key={type} className="cursor-pointer hover:border-primary transition-colors">
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
                  <Card key={item.name} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <item.icon className="w-10 h-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline">XLSX</Button>
                          <Button size="sm" variant="outline">PDF</Button>
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
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
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
