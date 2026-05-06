## Problema

A aba "Análise Anual" está mostrando R$ 0,00 em todos os KPIs porque a query ao Supabase está retornando erro 400:

```
invalid input value for enum transaction_natureza: "TRANSFERENCIA"
```

O enum `natureza` no banco só tem dois valores: `RECORRENTE` e `AVULSA`. Os filtros `.neq('natureza', 'TRANSFERENCIA')` e `.neq('natureza', 'INVESTIMENTO')` foram adicionados pensando nas regras do DRE, mas esses conceitos não existem como valores de `natureza` neste schema.

## Correção

Em `src/components/dashboard/AnnualAnalysisTab.tsx`, remover os dois `.neq()` da query principal — a busca passará a retornar todas as transações do ano selecionado e do ano anterior, populando corretamente os KPIs (Faturamento, Despesas, Resultado, Ticket Médio) e todas as sub-abas (Evolução Mensal, Categorias, Contas, Clientes).

Como Transferências/Investimentos não existem como `natureza`, não há risco de poluir os totais — eventuais exclusões futuras desses fluxos podem ser feitas via `cost_center.dre_group` quando necessário, mas não bloqueiam a exibição agora.

## Arquivo alterado

- `src/components/dashboard/AnnualAnalysisTab.tsx` (remover 2 linhas de filtro)
