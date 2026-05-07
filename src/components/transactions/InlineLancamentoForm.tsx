import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowDownCircle, ArrowUpCircle, Loader2, Send, RefreshCw,
  Repeat, Split, Sparkles, AlertCircle, ChevronUp, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTransactionCategories, useAccounts, usePaymentMethods } from '@/hooks/useFinancialConfig';
import { useCreateTransaction, useClients } from '@/hooks/useTransactions';
import { useSaveTransactionEntities } from '@/hooks/useTransactionEntities';
import { normalizeForSearch } from './CategorySearchInput';
import { MultiEntitySelector } from './MultiEntitySelector';
import { CategoryCombobox } from './CategoryCombobox';
import { CategoryChip } from './lancamento/CategoryChip';
import { resolveAccountAndCostCenter } from '@/lib/financial/categoryResolution';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  defaultMonth: number;
  defaultYear: number;
  /** Categorias que precisam de fluxo dedicado (RECORRENTE/FIXA) */
  onNeedsDedicatedFlow: (kind: 'recurring' | 'fixa') => void;
  onCreated?: () => void;
}

export function InlineLancamentoForm({ defaultMonth, defaultYear, onNeedsDedicatedFlow, onCreated }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: categories } = useTransactionCategories();
  const { data: accounts } = useAccounts();
  const { data: clients } = useClients();
  const { data: paymentMethods } = usePaymentMethods();
  const createTransaction = useCreateTransaction();
  const saveEntities = useSaveTransactionEntities();

  const today = new Date().toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [valor, setValor] = useState('');
  const [dataVenc, setDataVenc] = useState(today);
  const [descricao, setDescricao] = useState('');
  const [descricaoTouched, setDescricaoTouched] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [accountOverride, setAccountOverride] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Status/competência/pagamento (contexto rico)
  const [status, setStatus] = useState<'EM_ABERTO' | 'PAGO'>('EM_ABERTO');
  const [dataPagamento, setDataPagamento] = useState(today);
  const [competenciaMes, setCompetenciaMes] = useState(defaultMonth);
  const [competenciaAno, setCompetenciaAno] = useState(defaultYear);

  // Dados fiscais (Entrada Avulsa)
  const [origemReceita, setOrigemReceita] = useState('');
  const [documentoRecebimento, setDocumentoRecebimento] = useState('');

  // Parcelamento (despesa variável)
  const [enableRep, setEnableRep] = useState(false);
  const [repMode, setRepMode] = useState<'parcelamento' | 'repeticao'>('parcelamento');
  const [repCount, setRepCount] = useState(2);

  const activeCategories = (categories || []).filter(c => c.active);
  const filtered = useMemo(() => {
    if (!search.trim()) return activeCategories;
    const q = normalizeForSearch(search);
    return activeCategories.filter(c => normalizeForSearch(c.name).includes(q));
  }, [activeCategories, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof activeCategories> = {
      'ENTRADA-RECORRENTE': [], 'ENTRADA-AVULSA': [],
      'SAIDA-FIXA': [], 'SAIDA-VARIAVEL': [],
    };
    for (const c of filtered) {
      const key = `${c.type}-${c.subtype}`;
      if (groups[key]) groups[key].push(c);
    }
    return groups;
  }, [filtered]);

  const selected = activeCategories.find(c => c.id === categoryId) || null;
  const resolution = useMemo(
    () => resolveAccountAndCostCenter(selected as any, accountOverride),
    [selected, accountOverride]
  );

  const isEntrada = selected?.type === 'ENTRADA';
  const isAvulsaEntrada = selected?.type === 'ENTRADA' && selected?.subtype === 'AVULSA';
  const isVariavel = selected?.subtype === 'VARIAVEL';
  const needsDedicated = selected?.subtype === 'RECORRENTE' || selected?.subtype === 'FIXA';

  const accObj = accounts?.find(a => a.id === resolution.accountId);

  // Default Ramos Engenharia client for fixed expenses (rule from memory)
  const ramosClient = useMemo(
    () => (clients || []).find((c: any) => /ramos/i.test(c.name)),
    [clients]
  );

  // Auto-fill description when category changes (unless user typed)
  useEffect(() => {
    if (selected && !descricaoTouched) setDescricao(selected.name);
  }, [selected, descricaoTouched]);

  // Auto-set Ramos for despesa fixa selection (não se aplica aqui pois fixa redireciona, mas mantém para futuro)
  useEffect(() => {
    if (selected?.subtype === 'FIXA' && ramosClient && !clienteId) setClienteId(ramosClient.id);
  }, [selected, ramosClient, clienteId]);

  const reset = () => {
    setSearch(''); setCategoryId(''); setValor(''); setDataVenc(today);
    setDescricao(''); setDescricaoTouched(false);
    setClienteId(''); setEntityIds([]); setAccountOverride('');
    setPaymentMethodId(''); setNotes('');
    setEnableRep(false); setRepMode('parcelamento'); setRepCount(2);
    setStatus('EM_ABERTO'); setDataPagamento(today);
    setCompetenciaMes(defaultMonth); setCompetenciaAno(defaultYear);
    setOrigemReceita(''); setDocumentoRecebimento('');
  };

  const valorNum = parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;

  const canSubmit =
    !!selected && !needsDedicated && valorNum > 0 && !!dataVenc &&
    !!resolution.accountId && (!isEntrada || !!clienteId);

  const handleSubmit = async () => {
    if (!selected) return;
    if (needsDedicated) {
      onNeedsDedicatedFlow(selected.subtype === 'RECORRENTE' ? 'recurring' : 'fixa');
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const reps = enableRep && repCount > 1 ? repCount : 1;
      const valorParcela = enableRep && repMode === 'parcelamento' && repCount > 1
        ? Math.round((valorNum / repCount) * 100) / 100
        : valorNum;

      let m = defaultMonth;
      let y = defaultYear;
      const baseDay = new Date(dataVenc + 'T00:00:00').getDate();

      for (let i = 0; i < reps; i++) {
        const due = new Date(y, m - 1, baseDay).toISOString().split('T')[0];
        const suffix = reps > 1
          ? (repMode === 'parcelamento' ? ` - Parcela ${i + 1}/${reps}` : ` - Repetição ${i + 1}/${reps}`)
          : '';
        const result = await createTransaction.mutateAsync({
          tipo_movimento: selected.type,
          natureza: selected.subtype === 'AVULSA' ? 'AVULSA' : 'AVULSA',
          origem: 'LANCAMENTO_MANUAL',
          cliente_id: clienteId || null,
          competencia_mes: m,
          competencia_ano: y,
          valor: valorParcela,
          data_vencimento: due,
          descricao: (descricao || selected.name) + suffix,
          categoria_id: selected.id,
          centro_custo_id: resolution.costCenterId,
          conta_id: resolution.accountId,
          notes: notes || null,
          entity_id: entityIds[0] || null,
          created_by_user_id: user?.id,
        } as any);
        if (entityIds.length > 0 && result?.id) {
          await saveEntities.mutateAsync({ transactionId: result.id, entityIds });
        }
        m++;
        if (m > 12) { m = 1; y++; }
      }

      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['recent-launches'] });
      toast.success(reps > 1 ? `${reps} lançamentos criados!` : 'Lançamento criado!');
      reset();
      onCreated?.();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar lançamento');
    } finally {
      setSubmitting(false);
    }
  };

  const subtypeBadge = selected && {
    'RECORRENTE': { label: 'Entrada Recorrente', cls: 'border-income/40 text-income' },
    'AVULSA': { label: 'Entrada Avulsa', cls: 'border-income/40 text-income' },
    'FIXA': { label: 'Despesa Fixa', cls: 'border-expense/40 text-expense' },
    'VARIAVEL': { label: 'Despesa Variável', cls: 'border-expense/40 text-expense' },
  }[selected.subtype || 'AVULSA'];

  const SUBTYPE_HEADERS: Record<string, { label: string; icon: any; color: string }> = {
    'ENTRADA-RECORRENTE': { label: 'Entradas Recorrentes', icon: RefreshCw, color: 'text-income' },
    'ENTRADA-AVULSA': { label: 'Entradas Avulsas', icon: ArrowDownCircle, color: 'text-income' },
    'SAIDA-FIXA': { label: 'Despesas Fixas', icon: RefreshCw, color: 'text-expense' },
    'SAIDA-VARIAVEL': { label: 'Despesas Variáveis', icon: ArrowUpCircle, color: 'text-expense' },
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className={cn("p-4 lg:p-6", collapsed ? "space-y-0" : "space-y-4")}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base lg:text-lg font-bold">Novo lançamento</h2>
            <p className="text-xs text-muted-foreground truncate">
              {collapsed
                ? 'Clique para expandir e criar um novo lançamento.'
                : 'A categoria define tipo, conta e centro de custo automaticamente.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 w-8 p-0"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expandir' : 'Minimizar'}
            title={collapsed ? 'Expandir' : 'Minimizar'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="space-y-4">
            {/* Linha 1: Categoria — combobox compacto OU chip pós-seleção */}
            {!selected ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  1. Categoria *
                </Label>
                <CategoryCombobox
                  categories={activeCategories as any}
                  accounts={accounts as any}
                  value={categoryId}
                  onChange={(id) => { setCategoryId(id); setAccountOverride(''); }}
                />
                <p className="text-[11px] text-muted-foreground">
                  A categoria define automaticamente tipo, conta e centro de custo.
                </p>
              </div>
            ) : (
              <CategoryChip
                category={selected as any}
                accountName={accObj?.name}
                onChange={() => { setCategoryId(''); setAccountOverride(''); }}
              />
            )}

        {selected && needsDedicated && (
          <Card className="border-amber-300 bg-amber-50/40">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-amber-800">
                  {selected.subtype === 'RECORRENTE' ? 'Entrada recorrente' : 'Despesa fixa'} requer cadastro completo.
                </p>
                <p className="text-amber-700/80">Vamos abrir o formulário dedicado para garantir as parcelas e regras.</p>
              </div>
              <Button size="sm" onClick={handleSubmit}>
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {selected && !needsDedicated && (
          <>
            {/* Badges removidos — agora exibidos no CategoryChip */}

            {/* Linha 2: valor + data + entidade */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Valor (R$) *</Label>
                <Input
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label className="text-xs">Vencimento *</Label>
                <Input type="date" value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{isEntrada ? 'Cliente *' : 'Cliente (opcional)'}</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger className={isEntrada && !clienteId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 3: conta override (se necessário) + descricao */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Conta {resolution.needsAccountOverride && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={accountOverride || resolution.accountId || ''}
                  onValueChange={setAccountOverride}
                  disabled={!resolution.needsAccountOverride && !!resolution.accountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.filter(a => a.active).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!resolution.needsAccountOverride && (
                  <p className="text-[10px] text-muted-foreground mt-1">Definida pela categoria.</p>
                )}
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder={selected.name}
                />
              </div>
            </div>

            {/* Entidade (opcional aqui — fluxo rápido) */}
            <div>
              <MultiEntitySelector
                selectedIds={entityIds}
                onChange={setEntityIds}
                label="Entidade vinculada (opcional)"
              />
            </div>

            {/* Parcelamento — só para despesa variável */}
            {selected.subtype === 'VARIAVEL' && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5" /> Repetir / parcelar
                  </Label>
                  <Switch checked={enableRep} onCheckedChange={setEnableRep} />
                </div>
                {enableRep && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={repMode} onValueChange={(v) => setRepMode(v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parcelamento"><Split className="w-3 h-3 inline mr-1" /> Parcelar (divide)</SelectItem>
                        <SelectItem value="repeticao"><Repeat className="w-3 h-3 inline mr-1" /> Repetir (mesmo valor)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={repCount.toString()} onValueChange={(v) => setRepCount(parseInt(v))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 23 }, (_, i) => i + 2).map(n => (
                          <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={reset}>Limpar</Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Lançar
              </Button>
            </div>
          </>
        )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
