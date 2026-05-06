## Visão Geral

Reconstruir o módulo "Contas" como painel de gestão financeira por setor, em **4 fases incrementais**. Ao final de cada fase há um checkpoint de teste antes de avançar — fases seguintes só consomem o que foi validado.

Princípios:
- **Saldo nunca é manual.** Tudo deriva de `transactions` + `account_transfers` (já calculado por `recalculate_account_balance`).
- **Snapshots históricos** são calculados sob demanda (saldo no fim de qualquer mês).
- **Ajustes manuais** geram transações categorizadas como "Ajuste" — nunca tocam `current_balance` diretamente.
- A tabela `accounts` e a função `recalculate_account_balance` continuam sendo a base de verdade — não mudam.

---

## Fase 1 — Reset e nova Visão Geral

**Remover**
- Substituir conteúdo de `AccountsView.tsx` (descartar abas Composição, Transferências, Saúde antigas).
- Apagar arquivos legados: `AccountsOverviewTab`, `AccountsCompositionTab`, `AccountsTransfersTab`, `AccountsHealthTab`, `AccountsKpiGrid`, `AccountsRankings`, `AccountsHeader`, `AccountSummaryCard`, `AccountsGrid`, `AccountCard`.
- Manter (serão reutilizados ou substituídos depois): `AccountModal.tsx`, `TransferModal.tsx`.

**Criar**
- `AccountsView.tsx` (novo) — header + filtro mês/ano + grid de cards.
- `AccountsHeader.tsx` — título, seletor MonthYear, botões "Nova Conta", "Transferir", "Ajuste".
- `AccountCard.tsx` — para cada conta:
  - nome / banco
  - **saldo no fim do mês selecionado** (snapshot histórico)
  - **variação no mês** (saldo fim do mês − saldo fim do mês anterior) com seta ↑/↓ verde/vermelho
  - entradas e saídas do mês
  - clique abre drill-down (Fase 3)
- `useAccountsSnapshot.ts` — hook que para cada conta calcula:
  - `saldo = initial_balance + Σ(PAGOs até último dia do mês) + transfers_in − transfers_out`
  - `entradas_mes`, `saidas_mes`, `variacao`
  - Implementação: 1 query paginada em `transactions` com `data_pagamento <= fim_do_mes AND status='PAGO'` + 1 query em `account_transfers` com `transfer_date <= fim_do_mes`.

**Checkpoint Fase 1**
- Saldos do mês corrente devem bater exatamente com `accounts.current_balance`.
- Trocar para mês passado deve mostrar fotografia coerente (saldo cresce/diminui consistentemente mês a mês).
- Soma dos saldos = soma de `current_balance` quando mês = atual.

---

## Fase 2 — Visão histórica (gráfico de evolução)

**Criar**
- `AccountsEvolutionChart.tsx` — gráfico de linhas com saldo de cada conta nos últimos 12 meses (toggle por conta on/off, soma total opcional).
- `AccountsDistributionPanel.tsx` — gráfico de pizza/donut mostrando % do dinheiro total em cada conta no mês selecionado.
- Reutiliza `useAccountsSnapshot` em loop (12 meses) com cache via React Query.

**Checkpoint Fase 2**
- Linha de evolução fecha com snapshots da Fase 1 ponto a ponto.
- Distribuição soma 100%.

---

## Fase 3 — Drill-down da conta

**Criar**
- `AccountDetailDrawer.tsx` (Sheet lateral grande) ou nova rota `accounts/[id]`:
  - Header: nome, saldo atual, saldo no período, variação YoY/MoM.
  - Mini-gráfico de evolução (12 meses só dessa conta).
  - **Aba "Transações"**: lista filtrada por `account_id` com filtros por mês/ano e tipo (entrada/saída/transferência/ajuste). Reutiliza `TransactionsList` existente passando filtro fixo de conta.
  - **Aba "Transferências"**: histórico de `account_transfers` envolvendo a conta.
  - **Aba "Composição por categoria"**: barras horizontais mostrando para onde o dinheiro está indo (top categorias de saída) e de onde está vindo (top categorias de entrada) no período.

**Checkpoint Fase 3**
- Soma das transações listadas = entradas/saídas exibidas no card.
- Filtros funcionam sem perder contexto de conta.

---

## Fase 4 — Transferências e ajustes manuais

**Transferências** (já existe `TransferModal` + tabela `account_transfers`)
- Manter `TransferModal`, mas integrar no novo header.
- Lista de transferências recentes dentro do drill-down.

**Ajustes manuais** (nova funcionalidade)
- Criar `AccountAdjustmentModal.tsx` com 3 modos:
  - **Adicionar saldo** → cria `transaction` ENTRADA, `origem='LANCAMENTO_MANUAL'`, descrição "Ajuste manual (+)", categoria "AJUSTE DE SALDO", status PAGO.
  - **Retirar saldo** → cria SAIDA equivalente.
  - **Zerar conta** → cria SAIDA (ou ENTRADA) do valor exato necessário para zerar o saldo atual da conta.
- Migration: criar categoria `AJUSTE DE SALDO` (tipo dual? na verdade duas: uma ENTRADA e uma SAIDA) vinculada a um centro de custo "Ajustes internos" (não DRE).

**Checkpoint Fase 4**
- Adicionar/retirar reflete no saldo via trigger existente.
- "Zerar conta" zera exatamente.
- Ajustes aparecem na lista de transações com badge "Ajuste".

---

## Detalhes técnicos

**Cálculo de snapshot de saldo (mês M, ano A)**
```text
end_of_month = último dia de A-M
saldo(conta) = initial_balance
             + Σ valor_pago de transactions onde
                 account_id = conta
                 AND status = 'PAGO'
                 AND data_pagamento <= end_of_month
                 AND tipo_movimento = 'ENTRADA'
             − Σ valor_pago equivalente para SAIDA
             + Σ amount de account_transfers (to_account_id = conta, transfer_date <= end_of_month)
             − Σ amount de account_transfers (from_account_id = conta, transfer_date <= end_of_month)
```

**Performance**: uma única query paginada com `fetchAllPaginated` (já existe em `lib/financial/aggregates.ts`) carrega todas as `transactions` PAGAS até o fim do mês mais distante exibido; agrega no cliente por mês × conta.

**Migration na Fase 4**
- Inserir 1 categoria "AJUSTE DE SALDO" tipo ENTRADA e 1 tipo SAIDA, vinculadas a um cost_center "Ajustes internos" com `dre_group = 'NAO_OPERACIONAL'` (ou existente equivalente) para não poluir DRE.

**Arquivos previstos**

| Fase | Arquivo | Ação |
|---|---|---|
| 1 | `src/components/accounts/AccountsView.tsx` | reescrever |
| 1 | `src/components/accounts/AccountsHeader.tsx` | reescrever |
| 1 | `src/components/accounts/AccountCard.tsx` | reescrever |
| 1 | `src/hooks/useAccountsSnapshot.ts` | criar |
| 1 | `Accounts{Overview,Composition,Transfers,Health,Kpi,Rankings,Summary,Grid}*.tsx` | apagar |
| 2 | `src/components/accounts/AccountsEvolutionChart.tsx` | criar |
| 2 | `src/components/accounts/AccountsDistributionPanel.tsx` | criar |
| 3 | `src/components/accounts/AccountDetailDrawer.tsx` | criar |
| 4 | `src/components/accounts/AccountAdjustmentModal.tsx` | criar |
| 4 | migration: categorias e cost_center de ajuste | criar |

---

## Resultado esperado

- Página enxuta de cards por conta com snapshot do mês escolhido + variação.
- Gráfico de 12 meses mostrando evolução real do dinheiro.
- Drill-down completo por conta (transações, transferências, composição).
- Transferências e ajustes manuais sempre rastreáveis via `transactions` (única fonte de verdade).
- Sem saldo manual; sem divergências entre páginas.
