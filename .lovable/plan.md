

## Padronização do Workflow Categoria-Cêntrico nas Janelas de Lançamento

### Diagnóstico atual

Analisando as 4 janelas mostradas nos prints + o módulo de Aprovações:

| Janela | Filtros pré-categoria | Auto-fill Conta/C.Custo | Mostra heranças | Bloqueia órfã | Botão Limpar |
|---|---|---|---|---|---|
| **Nova Entrada Avulsa** (`QuickTransactionModal`) | ✅ filtros existem | ⚠️ envia para o banco mas **não mostra** ao usuário | ❌ | ❌ | ❌ |
| **Nova Despesa Variável** (`QuickTransactionModal`) | ✅ filtros existem | ⚠️ idem | ❌ | ❌ | ❌ |
| **Nova Despesa Fixa** (`NewFixedExpenseModal`) | ✅ | ✅ painel "Conta vinculada / C. Custo" | ✅ | ✅ (já corrigido) | ❌ |
| **Novo Contrato Recorrente** | ❌ não usa CategoryFilteredSelector | ❌ | ❌ | ❌ | ❌ |
| **Aprovações (bulk)** | ✅ | ✅ | ✅ | ✅ | ✅ "Limpar" |
| **Editar Lançamento** | ✅ cross-filter | ✅ via `handleCategoryChange` | ❌ não mostra texto | ❌ | ❌ |

**Problemas observados nos prints:**
- Print 1 e 4 (Avulsa/Variável): a categoria é selecionada e o usuário **não tem feedback visual** de qual conta/centro de custo foi herdado.
- Print 2 (Avulsa, categoria AJUDA DE CUSTO selecionada): mostra "Conta: BANCARIA / C. Custo: Despesas Administrativas" mas isso vem só do `CategoryFilteredSelector` interno; não há painel de inherited info nem campo override para casos sem default_account_id.
- Print 3 (Despesa Fixa): é o **padrão correto** a ser replicado em todas.
- Em nenhuma janela existe um botão **"Limpar filtros"** para zerar os filtros de Conta/C. Custo + categoria de uma vez (existe em Aprovações).

### O plano

#### 1. Consolidar `CategoryFilteredSelector` como componente único e completo

Estender o componente atual para conter, **dentro dele**, tudo que hoje é repetido fora:

- **Painel de heranças** (igual ao da Despesa Fixa): "Conta vinculada / Centro de Custo" mostrado em destaque assim que uma categoria é escolhida.
- **Botão "Limpar filtros"** (X discreto ao lado dos selects de filtro) que zera `filterAccountId`, `filterCostCenterId`, **mantendo** a categoria já escolhida.
- **Override de Conta** quando a categoria escolhida não tem `default_account_id`: bloco amarelo igual ao já existente no `NewFixedExpenseModal`, exigindo o usuário escolher manualmente uma conta antes de submeter.
- Nova prop `onResolvedAccountChange(accountId | null)` para o modal pai saber qual `account_id` deve persistir (default da categoria → override do usuário → null).
- Nova prop `onResolvedCostCenterChange(costCenterId | null)`.

Isso elimina a duplicação atual onde cada modal decide individualmente como mostrar/usar a herança.

#### 2. Padronizar as 4 janelas de lançamento + modal de edição

Aplicar o componente unificado em:

- **`QuickTransactionModal`** (Entrada Avulsa + Despesa Variável)
  - Adicionar painel de heranças.
  - Exigir conta override quando categoria não tem default (mesma regra da despesa fixa).
  - No `handleSubmit`, usar `effectiveAccountId` (default → override) em vez de `selectedCategory?.default_account_id`.
  - Bloquear submissão com toast claro se nada se resolver.

- **`NewFixedExpenseModal`** — apenas migrar para usar o painel embutido em vez do código próprio (sem mudança visual).

- **`NewRecurringContractModal`** — investigar se já usa `CategoryFilteredSelector`; se não, adicionar para que a categoria também guie a Conta/C. Custo do contrato recorrente.

- **`TransactionEditModal`** — exibir o mesmo painel de heranças após `handleCategoryChange`, e botão "Limpar filtros" para os pré-filtros já existentes.

#### 3. Hook compartilhado de validação no submit

Criar pequena helper `resolveAccountAndCostCenter(category, overrideAccountId)` em `src/lib/financial/categoryResolution.ts`:

```ts
return {
  accountId: category?.default_account_id ?? overrideAccountId ?? null,
  costCenterId: category?.cost_center_id ?? null,
  isOrphan: !(category?.default_account_id ?? overrideAccountId),
};
```

Usada em todos os 4 modais e no `useCreateTransaction` como guard final.

#### 4. UX adicional pedido pelo usuário ("limpar tipo aprovação")

Replicar exatamente o botão **"Limpar"** que existe em Aprovações:
- Posicionado à direita dos dois selects de filtro.
- Reseta filterAccountId + filterCostCenterId + busca interna da categoria (não a categoria já escolhida).
- Ícone `X` com tooltip "Limpar filtros".

### Arquivos afetados

- **Editar:** `src/components/transactions/CategoryFilteredSelector.tsx` — adicionar painel de herança, override de conta, botão limpar e callbacks.
- **Editar:** `src/components/transactions/QuickTransactionModal.tsx` — usar `effectiveAccountId`, remover lógica duplicada de auto-fill, bloquear submit órfão.
- **Editar:** `src/components/transactions/NewFixedExpenseModal.tsx` — migrar para o painel embutido (remove código duplicado).
- **Editar:** `src/components/contracts/NewRecurringContractModal.tsx` — adotar `CategoryFilteredSelector`.
- **Editar:** `src/components/transactions/TransactionEditModal.tsx` — exibir painel de herança e botão limpar.
- **Novo:** `src/lib/financial/categoryResolution.ts` — helper único de resolução conta/CC.
- **Editar:** `src/hooks/useTransactions.ts` — usar a helper como guard final no `useCreateTransaction`.

### Resultado esperado

- Consistência visual e comportamental: as 5 janelas (4 de criação + 1 de edição) funcionam exatamente igual quanto ao fluxo categoria → conta → centro de custo.
- Impossível criar transação órfã (`account_id IS NULL`) por nenhuma das janelas.
- Usuário sempre vê de forma clara qual conta/CC foi inferida.
- Botão "Limpar filtros" disponível em todas as janelas, idêntico ao módulo de Aprovações.
- Código consolidado: a lógica de auto-fill vive em **um único componente** + **uma única helper**, eliminando duplicação.

