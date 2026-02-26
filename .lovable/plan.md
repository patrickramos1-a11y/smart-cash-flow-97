
# Plano de Correcao e Evolucao do Modulo Financeiro

## Resumo

Este plano aborda todos os problemas identificados em 4 fases, da correcao critica ate a evolucao de interface. O foco principal esta em: corrigir projecao de contratos recorrentes, garantir heranca automatica categoria-conta, reestruturar a aba de Contas para refletir valores reais, e adicionar novas capacidades como entidades de vinculos e repeticao de despesas variaveis.

---

## FASE 1 -- Correcoes Criticas

### 1.1 Corrigir Projecao de Contratos Recorrentes

**Problema:** Contratos recorrentes aparecem apenas em dezembro e nao impactam dashboards.

**Causa raiz:** No `useCreateContractWithInstallments`, as parcelas sao geradas corretamente a partir do `startMonth`, porem o trigger `sync_installment_to_transaction` pode nao estar sendo disparado corretamente (triggers estao reportados como inexistentes no schema). As transacoes criadas pelo trigger usam `origem = 'CONTRATO_RECORRENTE'` mas a logica de filtro no dashboard e na aba recorrente pode nao estar considerando esse campo.

**Solucao:**
- Verificar e recriar os triggers `sync_installment_to_transaction` e `sync_transaction_to_installment` caso nao estejam ativos (migracao SQL)
- No `Dashboard.tsx`, garantir que contratos recorrentes (transacoes com `origem = 'CONTRATO_RECORRENTE'`) sejam contabilizados na projecao anual
- No `ProjectionChart.tsx`, corrigir a logica: atualmente usa `contracts` e calcula `projectedMonthlyRevenue` para meses futuros, mas para meses passados filtra por `status === 'PAGO'` -- deve incluir `EM_ABERTO` tambem no valor esperado
- Invalidar queries de transacoes apos criacao de contrato (ja existe, verificar se funciona)

**Arquivos:** `ProjectionChart.tsx`, `Dashboard.tsx`, nova migracao SQL para triggers

### 1.2 Corrigir Heranca Categoria -> Conta -> Centro de Custo

**Problema:** Sistema ainda mostra selecao manual de conta em contratos recorrentes. Categoria exibindo dados incorretos.

**Solucao:**
- `NewRecurringContractModal.tsx`: Remover campo `defaultAccountId` e select de contas (linhas 72, 457-470). Adicionar campo de selecao de categoria (filtrada para `ENTRADA` + `RECORRENTE`). Herdar `account_id` e `cost_center_id` da categoria selecionada
- `useCreateContractWithInstallments`: Ao criar transacoes via trigger, garantir que `conta_id` e `centro_custo_id` sejam populados a partir da categoria vinculada
- `NewFixedExpenseModal.tsx`: Remover campo desabilitado de conta manual (ja herda, mas precisa limpar o campo `conta_id` do formData que ainda aparece)

**Arquivos:** `NewRecurringContractModal.tsx`, `useRecurringContracts.ts`, `NewFixedExpenseModal.tsx`

### 1.3 Regra Clara para Desconto Fixo

**Problema:** Opcao de desconto sem prazo definido pode comprometer projecao.

**Solucao:**
- No `NewRecurringContractModal.tsx`, step "discount": tornar obrigatoria a selecao de duracao quando desconto estiver ativo
- Adicionar terceira opcao: "Desconto indefinido (ate encerramento manual)" com aviso visual
- Na projecao, descontos indefinidos aplicam o desconto em todos os meses ate `end_date` do contrato ou fim do ano

**Arquivos:** `NewRecurringContractModal.tsx`

---

## FASE 2 -- Evolucao Estrutural

### 2.1 Criar Modulo de Entidades Financeiras (Responsaveis/Fornecedores)

**Nova tabela no banco de dados:**

```text
financial_entities
  id          UUID PK
  name        TEXT NOT NULL
  type        TEXT NOT NULL  -- 'COLABORADOR', 'FORNECEDOR', 'SOCIO', 'GRUPO'
  email       TEXT
  phone       TEXT
  document    TEXT
  cost_center_id  UUID (FK opcional)
  active      BOOLEAN DEFAULT true
  notes       TEXT
  created_at  TIMESTAMPTZ
  updated_at  TIMESTAMPTZ
```

**Adicionar coluna na tabela transactions:**

```text
transactions
  + entity_id  UUID (FK para financial_entities, nullable)
```

**Impacto no codigo:**
- Criar hook `useFinancialEntities.ts` com CRUD
- Na aba de Configuracoes, adicionar nova tab "Entidades" com gestao de colaboradores, fornecedores, socios e grupos
- Nos modais de lancamento (`QuickTransactionModal`, `NewFixedExpenseModal`), adicionar campo opcional "Responsavel / Vinculado a" com busca
- No `TransactionsHub` e `Dashboard`, permitir filtro por entidade

**Arquivos novos:** `src/hooks/useFinancialEntities.ts`
**Arquivos modificados:** `FinancialConfigView.tsx`, `QuickTransactionModal.tsx`, `NewFixedExpenseModal.tsx`, `TransactionsHub.tsx`, migracao SQL

### 2.2 Despesa Variavel com Repeticao Limitada

**Problema:** Nao existe opcao de repetir despesa variavel X vezes.

**Solucao:**
- No `QuickTransactionModal.tsx`, quando `filterSubtype === 'VARIAVEL'`, adicionar secao "Repetir":
  - Toggle "Repetir este lancamento"
  - Campo "Quantas vezes" (2 a 24)
  - Opcao "Parcelamento" (divide o valor) vs "Repeticao" (mesmo valor)
- Ao submeter, gerar N transacoes com competencias sequenciais
- Descricao: "Nome - Parcela X/N" ou "Nome - Repeticao X/N"

**Arquivos:** `QuickTransactionModal.tsx`, `useTransactions.ts` (nova mutacao `useCreateBatchTransactions`)

---

## FASE 3 -- Reforma de Interface

### 3.1 Reformular Graficos com Despesas Fixas vs Variaveis

**Problema:** Graficos nao distinguem visualmente fixas de variaveis.

**Solucao:**
- No `RevenueExpenseChart.tsx`, substituir barra unica de despesas por 2 barras empilhadas:
  - Coluna 1: Despesas Fixas (cor vermelha escura)
  - Coluna 2: Despesas Variaveis (cor laranja)
  - Linha: Total consolidado
- Adicionar toggles para ativar/desativar camadas

**Arquivos:** `RevenueExpenseChart.tsx`, `TransactionsAnnualChart.tsx`

### 3.2 Navegacao Mensal Moderna

**Problema:** Selecao de mes com dropdowns antigos em todas as abas.

**Solucao:**
- Criar componente `MonthYearNavigator` com botoes prev/next, barra horizontal de meses clicaveis e transicao visual
- Substituir os selects de mes/ano em: `TransactionsHub.tsx`, `DespesasFixasPage.tsx`, `DespesasVariaveisPage.tsx`, `EntradasAvulsasPage.tsx`, `EntradasRecorrentesPage.tsx`

**Arquivo novo:** `src/components/ui/month-year-navigator.tsx`
**Arquivos modificados:** 5 paginas de transacao

### 3.3 Busca Inteligente de Categoria com Digitacao Progressiva

**Problema:** Lista completa de categorias aparece aberta, sem filtro.

**Solucao:**
- Nos modais (`QuickTransactionModal`, `NewFixedExpenseModal`), substituir `Select` por componente `Command` (cmdk ja instalado) com:
  - Input com digitacao progressiva
  - Filtro automatico
  - Agrupamento por subtipo
  - Botao "+" para criar nova categoria inline

**Arquivos:** `QuickTransactionModal.tsx`, `NewFixedExpenseModal.tsx`, `NewRecurringContractModal.tsx`

### 3.4 Botao Rapido para Criar Categoria no Lancamento

**Solucao:**
- Adicionar botao "+" ao lado do campo de categoria em todos os modais de lancamento
- Ao clicar, abrir Dialog inline para criar categoria rapida (nome, tipo, subtipo, conta, centro de custo)
- Ao salvar, selecionar automaticamente a nova categoria

**Arquivos:** `QuickTransactionModal.tsx`, `NewFixedExpenseModal.tsx`

---

## FASE 4 -- Reestruturacao da Aba de Contas

### 4.1 Corrigir Saldos das Contas

**Problema:** Contas nao puxam valores e estao inconsistentes.

**Causa raiz:** O campo `current_balance` em `accounts` nao e atualizado automaticamente com base nas transacoes. Ele reflete apenas o `initial_balance` estatico.

**Solucao:**
- Criar funcao SQL `recalculate_account_balance(account_id)` que:
  - Soma todas as transacoes PAGO vinculadas a conta (entradas - saidas)
  - Soma transferencias de/para a conta
  - Atualiza `current_balance = initial_balance + saldo_transacoes + saldo_transferencias`
- Criar trigger que dispara apos INSERT/UPDATE/DELETE em `transactions` quando `conta_id` muda ou `status` muda para/de PAGO
- Criar trigger similar em `account_transfers`
- Executar recalculo em massa para todas as contas existentes

**Arquivos:** Nova migracao SQL

### 4.2 Melhorar Visualizacao na Aba de Contas (AccountsView)

**Solucao:**
- Corrigir `AccountsView.tsx` para que o grafico de evolucao use `account_id` (UUID) ao inves de `conta_id` (texto legado) na filtragem de transacoes
- Garantir que a projecao de meses futuros use as categorias vinculadas a conta para calcular entradas/saidas projetadas
- Adicionar indicador de categorias vinculadas por conta na listagem

**Arquivos:** `AccountsView.tsx`

---

## Ordem de Execucao

1. Migracao SQL: triggers de sync, tabela `financial_entities`, coluna `entity_id`, funcao de recalculo de saldo
2. Corrigir projecao de contratos e heranca categoria-conta (Fase 1)
3. Reestruturar saldos de contas (Fase 4.1)
4. Criar hooks e UI de entidades financeiras (Fase 2.1)
5. Repeticao de despesas variaveis (Fase 2.2)
6. Reformulacao de graficos e navegacao (Fase 3)
7. Busca inteligente e botao de criacao rapida (Fase 3.3 e 3.4)

## Arquivos Impactados (resumo)

**Novas migracoes SQL:** 1 migracao consolidada com triggers, tabela, colunas e funcoes
**Novo arquivo:** `src/hooks/useFinancialEntities.ts`, `src/components/ui/month-year-navigator.tsx`
**Arquivos modificados:**
- `src/components/dashboard/ProjectionChart.tsx`
- `src/components/dashboard/Dashboard.tsx`
- `src/components/dashboard/RevenueExpenseChart.tsx`
- `src/components/contracts/NewRecurringContractModal.tsx`
- `src/components/transactions/QuickTransactionModal.tsx`
- `src/components/transactions/NewFixedExpenseModal.tsx`
- `src/components/transactions/TransactionsHub.tsx`
- `src/components/transactions/TransactionsAnnualChart.tsx`
- `src/components/transactions/DespesasFixasPage.tsx`
- `src/components/transactions/DespesasVariaveisPage.tsx`
- `src/components/transactions/EntradasAvulsasPage.tsx`
- `src/components/transactions/EntradasRecorrentesPage.tsx`
- `src/components/config/FinancialConfigView.tsx`
- `src/components/accounts/AccountsView.tsx`
- `src/hooks/useRecurringContracts.ts`
- `src/hooks/useTransactions.ts`
- `src/hooks/useFinancialConfig.ts`
