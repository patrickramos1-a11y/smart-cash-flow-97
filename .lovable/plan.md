## Objetivo

Criar experiência dedicada de **Lançamento** para o perfil **Financeiro** (Zenilda), tornando as demais páginas de Transações somente-leitura para esse perfil, e proteger o campo **Valor** contra edição acidental para todos os perfis.

---

## 1. Novo subitem no menu de Transações: "Lançamento"

**`src/components/layout/Sidebar.tsx`**
- Adicionar `{ id: 'lancamento', label: 'Lançamento', icon: PlusCircle }` como último subitem do grupo Transações.
- Visível para **todos os perfis** (admin e financeiro).

**`src/pages/Index.tsx`**
- Adicionar `case 'lancamento': return <LancamentoPage />;`
- Registrar em `tabConfig`: título "Lançamento", subtítulo "Criar e revisar últimos lançamentos".

---

## 2. Nova página `LancamentoPage`

**Arquivo novo:** `src/components/transactions/LancamentoPage.tsx`

Estrutura:

```text
┌─────────────────────────────────────────────────┐
│  Card central: [+ Novo Lançamento] (grande)     │
│  Subtítulo: "Crie entradas ou despesas"         │
└─────────────────────────────────────────────────┘
┌─ Últimos lançamentos realizados ───────────────┐
│ Filtros rápidos: Hoje | Semana | Mês           │
│   Pendentes | Aprovadas | Não aprovadas        │
│ ─────────────────────────────────────────────  │
│ Tabela / lista de cards com colunas:           │
│  Criado em | Vencimento | Tipo | Descrição |   │
│  Categoria | Conta | Centro custo | Cliente |  │
│  Valor | Status financeiro | Aprovação |       │
│  Criado por                                    │
└─────────────────────────────────────────────────┘
```

Comportamento:
- Botão "Novo Lançamento" abre o `NewTransactionWizard` já existente (mesmo fluxo da Visão Geral).
- Lista consulta `transactions` com `select` enriquecido (joins manuais via `useTransactions`) e ordenação `created_at DESC`, limite inicial 50 com "Carregar mais".
- **Para Financeiro:** filtra `created_by = user.id` (só vê os próprios lançamentos recentes).
- **Para Admin:** mostra todos os lançamentos recentes (sem filtro de criador), mantendo a página útil para auditoria rápida.
- Filtros rápidos manipulam intervalo de `created_at` e/ou `approval_status`.
- Cada linha clicável abre o `TransactionEditModal` para revisar/corrigir.
- Mobile: cards verticais (reaproveitar padrão de `MobileTransactionCard` ou layout próprio compacto).
- Badges de status financeiro (`PAGO`/`EM_ABERTO`/`ATRASADO`) e aprovação (`pendente`/`aprovado`/`rejeitado`) com cores semânticas.
- Coluna "Criado por" resolve `created_by` → `profiles.display_name` (query auxiliar).

---

## 3. Restrições de criação para o perfil Financeiro

Esconder/remover botões de "novo" nas páginas de transações **quando `isFinanceiro`**, mantendo intactos para `isAdmin`.

Arquivos a editar (envolver botão Novo com `{!isFinanceiro && ...}` ou retornar `null`):
- `src/components/transactions/TransactionsHub.tsx` — botão "Novo Lançamento" (linha ~391).
- `src/components/transactions/EntradasRecorrentesPage.tsx` — botão "Novo Contrato" (linha ~74).
- `src/components/transactions/EntradasAvulsasPage.tsx` — botão criar (linha ~75).
- `src/components/transactions/DespesasFixasPage.tsx` — botão criar (linha ~102).
- `src/components/transactions/DespesasVariaveisPage.tsx` — botão criar (linha ~128).

Também esconder, para Financeiro, ações de "novo" em listas internas (ex: bulk add) se existirem nessas mesmas páginas.

A página **Lançamento** continua com o botão para todos.

Importar `useAuth` onde ainda não estiver presente nesses arquivos.

> Observação: as páginas continuam navegáveis para Financeiro (consulta), apenas a criação fica concentrada em `Lançamento`.

---

## 4. Status do lançamento criado pela Zenilda

Já existe a regra `approval_status = 'pendente'` por padrão para criações do Financeiro (via `useAuth` + lógica de aprovação atual). Validar que:
- Ao criar via wizard na nova página com `role === 'financeiro'`, o `approval_status` permanece `pendente` e o item aparece na tela de **Aprovações** do Patrick (já existe rota `approval`).
- Nenhum ajuste estrutural extra é necessário — apenas conferir o caminho de gravação no `NewTransactionWizard` e modais filhos (`QuickTransactionModal`, `NewFixedExpenseModal`) para garantir que nenhum deles force `aprovado` para Financeiro.

---

## 5. Bloqueio do campo Valor em edições

Aplicar em **todas** as telas de edição de transação:
- `src/components/transactions/TransactionEditModal.tsx`
- `src/components/transactions/QuickTransactionModal.tsx` (quando em modo edição)
- `src/components/approval/ApprovalView.tsx` (se permite editar valor inline)
- `src/components/transactions/BulkEditPanel.tsx` (campo valor em bulk)

Padrão de UI:

```text
[ Valor ]  R$ 1.234,56   (campo desabilitado)
[ ] Permitir alteração do valor
```

Comportamento:
- `useState('allowValueEdit', false)` resetado a cada abertura.
- `<CurrencyInput disabled={!allowValueEdit} />`.
- Checkbox "Permitir alteração do valor" abaixo do campo, com `Lock`/`Unlock` icon.
- Vale para Admin e Financeiro (regra única).
- Não afeta o campo "Valor pago" — apenas `valor` (valor original do lançamento).

---

## 6. Considerações técnicas

- **Sem mudanças de schema** — toda a lógica usa colunas existentes (`approval_status`, `created_by`).
- **`created_by`**: confirmar que o `NewTransactionWizard` e modais filhos já preenchem `created_by = auth.user.id` ao inserir. Se algum não preenche, ajustar (necessário para a lista "meus lançamentos" da Zenilda funcionar).
- **Performance da lista**: usar `useQuery` com `staleTime: 30s`, paginação por offset + botão "carregar mais".
- **Mobile-first**: card único por lançamento, badges coloridos, valor destacado à direita.
- **Reaproveitamento**: lista pode usar componente já existente `MobileTransactionCard` ou criar `RecentLaunchRow` simples se layout precisar das colunas extras (criado em, criado por, status aprovação juntos).

---

## Resultado esperado

- Zenilda entra em **Transações → Lançamento**, cria tudo dali, vê suas últimas movimentações com status de aprovação e financeiro lado a lado.
- Demais páginas de transações ficam limpas (sem botões de criar) na visão dela.
- Patrick mantém todos os botões e ainda ganha a página **Lançamento** como atalho de auditoria recente.
- Campo **Valor** protegido por checkbox em qualquer tela de edição, evitando alterações acidentais.
