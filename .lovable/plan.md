# Plano — Revisão e Correção do Dashboard

## Problemas identificados (auditoria)

### 1. Projeção vs Realidade — bugs críticos (`ProjectionChart.tsx`)
- **Bug do "ano selecionado"**: `currentMonth` é sempre o mês atual do calendário (`new Date().getMonth()+1`). Ao consultar **2025**, meses depois do mês atual de 2026 já passaram, mas o gráfico ainda os trata como "futuros" e substitui o realizado pela **projeção dos contratos ativos** — gerando a "depressão" / valores incorretos que você está vendo em 2025.
- **Bug de despesa prevista**: a expressão é `isFutureMonth ? expectedExpenses : expectedExpenses` (idêntico nos dois lados) — não há projeção de despesa para meses futuros, então meses sem lançamento aparecem zerados.
- **Linha "Realizado" some**: `realizadoReceita/Despesa` é setado como `null` para meses futuros e `connectNulls={false}` faz a linha desaparecer abruptamente — visualmente parece "errado".
- **Limite 1000 linhas**: `select('...').eq('competencia_ano', ano)` sem paginação. Anos com muitos lançamentos podem ser truncados.

### 2. Dashboard (`Dashboard.tsx`)
- Usa `useTransactions({mes,ano})` que carrega TODAS as transações com joins pesados (limite 1000 silencioso) — pode esconder dados em meses cheios.
- KPIs de "% Recorrente / % Fixa" calculados sobre `valor` (esperado) — não distinguem realizado vs previsto e ignoram transferências/investimentos (deveriam ser excluídos, conforme regra do projeto).
- "% Despesas Variáveis = 100 - %Fixa": quando não há despesa, mostra 100%.
- "Atrasados" usa apenas `status='ATRASADO'`, mas o sistema mantém muitos itens vencidos como `EM_ABERTO` (status não é atualizado por trigger). Precisa considerar `data_vencimento < hoje AND status != 'PAGO'`.
- "Saldo em Conta" não respeita o ano selecionado (sempre mostra saldo atual). Confunde quando o usuário navega para 2024/2025.
- `clientName` usa `recurring_clients.name` direto — entradas avulsas com entity_id ficam como "Outros" e poluem o ranking.

### 3. Receita x Despesa (`RevenueExpenseChart.tsx`)
- Mostra "últimos 6 meses" relativos ao **mês real de hoje**, mas filtra a query só pelo `currentYear` selecionado. Ao navegar para 2024/2025, a janela móvel pode pedir meses que não existem no resultado e/ou ignorar parte do ano selecionado.
- Despesa fixa/variável só filtra por `transaction_categories.expense_type`, mas categorias antigas usam apenas `subtype` ou nem isso — falha em parte do histórico.

### 4. Outros indicadores
- `FiscalIndicators`, `RecurringVsPontualChart`, `ClientRankingChart` herdam dos mesmos hooks → mesmos riscos de truncamento.

---

## Correções propostas

### A. ProjectionChart (núcleo da queixa)
1. Calcular `currentMonth` como:
   - se `selectedYear < anoAtual` → 12 (todos os meses são "passado/realizado").
   - se `selectedYear > anoAtual` → 0 (todos "futuros/projetados").
   - se igual → mês atual real.
2. Corrigir `previstoDespesa`: para meses futuros, usar **média dos últimos 3 meses realizados de despesa** (ou despesas fixas projetadas via `fixed_expenses` ativas) em vez de repetir o `expectedExpenses=0`.
3. Sempre exibir realizado = 0 (e não null) quando o mês já é passado mas não tem dado, para a linha não "sumir". Em meses futuros manter null.
4. Buscar transações em paginação (loop `range`) ou via RPC agregada — eliminar o limite 1000.
5. Adicionar tooltip mais claro: "Realizado (PAGO)", "Previsto (lançado)".
6. Excluir TRANSFERÊNCIAS e INVESTIMENTOS (regra global do projeto) dos cálculos de receita/despesa.

### B. Dashboard
1. Substituir `useTransactions` por uma query agregada/paginada dedicada ao período (sem joins pesados quando só precisamos somar).
2. KPI "Atrasados": considerar `status != 'PAGO' AND data_vencimento < hoje`, somando entrada+saída separadamente.
3. KPI "Saldo em Conta": rotular como "Saldo Atual (Hoje)" e adicionar tooltip explicando que não muda com o filtro de período. Como melhoria, mostrar também saldo projetado para fim do período selecionado.
4. KPI "% Recorrente / % Fixa": basear em valor pago quando o mês já passou; em valor previsto para mês corrente/futuro. Excluir transferências/investimentos.
5. KPI "% Despesas Variáveis": só calcular se houver despesa total > 0; senão exibir "—".
6. Ranking de clientes: usar `entity` quando `cliente_id` for nulo, agrupando por nome real; descartar "Outros".

### C. RevenueExpenseChart
1. Mudar para mostrar **os 12 meses do ano selecionado** (consistente com ProjectionChart) ou janela móvel cruzando ano corretamente (buscar 2 anos quando necessário).
2. Detecção de fixa/variável: considerar `expense_type`, `subtype` e `natureza='RECORRENTE'` (já feito) e como fallback a categoria do tipo "FIXA" do nome — manter mas adicionar log/warning para categorias sem classificação.

### D. Robustez geral
- Criar helper `fetchAllPaginated` em `lib/financial/` para evitar o cap de 1000.
- Centralizar a regra "excluir Transferências/Investimentos" num filtro reutilizável.
- Reaproveitar o seletor de período (mês+ano) já presente em `MonthYearNavigator`.

---

## Detalhes técnicos

**Arquivos a alterar:**
- `src/components/dashboard/ProjectionChart.tsx` — refator completo do cálculo
- `src/components/dashboard/Dashboard.tsx` — KPIs corrigidos e nova query agregada
- `src/components/dashboard/RevenueExpenseChart.tsx` — janela do ano selecionado
- `src/components/dashboard/RecurringVsPontualChart.tsx` — auditar mesmos bugs (truncamento)
- `src/lib/financial/aggregates.ts` (novo) — helpers `fetchAllTransactions(year)`, `excludeTransfersInvestments(tx)`, `monthlyTotals(tx)`
- `src/hooks/useTransactions.ts` — opcional: `useTransactionsAggregated({year})` enxuto sem joins

**Sem mudanças de schema** — apenas correções de lógica no front + um helper.

## Resultado esperado
- 2024/2025 deixam de exibir "depressão" falsa: meses já passados sempre mostram realizado real.
- Linha de Realizado contínua até o mês atual; barras de Previsto consistentes para o ano todo.
- KPIs de % e Atrasados refletem regras do projeto (sem transferências/investimentos, vencidos por data).
- Sem perda silenciosa de dados em meses com muitos lançamentos.
