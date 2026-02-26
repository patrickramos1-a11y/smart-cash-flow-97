

# Plano: Expansao de Categorias para Consultoria Ambiental

## Contexto Atual

O sistema possui **14 contas** (BANCARIA, ALIMENTACAO, TRANSPORTE, UNIFORMES, LIMPEZA, MANUTENCAO, MATERIAL DE ESCRITORIO, etc.) e aproximadamente **35 categorias** de transacao. O objetivo e criar categorias mais granulares que reflitam a realidade operacional de uma consultoria ambiental, vinculando cada uma a sua conta, centro de custo e tipo corretos.

---

## Novas Categorias Propostas

### CONTA: ALIMENTACAO (id: 91ad8411)
Centro de Custo: Despesas administrativas | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| REFEICAO EM CAMPO | VARIAVEL | Alimentacao durante visitas tecnicas e campo |
| REFEICAO NO ESCRITORIO | VARIAVEL | Marmitas, deliveries, refeitorio |
| COFFEE BREAK / REUNIAO | VARIAVEL | Cafes, lanches para reunioes com clientes |
| AGUA MINERAL / BEBIDAS | VARIAVEL | Galoes, garrafas para equipe e campo |
| CESTA BASICA | VARIAVEL | Beneficio de cesta basica para colaboradores |

### CONTA: TRANSPORTE (id: 9a80e828)
Centro de Custo: Despesas com logistica | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| COMBUSTIVEL - GASOLINA | VARIAVEL | Abastecimento gasolina veiculos |
| COMBUSTIVEL - DIESEL | VARIAVEL | Abastecimento diesel (caminhonetes campo) |
| PEDAGIO | VARIAVEL | Pedagios em deslocamentos tecnicos |
| ESTACIONAMENTO | VARIAVEL | Estacionamento em visitas |
| PASSAGEM AEREA | VARIAVEL | Voos para projetos distantes |
| PASSAGEM RODOVIARIA | VARIAVEL | Onibus intermunicipais |
| FRETE / TRANSPORTE DE CARGA | VARIAVEL | Transporte de equipamentos e amostras |
| ALUGUEL DE VEICULO | VARIAVEL | Locacao para campo |
| MANUTENCAO VEICULAR | VARIAVEL | Revisoes, pneus, oleo dos veiculos |
| UBER / TAXI / APP | VARIAVEL | Deslocamentos urbanos por aplicativo |

### CONTA: UNIFORMES (id: 8ce81242)
Centro de Custo: Despesas pessoais | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| CAMISA / CAMISETA | VARIAVEL | Camisas polo, camisetas com logo |
| CALCA / BERMUDA | VARIAVEL | Calcas cargo, jeans para campo |
| CALCADO / BOTA | VARIAVEL | Botas de campo, sapatos de seguranca |
| EPI - CAPACETE | VARIAVEL | Capacetes de seguranca |
| EPI - LUVAS | VARIAVEL | Luvas de protecao |
| EPI - OCULOS / PROTETOR | VARIAVEL | Oculos, protetor auricular, mascaras |
| CRACHA / IDENTIFICACAO | VARIAVEL | Crachas, cordoes, porta-crachas |
| COLETE / JAQUETA | VARIAVEL | Coletes refletivos, jaquetas de campo |
| MOCHILA / BOLSA DE CAMPO | VARIAVEL | Mochilas tecnicas para equipe |

### CONTA: LIMPEZA (id: b3412183)
Centro de Custo: Despesas com manutencao e limpeza | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| PRODUTO DE LIMPEZA | VARIAVEL | Desinfetantes, detergentes, alcool |
| MATERIAL DE LIMPEZA | VARIAVEL | Vassouras, panos, baldes, rodos |
| MAO DE OBRA - LIMPEZA | FIXA | Servico de faxineira/empresa terceirizada |
| DESCARTAVEIS / HIGIENE | VARIAVEL | Papel toalha, papel higienico, sabonete |

### CONTA: MANUTENCAO (id: 4f454bfc)
Centro de Custo: Despesas com manutencao e limpeza | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| MANUTENCAO ELETRICA | VARIAVEL | Reparos eletricos, lampadas, fiacoes |
| MANUTENCAO HIDRAULICA | VARIAVEL | Encanamento, torneiras, caixa dagua |
| MANUTENCAO CIVIL / PREDIAL | VARIAVEL | Pintura, alvenaria, piso |
| MANUTENCAO DE EQUIPAMENTOS | VARIAVEL | Reparo de GPS, drones, instrumentos |
| MANUTENCAO DE TI | VARIAVEL | Reparo de PCs, servidores, rede |
| MANUTENCAO AR CONDICIONADO | VARIAVEL | Limpeza e reparo de split/central |
| JARDINAGEM / AREA EXTERNA | VARIAVEL | Corte de grama, poda, paisagismo |

### CONTA: MATERIAL DE ESCRITORIO (id: 7e66769f)
Centro de Custo: Despesas administrativas | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| PAPELARIA | VARIAVEL | Papel A4, envelopes, pastas, etiquetas |
| TONER / CARTUCHO | VARIAVEL | Suprimentos de impressao |
| CANETA / LAPIS / MARCADOR | VARIAVEL | Material de escrita |
| MATERIAL DE ENCADERNACAO | VARIAVEL | Espirais, capas, grampos - para relatorios tecnicos |
| SUPRIMENTOS DE INFORMATICA | VARIAVEL | Cabos, mouses, teclados, pen drives |
| MOBILIARIO | VARIAVEL | Cadeiras, mesas, estantes |
| CARTORIO / AUTENTICACAO | VARIAVEL | Reconhecimento firma, copias autenticadas |

### CONTA: BRINDES (id: 770788da)
Centro de Custo: Despesas pessoais | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| BRINDE CORPORATIVO | VARIAVEL | Canecas, agendas, kits com logo |
| PRESENTE / PREMIACAO | VARIAVEL | Reconhecimento de equipe |
| MATERIAL PROMOCIONAL | VARIAVEL | Banners, folders, adesivos |

### CONTA: MKT (id: 7aae7704)
Centro de Custo: Despesas comerciais | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| MARKETING DIGITAL | VARIAVEL | Google Ads, Meta Ads, LinkedIn |
| DESIGN / IDENTIDADE VISUAL | VARIAVEL | Criacao de artes, logos, apresentacoes |
| EVENTO / FEIRA | VARIAVEL | Participacao em feiras ambientais |
| MIDIA IMPRESSA | VARIAVEL | Flyers, cartoes de visita, catalogos |

### CONTA: IMPOSTOS E TAXAS (id: c195d69a)
Centro de Custo: Impostos e taxas | Tipo: VARIAVEL

| Categoria | Subtipo | Justificativa |
|-----------|---------|---------------|
| TAXA AMBIENTAL / LICENCIAMENTO | VARIAVEL | Taxas de orgaos ambientais (IBAMA, SEMA) |
| TAXA DE ART / RRT | VARIAVEL | Anotacao de Responsabilidade Tecnica |
| ANUIDADE CONSELHO (CREA/CRBio) | FIXA | Anuidades de conselhos profissionais |
| ALVARA / LICENCA MUNICIPAL | FIXA | Alvaras de funcionamento |
| TAXA BANCARIA / TARIFA | VARIAVEL | Tarifas de conta, TED, DOC |

---

## Resumo Quantitativo

| Conta | Categorias Novas | Tipo Predominante |
|-------|-----------------|-------------------|
| ALIMENTACAO | 5 | Variavel |
| TRANSPORTE | 10 | Variavel |
| UNIFORMES | 9 | Variavel |
| LIMPEZA | 4 | Misto |
| MANUTENCAO | 7 | Variavel |
| MATERIAL DE ESCRITORIO | 7 | Variavel |
| BRINDES | 3 | Variavel |
| MKT | 4 | Variavel |
| IMPOSTOS E TAXAS | 5 | Misto |
| **TOTAL** | **54** | |

---

## Implementacao Tecnica

1. **Migracrao SQL** -- Um unico INSERT em massa na tabela `transaction_categories` com as 54 novas categorias, cada uma ja vinculada a:
   - `default_account_id` (conta correspondente)
   - `cost_center_id` (centro de custo adequado)
   - `type` = SAIDA (todas sao despesas)
   - `expense_type` = FIXA ou VARIAVEL conforme tabela
   - `subtype` = FIXA ou VARIAVEL conforme tabela
   - `color` = cor semantica unica por grupo

2. **Categorias existentes genericas** como COMBUSTIVEL, ALIMENTACAO, COMPRA DE MATERIAL e COLABORADORES serao mantidas (nao serao excluidas), pois podem ter transacoes vinculadas. As novas categorias oferecem o detalhamento sem quebrar dados historicos.

3. **Nenhuma alteracao de schema** -- apenas insercao de dados na tabela `transaction_categories` existente.

