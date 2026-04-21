

## Reflexão e Unificação Semântica: Cliente × Entidade × Responsável

### Diagnóstico (o que está causando a confusão)

Hoje o sistema tem **3 campos distintos** com papéis sobrepostos, o que gera colunas ambíguas na tela de Aprovações e nas listagens:

| Campo no banco | O que representa hoje | Onde aparece preenchido |
|---|---|---|
| `cliente_id` → tabela `clients` | **Empresa/cliente final** (quem paga ou para quem o custo é atribuído) | 100% Entradas, ~96% Saídas (default: "RAMOS ENGENHARIA") |
| `entity_id` → `financial_entities` | **Pessoa física ou grupo** vinculado (Colaborador / Sócio / Fornecedor / Grupo) | 1% Entradas, 27% Saídas |
| `responsavel_id` → `financial_entities` | **Pessoa responsável** pela transação (quem executou/aprovou) | 0% Entradas, 20% Saídas — apenas em recorrentes (Patrick default) |

**Problemas concretos observados:**

1. Na tela de Aprovações a coluna **"Entidade"** mostra `ENTIDADES DE CLASSE` — isso **não é uma entidade**, é uma **categoria** herdada (bug de renderização ou dado errado na linha).
2. `entity_id` e `responsavel_id` apontam para a **mesma tabela** (`financial_entities`), mas têm propósito semântico diferente — isso não está claro para o usuário.
3. Em **Entradas** não faz sentido `entity_id` (pagador é o `cliente_id`); o campo útil seria **Responsável** (quem captou/cadastrou).
4. Em **Saídas** faz sentido `entity_id` (ex: FGTS do Darley → entity=Darley), mas hoje o **Responsável** não aparece em nenhuma coluna.
5. A coluna "Cliente" mostra só o primeiro nome ("RAMOS") — sem distinção visual do que é cliente-pagador vs. cliente-atribuído (centro de custo de cliente para despesas).

### Modelo conceitual proposto (sem alterar o banco)

Padronizar a linguagem em 3 papéis claros, reutilizando os campos existentes:

```text
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE  = "a quem se refere"  (empresa/CNPJ)               │
│           Entrada: quem paga    Saída: a quem atribuir custo │
├─────────────────────────────────────────────────────────────┤
│ ENTIDADE = "sobre quem/o quê" (pessoa ou grupo beneficiário)│
│           Ex.: FGTS→Darley, Pró-labore→Patrick, Luz→Grupo   │
│           Saídas: obrigatório     Entradas: oculto/opcional │
├─────────────────────────────────────────────────────────────┤
│ RESPONSÁVEL = "quem conduz" (pessoa que executa/aprova)     │
│           Entradas: útil (quem captou a receita)            │
│           Saídas: útil (quem autorizou a despesa)           │
└─────────────────────────────────────────────────────────────┘
```

**Regra visual:** Entidade e Responsável são sempre **pessoas/grupos** (`financial_entities`). Cliente é sempre **empresa** (`clients`).

### Fase 1 — Colunas inequívocas no grid de Aprovações

Reordenar e renomear cabeçalhos para eliminar colisão:

| Antes | Depois | Conteúdo |
|---|---|---|
| Tipo | Tipo | ↑/↓ Entrada/Saída |
| Descrição | Descrição | descricao + mês/ano |
| Cliente | **Cliente (empresa)** | `clients.name` com tooltip CNPJ |
| Entidade | **Vinculado a** | `financial_entities.name` + badge do tipo (Colaborador/Sócio/Fornecedor/Grupo) + ícone |
| — novo — | **Responsável** | `responsavel` como avatar+nome (condensada) |
| Categoria | Categoria | badge com ícone+cor |
| Origem | Origem | Manual / Recorrente / Fixo / Variável |
| Vencimento, Valor, Status, Ações | (sem alteração) | |

A célula **"Vinculado a"** atual que exibe `ENTIDADES DE CLASSE` está lendo do campo errado — corrigir para ler `entity_id` (join `financial_entities`), nunca a categoria.

### Fase 2 — Bulk Edit: separar Entidade e Responsável

Na seção **"Vínculos"** do modal "Editar selecionados":
- Campo **Vinculado a (Entidade)** → lista `financial_entities` agrupada por tipo (Colaborador ▸, Sócio ▸, Fornecedor ▸, Grupo ▸), com ícones e cores.
- Campo **Responsável** → mesma lista, mas filtrada por `type IN (COLABORADOR, SOCIO)` (quem pode ser responsável).
- Campo **Cliente (empresa)** → lista `clients`.
- Cada campo com seu botão "limpar" e pré-preenchimento via `commonValue()`.

### Fase 3 — Harmonizar todos os modais de criação/edição

Aplicar o mesmo vocabulário em:
- `TransactionEditModal` — trocar rótulo "Entidade" por **"Vinculado a (Entidade)"** e "Responsável" por **"Responsável (executor)"**, com microtexto explicativo.
- `QuickTransactionModal` — texto de erro "Responsável/Entidade obrigatório" → usar apenas **"Entidade é obrigatória"** (um campo, um nome).
- `NewFixedExpenseModal`, `NewTransactionWizard`, `EntradasRecorrentesPage`, `EntradasAvulsasPage` — exibir campo **Responsável** (hoje só aparece em contratos recorrentes) para entradas.
- Em **Entradas**: ocultar por padrão o seletor de Entidade (pouco usado) e destacar **Responsável**; em **Saídas**: manter ambos, Entidade obrigatória, Responsável recomendado.

### Fase 4 — Backfill de dados (opcional, com confirmação)

Atualmente:
- 1.140 Entradas **sem responsável** → botão "Definir responsável padrão = Patrick" em Config.
- 1.033 Saídas **sem entidade nem responsável** → ferramenta de Reclassificação em Lote já existente pode preencher por regras (ex: descrição contém "Pró-labore" → entity=Patrick).

Nenhuma migração destrutiva; apenas UPDATE em massa via UI de Reclassificação.

### Arquivos afetados

- `src/components/approval/ApprovalView.tsx` — renomear cabeçalhos, adicionar coluna Responsável, corrigir renderização da célula "Vinculado a", ajustar bulk edit.
- `src/components/transactions/TransactionEditModal.tsx` — renomear labels + microtexto.
- `src/components/transactions/QuickTransactionModal.tsx` — simplificar mensagem de erro.
- `src/components/transactions/NewFixedExpenseModal.tsx`, `NewTransactionWizard.tsx`, `EntradasRecorrentesPage.tsx`, `EntradasAvulsasPage.tsx` — adicionar/padronizar campo Responsável.
- `src/hooks/useTransactions.ts` — já retorna `responsible`; apenas expor no tipo usado por Aprovação.

Sem migrations. Sem novas tabelas. Apenas clareza semântica + UX.

### Pergunta antes de executar

1. **Rótulos finais** — confirma **"Vinculado a (Entidade)"** + **"Responsável"** + **"Cliente (empresa)"**? Ou prefere outros nomes?
2. **Entrada**: esconder `entity_id` (pouco usado) e mostrar só `responsavel_id`, ou manter ambos visíveis?
3. **Backfill**: quer que eu inclua nesta rodada um botão "Preencher Responsável padrão = Patrick nas Entradas em branco"?

