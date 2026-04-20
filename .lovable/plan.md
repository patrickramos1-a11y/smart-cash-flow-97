

# Auditoria + Refatoração Estrutural do Sistema Financeiro

## Diagnóstico (causas raiz encontradas)

Rodei queries reais no banco. Os "dois sistemas" que você sente **existem de verdade** e estão dentro das mesmas tabelas. Estes são os problemas estruturais confirmados:

### 1. Esquema duplicado na tabela `transactions` (causa #1 dos números errados)
A tabela tem **dois conjuntos de colunas para a mesma coisa**:
- `conta_id` (text, legado) **+** `account_id` (uuid, novo)
- `categoria_id` (text, legado) **+** `transaction_category_id` (uuid, novo)
- `centro_custo_id` (text, legado) **+** `cost_center_id` (uuid, novo)

Resultado real do banco hoje:
- 2.763 transações no total
- **356 transações com `conta_id` ≠ `account_id`** (divergência interna)
- 524 transações sem `account_id` mas com `conta_id` (e vice-versa)
- `fixed_expenses` ainda usa **100% colunas text legadas** (zero migradas)

Telas diferentes leem colunas diferentes → mesma transação aparece em uma conta no Dashboard e em outra na lista.

### 2. Triggers de saldo duplicadas
A tabela `transactions` tem **DUAS triggers** rodando o mesmo cálculo:
- `trg_recalc_balance_on_transaction`
- `trg_transactions_account_balance`

E a função `recalculate_account_balance` soma transações usando **OR** entre `conta_id` e `account_id` — quando os dois apontam para contas diferentes (356 casos), o saldo é contado em ambas as contas. Isso explica o saldo do Banco Inter em **−R$ 5.490.038**.

### 3. `fixed_expenses` desconectada da nova arquitetura
- `cliente_id` é uuid (ok), mas `categoria_id`, `conta_id`, `centro_custo_id` são **text** apontando para IDs antigos.
- Quando uma despesa fixa vira transação, o JOIN com `transaction_categories` (uuid) falha → categoria/cliente em branco em Aprovações (sintoma que você relatou).

### 4. Aprovações e edição operam em colunas diferentes
- `TransactionEditModal` salva em `transaction_category_id`, `account_id`, `cost_center_id` (uuid).
- Triggers de sincronização contrato↔transação (`sync_installment_to_transaction`) escrevem só nas colunas uuid.
- Mas listas/filtros antigos ainda leem `categoria_id` text em alguns pontos → edição "não aparece".

### 5. Sem `company_id` consistente
Várias tabelas têm `company_id` nullable e nunca preenchido. Multi-empresa não funciona; mas mais grave: queries que filtram por empresa retornam vazio ou tudo.

### 6. RLS aberto a `public` em tudo
Toda tabela tem políticas `USING true` para SELECT/INSERT/UPDATE/DELETE públicas. Não é causa de bug funcional, mas é um buraco de segurança que deve ser fechado nesta refatoração.

---

## Plano de Refatoração (5 fases)

### Fase 1 — Backup + Auditoria de dados (read-only)
1. Criar tabelas `*_backup_pre_refactor` (cópia integral) de: `transactions`, `fixed_expenses`, `accounts`, `recurring_installments`, `recurring_contracts`.
2. Gerar relatório SQL com: registros órfãos, IDs inválidos, divergências de coluna, contas sem movimento, transações sem categoria/conta/entidade.
3. Salvar relatório em `/mnt/documents/auditoria_pre_refactor.csv`.

### Fase 2 — Unificação de esquema (migration única)
**Tabela `transactions`:**
- Migrar dados: para cada linha, se `account_id` está vazio mas `conta_id` é uuid válido → copiar; se ambos preenchidos e divergentes → priorizar `account_id` (mais recente) e logar conflito.
- Idem para `transaction_category_id` ← `categoria_id` e `cost_center_id` ← `centro_custo_id`.
- **Dropar** colunas legadas: `conta_id`, `categoria_id`, `centro_custo_id`, `forma_pagamento_id` (text).
- Tornar **NOT NULL**: `account_id`, `transaction_category_id`, `entity_id` (regra que você definiu na conversa anterior).

**Tabela `fixed_expenses`:**
- Adicionar `account_id uuid`, `transaction_category_id uuid`, `cost_center_id uuid`, `payment_method_id uuid`.
- Migrar dados das colunas text correspondentes.
- Dropar colunas text antigas.

**Foreign keys reais** em todas as colunas de relacionamento (hoje não existem FKs declaradas — confirmado no schema).

### Fase 3 — Limpeza de triggers e funções
- **Remover triggers duplicadas**: manter só `trg_transactions_account_balance` e `trg_transfers_account_balance`; dropar `trg_recalc_balance_on_transaction` e `trg_recalc_balance_on_transfer`.
- Reescrever `recalculate_account_balance` para usar **só `account_id`** (uuid), não mais OR com text.
- Consolidar `sync_installment_to_transaction` + `sync_transaction_to_installment` num único módulo com guard de recursão já existente, mas escrevendo só nas colunas uuid.
- Adicionar trigger `enforce_required_fields` que rejeita INSERT/UPDATE em `transactions` sem `entity_id`, `account_id`, `transaction_category_id`.

### Fase 4 — Reprocessamento de dados
- Recalcular `current_balance` de **todas as contas** chamando `recalculate_account_balance` para cada uma após a migração.
- Recalcular `status` de transações (PAGO/EM_ABERTO/ATRASADO) com base em `data_pagamento` e `data_vencimento` vs hoje.
- Religar `fixed_expense_id` em transações que vieram de despesa fixa mas perderam o vínculo.
- Re-sincronizar `recurring_installments` ↔ `transactions` para cada contrato ativo.

### Fase 5 — Refatoração do código (frontend/hooks)
**Hooks centralizados (fonte única de verdade):**
- `useTransactions.ts`: remover toda referência a `categoria_id`/`conta_id`/`centro_custo_id` text. Aceitar e gravar **só uuid**.
- `useFixedExpenses.ts`: idem.
- Criar `src/lib/financial/balances.ts` — função única que calcula saldo de conta no frontend (espelhando a SQL), usada por Dashboard, Contas e Relatórios.
- Criar `src/lib/financial/dre.ts` — cálculo único do DRE consumido por Dashboard, DRE Completo e Relatórios.

**Componentes a alinhar com a nova fonte:**
- `Dashboard.tsx`, `AccountsView.tsx`, `DRECompleteView.tsx`, `OpenPaymentsView.tsx`, `ApprovalView.tsx`, `TransactionsList.tsx`, `MobileTransactionCard.tsx`, `ReclassificationView.tsx`, `RecurringContractsView.tsx`.
- Remover qualquer fallback que leia coluna text legada.

**Validações obrigatórias (já discutidas em mensagens anteriores, agora reforçadas no banco):**
- Entidade obrigatória em todos os lançamentos.
- Documento (NF/Recibo/Nota de Débito) obrigatório (exceto observação).
- Cliente obrigatório em ENTRADA.

### Fase 6 — Validação final
- Comparar totais antes/depois: `SUM(valor)` por mês, saldo por conta, count por status. Diferenças esperadas só onde havia bug (saldo do Inter sair de −5.49M para o valor real).
- Testar 1 fluxo end-to-end por módulo: criar lançamento → aprovar → marcar pago → ver no Dashboard → ver no DRE → ver saldo na Conta.

---

## Detalhes técnicos

**Arquivos de banco (migrations):**
1. `xxx_backup_pre_refactor.sql` — cria tabelas de backup
2. `xxx_unify_transactions_schema.sql` — migra + dropa colunas duplicadas em `transactions`
3. `xxx_unify_fixed_expenses_schema.sql` — idem para `fixed_expenses`
4. `xxx_consolidate_triggers.sql` — remove triggers duplicadas, reescreve `recalculate_account_balance`
5. `xxx_add_foreign_keys.sql` — declara todas as FKs faltantes
6. `xxx_enforce_required_fields.sql` — trigger de validação obrigatória
7. `xxx_reprocess_balances.sql` — DO block que recalcula tudo

**Arquivos de código a editar/criar:**
- Criar: `src/lib/financial/balances.ts`, `src/lib/financial/dre.ts`, `src/lib/financial/types.ts`
- Editar (limpar dual-column): `src/hooks/useTransactions.ts`, `src/hooks/useFixedExpenses.ts`, `src/hooks/useRecurringContracts.ts`, `src/hooks/useOpenPayments.ts`, `src/hooks/useDREReport.ts`
- Editar (consumir nova lib): `Dashboard.tsx`, `AccountsView.tsx`, `DRECompleteView.tsx`, `OpenPaymentsView.tsx`, `ApprovalView.tsx`, `TransactionsList.tsx`, `MobileTransactionCard.tsx`, `ReclassificationView.tsx`, `RecurringContractsView.tsx`, `TransactionEditModal.tsx`, `NewFixedExpenseModal.tsx`, `QuickTransactionModal.tsx`

**Riscos e mitigação:**
- Migration destrutiva (drop columns) → backup completo na Fase 1, reversível.
- Edição enquanto migra → executar fora de horário ou desabilitar inserts via flag temporária.
- Aprovações pendentes podem mudar de status durante reprocessamento → preservar `approval_status` explicitamente na migration.

**O que NÃO mudo:**
- `src/integrations/supabase/client.ts` e `types.ts` (regenerados automaticamente).
- Estrutura de `auth`, `storage`, `realtime` (proibido).
- Lógica de negócio de DRE, fiscal, recorrência (apenas centralizo, não reescrevo regras).

**Estimativa:** 7 migrations + ~15 arquivos de código editados + 3 novos arquivos de lib.

