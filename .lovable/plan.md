
# Plano de Reorganização Completa do Painel Financeiro

## Diagnóstico Atual

### Problemas Identificados
1. **Fragmentação das Configurações**: Configurações de Empresas, Contas, Categorias, Centros de Custo e Formas de Pagamento estão em menus separados, mas são interdependentes
2. **Desconexão entre Módulos**: Dashboard usa `mockData.ts` enquanto Transações usa dados do banco - falta integração real
3. **DRE Simplista**: A estrutura DRE atual não reflete os 15 grupos do modelo real (extraído de `DRE_MODELO_RAMOS.xlsx`)
4. **Falta de Hierarquia Clara**: Não há vínculo obrigatório entre Categoria → Centro de Custo → DRE
5. **Ausência de Módulo de Em Aberto**: Não existe visão centralizada de pagamentos pendentes
6. **Fluxo de Caixa por Conta Incompleto**: Falta visualização de saldo acumulado por conta ao longo do tempo

---

## Arquitetura Proposta

### Hierarquia Estrutural do Sistema

```text
Empresa (Fonte Financeira)
└── Contas Financeiras
    └── Categorias de Transação
        └── Centros de Custo (15 grupos DRE)
            └── Transações
```

### Novos Módulos e Reorganização

```text
MENU PRINCIPAL (Novo)
├── Dashboard (melhorado com dados reais)
├── Transações
│   ├── Visão Geral (todas)
│   ├── Entradas
│   │   ├── Recorrentes (contratos)
│   │   └── Avulsas (pontuais)
│   └── Saídas
│       ├── Fixas (despesas fixas)
│       └── Pontuais (variáveis)
├── Contas (saldo, extrato, transferências)
├── Em Aberto (NOVO - crucial)
├── Contratos Recorrentes (existente)
├── Relatórios
│   ├── Fluxo de Caixa
│   ├── DRE Completa (15 grupos)
│   ├── Despesas por Categoria
│   ├── Despesas por Centro de Custo
│   └── Ranking de Clientes
├── Clientes
├── Configuração Financeira (UNIFICADA)
│   ├── Empresas
│   ├── Contas
│   ├── Categorias (com vínculo a Centro de Custo)
│   ├── Centros de Custo (com grupo DRE)
│   ├── Formas de Pagamento
│   └── Salário Mínimo
└── Importar/Exportar
```

---

## Fase 1: Schema do Banco de Dados

### 1.1 Novas Tabelas

**`financial_companies` (Empresas/Fontes Financeiras)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | text | Nome da empresa |
| cnpj | text | CNPJ (opcional) |
| active | boolean | Ativo/Inativo |

**`accounts` (Contas Financeiras)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| company_id | uuid FK | Empresa dona |
| category_id | uuid FK | Categoria de agrupamento |
| name | text | Nome da conta |
| bank | text | Banco (opcional) |
| initial_balance | numeric | Saldo inicial |
| current_balance | numeric | Saldo atual (calculado) |
| active | boolean | Ativo/Inativo |

**`account_categories` (Agrupadores de Saldo)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| company_id | uuid FK | Empresa |
| name | text | Nome (ex: CONTA INTER, BINANCE) |
| color | text | Cor para visualização |
| order | int | Ordem de exibição |
| active | boolean | Ativo/Inativo |

**`cost_centers` (Centros de Custo - Estrutura DRE)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| company_id | uuid FK | Empresa |
| name | text | Nome (ex: Despesas administrativas) |
| code | text | Código curto |
| dre_group | text | Grupo DRE (15 grupos) |
| dre_label | text | Label no DRE |
| dre_order | int | Ordem no DRE |
| is_expense | boolean | Se é despesa (deduz) |
| active | boolean | Ativo/Inativo |

**`transaction_categories` (Categorias de Transação)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| company_id | uuid FK | Empresa |
| cost_center_id | uuid FK | Centro de custo (OBRIGATÓRIO) |
| name | text | Nome (ex: Energia, Aluguel) |
| type | enum | ENTRADA, SAIDA, AMBOS |
| expense_type | text | FIXA, VARIADA, IMPOSTO (para saídas) |
| default_account_id | uuid FK | Conta padrão (opcional) |
| color | text | Cor |
| active | boolean | Ativo/Inativo |

### 1.2 Alteração na Tabela `transactions`

Adicionar campos:
- `company_id` (FK → financial_companies)
- `account_id` (FK → accounts)
- `category_id` (FK → transaction_categories)
- `cost_center_id` (FK → cost_centers) - denormalizado para performance

### 1.3 Migração dos 15 Centros de Custo (DRE)

Baseado no arquivo `DRE_MODELO_RAMOS.xlsx`:
1. Receita Bruta
2. Deduções da receita bruta
3. Custos operacionais
4. Despesas administrativas
5. Despesas financeiras
6. Despesas pessoais
7. Despesas com logística
8. Despesas com manutenção e limpeza
9. Despesas comerciais
10. Impostos e taxas
11. (Outros conforme modelo)

### 1.4 Migração das Categorias

Inserir 67 categorias do modelo com vínculos:
- Cada categoria → Centro de Custo
- Cada categoria → Conta padrão
- Tipo de despesa (FIXA/VARIADA/IMPOSTO)

---

## Fase 2: Janela Única de Configuração Financeira

### 2.1 Componente `FinancialConfigView.tsx`

**Abas unificadas:**
1. **Empresas** - Cadastro da fonte financeira
2. **Contas** - Contas bancárias com vínculo à empresa
3. **Categorias de Conta** - Agrupadores de saldo
4. **Categorias de Transação** - Com vínculo obrigatório a Centro de Custo
5. **Centros de Custo** - 15 grupos DRE
6. **Formas de Pagamento**
7. **Salário Mínimo** - Configuração global por ano

**Visualização de vínculos:**
- Diagrama mostrando: Empresa → Contas → Categorias → Centros de Custo → DRE

---

## Fase 3: Módulo de Pagamentos Em Aberto (Crítico)

### 3.1 Componente `OpenPaymentsView.tsx`

**KPIs do módulo:**
- Total de Entradas em Aberto (inadimplência)
- Total de Saídas em Aberto (a pagar)
- Evolução do Total em Aberto (gráfico linha)
- Indicador de tendência (aumentando/diminuindo)

**Abas:**
1. **A Receber** - Clientes inadimplentes
2. **A Pagar** - Despesas não quitadas
3. **Atrasados** - Vencidos há mais de X dias

**Funcionalidades:**
- Marcar como pago (com data e conta)
- Editar vencimento
- Filtros por tipo, cliente, conta, categoria
- Ações em lote

---

## Fase 4: DRE Completa (15 Grupos)

### 4.1 Componente `DRECompleteView.tsx`

**Estrutura visual (baseada na imagem de referência):**

```text
┌──────────────────────────────────────────────────────────┐
│                      JAN  FEV  MAR ... DEZ   TOTAL       │
├──────────────────────────────────────────────────────────┤
│ RECEITA BRUTA (verde)           93.963  0  ...           │
│   • Serviços Ambientais                                  │
│   • Serviços de SST                                      │
├──────────────────────────────────────────────────────────┤
│ (-) Deduções da receita bruta   250  0  ...              │
├──────────────────────────────────────────────────────────┤
│ = RECEITA LÍQUIDA (verde)       93.713  0  ...           │
├──────────────────────────────────────────────────────────┤
│ (-) Custos operacionais         0  0  ...                │
├──────────────────────────────────────────────────────────┤
│ = LUCRO BRUTO (verde)           93.713  0  ...           │
├──────────────────────────────────────────────────────────┤
│ DESPESAS OPERACIONAIS (vermelho) 72.693  1.699  ...      │
│   • Despesas comerciais                                  │
│   • Despesas pessoais                                    │
│   • Despesas administrativas                             │
│   • Despesas financeiras                                 │
│   • Despesas com manutenção                              │
│   • Despesas com logística                               │
│   • Impostos e taxas                                     │
├──────────────────────────────────────────────────────────┤
│ = LUCRO OPERACIONAL (azul)      21.019  -1.699  ...      │
└──────────────────────────────────────────────────────────┘
```

**Indicadores estratégicos:**
- Margem bruta (%)
- Margem líquida (%)
- % cada centro de custo sobre receita
- Comparativo com mês anterior

---

## Fase 5: Fluxo de Caixa por Conta

### 5.1 Melhorias em `AccountsView.tsx`

**Novas visualizações:**
1. **Saldo Consolidado** - Soma de todas as contas
2. **Evolução Mensal** - Gráfico de linha por conta
3. **Extrato Detalhado** - Por conta selecionada
4. **Transferências** - Entre contas (não afeta DRE)

**Estrutura visual (baseada na imagem de referência):**

```text
┌───────────────────────────────────────────────────────┐
│ CONTA      │ JAN      │ FEV      │ ... │ DEZ         │
├───────────────────────────────────────────────────────┤
│ BANCARIA   │ 574.442  │ 668.405  │ ... │ 670.905     │
│ LIMPEZA    │ 1.887    │ 2.437    │ ... │ 2.437       │
│ DINHEIRO   │ 1.432    │ 1.432    │ ... │ 1.432       │
│ ...        │          │          │     │             │
└───────────────────────────────────────────────────────┘
```

---

## Fase 6: Despesas por Categoria e Setor

### 6.1 Componente `ExpenseAnalysisView.tsx`

**Visualizações:**
1. **Por Categoria** - Top categorias que mais consomem
2. **Por Centro de Custo** - Agrupado pelos 15 grupos DRE
3. **Por Conta** - Qual conta está sendo mais usada
4. **Cruzamentos:**
   - Categoria × Mês
   - Centro de Custo × Conta
   - Categoria × DRE

**Gráficos:**
- Pizza: Distribuição por categoria
- Barras empilhadas: Por mês × categoria
- Tabela: Detalhamento com drill-down

---

## Fase 7: Dashboard Integrado com Dados Reais

### 7.1 Melhorias no `Dashboard.tsx`

**Substituir mockData por hooks reais:**
- `useTransactionKPIs` já existe → usar
- Criar `useDashboardData` para consolidar

**Novos KPIs:**
- Total de SM contratados
- Receita projetada vs realizada
- Índice de inadimplência (%)
- Despesas fixas vs variáveis

**Novos gráficos:**
- Projeção de despesas fixas + receitas recorrentes (mensal)
- Previsto vs Realizado

---

## Fase 8: Reorganização do Menu Sidebar

### 8.1 Novo `Sidebar.tsx`

**Estrutura simplificada:**

```typescript
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', icon: ArrowDownUp },
  { id: 'accounts', label: 'Contas', icon: Wallet },
  { id: 'open-payments', label: 'Em Aberto', icon: AlertCircle }, // NOVO
  { id: 'recurring-contracts', label: 'Contratos', icon: RefreshCw },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'config', label: 'Configuração', icon: Settings }, // UNIFICADO
  { id: 'import', label: 'Importar/Exportar', icon: FileSpreadsheet },
];
```

**Remoção do submenu "Cadastros"** - Tudo vai para "Configuração"

---

## Cronograma de Implementação

### Sprint 1: Fundação (2-3 prompts)
1. Migração do banco: criar tabelas `financial_companies`, `accounts`, `account_categories`, `cost_centers`, `transaction_categories`
2. Migrar dados: 15 centros de custo + 67 categorias do modelo DRE
3. Atualizar tabela `transactions` com novos campos

### Sprint 2: Configuração Unificada (2 prompts)
1. Criar `FinancialConfigView.tsx` com todas as abas
2. Atualizar `Sidebar.tsx` com nova estrutura
3. Remover páginas de cadastro separadas

### Sprint 3: Módulo Em Aberto (1-2 prompts)
1. Criar `OpenPaymentsView.tsx`
2. Hooks: `useOpenPayments`
3. Ações: marcar pago, editar vencimento

### Sprint 4: DRE Completa (2 prompts)
1. Criar `DRECompleteView.tsx` com 15 grupos
2. Visualização mensal + acumulada
3. Indicadores estratégicos

### Sprint 5: Análises Avançadas (2 prompts)
1. Despesas por categoria/centro de custo
2. Fluxo de caixa por conta com gráficos
3. Dashboard com dados reais

---

## Arquivos a Criar/Modificar

### Novos Arquivos
- `src/components/config/FinancialConfigView.tsx`
- `src/components/open-payments/OpenPaymentsView.tsx`
- `src/components/reports/DRECompleteView.tsx`
- `src/components/reports/ExpenseAnalysisView.tsx`
- `src/hooks/useFinancialConfig.ts`
- `src/hooks/useOpenPayments.ts`
- `src/hooks/useDREReport.ts`
- `supabase/migrations/[timestamp]_financial_config_tables.sql`

### Arquivos a Modificar
- `src/components/layout/Sidebar.tsx` - Nova estrutura de menu
- `src/pages/Index.tsx` - Novos roteamentos
- `src/components/accounts/AccountsView.tsx` - Fluxo de caixa melhorado
- `src/components/dashboard/Dashboard.tsx` - Dados reais
- `src/components/reports/ReportsView.tsx` - Novos relatórios

---

## Critérios de Aceite

1. **Configuração Unificada**: Todas as configurações estruturais em uma única janela
2. **Vínculos Obrigatórios**: Categoria não existe sem Centro de Custo
3. **Em Aberto Centralizado**: Módulo exclusivo para inadimplência e a pagar
4. **DRE com 15 Grupos**: Refletindo fielmente o modelo da empresa
5. **Fluxo de Caixa por Conta**: Saldo, evolução e extrato
6. **Despesas Analisáveis**: Por categoria, centro de custo e cruzamentos
7. **Dashboard Real**: Dados do banco, não mock

---

## Detalhes Técnicos

### Hooks Necessários

```typescript
// useFinancialConfig.ts
useCompanies()
useAccounts()
useAccountCategories()
useCostCenters()
useTransactionCategories()
usePaymentMethods()

// useOpenPayments.ts
useOpenPayments(filters)
useOpenPaymentStats()
useMarkAsPaid()

// useDREReport.ts
useDREData(year)
useDREMonthly(month, year)
useDREIndicators()
```

### Estrutura DRE (Cálculo)

```typescript
interface DRELine {
  order: number;
  label: string;
  type: 'header' | 'sum' | 'deduction' | 'result';
  values: Record<number, number>; // mês → valor
  total: number;
  percentage?: number;
}
```
