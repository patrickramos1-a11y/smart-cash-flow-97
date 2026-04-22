

## Bloco 1 — Reconstrução da página Contas: Clareza & Confiança

### Objetivo
Ao abrir **Contas**, o usuário entende em segundos: saldo total, contas positivas, negativas, zeradas, em alerta, e quais merecem atenção. Mantemos as abas existentes (Composição, Transferências, Saúde) intactas — refazemos apenas a aba **"Visão Geral"**.

### Nova estrutura da aba Visão Geral

```text
┌─ Cabeçalho inteligente ──────────────────────────────────────┐
│ [Ano ▼] [Mês ▼] [Mês Atual] [Ano Completo] [↻ Atualizar]    │
└──────────────────────────────────────────────────────────────┘

┌─ KPIs (6 cards) ─────────────────────────────────────────────┐
│ Saldo │ Positivas │ Negativas │ Zeradas │ Alerta │ Nº Contas│
└──────────────────────────────────────────────────────────────┘

┌─ Grid de Contas (cards) ─────────────────────────────────────┐
│ [conta] [conta] [conta] ...                                  │
│ filtros: Todas | Positivas | Negativas | Zeradas | Alerta    │
└──────────────────────────────────────────────────────────────┘

┌─ Rankings ───────────────────────────────────────────────────┐
│ Top 5 + │ Top 5 - │ Sem movimentação │ Mais utilizadas      │
└──────────────────────────────────────────────────────────────┘
```

### 1. Cabeçalho inteligente
- Seletor de **Ano** + **Mês** + atalhos **"Mês Atual"** / **"Ano Completo"** (alterna escopo do período).
- Botão **"Atualizar saldos"** — chama `recalculate_account_balance` para todas as contas (loop client-side sobre o RPC já existente) e invalida queries.
- Padrão ao abrir: **ano atual + mês atual**.

### 2. Cards de KPI (6)
Calculados a partir de `computeAllBalances` (já existente em `src/lib/financial/balances.ts`) — fonte única e confiável.

| KPI | Fórmula | Cor |
|---|---|---|
| Saldo Consolidado | Σ `computedBalance` de todas as contas ativas | primary |
| Positivas | Σ saldos > 0 (e contagem) | income/verde |
| Negativas | Σ saldos < 0 (e contagem) | expense/vermelho |
| Zeradas | contagem de saldos == 0 | muted |
| Em Alerta | contagem de contas com `drift > 0.01` ou sem categoria vinculada | warning/amarelo |
| Total de Contas | contagem ativas | neutro |

### 3. Grid visual de contas
Cada card (substitui o `AccountCard` atual com versão mais informativa):
- Nome + categoria de conta (cor)
- **Saldo grande**, com cor por status
- **% do total geral** (`saldo / saldo consolidado × 100`)
- **Status pill**: Positiva / Negativa / Zerada / Em Alerta
- Movimentações no período selecionado (count de transações PAGAS no mês/ano)
- **Mini sparkline** de saldo acumulado dos últimos 6 meses
- Selo **"Revisar"** se: sem categoria de conta, sem categorias de transação vinculadas, ou drift detectado
- Botão **"Ver detalhes"** → abre a aba Composição já filtrada por essa conta

Filtros rápidos acima do grid: **Todas | Positivas | Negativas | Zeradas | Em Alerta** + busca por nome.

### 4. Rankings (4 listas compactas)
- **Top 5 maiores saldos positivos**
- **Top 5 maiores déficits** (mais negativas)
- **Sem movimentação** no período selecionado (0 transações PAGAS)
- **Mais utilizadas no mês** (maior nº de transações PAGAS)

### Regras de cálculo (consistência total)
- Todos os saldos vêm de `computeAllBalances` — mesma função usada na aba Saúde, espelha o `recalculate_account_balance` SQL.
- Movimentações = só `status = 'PAGO'`, valor `valor_pago ?? valor`.
- Transferências contam como entrada/saída para fins de movimentação no card.
- Se `drift > 0.01` aparece banner amarelo no topo: *"X contas com saldo divergente — Reconciliar agora"* com ação que dispara o RPC.

### Arquitetura de arquivos

- **Novo:** `src/components/accounts/AccountsHeader.tsx` — Ano/Mês/atalhos/atualizar.
- **Novo:** `src/components/accounts/AccountsKpiGrid.tsx` — 6 cards de KPI.
- **Novo:** `src/components/accounts/AccountsGrid.tsx` — grid + filtros de status + busca.
- **Novo:** `src/components/accounts/AccountSummaryCard.tsx` — card moderno (substitui visualmente o atual `AccountCard.tsx` no contexto da Visão Geral).
- **Novo:** `src/components/accounts/AccountsRankings.tsx` — 4 listas de ranking.
- **Novo:** `src/hooks/useAccountsOverview.ts` — hook único que retorna `{ accounts, balances, kpis, rankings, drifts, period }` baseado em `useAccounts`, `useTransactions`, `useAccountTransfers` + `computeAllBalances`. Centraliza toda a matemática.
- **Editar:** `src/components/accounts/AccountsOverviewTab.tsx` — vira orquestrador fino que monta Header + KPIs + Grid + Rankings consumindo o novo hook.
- **Editar:** `src/components/accounts/AccountsView.tsx` — promover o seletor de período para o nível da página (compartilhado com as outras abas no futuro), remover o seletor de ano duplicado.

### O que NÃO entra neste bloco
- Histórico profundo de conta · transferências avançadas · automações · reconciliação massiva · IA de insights. (Reservado para próximos blocos.)

### Resultado esperado
- Tela carrega em até 1 telão visual, sem scroll para entender a situação.
- Saldos 100% consistentes com a função SQL (mesma fórmula em um só lugar).
- Status visual imediato (cores + selos), revisão a um clique.
- Filtros e rankings que respondem à pergunta *"onde está o dinheiro e o que precisa de atenção?"* em segundos.

