# Plano: Central Operacional de Lançamento (Smart Form)

## Visão geral

Hoje `InlineLancamentoForm` é um único formulário estático com todos os campos sempre visíveis. Vamos transformá-lo em um **fluxo contextual de 3 etapas** que **compacta** após escolhas e **adapta** os campos ao tipo de lançamento (Entrada Avulsa, Entrada Recorrente, Despesa Fixa, Despesa Variável).

Princípio: **Categoria escolhida → tela se adapta + colapsa**. Cada lançamento tem seu próprio conjunto de regras herdadas dos módulos especializados (NewFixedExpenseModal, NewRecurringContractModal, EntradasAvulsasPage etc.).

---

## Fase 1 — Compactação da Categoria + Smart Picker

**Objetivo:** o seletor de categoria deixa de ocupar metade da tela após escolha.

- Substituir o grid de categorias por um **CategoryCombobox** (cmdk popover) com:
  - Busca dinâmica
  - Agrupamento por subtipo (Entrada Recorrente / Avulsa / Despesa Fixa / Variável)
  - Cada item mostra: cor, nome, conta default, centro de custo
- **Após seleção** o picker vira um **chip compacto**:
  ```text
  [● SERVIÇO AMBIENTAL]  Entrada Avulsa · Bancária · Receita Bruta   [trocar]
  ```
- Header do card mostra o resumo contextual (badge de tipo + valor sendo digitado em tempo real).
- Remover o "1. Categoria" gigante quando categoria estiver definida.

**Arquivos:** novo `src/components/transactions/CategoryCombobox.tsx`, edita `InlineLancamentoForm.tsx`.

---

## Fase 2 — Formulário Contextual por Subtipo

**Objetivo:** após escolher a categoria, mostrar **somente** os campos pertinentes àquele subtipo, herdando a inteligência dos modais dedicados.

Roteamento interno (sem abrir outro modal):

| Subtipo | Campos exibidos | Herda de |
|---|---|---|
| **Entrada Avulsa** | valor, vencimento, cliente*, entidade*, dados fiscais (origem da receita, doc), forma pgto, competência, status pago/aberto | `EntradasAvulsasPage` + `QuickTransactionModal` |
| **Entrada Recorrente** | plano, cliente*, dia vencimento, fator SM/valor fixo, data início, fiscal | `NewRecurringContractModal` (inline) |
| **Despesa Fixa** | valor, dia vencimento, cliente padrão (Ramos), entidade, conta, recorrência mensal | `NewFixedExpenseModal` (inline) |
| **Despesa Variável** | valor, vencimento, entidade, conta, parcelar/repetir, status pago | já existe |

Cada subtipo é um sub-componente:
- `EntradaAvulsaFields.tsx`
- `EntradaRecorrenteFields.tsx`
- `DespesaFixaFields.tsx`
- `DespesaVariavelFields.tsx`

`InlineLancamentoForm` vira um **orquestrador**: escolhe categoria → renderiza o sub-componente correto.

Decisão importante: **deixar de redirecionar** Recorrente/Fixa para modais dedicados — a Central absorve esses fluxos.

---

## Fase 3 — Campos Inteligentes (UX Inputs)

**Objetivo:** reduzir fricção em cada campo individual.

- **CurrencyInput BR** — máscara automática `1.234,56` enquanto digita (já existe `currency-input.tsx`, padronizar uso).
- **Cliente com criação rápida**: combobox (cmdk) que detecta texto novo e oferece "+ Criar cliente: DARLEY" inline (sem sair).
- **Descrição auto-preenchida** com nome da categoria, **editável**, obrigatória.
- **Status financeiro**: toggle `Em aberto / Pago` no topo do bloco financeiro.
  - Se **Pago** → revela: data de pagamento (default hoje), forma de pagamento (obrigatória).
- **Competência**: dropdown mês/ano discreto, default = mês ativo, editável.
- Validação visual em tempo real (bordas vermelhas + helper text).

---

## Fase 4 — Resumo + Confirmação Compacta

**Objetivo:** dar ao usuário a sensação de "fechei o caixa".

Após preencher, o card colapsa para **modo resumo**:

```text
✔ Entrada Avulsa
  Conta: Bancária  ·  C. Custo: Receita Bruta
  Cliente: Fazenda X  ·  Entidade: Darley
  Valor: R$ 12.500,00  ·  Vencimento: 07/05/2026
  Status: Pago (PIX, 07/05)
  [Editar]   [Lançar]   [Lançar e novo]
```

- Botão **"Lançar e novo"** → mantém categoria + cliente, limpa valor/data (lançamentos em série).
- Atalhos de teclado: `Enter` lançar, `Ctrl+Enter` lançar e novo, `Esc` cancelar.

---

## Fase 5 — Inteligência (preparação para futuro)

Stub apenas, sem implementação pesada nesta rodada — só deixar ganchos:
- Hook `useSuggestedCategory(descricao)` que poderá usar Lovable AI depois.
- Função `duplicateLastLaunch()` (botão "Repetir último lançamento").
- Histórico recente (últimos 3) clicáveis para auto-preencher.

---

## Estrutura de Arquivos Final

```text
src/components/transactions/
├── LancamentoPage.tsx                    (sem alterações estruturais)
├── InlineLancamentoForm.tsx              (vira orquestrador slim)
├── CategoryCombobox.tsx                  [novo - Fase 1]
├── lancamento/
│   ├── CategoryChip.tsx                  [novo - Fase 1]
│   ├── PaymentStatusBlock.tsx            [novo - Fase 3]
│   ├── QuickClientCombobox.tsx           [novo - Fase 3]
│   ├── LancamentoSummary.tsx             [novo - Fase 4]
│   └── fields/
│       ├── EntradaAvulsaFields.tsx       [novo - Fase 2]
│       ├── EntradaRecorrenteFields.tsx   [novo - Fase 2]
│       ├── DespesaFixaFields.tsx         [novo - Fase 2]
│       └── DespesaVariavelFields.tsx     [novo - Fase 2]
```

## Execução

Confirmando o plano, executamos **Fase 1 primeiro** (impacto visual imediato — resolve o "tela explode") e validamos antes de partir para a Fase 2. Cada fase é entregue isoladamente e testável.

Posso começar pela Fase 1?
