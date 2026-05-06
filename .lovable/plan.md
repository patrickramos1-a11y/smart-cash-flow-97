# Refatoração da Página de Contas

Plano dividido em 5 frentes, podendo ser executadas numa única passagem.

## 1. Cards de Conta Compactos (`AccountCard.tsx` + `AccountsView.tsx`)

Reduzir altura e aumentar densidade:
- Header reduzido (ícone 7x7, fonte menor, banco como subtítulo discreto)
- Saldo em destaque (text-xl em vez de 2xl)
- Linha única de Entradas / Saídas (ícones + valor compacto)
- Linha única de Transferências e Variação (badges pequenos)
- Padding `p-3` em vez de `p-4`, gap reduzido

Grid responsivo novo:
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
```

## 2. Barra de Controle (novo componente `AccountsToolbar.tsx`)

Acima do grid, com:
- **Busca**: input com filtro por nome/banco
- **Ordenação** (Select): Saldo desc/asc, Nome A-Z, Maior movimentação
- **Filtros** (chips toggle): Positivo / Negativo / Zerada / Com movimento / Sem movimento
- **Agrupamento** (Select): Nenhum / Banco / Categoria
- Quando agrupado, render por seções com header e subtotal

Estado mantido em `AccountsView.tsx` (useState local), aplicado antes do render do grid.

## 3. Navegação Entre Contas (`AccountDetailPage.tsx`)

No header da página adicionar:
- Botão `← Anterior`
- Dropdown central com lista de todas contas (busca incluída via `Command`)
- Botão `Próxima →`

Ordem definida pela mesma lista filtrada/ordenada da view principal (passar via prop ou recomputar).

## 4. Correção de Meses Faltantes (Jan/Fev)

Investigar e corrigir em:
- `useAccountAnnual.ts`: garantir loop `for (let m = 1; m <= 12; m++)` populando array completo, mesmo sem dados
- `AccountAnnualChart.tsx` / `AccountBalanceEvolutionChart.tsx`: usar array fixo de 12 meses como base
- `AccountMovementsTable.tsx` (mensal): renderizar linha para todos os 12 meses do ano ativo
- Verificar parse de datas (`YYYY-MM-DD` manual, conforme regra de memória) — `new Date(str)` causa drift de fuso

Causa provável: filtro `>= startDate` usando primeiro dia do ano com timezone UTC empurrando jan p/ dez do ano anterior. Trocar por comparação string `competencia_ano = ano && competencia_mes = m`.

## 5. Validação de Saldo (`AccountInsights.tsx` ou novo `AccountBalanceAudit.tsx`)

Adicionar bloco de conferência:
```
Saldo Inicial         R$ X
+ Entradas reais      R$ X
− Saídas reais        R$ X
+ Transferências IN   R$ X
− Transferências OUT  R$ X
─────────────────────
= Saldo calculado     R$ X
  Saldo registrado    R$ X   [✓ ou ⚠ divergência]
```

Garantir em todos os hooks que transferências NÃO entram em "entradas/saídas operacionais" — separar campos distintos (`entradas`, `saidas`, `transfIn`, `transfOut`).

## 6. Tabela Mensal Melhorada (`AccountMovementsTable.tsx` modo mensal)

Colunas: Mês | Entradas | Saídas | Transf. Líq. | Resultado | Saldo Final
- Verde/vermelho semântico
- Destaque (badge) para maior entrada e maior saída do ano
- Linha clicável → expande/filtra movimentos daquele mês

## 7. Gráficos (`AccountAnnualChart.tsx`, `AccountCategoryStackedChart.tsx`)

- Eixo X sempre Jan→Dez fixo
- Toggle Entradas/Saídas no chart de categorias (já parcialmente existe — revisar)
- Stacked bars por categoria

## 8. UX Geral

- Cores das contas vindas de `account.category.color` consistente em card, header detail e chart
- Ícone por tipo (banco vs reserva vs operacional) usando `category.name` ou novo campo
- Contraste: saldo negativo sempre `text-destructive font-bold`

## Arquivos Afetados

Editar:
- `src/components/accounts/AccountCard.tsx` (compactar)
- `src/components/accounts/AccountsView.tsx` (toolbar + filtros + grid novo)
- `src/components/accounts/AccountDetailPage.tsx` (navegação)
- `src/components/accounts/AccountMovementsTable.tsx` (12 meses + colunas)
- `src/components/accounts/AccountAnnualChart.tsx` (eixo fixo)
- `src/components/accounts/AccountBalanceEvolutionChart.tsx` (eixo fixo)
- `src/components/accounts/AccountInsights.tsx` (auditoria de saldo)
- `src/hooks/useAccountAnnual.ts` (12 meses garantidos + parse seguro)
- `src/hooks/useAccountsSnapshot.ts` (separar transferências de entradas/saídas)

Criar:
- `src/components/accounts/AccountsToolbar.tsx`
- `src/components/accounts/AccountSwitcher.tsx` (dropdown de navegação)

## Critérios de Aceite

1. Em desktop 1208px aparecem 4 cards por linha
2. Toolbar permite ordenar/filtrar/agrupar/buscar com resposta instantânea
3. Em qualquer conta, gráfico anual mostra Jan a Dez sem buracos
4. Bloco de auditoria mostra saldo calculado = saldo registrado (ou marca divergência)
5. Transferências nunca somam em entradas/saídas operacionais
6. Navegação ←/→ e dropdown funcionam na página de detalhe