
# Plano: Formularios Dedicados para Recorrentes e Despesas Fixas

## Problema Identificado

Hoje, quando voce clica em "Novo" nas paginas de **Entradas Recorrentes**, **Entradas Avulsas**, **Despesas Fixas** ou **Despesas Variaveis**, todas abrem o mesmo wizard generico (`NewTransactionWizard`) que:

1. Pergunta se e Entrada ou Saida
2. Pergunta se e Recorrente ou Avulsa  
3. Mostra um formulario padrao com campos manuais (descricao, valor, categoria...)

Isso contradiz toda a logica que voce definiu nas conversas anteriores:
- **Entradas Recorrentes** deveriam ter um **formulario de contrato** (selecionar cliente, plano, fator SM ou valor fixo, descontos, e o sistema gera tudo automatico)
- **Despesas Fixas** deveriam ter um **formulario de cadastro de despesa fixa** (fornecedor, valor, dia de vencimento, conta, e o sistema gera lancamentos mensais)
- **Entradas Avulsas** e **Despesas Variaveis** podem continuar com formulario simples, mas sem as etapas desnecessarias de escolher tipo/natureza (ja que a pagina ja define isso)

## Solucao Proposta

### 1. Criar Modal de Novo Contrato Recorrente (`NewRecurringContractModal`)

Formulario dedicado que aparece ao clicar "Novo" na pagina **Entradas Recorrentes**:

- **Cliente**: Selecionar cliente existente OU criar novo (nome, email, telefone, documento)
- **Modelo de cobranca**: 
  - Salario Minimo (selecionar plano: Basico 0,75 / VIP 1,5 / Premium 2 / Master 3)
  - Valor Fixo em R$
- **Fator customizado**: Permitir alterar o fator SM por cliente (ex: VIP pagando 1,0 em vez de 1,5)
- **Descontos**:
  - Tipo: por fator SM / por valor R$ / por percentual
  - Valor do desconto
  - Duracao: por periodo (X meses) ou ate data especifica
- **Conta padrao de recebimento** (opcional)
- **Data de inicio do contrato**
- **Ano de geracao**: para qual ano gerar as competencias

Ao salvar: o sistema usa o hook `useCreateContractWithInstallments` (que ja existe) para criar o contrato + gerar automaticamente as competencias mensais + transacoes com descricao padronizada `[CLIENTE] -- Recorrente -- [PLANO] -- [COMPETENCIA]`.

### 2. Criar Modal de Nova Despesa Fixa (`NewFixedExpenseModal`)

Formulario dedicado que aparece ao clicar "Novo" na pagina **Despesas Fixas**:

- **Nome/Fornecedor**: Quem recebe o pagamento
- **Valor mensal** (R$)
- **Dia de vencimento** (1-31)
- **Conta de pagamento**: Selecionar conta
- **Categoria**: Selecionar categoria (filtrada para saidas)
- **Centro de custo**: Preenchido automaticamente pela categoria selecionada
- **Forma de pagamento**
- **Data de inicio** e **Data de fim** (opcional)
- **Observacoes**

Ao salvar: usa o hook `useCreateFixedExpense` (que ja existe) + `useGenerateFixedExpenseTransactions` para criar a despesa fixa e gerar os lancamentos mensais automaticamente.

### 3. Simplificar formularios de Avulsas e Variaveis

Nas paginas **Entradas Avulsas** e **Despesas Variaveis**, substituir o wizard de 3 etapas por um formulario direto (sem perguntar tipo/natureza, ja que a pagina ja define isso):

- Descricao
- Valor
- Cliente (para entradas avulsas)
- Data de vencimento
- Competencia (mes/ano)
- Categoria, Conta, Forma de pagamento
- Observacoes

### 4. Manter o Wizard generico apenas na Visao Geral

O `NewTransactionWizard` atual continua existindo **apenas** na pagina "Transacoes > Visao Geral" (`TransactionsHub`), onde faz sentido perguntar o tipo e natureza.

## Resumo das Mudancas por Arquivo

### Novos Arquivos
- `src/components/contracts/NewRecurringContractModal.tsx` -- Modal completo de cadastro de contrato recorrente
- `src/components/transactions/NewFixedExpenseModal.tsx` -- Modal completo de cadastro de despesa fixa

### Arquivos Modificados
- `src/components/transactions/EntradasRecorrentesPage.tsx` -- Trocar `NewTransactionWizard` por `NewRecurringContractModal`
- `src/components/transactions/DespesasFixasPage.tsx` -- Trocar `NewTransactionWizard` por `NewFixedExpenseModal`
- `src/components/transactions/EntradasAvulsasPage.tsx` -- Trocar wizard por formulario direto pre-configurado para Entrada Avulsa
- `src/components/transactions/DespesasVariaveisPage.tsx` -- Trocar wizard por formulario direto pre-configurado para Saida Variavel

### Detalhes Tecnicos

**NewRecurringContractModal**:
- Usa os hooks existentes: `useRecurringClients`, `useContractPlans`, `useCreateContractWithInstallments`, `useCreateClientWithContract`
- Busca dados reais do banco (clientes, planos, salario minimo configurado)
- Formulario em etapas visuais: Selecionar Cliente → Definir Plano/Valor → Configurar Descontos → Confirmar e Gerar

**NewFixedExpenseModal**:
- Usa os hooks existentes: `useCreateFixedExpense`, `useGenerateFixedExpenseTransactions`
- Busca contas e categorias do banco via `useAccounts`, `useTransactionCategories`
- Formulario unico (sem etapas), direto ao ponto

**Formularios simplificados (Avulsas/Variaveis)**:
- Reutiliza o mesmo componente `NewTransactionWizard` mas com nova prop `skipSteps` que pula direto para o formulario com tipo e natureza pre-definidos
- Alternativa: criar um componente `QuickTransactionModal` mais enxuto
