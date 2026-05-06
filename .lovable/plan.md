## Dashboard Estratégico SISRamos — Plano de Implantação em Fases

Transformar o Dashboard atual (resumo mensal + análise anual) em um **centro de decisão financeira** com 3 níveis: Visão Geral (executivo) → Análise (exploração) → Detalhamento (drill-down).

A implantação segue 4 fases, começando pelo que tem **maior valor e menor custo** (já temos hooks/dados prontos), evoluindo para inteligência e exploração.

---

### Estrutura final proposta

```text
Dashboard
├── [Aba] Executivo            ← Nível 1 (Fase 1)
├── [Aba] Receita              ← Nível 2 (Fase 2)
├── [Aba] Despesas             ← Nível 2 (Fase 2)
├── [Aba] Clientes             ← Nível 2 (Fase 2)
├── [Aba] Caixa & Contas       ← Nível 2 (Fase 2)
├── [Aba] Projeção & Tendência ← Nível 3 (Fase 3)
└── [Aba] Insights             ← Nível 4 (Fase 4)
```

Cada bloco usa o mesmo **Year Context** ativo do app (memória `Year-Based Operational Context`) e respeita as regras já consolidadas (DRE exclui Transferências/Investimentos, regime competência por padrão, semântica verde/vermelho).

---

## FASE 1 — CORE EXECUTIVO (alto valor, baixo custo)

**Objetivo:** painel de leitura rápida do negócio em uma tela.

Aba **"Executivo"** (substitui a "Visão Geral" atual, mantendo a "Análise Anual" como aba separada):

1. **Hero KPIs (linha única, 4 cards grandes)** — ano corrente acumulado:
   - Receita YTD · Despesa YTD · **Resultado Operacional YTD** · Saldo Total em Caixa
   - Cada card mostra: valor, variação % vs mesmo período do ano anterior, mini-sparkline 12 meses.

2. **Tira de KPIs secundários (8 mini-cards)**: Receita Recorrente %, MRR estimado (Σ contratos × SM ativo), Ticket Médio, Margem Operacional %, A Receber, A Pagar, Atrasados, Burn Rate mensal médio.

3. **Gráfico mestre — Evolução Mensal (12 meses)**:
   - Linhas: Receita, Despesa, Resultado.
   - Sempre ano completo (jan→dez), sem pular meses (já corrigido).
   - Toggle Competência/Caixa.
   - Click no mês → navega para detalhamento mensal (reusa `AccountMonthDrillDown` patterns).

4. **Split lado-a-lado**:
   - Receita Recorrente vs Avulsa (donut + valor).
   - Despesa Fixa vs Variável (donut + valor).

5. **Alertas operacionais** (chips no topo):
   - Contas negativas, atrasados >30d, queda de receita >20% MoM, contratos vencendo nos próximos 30d.

**Custo técnico:** baixo. Reaproveita `useTransactionKPIs`, `useTransactions`, `useRecurringContracts`, `useAccounts`, `useDREReport`, `RevenueExpenseChart`, `RecurringVsPontualChart`.

**Arquivos:**
- `src/components/dashboard/Dashboard.tsx` (reorganizar abas)
- `src/components/dashboard/executive/HeroKPIs.tsx` (novo)
- `src/components/dashboard/executive/SecondaryKPIs.tsx` (novo)
- `src/components/dashboard/executive/MasterEvolutionChart.tsx` (novo, baseado em `RevenueExpenseChart`)
- `src/components/dashboard/executive/AlertsBar.tsx` (novo)
- `src/hooks/useDashboardYTD.ts` (novo — agregador YTD + YoY)

---

## FASE 2 — CONTROLE (médio custo, alto valor)

Quatro abas exploratórias. Cada uma tem KPIs próprios + gráficos + tabela com drill-down.

### 2.1 Aba **Receita**
- Receita por mês (barras empilhadas: Recorrente / Avulsa).
- Top 10 clientes (já temos `ClientRankingChart`).
- Ranking por categoria de entrada.
- Concentração: % do faturamento dos top 3 clientes (risco de dependência).
- Tabela: contratos ativos × SM × valor mensal × próximo vencimento.

### 2.2 Aba **Despesas**
- Despesa por mês (barras empilhadas por **Centro de Custo** ou **Categoria** — toggle).
- Top categorias (Pareto 80/20).
- Fixa vs Variável ao longo do ano.
- Heatmap categoria × mês (identifica picos).
- Tabela drill-down clicável → abre transações filtradas.

### 2.3 Aba **Clientes**
- Ranking por lucratividade (já existe, expandir).
- Receita por cliente ao longo do ano (linhas múltiplas).
- Clientes novos vs perdidos (entradas/saídas no período).
- Curva ABC.

### 2.4 Aba **Caixa & Contas**
- Saldo total ao longo do ano (reusa `AccountsEvolutionChart`).
- Distribuição por conta (já existe `AccountsDistributionPanel`).
- Transferências planejadas vs executadas.
- Projeção de saldo final do ano (reusa `useAccountForecast`).

**Custo técnico:** médio. Maioria reaproveita componentes existentes; precisamos de novos hooks de agregação por categoria/centro de custo ao longo do ano.

**Arquivos novos:**
- `src/components/dashboard/revenue/RevenueTab.tsx`
- `src/components/dashboard/expenses/ExpensesTab.tsx` (+ `CategoryHeatmap.tsx`, `ParetoChart.tsx`)
- `src/components/dashboard/clients/ClientsTab.tsx`
- `src/components/dashboard/cash/CashTab.tsx`
- `src/hooks/useCategoryAnnualBreakdown.ts`
- `src/hooks/useCostCenterAnnualBreakdown.ts`

---

## FASE 3 — INTELIGÊNCIA (médio/alto custo)

Aba **"Projeção & Tendência"**:

1. **Projeção vs Realizado** (mês a mês do ano corrente):
   - Realizado (PAGO) · Previsto (EM_ABERTO + recorrências futuras) · Meta (opcional).
2. **Comparativo YoY**: ano corrente vs ano anterior (linhas sobrepostas) para Receita, Despesa, Resultado.
3. **Tendência (média móvel 3m)** com indicador de aceleração/desaceleração.
4. **Cenários simples**: "se cortar X% das variáveis", "se perder cliente Y".
5. **Forecast de saldo de caixa** até final do ano por conta + total.

**Custo técnico:** médio-alto. Requer agregadores que cruzam transações realizadas + parcelas futuras de `recurring_installments` + `fixed_expenses` projetados.

**Arquivos:**
- `src/components/dashboard/forecast/ForecastTab.tsx`
- `src/components/dashboard/forecast/YoYComparison.tsx`
- `src/components/dashboard/forecast/ScenarioSimulator.tsx`
- `src/hooks/useAnnualProjection.ts`

---

## FASE 4 — EXPLORAÇÃO & INSIGHTS (alto custo)

Aba **"Insights"**:

1. **Drill-down universal**: qualquer KPI/gráfico clicável navega para a lista de transações filtrada (descrição, categoria, conta, período).
2. **Insights automáticos** (regras simples no client, sem IA):
   - "Despesas com X cresceram 40% vs mês anterior."
   - "Cliente Y representa 35% da receita — risco alto."
   - "Conta Z ficará negativa em 18 dias no ritmo atual."
3. **Comparativos multi-ano** (3 anos lado a lado).
4. **Exportação** (CSV/PDF) de cada bloco.

**Custo técnico:** alto. Requer engine de regras de insight + sistema de navegação cruzada padronizada entre módulos.

**Arquivos:**
- `src/components/dashboard/insights/InsightsTab.tsx`
- `src/lib/dashboard/insightRules.ts`
- `src/lib/dashboard/drillDownNavigator.ts`

---

## Decisões a confirmar antes da Fase 1

1. **Indicadores Fiscais** (`FiscalIndicators`): manter na aba Executivo como tira reduzida, ou mover para subpágina dedicada (consistente com a recomendação de baixa prioridade)?
2. **MRR / SM contratado**: exibir em R$ (multiplicado pelo SM ativo do ano) ou em "X SM"?
3. **Aba "Análise Anual" atual**: absorvida pelo novo "Executivo" + "Receita/Despesas", ou mantida como compatibilidade?

---

## Entregável Fase 1 (próxima execução, após aprovação)

Apenas a Fase 1 (Executivo) — entrega visível e funcional em uma única iteração. As Fases 2–4 serão planejadas e aprovadas individualmente conforme avançarmos.