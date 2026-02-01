import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Edit,
  Calendar,
  User,
  CreditCard,
  FileText,
  Paperclip,
  History,
  CheckCircle,
  Wrench
} from 'lucide-react';
import {
  BacklogItem,
  BacklogProject,
  BacklogModule,
  BacklogStatus,
  statusLabels,
  categoryLabels,
  priorityLabels,
  impactLabels,
  effortLabels,
  eventTypeLabels,
  validationTypeLabels,
  useBacklogItem,
  useBacklogHistory,
  useBacklogAttachments,
  useBacklogValidations,
  useBacklogImplementationRecords,
  useUpdateBacklogStatus
} from '@/hooks/useBacklog';
import { BacklogAttachments } from './BacklogAttachments';
import { BacklogValidation } from './BacklogValidation';
import { BacklogImplementations } from './BacklogImplementations';

interface BacklogItemDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  onEditClick: () => void;
}

const statusOrder: BacklogStatus[] = [
  'IDEIA', 'EM_ANALISE', 'REFINADO', 'AGUARDANDO_RECURSOS',
  'EM_IMPLEMENTACAO', 'EM_TESTES', 'IMPLEMENTADO', 'LANCADO', 'VALIDADO', 'ARQUIVADO'
];

export function BacklogItemDetail({ open, onOpenChange, itemId, onEditClick }: BacklogItemDetailProps) {
  const { data: item, isLoading } = useBacklogItem(itemId || '');
  const { data: history } = useBacklogHistory(itemId || '');
  const { data: attachments } = useBacklogAttachments(itemId || '');
  const { data: validations } = useBacklogValidations(itemId || '');
  const { data: implementations } = useBacklogImplementationRecords(itemId || '');
  const updateStatus = useUpdateBacklogStatus();

  const [activeTab, setActiveTab] = useState('description');

  if (!itemId) return null;

  const handleStatusChange = async (newStatus: BacklogStatus) => {
    await updateStatus.mutateAsync({ id: itemId, status: newStatus });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {isLoading || !item ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <>
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl">{item.title}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>{item.project?.name}</span>
                    <span>•</span>
                    <span>{categoryLabels[item.category]}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-sm font-medium">Status:</span>
                <Select value={item.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOrder.map(s => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="flex-shrink-0">
                <TabsTrigger value="description" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Descrição
                </TabsTrigger>
                <TabsTrigger value="attachments" className="gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexos ({attachments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="implementations" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  Implementações ({implementations?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="validation" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Validação ({validations?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Histórico ({history?.length || 0})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="description" className="mt-0">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Main Description */}
                    <div className="col-span-2">
                      <Card>
                        <CardContent className="p-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                            {item.description || 'Sem descrição'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-4">
                      {/* Priority, Impact, Effort */}
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Prioridade</span>
                            <Badge variant="secondary">{priorityLabels[item.priority]}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Impacto</span>
                            <Badge variant="outline">{impactLabels[item.expected_impact]}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Esforço</span>
                            <Badge variant="outline">{effortLabels[item.effort_estimate]}</Badge>
                          </div>
                          {item.depends_on_credits && (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <CreditCard className="h-4 w-4" />
                              <span className="text-sm">Depende de Créditos</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Modules */}
                      {item.modules && item.modules.length > 0 && (
                        <Card>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm">Módulos Impactados</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex flex-wrap gap-1">
                              {item.modules.map((m: BacklogModule) => (
                                <Badge key={m.id} variant="outline" className="text-xs">
                                  {m.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Responsibles */}
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          {item.responsible_product && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Responsável Produto</p>
                                <p className="text-sm">{item.responsible_product}</p>
                              </div>
                            </div>
                          )}
                          {item.responsible_tech && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Responsável Técnico</p>
                                <p className="text-sm">{item.responsible_tech}</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Dates */}
                      <Card>
                        <CardContent className="p-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Criado:</span>
                            <span>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          </div>
                          {item.start_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Início:</span>
                              <span>{format(new Date(item.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          )}
                          {item.completion_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Conclusão:</span>
                              <span>{format(new Date(item.completion_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          )}
                          {item.release_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Lançamento:</span>
                              <span>{format(new Date(item.release_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          )}
                          {item.validation_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Validação:</span>
                              <span>{format(new Date(item.validation_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="mt-0">
                  <BacklogAttachments itemId={itemId} attachments={attachments || []} />
                </TabsContent>

                <TabsContent value="implementations" className="mt-0">
                  <BacklogImplementations itemId={itemId} records={implementations || []} />
                </TabsContent>

                <TabsContent value="validation" className="mt-0">
                  <BacklogValidation itemId={itemId} validations={validations || []} />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <Card>
                    <CardContent className="p-4">
                      {history && history.length > 0 ? (
                        <div className="space-y-4">
                          {history.map((entry, i) => (
                            <div key={entry.id}>
                              <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {eventTypeLabels[entry.event_type]}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </span>
                                  </div>
                                  {entry.event_description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {entry.event_description}
                                    </p>
                                  )}
                                  {entry.previous_value && entry.new_value && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {entry.previous_value} → {entry.new_value}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {i < history.length - 1 && <Separator className="mt-4" />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
