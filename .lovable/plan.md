

## Edição em Massa nas Páginas de Transações

### Objetivo

Levar a mesma capacidade de **bulk edit** que existe hoje na tela de Aprovações para todas as listagens de transações:
- Visão Geral, Entradas Recorrentes, Entradas Avulsas, Despesas Fixas e Despesas Variáveis.

E adicionar **proteções de segurança específicas** para evitar efeitos colaterais (ex.: alterar Responsável de 1.140 lançamentos recorrentes sem quebrar nomenclatura, datas ou parcelas).

---

### O que vai mudar

#### 1. Componente único: `BulkEditPanel`

Hoje a barra de seleção em `TransactionsList.tsx` só tem **"Excluir Selecionadas"**. Vou adicionar um botão **"Editar Selecionadas"** que abre o mesmo modal de Bulk Edit já usado em Aprovações — mas extraído para um componente reutilizável `src/components/transactions/BulkEditPanel.tsx`.

Campos disponíveis (todos opcionais — vazio = não altera):
- **Cliente (empresa)**
- **Vinculado a (Entidade)**
- **Responsável (executor)** ← caso de uso pedido
- **Categoria** (com busca por substring, mesma da rodada anterior)
- **Conta**
- **Centro de Custo**
- **Status** (Em Aberto / Pago / Atrasado)
- **Data de Vencimento** (deslocamento em dias: +N / -N, ou data fixa)
- **Valor** (substituir / acrescentar / aplicar % — só habilitado em seleções pequenas)

Campos **bloqueados** no bulk: Descrição, Competência mês/ano, Documento e Observações — porque alterá-los em massa quebra rastreabilidade e nomenclatura ("janeiro" vira tudo igual). O usuário ainda pode editar individualmente.

#### 2. Proteções por contexto

A tela onde o painel é aberto **restringe automaticamente** os campos:

| Tela | Campos liberados | Bloqueados (motivo) |
|---|---|---|
| Visão Geral | todos os listados acima | — |
| Entradas Recorrentes | Responsável, Categoria, Conta, C.Custo, Status | Cliente (vem do contrato), Valor (vem do plano/SM), Vencimento (vem do `dia_vencimento`) |
| Entradas Avulsas | todos | — |
| Despesas Fixas | Responsável, Entidade, Categoria, Conta, C.Custo, Status | Cliente padrão, Valor (vem da despesa fixa), Vencimento (vem do `dia_vencimento`) |
| Despesas Variáveis | todos | — |

Isso evita o cenário "alterei o vencimento e quebrei toda a série recorrente do Patrick".

#### 3. Pré-visualização antes de aplicar (passo crítico)

Antes do `UPDATE`, o painel mostra um **resumo de impacto**:

```text
Você está prestes a alterar 1.140 lançamentos:
  • Responsável: (vazio) → Patrick
  • 0 transações já tinham Responsável (serão sobrescritas: NÃO)
  • Origens afetadas: CONTRATO_RECORRENTE (1.140)
  • Anos: 2024 (520), 2025 (620)
  • Nenhuma alteração em descrição, valor ou vencimento.

[ Cancelar ]   [ Confirmar alteração de 1.140 lançamentos ]
```

Toggle **"Sobrescrever valores existentes"** (default OFF) — só preenche onde o campo está nulo, exatamente como o backfill do Reclassificação.

#### 4. Performance e segurança da execução

- **Update em chunks** de 500 IDs por vez (evita timeout do PostgREST e do trigger `recalculate_account_balance`).
- **Barra de progresso** "750 / 1.140 atualizados…".
- Apenas os campos efetivamente preenchidos vão para o `UPDATE` (mesmo padrão já corrigido em Aprovações), evitando reexecução desnecessária dos triggers `sync_transaction_to_installment` e do recálculo de saldo.
- Após sucesso: invalida `transactions`, `approval-transactions`, `open-payments`, `transactions_chart_v2` e refetch ativo.

#### 5. Seleção inteligente

Na barra de bulk vão aparecer atalhos contextuais:
- **"Selecionar todos os filtrados"** (não só os da página visível).
- **"Selecionar só sem Responsável"** / **"Selecionar só sem Entidade"** — atalhos para o caso pedido.

---

### Arquivos afetados

- **Novo:** `src/components/transactions/BulkEditPanel.tsx` — modal reutilizável extraído de `ApprovalView.tsx`.
- **Editar:** `src/components/transactions/TransactionsList.tsx` — adicionar botão "Editar Selecionadas", atalhos de seleção, prop `bulkContext` para definir campos liberados.
- **Editar:** `src/components/approval/ApprovalView.tsx` — substituir o bulk edit interno pelo componente compartilhado (sem perder funcionalidade atual).
- **Sem migrations.** Sem mudanças de schema.

### Detalhes técnicos relevantes

- O update é feito direto em `transactions` via supabase, com `.in('id', chunk).select('id')` para garantir feedback síncrono de erros (mesmo padrão de Aprovações).
- O toggle "Sobrescrever" se traduz em `.is('<campo>', null)` adicionado ao `WHERE` quando OFF.
- Recorrências (`origem='CONTRATO_RECORRENTE'`): só campos seguros (Responsável, Status, Categoria, Conta, C.Custo, Entidade) são mostrados — assim o trigger de sincronização com `recurring_installments` não dispara reescrita de valor/data.

### Pergunta antes de executar

1. **Atalhos de seleção** — confirma os dois atalhos ("sem Responsável" e "sem Entidade"), ou quer adicionar também "sem Categoria" e "sem Conta"?
2. **Sobrescrever** — default OFF (só preenche onde está nulo) está bom, ou prefere que sempre pergunte explicitamente?
3. **Bulk de Valor/Vencimento em recorrências** — manter bloqueado (mais seguro) ou liberar com aviso vermelho "isto vai recriar parcelas"?

