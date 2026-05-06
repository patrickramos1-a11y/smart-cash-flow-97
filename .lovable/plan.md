# Auditoria do Drill-down Mensal da Conta

## Problema

Quando você abre **Despesas Variáveis › Fevereiro**, aparecem lançamentos como "Cabify R$ 158,18" vinculados a uma conta. Porém, ao abrir essa mesma conta na página **Contas › [conta] › Fevereiro**, esses valores não aparecem (ou aparecem diferentes).

Investigando, encontrei **duas causas reais** e **um problema de UX** no recorte do mês.

### Causa 1 — Critério de período diferente

| Página | Como filtra o mês |
|---|---|
| Despesas Variáveis | `competencia_mes` + `competencia_ano` (regime de competência), considera **todos os status** e usa `valor` |
| Resumo anual da conta (`useAccountAnnual`) | Apenas `status = 'PAGO'` filtrado por `data_pagamento` (regime de caixa) |
| Drill-down do mês (`useAccountDetail`) | PAGO por `data_pagamento` **OU** demais status por `data_vencimento` — competência é ignorada |

Resultado: uma despesa Cabify lançada em fev (competência) mas paga em mar (ou ainda em aberto com vencimento em mar) **some** do "Fevereiro" da conta.

### Causa 2 — Lançamentos sem `account_id`

A query da conta filtra `account_id = ?`. Se a despesa foi cadastrada sem conta vinculada (acontece em importações antigas), ela aparece em "Despesas Variáveis" mas não em conta nenhuma.

### Causa 3 — Drill-down apertado

O drill-down atual usa 4 colunas (Entradas / Saídas / Transf. recebidas / Transf. enviadas) lado a lado, o que comprime tudo. Você pediu um **recorte real da lista de transações**, filtrado por conta + mês, com a **descrição como coluna**.

---

## O que vou fazer

### 1. Unificar critério de período (regime de competência)

Tornar o resumo anual e o drill-down da conta consistentes com as páginas de Despesas/Entradas:

- `useAccountAnnual.ts`: passar a agrupar por **`competencia_ano`/`competencia_mes`** em vez de `data_pagamento`. Continuar somando `valor_pago ?? valor` (PAGO usa pago, demais usam previsto). Manter o cálculo de saldo de abertura por caixa (movimentos pagos antes de 01/jan), mas a coluna "Resultado/Saldo final" da tabela mensal vira **resultado de competência** com nota explicativa.
- `useAccountDetail.ts`: filtrar transações do mês por **`competencia`** (1 critério único) e ainda separar internamente Pago / Em Aberto / Atrasado para badges.
- Adicionar um **toggle "Competência ↔ Caixa"** acima da tabela anual da conta para quem quiser ver pelo regime de caixa (data de pagamento).

### 2. Detectar lançamentos órfãos

Em `useAccountAnnual` e nos KPIs da página de conta, adicionar um aviso se existirem transações no ano com `account_id IS NULL` que apareçam nas outras telas. Mostro um chip clicável "X lançamentos sem conta" que leva para a tela de reclassificação.

### 3. Redesenhar o drill-down como lista filtrada real

Substituir os 4 cards apertados de `AccountMonthDrillDown.tsx` por **uma tabela única** no padrão da `TransactionsList`, filtrada por aquela conta + aquele mês:

```text
Data    Descrição                Categoria        C.Custo    Status   Tipo   Valor
04/02   UBER - Cabify aeroporto  TRANSPORTE       Operacional PAGO    Saída  −R$ 158,18
07/02   ...                       ...              ...         ...     ...    ...
```

Características:
- Colunas reais com `<table>`: Data, **Descrição (coluna larga, sem truncar agressivo)**, Categoria (com cor), Centro de custo, Status (badge), Tipo (Entrada/Saída/Transf), Valor.
- Cabeçalho fixo com filtros rápidos: chips "Entradas | Saídas | Transferências | Todas", busca por descrição, e seletor de regime (Competência/Caixa).
- Subtotais no rodapé: `Σ Entradas`, `Σ Saídas`, `Σ Transferências líq.`, `= Resultado do mês`.
- Bloco de auditoria abaixo: compara a soma da lista com o total exibido na linha do mês da tabela anual; se divergir, mostra delta e link "ver lançamentos divergentes".
- Botão "Abrir em Transações" que navega para a Hub de Transações já com filtros conta+mês aplicados.

### 4. Garantir consistência visual

- Mesmas cores semânticas (verde/vermelho) e mesmas badges de status já usadas em `TransactionsList`.
- Linhas clicáveis abrindo o `TransactionEditModal` existente, igual à página de transações.

---

## Arquivos

**Modificados**
- `src/hooks/useAccountAnnual.ts` — filtrar por `competencia` + suporte a modo `caixa`; expor lançamentos órfãos do ano.
- `src/hooks/useAccountDetail.ts` — filtrar por competência, retornar transações com todos os campos necessários (cost_center, entity).
- `src/components/accounts/AccountMonthDrillDown.tsx` — reescrever como tabela única com colunas reais e filtros.
- `src/components/accounts/AccountAnnualAnalysis.tsx` — adicionar toggle Competência/Caixa, passar o modo para o hook e drill-down.

**Sem mudanças de banco.** Apenas leitura/agregação no frontend.
