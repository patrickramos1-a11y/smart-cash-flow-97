

## Correção do Painel Inteligente de Edição (Bulk + Pontual)

### Diagnóstico
Nos dois modais (Aprovações → "Editar em massa" e `TransactionEditModal` → edição pontual) os 3 campos **Conta / Centro de Custo / Categoria** hoje se comportam como filtros **independentes**: ao trocar um, os outros ficam "travados" no valor anterior, gerando estados inválidos (ex.: Conta=BANCARIA + CC=Dedução → nenhuma categoria aparece).

O comportamento desejado é um **painel encadeado** tipo cascata viva:

```text
[Conta] ──┐
          ├──► filtra ──► [Categoria]
[CC]    ──┘
   ▲                         │
   └─── autopreenche ────────┘  (ao escolher Categoria)
```

- Trocar **Conta** → limpa CC se incompatível e recalcula categorias a partir da nova Conta + CCs que essa Conta possui.
- Trocar **CC** → limpa Conta se incompatível e recalcula categorias.
- Trocar **Categoria** → autopreenche Conta e CC (como já faz).
- Campo "Conta" sempre lista **todas as contas que possuem ≥1 categoria** do tipo correto (Entrada/Saída), com ícone + cor.
- Campo "CC" sempre lista **todos os CCs que possuem ≥1 categoria compatível com a Conta selecionada** (se houver Conta escolhida) — caso contrário, todos os CCs que têm categorias.
- Categoria sempre lista o cruzamento Conta ∩ CC ∩ Tipo, com o grupo por conta mantido.

### Fase 1 — `ApprovalView.tsx` (bulk edit)

**1.1 Reescrever `bulkVisibleAccounts`** para depender do CC atual:
- Se `bulkCostCenterId` estiver definido → só contas que tenham ≥1 categoria dentro daquele CC (+ tipo em comum).
- Sempre incluir `stickyAccountIds` (seleção atual + autopreenchida).

**1.2 Reescrever `bulkVisibleCostCenters`** para depender da Conta atual:
- Se `bulkAccountId` estiver definido → só CCs que tenham ≥1 categoria dentro daquela Conta.
- Sempre incluir `stickyCostCenterIds`.

**1.3 Auto-limpeza no setter da Conta** (novo handler `handleBulkAccountChange`):
- Se a categoria atual não pertence à nova conta → limpa `bulkCategoryId`.
- Se o CC atual não tem nenhuma categoria em comum com a nova conta → limpa `bulkCostCenterId`.

**1.4 Auto-limpeza no setter do CC** (novo handler `handleBulkCostCenterChange`): mesma lógica invertida.

**1.5 Trocar `<Select onValueChange={setBulkAccountId}>` → `onValueChange={handleBulkAccountChange}`** (idem para CC).

**1.6 Estado vazio do dropdown de Categoria**:
- Quando `bulkFilteredCategories.length === 0`, o link já existente "Limpar Conta e CC" é mantido; adicionar também opção "Limpar apenas Conta" e "Limpar apenas CC" para granularidade.

### Fase 2 — `TransactionEditModal.tsx` (edição pontual)

Mesma refatoração em menor escala — o modal já tem `handleAccountChange` / `handleCostCenterChange`, mas só limpa a **categoria**; não limpa o CC quando a conta muda, nem a conta quando o CC muda.

**2.1** Em `handleAccountChange(newAccountId)`:
- Além de limpar categoria incompatível, checar: se `costCenterId` atual não aparece em nenhuma categoria da nova conta → limpar `costCenterId`.

**2.2** Em `handleCostCenterChange(newCcId)`:
- Além de limpar categoria incompatível, checar: se `accountId` atual não aparece em nenhuma categoria do novo CC → limpar `accountId`.

**2.3** `visibleAccounts` e `visibleCostCenters` hoje filtram apenas por `.active`. Vamos encadear:
- `visibleAccounts` = contas com ≥1 categoria do tipo da transação + (se CC selecionado) com categoria dentro desse CC + sticky (valor atual).
- `visibleCostCenters` = CCs com ≥1 categoria do tipo + (se Conta selecionada) com categoria dentro dessa Conta + sticky.

**2.4** `SelectContent` de Categoria: quando `categoriesForFilters.length === 0`, exibir bloco "Nenhuma categoria para este filtro" com botões "Limpar Conta" e "Limpar Centro de Custo".

### Fase 3 — Validação manual

Casos de teste (usuário valida):

1. Selecionar 1 transação com CC="Dedução" + Conta="BANCARIA" → abrir bulk edit → trocar Conta para "IMPOSTOS E TAXAS" → CC deve ser auto-limpo (ou auto-ajustado) e Categorias devem listar impostos.
2. Selecionar Conta="BANCARIA" sem CC → dropdown CC deve mostrar **todos** os CCs usados pelas categorias de BANCARIA (não apenas Movimentações Patrimoniais).
3. Mudar Categoria → Conta e CC preenchem automaticamente.
4. Repetir no modal pontual (`TransactionEditModal`).

### Arquivos afetados
- `src/components/approval/ApprovalView.tsx` (fases 1)
- `src/components/transactions/TransactionEditModal.tsx` (fase 2)

Sem migrations. Sem novas tabelas. Apenas lógica de UI.

