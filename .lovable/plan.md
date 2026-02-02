# Planos de Implementação SISRAMOS FIN

---

# PLANO 1: Reestruturação do Painel Financeiro

## Status: 🎯 EM PLANEJAMENTO

### Visão Geral

Evolução do Painel Financeiro para transformá-lo em um **sistema de inteligência financeira**, capaz de explicar:
- De onde o dinheiro vem
- Por onde ele passa
- Como ele sai
- Como isso impacta o DRE
- Onde estão os gargalos, excessos e oportunidades

---

## 1. DIAGNÓSTICO DA SITUAÇÃO ATUAL

### ✅ O que já existe e funciona bem:
- **TransactionsHub** com abas (Visão Geral, Entradas, Saídas) e sub-filtros (Recorrentes/Avulsas, Fixas/Pontuais)
- **FinancialConfigView** unificada com abas de Empresas, Contas, Categorias de Conta, Centros de Custo, Categorias de Transação, Formas de Pagamento, e Salário Mínimo
- **OpenPaymentsView** dedicado para pagamentos em aberto com indicadores de tendência
- **RecurringContractsView** para contratos baseados em Salário Mínimo
- **Seletor de período** em Transações (mês/ano)
- **Hooks robustos** com TanStack Query integrados ao Supabase

### ⚠️ Gaps identificados:
1. **Dashboard** não tem seletor de período (CRÍTICO!)
2. **Tripé Conta × Categoria × Centro de Custo** existe no banco mas falta visualização clara
3. Falta análise estratégica por categoria e conta (onde gastar menos?)
4. Falta gráfico anual de projeções em Transações
5. Categoria IMPOSTOS não está explícita no sistema
6. Integração Contratos ↔ Transações existe mas UX pode melhorar

---

## 2. ARQUITETURA DO TRIPÉ (LÓGICA BASE)

```
FONTE FINANCEIRA (Ramos Engenharia)
    │
    └── CONTAS (Banco, Caixa, Cartão, Digital, Investimentos)
            │   └── Onde o dinheiro está
            │   └── Saldo próprio + Histórico
            │
            └── TRANSAÇÕES
                    │
                    └── CATEGORIAS DE TRANSAÇÃO
                            │   └── Vinculada a Centro de Custo
                            │   └── Define "como" o dinheiro sai/entra
                            │
                            └── CENTROS DE CUSTO
                                    │
                                    └── DRE (15 grupos)
```

### Regras:
- Uma conta pode ter várias categorias
- Uma categoria pertence a um único centro de custo
- O centro de custo define o impacto no DRE
- Transferências entre contas NÃO afetam DRE

---

## 3. FASES DE IMPLEMENTAÇÃO

### 📌 FASE 1: FILTRO GLOBAL DE PERÍODO NO DASHBOARD (CRÍTICO)
**Status**: ⏳ Próximo
- Adicionar seletores mês/ano no Dashboard
- Todos os KPIs e gráficos respeitam o período selecionado

### 📌 FASE 2: ANÁLISE ESTRATÉGICA EM TRANSAÇÕES
- Indicadores de formas de pagamento
- Despesas por categoria com percentual
- Despesas por conta
- Gráficos de distribuição

### 📌 FASE 3: GRÁFICO ANUAL EM TRANSAÇÕES
- Gráfico fixo no topo mostrando despesas/receitas anuais
- Comparativo entrada × saída por mês
- Filtros aplicáveis (só recorrente, só avulso, etc.)

### 📌 FASE 4: CATEGORIA IMPOSTOS
- Criar/destacar categoria para impostos
- Possivelmente adicionar aba "Impostos" em Saídas

### 📌 FASE 5: VISUALIZAÇÃO DO TRIPÉ
- Drill-down: DRE → Centro de Custo → Categoria → Conta → Transações
- Análise cruzada

### 📌 FASE 6: MELHORIAS UX CONTRATOS
- Wizard mais guiado
- Mostrar transações geradas automaticamente
- Indicador de % nota fiscal

---

## 4. PERGUNTAS QUE O SISTEMA DEVE RESPONDER

- Quais categorias mais gastam?
- Quais contas mais gastam?
- Onde estão os maiores gastos?
- Como reduzir custos? (ex: Transporte)
- Quantos SM a carteira gera?
- Inadimplência por cliente
- Projeção vs Realizado

---

## 5. CRITÉRIOS DE SUCESSO

✅ Dashboard com período selecionável
✅ Análise por categoria/conta/centro de custo
✅ Gráfico anual de projeções
✅ Drill-down DRE → Transações funcionando
✅ Usuário responde "onde estou gastando mais?"

---

# PLANO 2: Backlog de Produto (IMPLEMENTADO ✅)

## Visão Geral

Implementação de um módulo completo de **Backlog de Produto** seguindo práticas Scrum/Agile, com foco em planejamento, rastreabilidade, histórico automático (changelog) e apoio à tomada de decisão.

---

## 1. Arquitetura do Banco de Dados

### 1.1 Novas Tabelas

**`backlog_projects` (Projetos/Produtos)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | text | Nome do projeto |
| description | text | Descrição |
| active | boolean | Ativo |
| created_at | timestamp | Data criação |
| updated_at | timestamp | Data atualização |

**`backlog_modules` (Módulos por Projeto)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| project_id | uuid FK | Projeto |
| name | text | Nome do módulo |
| active | boolean | Ativo |

**`backlog_items` (Itens do Backlog)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| project_id | uuid FK | Projeto |
| title | text | Título curto e objetivo |
| category | enum | Nova Funcionalidade, Melhoria, Correção, Ajuste Técnico, UX/UI, Relatórios, Segurança, Infraestrutura |
| description | text | Descrição rica (Markdown) |
| status | enum | Ideia, Em Análise, Refinado, Aguardando Recursos, Em Implementação, Em Testes, Implementado, Lançado, Validado, Arquivado |
| priority | enum | Alta, Média, Baixa |
| expected_impact | enum | Alto, Médio, Baixo |
| effort_estimate | enum | Pequeno, Médio, Grande |
| depends_on_credits | boolean | Dependência de recursos |
| responsible_product | text | Responsável produto |
| responsible_tech | text | Responsável técnico |
| created_at | timestamp | Data criação automática |
| start_date | date | Início implementação |
| completion_date | date | Data conclusão |
| release_date | date | Data lançamento |
| validation_date | date | Data validação |

**`backlog_item_modules` (Relação N:N - Módulos Impactados)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| backlog_item_id | uuid FK | Item do backlog |
| module_id | uuid FK | Módulo impactado |

**`backlog_attachments` (Anexos)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| backlog_item_id | uuid FK | Item do backlog |
| file_name | text | Nome do arquivo |
| file_path | text | Caminho no storage |
| file_type | text | Tipo MIME |
| file_size | integer | Tamanho em bytes |
| created_at | timestamp | Data upload |

**`backlog_validations` (Confirmação de Entrega)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| backlog_item_id | uuid FK | Item do backlog |
| validated | boolean | Entrega validada |
| validation_date | date | Data validação |
| validated_by | text | Usuário validador |
| validation_type | enum | Teste funcional, Validação visual, Validação técnica, Validação regra negócio |
| notes | text | Observações |

**`backlog_implementation_records` (Registros de Implementação)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| backlog_item_id | uuid FK | Item do backlog |
| description | text | Descrição do ajuste |
| date | date | Data |
| responsible | text | Responsável |
| status | enum | Executado, Não executado |
| created_at | timestamp | Data registro |

**`backlog_history` (Changelog Automático e Imutável)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| backlog_item_id | uuid FK | Item do backlog |
| event_type | enum | CRIADO, STATUS_ALTERADO, ANEXO_ADICIONADO, ANEXO_REMOVIDO, PRIORIDADE_ALTERADA, DATA_ALTERADA, IMPLEMENTADO, LANCADO, VALIDADO, ARQUIVADO |
| event_description | text | Descrição do evento |
| previous_value | text | Valor anterior |
| new_value | text | Novo valor |
| user_id | text | Usuário que executou |
| created_at | timestamp | Data/hora do evento |

### 1.2 ENUMs

```sql
CREATE TYPE backlog_category AS ENUM (
  'NOVA_FUNCIONALIDADE',
  'MELHORIA_EXISTENTE',
  'CORRECAO_BUG',
  'AJUSTE_TECNICO',
  'UX_UI_VISUAL',
  'RELATORIOS_INDICADORES',
  'SEGURANCA_PERMISSOES',
  'INFRAESTRUTURA_CREDITOS'
);

CREATE TYPE backlog_status AS ENUM (
  'IDEIA',
  'EM_ANALISE',
  'REFINADO',
  'AGUARDANDO_RECURSOS',
  'EM_IMPLEMENTACAO',
  'EM_TESTES',
  'IMPLEMENTADO',
  'LANCADO',
  'VALIDADO',
  'ARQUIVADO'
);

CREATE TYPE backlog_priority AS ENUM ('ALTA', 'MEDIA', 'BAIXA');
CREATE TYPE backlog_impact AS ENUM ('ALTO', 'MEDIO', 'BAIXO');
CREATE TYPE backlog_effort AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');
CREATE TYPE validation_type AS ENUM ('TESTE_FUNCIONAL', 'VALIDACAO_VISUAL', 'VALIDACAO_TECNICA', 'VALIDACAO_REGRA_NEGOCIO');
CREATE TYPE implementation_status AS ENUM ('EXECUTADO', 'NAO_EXECUTADO');
CREATE TYPE backlog_event_type AS ENUM (
  'CRIADO', 'STATUS_ALTERADO', 'ANEXO_ADICIONADO', 'ANEXO_REMOVIDO',
  'PRIORIDADE_ALTERADA', 'DATA_ALTERADA', 'IMPLEMENTADO', 'LANCADO', 'VALIDADO', 'ARQUIVADO'
);
```

### 1.3 Storage Bucket

Criar bucket `backlog-attachments` para armazenar anexos.

### 1.4 Triggers para Changelog Automático

Triggers automáticos em `backlog_items`:
- INSERT → Registra evento "CRIADO"
- UPDATE em status → Registra "STATUS_ALTERADO"
- UPDATE em priority → Registra "PRIORIDADE_ALTERADA"
- UPDATE em datas → Registra "DATA_ALTERADA"

---

## 2. Estrutura de Componentes

### 2.1 Novos Arquivos

```text
src/
├── components/
│   └── backlog/
│       ├── BacklogView.tsx           # Componente principal com abas
│       ├── BacklogKanban.tsx         # Visão Kanban por status
│       ├── BacklogList.tsx           # Lista geral do backlog
│       ├── BacklogFilters.tsx        # Filtros avançados
│       ├── BacklogItemModal.tsx      # Modal criar/editar item
│       ├── BacklogItemDetail.tsx     # Detalhe do item (timeline, anexos)
│       ├── BacklogAttachments.tsx    # Gerenciador de anexos
│       ├── BacklogValidation.tsx     # Confirmação de entrega
│       ├── BacklogHistory.tsx        # Timeline de changelog
│       ├── BacklogImplementations.tsx # Registros de implementação
│       ├── BacklogIndicators.tsx     # Dashboard de indicadores
│       └── BacklogSettings.tsx       # Configurações (projetos, módulos)
│
└── hooks/
    └── useBacklog.ts                 # Hooks CRUD completos
```

### 2.2 Estrutura do BacklogView.tsx

```text
┌──────────────────────────────────────────────────────────────────┐
│  BACKLOG DE PRODUTO                                              │
├──────────────────────────────────────────────────────────────────┤
│  [Indicadores]  Total: 45  Aguardando: 8  Implementação: 5  ...  │
├──────────────────────────────────────────────────────────────────┤
│  Tabs: [Lista] [Kanban] [Por Projeto] [Por Status] [Recursos]    │
├──────────────────────────────────────────────────────────────────┤
│  Filtros: Projeto ▼  Categoria ▼  Prioridade ▼  Status ▼         │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📋 Implementar autenticação 2FA                           │  │
│  │  Projeto: Sistema X | Cat: Segurança | 🔴 Alta | 🕐 Refinado│  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │  🔧 Melhorar performance do DRE                             │  │
│  │  Projeto: Financeiro | Cat: Ajuste Técnico | 🟡 Média       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Modal de Detalhe do Item

```text
┌──────────────────────────────────────────────────────────────────┐
│  [X]  📋 Implementar autenticação 2FA                  [Editar]  │
├──────────────────────────────────────────────────────────────────┤
│  Tabs: [Descrição] [Anexos] [Implementações] [Validação] [Hist.] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ## Contexto / Problema                                          │
│  Atualmente o sistema não possui segunda camada de autenticação  │
│                                                                  │
│  ## Objetivo da melhoria                                         │
│  Adicionar autenticação de dois fatores para maior segurança     │
│                                                                  │
│  ## Comportamento esperado                                       │
│  - Usuário pode ativar 2FA nas configurações                     │
│  - Suporte a TOTP (Google Authenticator)                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Projeto: Sistema X                                              │
│  Módulos: [Autenticação] [Configurações]                         │
│  Categoria: Segurança/Permissões                                 │
│  Status: Refinado                                                │
│  Prioridade: Alta | Impacto: Alto | Esforço: Médio               │
│  Depende de Créditos: Não                                        │
│  Responsável Produto: João                                       │
│  Responsável Técnico: Maria                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Funcionalidades Principais

### 3.1 CRUD de Itens
- Criar novo item com todos os campos
- Editar item existente
- Alterar status manualmente
- Arquivar item (não excluir)
- Duplicar item

### 3.2 Gestão de Anexos
- Upload múltiplo (imagens, PDFs, planilhas)
- Armazenamento no Supabase Storage
- Visualização inline de imagens
- Download de arquivos
- Anexos permanecem após arquivamento

### 3.3 Confirmação de Entrega (Obrigatória)
- Item não pode ser "Validado" sem confirmação
- Campos: tipo de validação, data, validador, observações
- Bloqueio automático de status final sem validação

### 3.4 Changelog Automático
- Registro imutável de todos os eventos
- Timeline visual no detalhe do item
- Filtros por tipo de evento
- Exportação de histórico

### 3.5 Registros de Implementação
- Log de ajustes realizados durante implementação
- Data, responsável, descrição, status
- Rastreabilidade completa

### 3.6 Indicadores (Dashboard)
- Total de itens
- Por status (pipeline visual)
- Aguardando recursos
- Em implementação
- Implementados
- Lançados
- Validados
- Velocidade de conclusão
- Tempo médio por status

---

## 4. Integração com Menu

### 4.1 Atualização do Sidebar

Adicionar novo item de menu:
```typescript
{ id: 'backlog', label: 'Backlog', icon: ClipboardList, badge: 'new' }
```

### 4.2 Atualização do Index.tsx

Novo caso no switch:
```typescript
case 'backlog':
  return <BacklogView />;
```

Nova entrada no tabConfig:
```typescript
backlog: { title: 'Backlog de Produto', subtitle: 'Planejamento e controle de melhorias' }
```

---

## 5. Cronograma de Implementação

### Sprint 1: Fundação (2 prompts)
1. Migração do banco: criar todas as tabelas e ENUMs
2. Criar bucket de storage para anexos
3. Criar triggers para changelog automático

### Sprint 2: Hooks e Backend (1 prompt)
1. Criar `useBacklog.ts` com todos os hooks CRUD
2. Hooks para anexos, validações, implementações
3. Hooks para histórico e indicadores

### Sprint 3: Interface Principal (2 prompts)
1. `BacklogView.tsx` - Componente principal com indicadores
2. `BacklogList.tsx` - Lista filtrada
3. `BacklogFilters.tsx` - Filtros avançados
4. `BacklogItemModal.tsx` - Criar/Editar item

### Sprint 4: Detalhes e Histórico (2 prompts)
1. `BacklogItemDetail.tsx` - Visão completa do item
2. `BacklogHistory.tsx` - Timeline de changelog
3. `BacklogAttachments.tsx` - Upload e gestão de arquivos
4. `BacklogValidation.tsx` - Confirmação de entrega

### Sprint 5: Kanban e Configurações (1 prompt)
1. `BacklogKanban.tsx` - Visão drag-and-drop
2. `BacklogSettings.tsx` - Projetos e módulos
3. Integração final com Sidebar

---

## 6. Detalhes Técnicos

### 6.1 Hooks Necessários

```typescript
// useBacklog.ts
useBacklogItems(filters)          // Lista com filtros
useBacklogItem(id)                // Item único
useCreateBacklogItem()            // Criar item
useUpdateBacklogItem()            // Atualizar item
useUpdateBacklogStatus()          // Alterar status (com log)
useArchiveBacklogItem()           // Arquivar

// Anexos
useBacklogAttachments(itemId)
useUploadAttachment()
useDeleteAttachment()

// Validação
useBacklogValidation(itemId)
useCreateValidation()

// Implementações
useImplementationRecords(itemId)
useCreateImplementationRecord()

// Histórico
useBacklogHistory(itemId)

// Indicadores
useBacklogStats()
useBacklogByStatus()

// Configuração
useBacklogProjects()
useBacklogModules(projectId)
```

### 6.2 Tipos TypeScript

```typescript
interface BacklogItem {
  id: string;
  project_id: string;
  project?: BacklogProject;
  title: string;
  category: BacklogCategory;
  description: string;
  status: BacklogStatus;
  priority: BacklogPriority;
  expected_impact: BacklogImpact;
  effort_estimate: BacklogEffort;
  depends_on_credits: boolean;
  responsible_product: string | null;
  responsible_tech: string | null;
  created_at: string;
  start_date: string | null;
  completion_date: string | null;
  release_date: string | null;
  validation_date: string | null;
  modules?: BacklogModule[];
  attachments?: BacklogAttachment[];
  validations?: BacklogValidation[];
  implementation_records?: BacklogImplementationRecord[];
}
```

---

## 7. Regras de Negócio Críticas

1. **Validação Obrigatória**: Nenhum item pode ter status "VALIDADO" sem registro de validação
2. **Arquivamento ≠ Exclusão**: Itens arquivados permanecem acessíveis
3. **Changelog Imutável**: Histórico não pode ser editado ou excluído
4. **Status Manual**: Apenas usuário pode alterar status
5. **Anexos Permanentes**: Anexos permanecem após arquivamento do item

---

## 8. Critérios de Aceite

1. CRUD completo de itens do backlog
2. Upload e gestão de anexos funcionando
3. Changelog automático registrando todos os eventos
4. Confirmação de entrega obrigatória para validação
5. Visões: Lista, Kanban, Por Projeto, Por Status
6. Indicadores calculados em tempo real
7. Filtros por projeto, categoria, prioridade, status, recursos
8. Histórico visual na timeline do item
9. Registros de implementação funcionando
10. Menu integrado com acesso ao Backlog

---

## 9. Arquivos a Criar/Modificar

### Novos Arquivos
- `supabase/migrations/[timestamp]_backlog_tables.sql`
- `src/components/backlog/BacklogView.tsx`
- `src/components/backlog/BacklogList.tsx`
- `src/components/backlog/BacklogKanban.tsx`
- `src/components/backlog/BacklogFilters.tsx`
- `src/components/backlog/BacklogItemModal.tsx`
- `src/components/backlog/BacklogItemDetail.tsx`
- `src/components/backlog/BacklogAttachments.tsx`
- `src/components/backlog/BacklogValidation.tsx`
- `src/components/backlog/BacklogHistory.tsx`
- `src/components/backlog/BacklogImplementations.tsx`
- `src/components/backlog/BacklogIndicators.tsx`
- `src/components/backlog/BacklogSettings.tsx`
- `src/hooks/useBacklog.ts`

### Arquivos a Modificar
- `src/components/layout/Sidebar.tsx` - Adicionar item Backlog
- `src/pages/Index.tsx` - Adicionar rota e config

---

## Objetivo Final

Transformar o Backlog de Produto em uma **ferramenta real de planejamento**, controle de execução e entrega, com:

- Histórico confiável do sistema (changelog validado)
- Base de decisão estratégica
- Rastreabilidade completa das implementações
- Governança e maturidade para reutilização em qualquer projeto
