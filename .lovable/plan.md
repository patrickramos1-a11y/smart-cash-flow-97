# Melhorias no módulo de Contas

## 1. Modal de Transferência — Visual + Origem padrão Bancária

Arquivo: `src/components/accounts/TransferModal.tsx`

- Reescrever layout em 2 cards visuais (Origem / Destino) lado a lado, com seta animada `ArrowRightLeft` ao centro.
- Cada card mostra: ícone colorido (cor da categoria da conta), nome da conta, banco, **saldo atual** e **saldo estimado após** (verde/vermelho conforme positivo/negativo).
- Campo de **Valor** em destaque (input grande, formato BRL) usando `CurrencyInput`.
- Aviso visual quando saldo estimado da origem ficar negativo (badge âmbar, não bloqueia).
- Origem padrão: ao abrir o modal, pré-selecionar a conta cujo `name ILIKE 'BANC%'` (fallback: primeira ativa). Permanece editável.
- Manter campos: data e observações; rodapé com botão primário "Confirmar transferência".

## 2. Saldos considerando transferências (auditoria + correção)

A lógica de saldo já considera transferências em três pontos:
- SQL: `recalculate_account_balance` (soma `transfer_in` − `transfer_out`).
- Frontend snapshot mensal: `useAccountsSnapshot`.
- Cálculo unificado: `src/lib/financial/balances.ts`.

Ações:
- Forçar recálculo de todos os saldos (`recalculate_account_balance` para cada conta ativa) via migration de manutenção, garantindo consistência atual.
- Em `AccountCard`, exibir uma linha extra "Transferências" (in/out do mês) abaixo de Entradas/Saídas para evidenciar o impacto.
- Confirmar (sem mudança de código necessária) que `dre.ts` e `useDREReport.ts` não somam `account_transfers` — transferências continuam fora do DRE/faturamento.

## 3. Página de Detalhamento da Conta (gerencial)

Hoje: `AccountDetailDrawer` (Sheet lateral, 4 abas básicas).
Novo: substituir por `AccountDetailView` em rota interna `/?view=account&id=...` (ou manter Sheet em telas grandes). Para simplificar e respeitar o padrão atual, **manteremos um Sheet em largura máxima (`sm:max-w-5xl`)** com layout de página completa.

### 3.1 Cabeçalho
- Ícone + cor da categoria, nome da conta, banco, badge de status.
- Seletor mês/ano (reuso `MonthYearNavigator`).
- Saldo atual em destaque (grande).
- Botões: **Transferir** (abre `TransferModal` pré-preenchido com esta conta como origem) e **Ajustar saldo**.

### 3.2 KPIs (6 cards)
1. Saldo inicial do período
2. Entradas por recebimentos
3. Entradas por transferências
4. Saídas por despesas
5. Saídas por transferências
6. Saldo final + variação (chip colorido)

Já calculados em `useAccountsSnapshot` (`entradas_mes`, `saidas_mes`, `transferencias_in/out`, `saldo_inicio_mes`, `saldo_fim_mes`, `variacao`).

### 3.3 Abas
- **Visão Geral** — KPIs + gráfico de evolução de saldo (linha 12 meses) + top 5 categorias.
- **Movimentos** — lista de transações pagas (atual conteúdo da aba "Movimentos").
- **Transferências** — atual aba de transferências, com totais IN/OUT no topo.
- **Categorias** — composição por categoria (atual) + barra empilhada por mês.
- **Análise Anual** — gráfico anual por categoria (ver 3.4).

### 3.4 Gráfico anual por categoria (novo)

Componente: `src/components/accounts/AccountAnnualChart.tsx`
- BarChart empilhado (recharts), eixo X = meses Jan→Dez, séries = top N categorias da conta no ano + bucket "Outras".
- Toggle Entradas / Saídas / Ambos.
- Tooltip mostra valor por categoria e total mensal.

Hook: `src/hooks/useAccountAnnual.ts`
- Query: transações pagas da conta no ano agrupadas por `(competencia_mes, transaction_category_id, tipo_movimento)`.
- Inclui também série de transferências mensais (linha sobreposta opcional).

### 3.5 Filtros
- Ano, Mês (cabeçalho)
- Categoria (multi-select dentro das abas Movimentos / Análise Anual)
- Tipo: Entrada / Saída / Transferência (chips)

## 4. Detalhes técnicos

Arquivos a criar:
- `src/components/accounts/AccountDetailView.tsx` (substitui o conteúdo do drawer)
- `src/components/accounts/AccountAnnualChart.tsx`
- `src/components/accounts/AccountBalanceEvolutionChart.tsx`
- `src/hooks/useAccountAnnual.ts`

Arquivos a editar:
- `src/components/accounts/TransferModal.tsx` (novo layout + origem padrão + prop opcional `defaultFromAccountId`)
- `src/components/accounts/AccountDetailDrawer.tsx` (passa a renderizar `AccountDetailView` dentro do Sheet largo)
- `src/components/accounts/AccountsView.tsx` (passar `defaultFromAccountId` para `TransferModal` quando aberto a partir de uma conta)
- `src/components/accounts/AccountCard.tsx` (mini linha de transferências do mês)

Migration de manutenção (SQL):
```sql
SELECT public.recalculate_account_balance(id) FROM public.accounts WHERE active;
```

Confirmações:
- DRE/faturamento não somam `account_transfers` — nenhuma alteração necessária.
- RLS já é pública nas tabelas envolvidas.

## 5. Checklist final
1. Modal de transferência reformulado + Bancária padrão.
2. Recalcular saldos (job único).
3. Card da conta mostra transferências do mês.
4. Drawer expandido para AccountDetailView com 5 abas.
5. Gráfico anual por categoria funcional.
6. Botões Transferir/Ajustar saldo no cabeçalho da conta.
7. Smoke test: transferência R$ 100 BANCÁRIA→outra → ambos saldos atualizam, DRE inalterado.
