

# Refatoracao Completa: Categoria como Nucleo do Sistema Financeiro

## Resumo

Transformar a **Categoria** no elemento central de todo o fluxo financeiro. Ao selecionar uma categoria no lancamento, o sistema automaticamente herda conta, centro de custo e tipo de lancamento -- eliminando preenchimento manual e erros de classificacao.

## O que muda

### Hoje
- Categoria tem tipo (Entrada/Saida) e natureza de despesa (Fixa/Variavel), mas **nao tem subtipo para entradas** (Recorrente/Avulsa)
- Conta e centro de custo sao preenchidos manualmente no lancamento
- Conta padrao (`default_account_id`) e opcional e pouco usada
- Nas abas de transacoes, todas as categorias aparecem sem filtragem inteligente

### Depois
- Cada categoria define **completamente** o tipo de lancamento:
  - Entrada Recorrente, Entrada Avulsa, Despesa Fixa, Despesa Variavel
- Conta e centro de custo sao **herdados automaticamente** da categoria
- No lancamento, o usuario escolhe apenas a categoria -- o resto e preenchido pelo sistema
- Cada aba de transacao mostra **apenas** as categorias do seu tipo

---

## Etapas de Implementacao

### 1. Migracao do Banco de Dados

Adicionar coluna `subtype` a tabela `transaction_categories` para distinguir os 4 tipos completos:

```text
transaction_categories
  + subtype TEXT  -- valores: 'RECORRENTE', 'AVULSA', 'FIXA', 'VARIAVEL'
```

Logica de preenchimento automatico dos dados existentes:
- Se `type = 'SAIDA'` e `expense_type = 'FIXA'` → `subtype = 'FIXA'`
- Se `type = 'SAIDA'` e `expense_type = 'VARIAVEL'` → `subtype = 'VARIAVEL'`
- Se `type = 'SAIDA'` e sem expense_type → `subtype = 'VARIAVEL'` (padrao)
- Se `type = 'ENTRADA'` → `subtype = 'AVULSA'` (padrao, usuario ajusta depois)

Tornar `default_account_id` efetivamente obrigatorio na interface (sem alterar constraint no banco para nao quebrar dados antigos).

### 2. Refatorar Formulario de Categoria (Configuracoes)

Redesenhar o formulario de cadastro/edicao de categoria:

**Campos do formulario:**
- Nome da categoria
- Tipo principal: **Entrada** ou **Despesa** (radio/select)
- Subtipo (condicional):
  - Se Entrada: **Recorrente** ou **Avulsa**
  - Se Despesa: **Fixa** ou **Variavel**
- Conta vinculada (obrigatoria) -- select com contas ativas
- Centro de custo (obrigatorio) -- select com centros ativos
- Cor (opcional)
- Status ativo/inativo

**Visualizacao da listagem:**
- Agrupar categorias por tipo (4 grupos visuais com cores):
  - Entrada Recorrente (verde escuro)
  - Entrada Avulsa (verde claro)
  - Despesa Fixa (vermelho escuro)
  - Despesa Variavel (vermelho claro)
- Mostrar conta e centro de custo vinculados em cada linha

### 3. Edicao em Massa de Categorias

Implementar na aba de Categorias (Configuracoes):

- Checkbox de selecao multipla em cada categoria
- Barra de acoes em massa que aparece ao selecionar 2+ itens:
  - Alterar conta vinculada
  - Alterar centro de custo
  - Alterar subtipo (Recorrente/Avulsa/Fixa/Variavel)
  - Ativar/Desativar em massa

### 4. Atualizar Hooks e Logica de Lancamento

**No `useFinancialConfig.ts`:**
- Atualizar tipo `TransactionCategory` para incluir `subtype`
- Adicionar funcao `useTransactionCategoriesBySubtype(subtype)` para filtrar categorias

**No `useTransactions.ts` / `useCreateTransaction`:**
- Ao criar transacao, buscar a categoria selecionada
- Auto-preencher `conta_id`, `centro_custo_id`, `cost_center_id` a partir da categoria
- Auto-definir `tipo_movimento` e `natureza` com base no tipo/subtipo da categoria

### 5. Atualizar Modais de Lancamento

**QuickTransactionModal (Avulsas e Variaveis):**
- Remover campos de conta, centro de custo e tipo do formulario
- Adicionar campo de busca/selecao de categoria como campo principal
- Filtrar categorias pelo subtipo correto (baseado na aba atual)
- Ao selecionar categoria, preencher automaticamente os campos ocultos

**NewRecurringContractModal (Entradas Recorrentes):**
- Adicionar selecao de categoria (filtrada para ENTRADA + RECORRENTE)
- Herdar conta e centro de custo da categoria selecionada

**NewFixedExpenseModal (Despesas Fixas):**
- Adicionar selecao de categoria (filtrada para SAIDA + FIXA)
- Herdar conta e centro de custo da categoria selecionada

**Visao Geral (TransactionsHub):**
- No wizard generico, adicionar campo de busca inteligente de categoria
- Ao selecionar uma categoria, detectar o subtipo e redirecionar para o modal correto:
  - Entrada Recorrente → abre NewRecurringContractModal
  - Entrada Avulsa → abre QuickTransactionModal (modo entrada)
  - Despesa Fixa → abre NewFixedExpenseModal
  - Despesa Variavel → abre QuickTransactionModal (modo despesa)

---

## Arquivos Impactados

### Banco de Dados
- Nova migracao: adicionar coluna `subtype` em `transaction_categories` + popular dados existentes

### Arquivos Modificados
- `src/hooks/useFinancialConfig.ts` -- atualizar tipo TransactionCategory, adicionar hook de filtragem por subtipo
- `src/components/config/FinancialConfigView.tsx` -- redesenhar TransactionCategoriesTab com novo formulario, agrupamento visual e edicao em massa
- `src/components/transactions/QuickTransactionModal.tsx` -- remover campos manuais, adicionar selecao de categoria como campo central
- `src/components/contracts/NewRecurringContractModal.tsx` -- adicionar selecao de categoria filtrada
- `src/components/transactions/NewFixedExpenseModal.tsx` -- adicionar selecao de categoria filtrada
- `src/components/transactions/TransactionsHub.tsx` -- wizard inteligente na visao geral
- `src/hooks/useTransactions.ts` -- auto-preencher dados da categoria ao criar transacao

### Nenhum arquivo novo necessario
Toda a logica se encaixa nos componentes e hooks existentes.
