

## Conta em branco em Transações — Diagnóstico & Refatoração

### O problema (confirmado no banco)

- **125 transações** em 2026 estão com `account_id = NULL` (todas de origem `DESPESA_FIXA`).
- Dessas, **28 já estão marcadas como PAGO** — ou seja, deveriam estar afetando o saldo de uma conta, mas não estão. Isso explica saldos inconsistentes.
- A causa raiz é que **41 das 68 despesas fixas ativas** estão com `account_id = NULL` no cadastro mestre — mesmo quando a categoria associada (FOLHA DE PAGAMENTO, FGTS, INSS, INTERNERT, AGUA, etc.) já tem `default_account_id` preenchido.
- Quando o gerador de parcelas (`useFixedExpenses.ts:176`) cria as transações do mês, ele copia `e.account_id` direto da despesa fixa — se vier null, a parcela nasce órfã.
- Resultado visual: a coluna **Conta** aparece em branco, e ao filtrar por conta esses lançamentos somem.

### Causa secundária

O `NewFixedExpenseModal` resolve `default_account_id` corretamente *no momento da criação*, mas:
1. Não força fallback se o usuário trocar de categoria depois.
2. Despesas antigas criadas antes da migração para o modelo categoria-cêntrica nunca tiveram a conta preenchida.
3. Não há trigger no banco que garanta a invariante "transação manual/recorrente sempre tem conta".

---

### Plano de correção (3 frentes)

#### 1. Backfill imediato (uma vez)

Migration SQL que:

- Para cada `fixed_expenses` com `account_id IS NULL`, copia o `default_account_id` da `transaction_category` vinculada. *(41 registros corrigidos)*
- Para cada `transactions` com `origem='DESPESA_FIXA'` e `account_id IS NULL`, herda o `account_id` agora preenchido na despesa fixa-mãe. *(125 transações corrigidas)*
- Idem para qualquer transação de origem `CONTRATO_RECORRENTE`, `LANCAMENTO_MANUAL` ou `IMPORTACAO` com `account_id IS NULL` mas categoria com `default_account_id` definido. *(varredura de segurança)*
- Recalcula o saldo das contas afetadas (`SELECT recalculate_account_balance(id)` para cada conta única tocada) — isto corrige os 28 PAGOs que sumiram dos saldos.
- Loga em `migration_conflicts_log` qualquer despesa fixa que **continue** sem conta (categoria também sem default) para revisão manual no UI.

#### 2. Garantia no código (não acontecer de novo)

- **`useFixedExpenses.ts` (generateFixedExpenseTransactions)**: ao montar a parcela, se `e.account_id` for null, fazer fallback para `transaction_categories.default_account_id` antes do insert. Se ambos forem null, **abortar com toast de erro** listando o nome da despesa, em vez de inserir órfã.
- **`NewFixedExpenseModal`**: se a categoria escolhida não tem `default_account_id`, exigir que o usuário selecione uma conta no próprio modal (campo passa de inferido → obrigatório).
- **`useTransactions.useCreateTransaction`**: mesma regra de fallback (categoria → default_account_id) e bloqueio se nada resolver.

#### 3. Visibilidade no UI

- Em `TransactionsList`, transações com `account_id` nulo passam a exibir um badge laranja **"Sem conta"** clicável que abre o modal de edição já com o campo Conta destacado — em vez de simplesmente aparecer em branco.
- Adicionar atalho de seleção em massa: **"Selecionar sem Conta"** (igual aos atalhos "sem Responsável" / "sem NF" já criados), permitindo o usuário corrigir os 125 órfãos em uma operação só caso o backfill automático não consiga resolver alguns.
- Em `DespesasFixasPage`, indicador no topo: "X despesas fixas sem conta vinculada" linkando para a lista filtrada.

---

### Arquivos afetados

- **Nova migration**: `supabase/migrations/<timestamp>_backfill_account_id_orfaos.sql` — backfill de fixed_expenses → transactions + recalcula saldos.
- **Editar**: `src/hooks/useFixedExpenses.ts` — fallback para `default_account_id` da categoria + erro explícito se faltar.
- **Editar**: `src/hooks/useTransactions.ts` — mesmo fallback no `useCreateTransaction`.
- **Editar**: `src/components/transactions/NewFixedExpenseModal.tsx` — Conta vira obrigatória quando categoria não tem default.
- **Editar**: `src/components/transactions/TransactionsList.tsx` — badge "Sem conta" + atalho "Selecionar sem Conta".
- **Editar**: `src/components/transactions/DespesasFixasPage.tsx` — alerta de despesas fixas órfãs.

### Resultado esperado

- 0 transações com `account_id IS NULL` após backfill.
- Saldos das contas reconciliados (28 lançamentos PAGOs voltam a impactar o saldo).
- Impossível criar nova transação ou despesa fixa órfã pelo UI.
- Se aparecer alguma órfã residual (ex.: importação futura), o badge laranja e o atalho de bulk edit deixam o conserto a 2 cliques.

