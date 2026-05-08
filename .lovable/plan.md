# Permissões por Usuário (Visibilidade de Módulos)

Hoje a navegação só distingue **Admin × Financeiro**. Vamos adicionar uma camada por usuário onde o admin escolhe, com checkboxes, **quais itens do menu** cada usuário enxerga. Admin sempre vê tudo.

## Como vai funcionar

1. Em **Configuração → Usuários & Permissões** (nova aba, só para admin) aparece a lista de todos os perfis.
2. O admin abre a Zonilda e vê um painel com checkboxes agrupados pelas seções do menu (Principal, Gestão, Relatórios, Cadastros, Sistema).
3. Marca/desmarca módulos. "Salvar" grava as permissões.
4. Na próxima vez que ela abrir o sistema, a sidebar e a bottom-nav só mostram o que está habilitado, e ao tentar acessar uma rota bloqueada vê uma tela "Sem acesso a este módulo".
5. Atalhos rápidos no painel: **Marcar tudo**, **Desmarcar tudo**, **Aplicar preset Financeiro padrão**.

Por padrão, qualquer usuário Financeiro novo terá um preset (todos exceto Backlog, Importar/Exportar, Reclassificação, Configuração) — exatamente como hoje. Admin ignora as permissões.

## Banco de dados

Nova tabela `user_module_permissions`:

```text
id            uuid PK
user_id       uuid  -> auth.users (cascade)
module_key    text  (ex: 'dashboard', 'transactions', 'approval', ...)
allowed       boolean default true
created_at, updated_at
UNIQUE(user_id, module_key)
```

RLS:
- SELECT: o próprio usuário lê suas permissões; admin lê todas.
- INSERT/UPDATE/DELETE: somente admin (`has_role(auth.uid(),'admin')`).

Regra de leitura no app: se NÃO existir nenhuma linha para o usuário → aplica preset padrão Financeiro. Se existir pelo menos uma → usa exatamente o que está marcado.

## Frontend

**Novos arquivos**
- `src/lib/modules.ts` — catálogo único de módulos (key, label, ícone, seção, default Financeiro). Fonte da verdade usada por sidebar, bottom-nav e tela de permissões.
- `src/hooks/usePermissions.ts` — busca + cache (react-query) das permissões do usuário logado, expõe `can(moduleKey)` e `allowedKeys`.
- `src/components/settings/UserPermissionsView.tsx` — lista de usuários (esquerda) + painel de checkboxes agrupados (direita), com Salvar / Marcar tudo / Preset Financeiro.
- `src/components/feedback/NoAccess.tsx` — tela amigável quando o usuário tenta abrir um módulo bloqueado.

**Edições**
- `src/components/layout/Sidebar.tsx` — filtrar `menuSections` por `can(item.id)`. Admin ignora filtro.
- `src/components/layout/MobileBottomNav.tsx` — mesmo filtro.
- `src/pages/Index.tsx` — antes de renderizar uma aba, checar `can(activeTab)`; se não, mostrar `<NoAccess />`. Se a aba ativa virou inacessível (admin tirou permissão em runtime), redireciona para o primeiro módulo permitido.
- `src/components/config/FinancialConfigView.tsx` — adicionar aba "Usuários & Permissões" visível só para admin.

## Detalhes técnicos

```text
modules.ts (chaves alinhadas ao activeTab atual)
  PRINCIPAL: dashboard, lancamento, transactions
  GESTÃO:    accounts, open-payments, approval, recurring-contracts, reclassification
  RELATÓRIOS: reports
  CADASTROS: clients, entities
  SISTEMA:   config, import, backlog
```

- O catálogo cobre só os itens de **primeiro nível**. Sub-itens de Transações herdam do pai.
- `usePermissions` faz `select module_key,allowed from user_module_permissions where user_id=auth.uid()`. Admin curto-circuita: `can = () => true`.
- Salvar = upsert por `(user_id, module_key)`. "Marcar tudo" envia todos com `allowed=true`. Preset Financeiro envia conforme defaults.

## Garantias

- Não altera roles existentes; é uma camada adicional sobre `admin/financeiro`.
- Admin nunca é bloqueado.
- Nenhum dado financeiro é tocado.
- Se a tabela estiver vazia para um usuário, o comportamento é idêntico ao de hoje (compatível com o que já existe).

Aprovando, eu crio a migração + tela de permissões + filtro na sidebar/bottom-nav numa única entrega.
