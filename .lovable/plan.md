# Módulo de Transferências Planejadas

Cria um sistema completo de planejamento de transferências entre contas (avulsas + recorrentes), com geração automática de ocorrências futuras, conversão de despesas em transferências, e cálculo de **Saldo Previsto** por conta.

---

## Fase 1 — Estrutura de dados

Nova tabela `planned_transfers` (modelo/recorrência):

- `from_account_id`, `to_account_id`, `amount`, `category_id` (opcional)
- `frequency`: `AVULSA | MENSAL | QUINZENAL | SEMANAL | TRIMESTRAL | ANUAL | CUSTOM`
- `interval_days` (para CUSTOM)
- `start_date`, `end_date` (opcional), `due_day` (default 10)
- `status`: `ATIVO | PAUSADO | ENCERRADO`
- `description`, `notes`, `created_by`

Nova tabela `planned_transfer_occurrences` (parcelas/ocorrências):

- `planned_transfer_id`, `scheduled_date`, `expected_amount`
- `status`: `PLANEJADA | EXECUTADA | ATRASADA | CANCELADA`
- `executed_transfer_id` (FK → `account_transfers.id` quando executada)
- `executed_at`, `executed_by`

Coluna nova em `account_transfers`:
- `planned_occurrence_id` (FK opcional, rastreabilidade)

Coluna nova em `transactions`:
- `planned_transfer_occurrence_id` — quando uma despesa nasce de um planejamento, marca o vínculo. Permite "Converter em transferência" sem duplicar valor.

Função SQL `generate_planned_transfer_occurrences(planned_id)`: gera ocorrências do início até `end_date` (ou +12 meses se indefinido). Trigger: ao inserir/atualizar `planned_transfers`, regenera ocorrências futuras não executadas.

Função `execute_planned_occurrence(occurrence_id, real_date)`: cria `account_transfers` real, marca ocorrência como EXECUTADA e vincula.

---

## Fase 2 — Hook + tela de gestão

**Hook `usePlannedTransfers`**: CRUD do modelo + listagem de ocorrências futuras agregadas.

**Nova aba "Transferências Planejadas"** dentro de Contas (`AccountsView` ganha `Tabs`: *Visão geral* | *Planejadas*):

- KPIs: total planejado mês, próximas 7 dias, atrasadas, pausadas
- Lista agrupada por **Conta destino** (ou tipo)
- Cada item: origem → destino, valor, frequência, próxima execução, badge de status
- Ações por linha: **Editar**, **Pausar/Retomar**, **Excluir**, **Executar agora**
- Seleção múltipla → editar valor em lote (atualiza todas ocorrências futuras EM ABERTO)

**Modal `PlannedTransferModal`**: criar/editar com cards visuais (mesmo padrão do `TransferModal` atual) + bloco de recorrência (frequência, data inicial, data final opcional, dia de vencimento).

---

## Fase 3 — Conversão e impacto em transações

Quando uma transação tem `planned_transfer_occurrence_id`:

- Na lista de transações, o botão "Pagar" é **substituído** por "**Converter em transferência**"
- Ao confirmar: chama `execute_planned_occurrence`, marca a transação como `CONVERTIDA_TRANSFERENCIA` (novo status) — não impacta DRE, apenas referência histórica
- Badge visual "Planejada → Transferência" na transação

Útil para o caso real do usuário: lança como despesa fixa, e na hora certa converte em transferência sem virar despesa de caixa.

---

## Fase 4 — Saldo Previsto + gráficos

**Hook `useAccountForecast(accountId, year)`**: calcula 3 séries:

1. **Saldo Real** — apenas transações PAGAS
2. **Saldo com Transferências** — + transferências executadas
3. **Saldo Previsto** — + transações futuras EM_ABERTO + ocorrências PLANEJADAS

Atualizações na **AccountDetailPage**:

- `AccountBalanceEvolutionChart`: ganha **2ª linha tracejada** = Saldo Previsto até dez/ano
- Barras futuras destacadas (transferências planejadas + entradas previstas)
- Bloco **"Insights de Caixa Futuro"**:
  - "Conta ficará negativa em [mês]" (se previsto < 0)
  - "Pico previsto em [mês]: R$ X"
  - "Transferências planejadas cobrem X% das despesas previstas"

---

## Fase 5 — Regras de integridade

- Transferências planejadas **NÃO** entram no DRE (tag de exclusão já aplicada via tipo)
- Ocorrência só pode ser executada uma vez (constraint UNIQUE em `executed_transfer_id`)
- Editar modelo recria ocorrências futuras PLANEJADAS, **preserva** EXECUTADAS
- Pausar = ocorrências futuras viram CANCELADA (reversível)
- Encerrar = define `end_date = today`, cancela futuras

---

## Arquivos principais

```text
supabase/migrations/<ts>_planned_transfers.sql
src/hooks/usePlannedTransfers.ts
src/hooks/useAccountForecast.ts
src/components/accounts/PlannedTransfersTab.tsx
src/components/accounts/PlannedTransferModal.tsx
src/components/accounts/PlannedTransferRow.tsx
src/components/accounts/AccountForecastInsights.tsx
src/components/accounts/AccountsView.tsx           (adiciona Tabs)
src/components/accounts/AccountBalanceEvolutionChart.tsx  (linha previsto)
src/components/transactions/...                   (botão Converter em transferência)
```

---

## Entrega faseada (com valor a cada passo)

1. **Fase 1 + 2** → planejamento completo já funcional (lista, criar, editar, pausar)
2. **Fase 3** → conversão da despesa em transferência (fluxo do usuário)
3. **Fase 4** → previsibilidade de saldo + insights
4. **Fase 5** → polimento de regras e edição em lote

Aprovando, começo pela **Fase 1 + 2** para entregar valor visível rápido.