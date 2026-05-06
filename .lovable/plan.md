# Reestruturação da Página de Detalhamento de Conta

A página hoje abre como drawer lateral, com poucos KPIs e gráficos. Vamos transformá-la em **painel analítico completo (página inteira)**, dividido em **3 fases** para garantir estabilidade e entregar valor a cada etapa.

---

## Fase 1 — Fundação: Página completa + cálculos corretos + KPIs

**Objetivo:** trocar o drawer por uma rota navegacional, garantir que todos os números (saldo, transferências, entradas, saídas) batem matematicamente.

### Mudanças
1. **Nova "rota" interna `account-detail`** controlada por estado em `pages/Index.tsx` (mantém padrão atual de tabs, sem React Router novo).
   - `AccountsView` passa a chamar `onOpenDetail(account)` em vez de abrir drawer.
   - `Index` adiciona estado `selectedAccountId` e renderiza `<AccountDetailPage>` em tela cheia quando setado.
   - Header com botão **"← Voltar para Contas"** + breadcrumb `Contas > {nome}`.

2. **Novo componente `AccountDetailPage.tsx`** (substitui `AccountDetailView` no contexto de página).
   - Reaproveita lógica do `AccountDetailView` atual mas em layout de página (largura total, sem padding de drawer).
   - Aposenta `AccountDetailDrawer.tsx` (mantemos arquivo até confirmar, depois removemos).

3. **Auditoria de cálculos** no hook `useAccountsSnapshot` e `useAccountDetail`:
   - Validar que `saldo_inicio_mes`, `entradas_mes`, `saidas_mes`, `transferencias_in/out`, `saldo_fim_mes` cobrem todas as fontes (transações PAGO + account_transfers).
   - Validar identidade: `saldo_fim = saldo_ini + entradas + trIn − saidas − trOut`. Se houver divergência, corrigir o hook.
   - Rodar `recalculate_account_balance` para todas as contas via migração (já existe a função).

4. **Bloco de validação visual** no topo da página: mini-linha mostrando a equação acima com os valores reais, em vermelho se inconsistente.

**Entrega:** página dedicada funcionando, números corretos, KPIs confiáveis. Tudo o que já existe continua funcionando.

---

## Fase 2 — Análises por categoria + gráficos estratégicos

**Objetivo:** entregar os relatórios e insights por categoria que hoje não existem.

### Mudanças
1. **Gráfico anual de saldo melhorado** (`AccountBalanceEvolutionChart`):
   - Linha contínua de saldo + barras opcionais de entradas/saídas no mesmo eixo (ComposedChart).
   - Toggle "Mostrar entradas/saídas".
   - Corrigir base: usar saldo de abertura real do ano (não `initial_balance` da conta) — calcular a partir de movimentos anteriores ao ano selecionado.

2. **Gráfico de barras empilhadas por categoria** (componente novo `AccountCategoryStackedChart.tsx`):
   - Eixo X: meses Jan–Dez do ano ativo.
   - Eixo Y: valor.
   - Cada barra empilhada por categoria (cores da própria categoria).
   - Toggle Entradas / Saídas (separados, pois somar não faz sentido).
   - Tooltip com top 5 categorias do mês.
   - Dados via `useAccountAnnual` (já estrutura `byCategory`).

3. **Aba "Categorias" reforçada** (`AccountCategoryAnalysis.tsx`):
   - Lista por categoria com: total, % da conta, mini-sparkline 12 meses, tendência (subindo/descendo via regressão linear simples).
   - Clique na categoria → abre modal/drawer com lista de movimentos filtrados.

4. **Bloco "Insights da conta"** (`AccountInsights.tsx`) — regras simples:
   - "Categoria X representa Y% das despesas"
   - "Mês com maior saída: {mês} ({valor})"
   - "Transferências representam X% das entradas"
   - "Saldo cresceu/caiu Y% nos últimos 6 meses"
   - "N% das entradas vêm de transferências internas (atenção)"

**Entrega:** análise estratégica por categoria + insights automáticos. A pergunta "para onde foi o dinheiro?" passa a ter resposta visual.

---

## Fase 3 — Movimentos avançados + Aba Análise Anual completa

**Objetivo:** entregar tabela de movimentos no nível das transações + visão anual consolidada.

### Mudanças
1. **Aba "Movimentos" reforçada** (`AccountMovementsTable.tsx`):
   - Tabela tipo planilha (similar à Lançamentos): data, tipo (entrada/saída/transferência), descrição, categoria, contraparte, valor, status.
   - Filtros: período (hoje/semana/15d/mês/customizado), categoria (multi), tipo (multi).
   - Busca textual (cmdk-style).
   - Ordenação por coluna.
   - Inclui transferências (linhas adicionais com ícone próprio).
   - Export CSV.

2. **Aba "Transferências" separada in/out** com totais e contrapartes mais frequentes.

3. **Aba "Análise Anual" nova** (`AccountAnnualAnalysisTab.tsx`):
   - KPIs anuais: total movimentado, recebido, gasto, transferido, crescimento %.
   - Gráfico comparativo mês a mês (entradas vs saídas).
   - Top 10 categorias do ano.
   - Evolução de saldo ano completo (com início real).
   - Comparativo com ano anterior (se houver dados).

**Entrega:** painel analítico completo, leitura estratégica e operacional da conta.

---

## Detalhes técnicos

### Arquivos novos
- `src/components/accounts/AccountDetailPage.tsx` (Fase 1)
- `src/components/accounts/AccountCategoryStackedChart.tsx` (Fase 2)
- `src/components/accounts/AccountCategoryAnalysis.tsx` (Fase 2)
- `src/components/accounts/AccountInsights.tsx` (Fase 2)
- `src/components/accounts/AccountMovementsTable.tsx` (Fase 3)
- `src/components/accounts/AccountAnnualAnalysisTab.tsx` (Fase 3)
- `src/hooks/useAccountInsights.ts` (Fase 2)
- `src/hooks/useAccountMovements.ts` (Fase 3, com paginação/filtros)

### Arquivos editados
- `src/pages/Index.tsx` — adicionar estado e roteamento para a página de detalhe.
- `src/components/accounts/AccountsView.tsx` — `onClick` da `AccountCard` chama `onOpenDetail` em vez de drawer.
- `src/hooks/useAccountAnnual.ts` — corrigir `endBalance` usando saldo de abertura do ano real.
- `src/hooks/useAccountsSnapshot.ts` / `useAccountDetail.ts` — validar e ajustar cálculos.
- `src/components/accounts/AccountBalanceEvolutionChart.tsx` — adicionar barras opcionais.

### Arquivos depreciados
- `src/components/accounts/AccountDetailDrawer.tsx` — manter por enquanto, remover após Fase 1 estabilizar.

### Migrações
- 1 migração na Fase 1: `SELECT recalculate_account_balance(id) FROM accounts WHERE active`. Sem alteração de schema.

---

## Resultado por fase

| Fase | Tempo de UI | Ganho |
|------|-------------|-------|
| 1 | Página completa funcional, números corretos | Confiabilidade + UX |
| 2 | Gráficos por categoria + insights automáticos | Estratégia |
| 3 | Tabela detalhada + análise anual | Operação + decisão |

Aprove para começar pela **Fase 1**.
