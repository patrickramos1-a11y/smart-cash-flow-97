# Refatoração Visual + Reorganização — Sisramos / Ramos Engenharia

Redesenho completo + reorganização da navegação, baseado na identidade visual oficial (verde `#0dd375`, cinza `#5b5b5b`, símbolo "copa/círculo incompleto"). **Nenhuma cor cadastrada de categorias/contas/entidades é alterada** — só o shell visual.

## Princípios
- Marca primeiro: verde-ciano + cinza institucional, círculo incompleto como motivo gráfico recorrente (badges ativos, dividers, loaders).
- Tipografia: Inter (corpo) + **Space Grotesk** (títulos) — geometria que conversa com a logo.
- Componentes shadcn estendidos com novas variantes (`brand`, `glass`, `gradient`).
- Cada fase termina com **Auditoria & Validação** (checklist visual + funcional) antes de avançar.

## Logo
Os arquivos enviados serão usados como ativo oficial:
- `SO_LOGO.png` → símbolo (sidebar colapsada, favicon, splash, loaders).
- `LOGO-IMG--12.png` (horizontal) → header/topbar e tela de login.
- `LOGO-IMG--11.png` (vertical) → splash screen e empty states grandes.
- `MARCA_DA_GUA.png` → marca d'água sutil em hero do dashboard e fundos de relatórios.
Copiados para `src/assets/brand/` e expostos via componente `<Logo variant="symbol|horizontal|vertical|watermark" />`.

---

## FASE 1 — Fundação Visual + Shell + Identidade
*(Engloba antigas Fases 1, 2 e parte da 3)*

**1.1 Design System v2** (`src/index.css`, `tailwind.config.ts`)
- Nova paleta primária: `--brand: 155 88% 44%`, `--brand-glow`, `--brand-deep`, `--neutral: 0 0% 36%`.
- Tokens novos: `--surface`, `--surface-elevated`, `--gradient-brand`, `--gradient-mesh`, `--shadow-brand`, `--ring-soft`.
- Raio padrão 1rem, escala (sm/md/lg/2xl).
- Dark mode recalibrado.
- Fonte Space Grotesk via Google Fonts.

**1.2 Componente de Marca**
- `<Logo />` com 4 variantes a partir dos PNGs enviados.
- Favicon, apple-touch, theme-color, splash atualizados.

**1.3 Shell (Sidebar + Header + Bottom Nav)**
- Sidebar redesenhada com `shadcn/sidebar` (`collapsible="icon"`), glass leve, indicador ativo em formato de "círculo incompleto", grupos colapsáveis, marca no topo.
- Header com command palette `⌘K`, seletor de Ano Ativo destacado, avatar refinado.
- MobileBottomNav: pílula flutuante com FAB central de "Novo lançamento".

**1.4 Componentes base atualizados**
- `Button`: variantes `brand`, `brandGhost`, `glass`, `gradient`, estados loading/success.
- `Card`: variantes `elevated`, `glass`, `outlined`, `gradient`.
- `Input/Select/Combobox`: 44px, ring verde suave.
- `Badge`: semânticos + `soft`.
- `Tabs`: pílula com indicador animado.

**Auditoria 1**: contraste AA, dark mode, mobile 375px, todas as rotas renderizam sem regressão visual, cores de categorias intactas.

---

## FASE 2 — Reorganização da Navegação + Telas Operacionais
*(Engloba antigas Fases 4 e parte de 5, + IA do menu)*

**2.1 Nova IA do menu** (proposta — confirmamos antes de codar)
```text
PRINCIPAL
  Dashboard
  Lançamento (CTA destaque)
  Transações
    ├─ Todas
    ├─ Entradas Avulsas
    ├─ Entradas Recorrentes
    ├─ Despesas Fixas
    └─ Despesas Variáveis
  Aprovações  (badge contador)
  Pagamentos em Aberto

GESTÃO
  Contas
  Contratos Recorrentes
  Clientes & Entidades
  Reclassificação

RELATÓRIOS
  DRE
  Análise de Despesas
  Fiscal
  Relatórios Gerais

CONFIGURAÇÕES
  Cadastros (Categorias, Centros de Custo, Formas de Pagto, Planos)
  Financeiro (Salário Mínimo, Regras Fiscais)
  Importação / Exportação
  Backlog
  Usuários & Permissões
```
Reduz de ~20 itens soltos para 4 grupos claros, com a operação diária no topo.

**2.2 Telas operacionais**
- **Dashboard**: hero com saudação + marca d'água, KPIs no novo padrão, gráfico mestre com gradient verde, alertas redesenhados.
- **Lançamento (Central)**: refino visual do form atual (chips, comboboxes, resumo, atalhos).
- **Transações**: linhas com hover sutil, badges no novo padrão, filtros como pílulas, MonthYear navigator polido.
- **Contas**: cards com gradient sutil, micro-charts.
- **Aprovações / Pagamentos em Aberto**: KPI cards como filtros, bulk actions visíveis.

**Auditoria 2**: fluxo de lançamento ponta-a-ponta, navegação por teclado, mobile, performance (LCP), nenhuma rota órfã após reorganização.

---

## FASE 3 — Telas Analíticas, Cadastros e Polimento Final
*(Engloba antigas Fases 5 e 6)*

**3.1 Analíticas e Cadastros**
- **DRE / Relatórios**: tipografia tabular, indentação visual, totais em destaque branded, export polido.
- **Categorias / Centros de Custo / Entidades**: grid moderno **preservando as cores cadastradas** (apenas o container muda).
- **Configurações**: nav lateral interna, seções como cards.
- **Login**: split-screen com logo vertical + form minimalista.

**3.2 Microinterações
- Transições de página (fade + slide leve).
- Skeletons com shimmer verde.
- Empty states ilustrados com motivo do círculo incompleto.
- Count-up nos KPIs.
- Toaster (sonner) com tema branded.

**Auditoria 3 (final)**: checklist completo — acessibilidade AA, dark mode tela a tela, mobile/tablet/desktop, smoke test funcional de todas as rotas, validação com você antes de fechar.

---

## Detalhes técnicos

```text
Arquivos por fase
F1: src/index.css, tailwind.config.ts, src/components/brand/Logo.tsx,
    src/assets/brand/*, index.html, ui/{button,card,input,badge,tabs}.tsx,
    layout/{Sidebar,Header,MobileBottomNav}.tsx
F2: App.tsx (rotas/grupos), Sidebar (nova IA), Dashboard, Lançamento,
    Transações, Contas, Aprovações, OpenPayments
F3: DRE, Reports, Cadastros, Configurações, Login, feedback/{Skeleton,
    EmptyState,PageTransition}
```

## Garantias
- Cores cadastradas pelo usuário (categorias/contas/entidades) **intactas**.
- Sem migração de banco. Sem quebra de API.
- Cada fase é entregue revisável; auditoria entre fases.

## Próximo passo
Aprovando o plano, começo pela **Fase 1**. Antes da Fase 2, te mostro a IA do menu para confirmação final.
