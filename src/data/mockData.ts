import { 
  Transaction, 
  Client, 
  Contract, 
  Account, 
  AccountCategory,
  TransactionCategory,
  CostCenter, 
  PaymentMethod,
  FinancialCompany,
  FinancialSource,
  DashboardKPIs,
  ClientProfitability,
  AccountCategoryBalance,
  AgingReport,
  DREReport
} from '@/types/financial';

// ============= HELPERS =============
export const parseBrazilianCurrency = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const formatCompetence = (month: number, year: number): string => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[month - 1]}/${year}`;
};

// ============= EMPRESAS FINANCEIRAS =============
export const mockFinancialCompanies: FinancialCompany[] = [
  { id: 'emp1', name: 'RAMOS ENGENHARIA', cnpj: '12.345.678/0001-00', active: true },
  { id: 'emp2', name: 'RAMOS CONSULTORIA', cnpj: '12.345.678/0002-00', active: true },
];

// ============= CATEGORIAS DE CONTA (Agrupador de saldo) =============
export const mockAccountCategories: AccountCategory[] = [
  { id: 'ac1', name: 'CONTA INTER', description: 'Contas Banco Inter', color: '#FF6600', active: true, order: 1 },
  { id: 'ac2', name: 'BINANCE (CRIPTO)', description: 'Carteiras Cripto', color: '#F3BA2F', active: true, order: 2 },
  { id: 'ac3', name: 'INVEST. INTER', description: 'Investimentos Inter', color: '#10B981', active: true, order: 3 },
  { id: 'ac4', name: 'CONTA BENEFÍCIO', description: 'Contas de Benefícios', color: '#8B5CF6', active: true, order: 4 },
  { id: 'ac5', name: 'CONTAS DESABILITADAS', description: 'Contas inativas', color: '#6B7280', active: true, order: 5 },
  { id: 'ac6', name: 'SEM CATEGORIA', description: 'Sem categorização', color: '#94A3B8', active: true, order: 6 },
];

// ============= CONTAS (com saldo) =============
export const mockAccounts: Account[] = [
  { id: 'acc1', name: 'INTER - CONTA CORRENTE PJ', categoryId: 'ac1', categoryName: 'CONTA INTER', bank: 'Inter', balance: 58480.70, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc2', name: 'INTER - CONTA DIGITAL PF', categoryId: 'ac1', categoryName: 'CONTA INTER', bank: 'Inter', balance: 41000.00, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc3', name: 'BINANCE - PF - CRIPTO', categoryId: 'ac2', categoryName: 'BINANCE (CRIPTO)', balance: 42372.60, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc4', name: 'INVEST. INTER - CDB', categoryId: 'ac3', categoryName: 'INVEST. INTER', bank: 'Inter', balance: 75000.00, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc5', name: 'INVEST. INTER - LCI', categoryId: 'ac3', categoryName: 'INVEST. INTER', bank: 'Inter', balance: 40000.00, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc6', name: 'CONTA BENEFÍCIO VR', categoryId: 'ac4', categoryName: 'CONTA BENEFÍCIO', balance: 2300.01, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc7', name: 'CAIXA FÍSICO', categoryId: 'ac6', categoryName: 'SEM CATEGORIA', balance: 5446.68, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc8', name: 'CARTEIRA PESSOAL', categoryId: 'ac6', categoryName: 'SEM CATEGORIA', balance: 41000.00, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'acc9', name: 'CONTA ANTIGA BB', categoryId: 'ac5', categoryName: 'CONTAS DESABILITADAS', bank: 'BB', balance: 0, active: false, createdAt: new Date(), updatedAt: new Date() },
];

// ============= CATEGORIAS DE TRANSAÇÃO =============
export const mockTransactionCategories: TransactionCategory[] = [
  { id: 'tc1', name: 'ACOMPANHAMENTO AMBIENTAL', nature: 'ENTRADA', color: '#10B981', active: true },
  { id: 'tc2', name: 'PROJETOS ESPECIAIS', nature: 'ENTRADA', color: '#3B82F6', active: true },
  { id: 'tc3', name: 'LICENCIAMENTO', nature: 'ENTRADA', color: '#8B5CF6', active: true },
  { id: 'tc4', name: 'CONSULTORIA', nature: 'ENTRADA', color: '#06B6D4', active: true },
  { id: 'tc5', name: 'SALÁRIOS', nature: 'SAIDA', color: '#EF4444', active: true },
  { id: 'tc6', name: 'ENERGIA', nature: 'SAIDA', color: '#F59E0B', active: true },
  { id: 'tc7', name: 'ALUGUEL', nature: 'SAIDA', color: '#EC4899', active: true },
  { id: 'tc8', name: 'MATERIAL DE ESCRITÓRIO', nature: 'SAIDA', color: '#6366F1', active: true },
  { id: 'tc9', name: 'TAXAS E IMPOSTOS', nature: 'SAIDA', color: '#DC2626', active: true },
  { id: 'tc10', name: 'MARKETING', nature: 'SAIDA', color: '#14B8A6', active: true },
  { id: 'tc11', name: 'TRANSFERÊNCIA', nature: 'AMBOS', color: '#64748B', active: true },
];

// ============= CENTROS DE CUSTO (DRE) =============
export const mockCostCenters: CostCenter[] = [
  { id: 'cc1', name: 'Receita Bruta', code: 'RB', includeInDRE: true, dreLabel: '(+) Receita Bruta', dreOrder: 1, active: true },
  { id: 'cc2', name: 'Deduções da Receita', code: 'DED', includeInDRE: true, dreLabel: '(-) Deduções', dreOrder: 2, active: true },
  { id: 'cc3', name: 'Custos Operacionais', code: 'COP', includeInDRE: true, dreLabel: '(-) Custos Operacionais', dreOrder: 3, active: true },
  { id: 'cc4', name: 'Despesas Administrativas', code: 'DAD', includeInDRE: true, dreLabel: '(-) Despesas Administrativas', dreOrder: 4, active: true },
  { id: 'cc5', name: 'Despesas Financeiras', code: 'DFI', includeInDRE: true, dreLabel: '(-) Despesas Financeiras', dreOrder: 5, active: true },
  { id: 'cc6', name: 'Outras Receitas', code: 'ORE', includeInDRE: true, dreLabel: '(+) Outras Receitas', dreOrder: 6, active: true },
  { id: 'cc7', name: 'Transferências', code: 'TRF', includeInDRE: false, dreLabel: '', dreOrder: 99, active: true },
];

// ============= FORMAS DE PAGAMENTO =============
export const mockPaymentMethods: PaymentMethod[] = [
  { id: 'pm1', name: 'Boleto Bancário', active: true },
  { id: 'pm2', name: 'PIX', active: true },
  { id: 'pm3', name: 'Transferência Bancária', active: true },
  { id: 'pm4', name: 'Cartão de Crédito', active: true },
  { id: 'pm5', name: 'Cartão de Débito', active: true },
  { id: 'pm6', name: 'Débito Automático', active: true },
  { id: 'pm7', name: 'Dinheiro', active: true },
  { id: 'pm8', name: 'Cheque', active: true },
];

// ============= FONTES FINANCEIRAS =============
export const mockFinancialSources: FinancialSource[] = [
  { id: 'fs1', name: 'Receita Operacional', active: true },
  { id: 'fs2', name: 'Empréstimo Bancário', active: true },
  { id: 'fs3', name: 'Investimento Sócio', active: true },
  { id: 'fs4', name: 'Rendimentos', active: true },
];

// ============= CLIENTES =============
export const mockClients: Client[] = [
  { id: 'cli1', name: 'NATURE AMAZON', type: 'RECORRENTE', email: 'contato@natureamazon.com', phone: '(92) 99999-0001', document: '12.345.678/0001-01', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli2', name: 'AÇAI KAA', type: 'RECORRENTE', email: 'financeiro@acaikaa.com', phone: '(92) 99999-0002', document: '12.345.678/0001-02', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli3', name: '4 ELEMENTOS', type: 'RECORRENTE', email: 'adm@4elementos.com', phone: '(92) 99999-0003', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli4', name: 'CEIBA', type: 'RECORRENTE', phone: '(92) 99999-0004', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli5', name: 'DA CASA', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli6', name: 'AÇAI VIATANAT', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli7', name: 'CTC', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli8', name: 'FROM AMAZONIA', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli9', name: 'GUARA PARK', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli10', name: 'FLOR DE AÇAI', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli11', name: 'NOVO CLIENTE PONTUAL', type: 'AVULSO', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: 'cli12', name: 'PROJETO ESPECIAL LTDA', type: 'AVULSO', contracts: [], createdAt: new Date(), updatedAt: new Date() },
];

// ============= CONTRATOS (SM) =============
export const mockContracts: Contract[] = [
  { id: 'ctr1', clientId: 'cli1', clientName: 'NATURE AMAZON', description: 'Acompanhamento Ambiental Mensal', minimumWages: 1.5, minimumWageValue: 1518.00, minimumWageMonth: 1, minimumWageYear: 2026, calculatedMonthlyValue: 2277.00, startDate: new Date('2024-01-01'), active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ctr2', clientId: 'cli2', clientName: 'AÇAI KAA', description: 'Consultoria Ambiental', minimumWages: 2.0, minimumWageValue: 1518.00, minimumWageMonth: 1, minimumWageYear: 2026, calculatedMonthlyValue: 3036.00, startDate: new Date('2024-01-01'), active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ctr3', clientId: 'cli3', clientName: '4 ELEMENTOS', description: 'Acompanhamento Ambiental', minimumWages: 1.5, minimumWageValue: 1518.00, minimumWageMonth: 1, minimumWageYear: 2026, calculatedMonthlyValue: 2277.00, startDate: new Date('2024-03-01'), active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ctr4', clientId: 'cli4', clientName: 'CEIBA', description: 'Licenciamento e Acompanhamento', minimumWages: 2.0, minimumWageValue: 1518.00, minimumWageMonth: 1, minimumWageYear: 2026, calculatedMonthlyValue: 3036.00, startDate: new Date('2024-06-01'), active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ctr5', clientId: 'cli5', clientName: 'DA CASA', description: 'Acompanhamento Básico', minimumWages: 1.0, minimumWageValue: 1518.00, minimumWageMonth: 1, minimumWageYear: 2026, calculatedMonthlyValue: 1518.00, startDate: new Date('2025-01-01'), active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ctr6', clientId: 'cli6', clientName: 'AÇAI VIATANAT', description: 'Acompanhamento Ambiental', minimumWages: 1.2, minimumWageValue: 1518.00, minimumWageMonth: 1, minimumWageYear: 2026, calculatedMonthlyValue: 1821.60, startDate: new Date('2024-01-01'), active: true, createdAt: new Date(), updatedAt: new Date() },
];

// ============= TRANSAÇÕES =============
export const mockTransactions: Transaction[] = [
  // Entradas Recorrentes
  {
    id: 'trx001',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    description: 'NATURE AMAZON (Recorrente - 01/2026)',
    serviceDescription: 'Acompanhamento ambiental mensal conforme contrato',
    value: 2277.00,
    categoryId: 'tc1', categoryName: 'ACOMPANHAMENTO AMBIENTAL',
    costCenterId: 'cc1', costCenterName: 'Receita Bruta',
    paymentMethodId: 'pm1', paymentMethodName: 'Boleto Bancário',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'NF', documentNumber: 'NF-001234', documentStatus: 'OK',
    paymentDate: new Date('2026-01-10'), dueDate: new Date('2026-01-10'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'ENTRADA', revenueType: 'RECORRENTE',
    clientId: 'cli1', clientName: 'NATURE AMAZON', clientType: 'RECORRENTE', contractId: 'ctr1',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx002',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    description: 'AÇAI KAA (Recorrente - 01/2026)',
    serviceDescription: 'Consultoria ambiental conforme contrato',
    value: 3036.00,
    categoryId: 'tc1', categoryName: 'ACOMPANHAMENTO AMBIENTAL',
    costCenterId: 'cc1', costCenterName: 'Receita Bruta',
    paymentMethodId: 'pm1', paymentMethodName: 'Boleto Bancário',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'NF', documentNumber: '', documentStatus: 'PENDENTE',
    dueDate: new Date('2026-01-13'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: false, status: 'EM_ABERTO',
    nature: 'ENTRADA', revenueType: 'RECORRENTE',
    clientId: 'cli2', clientName: 'AÇAI KAA', clientType: 'RECORRENTE', contractId: 'ctr2',
    collectionSent: true, collectionHistory: [
      { id: 'col1', transactionId: 'trx002', date: new Date('2026-01-12'), channel: 'WHATSAPP', userId: 'user1', userName: 'Admin' }
    ],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx003',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    description: '4 ELEMENTOS (Recorrente - 01/2026)',
    value: 2277.00,
    categoryId: 'tc1', categoryName: 'ACOMPANHAMENTO AMBIENTAL',
    costCenterId: 'cc1', costCenterName: 'Receita Bruta',
    paymentMethodId: 'pm1', paymentMethodName: 'Boleto Bancário',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'NF', documentNumber: 'NF-001235', documentStatus: 'OK',
    paymentDate: new Date('2026-01-10'), dueDate: new Date('2026-01-10'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'ENTRADA', revenueType: 'RECORRENTE',
    clientId: 'cli3', clientName: '4 ELEMENTOS', clientType: 'RECORRENTE', contractId: 'ctr3',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx004',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    description: 'CEIBA (Recorrente - 01/2026)',
    value: 3036.00,
    categoryId: 'tc1', categoryName: 'ACOMPANHAMENTO AMBIENTAL',
    costCenterId: 'cc1', costCenterName: 'Receita Bruta',
    paymentMethodId: 'pm1', paymentMethodName: 'Boleto Bancário',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'NF', documentNumber: '', documentStatus: 'PENDENTE',
    dueDate: new Date('2026-01-05'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: false, status: 'ATRASADO',
    nature: 'ENTRADA', revenueType: 'RECORRENTE',
    clientId: 'cli4', clientName: 'CEIBA', clientType: 'RECORRENTE', contractId: 'ctr4',
    collectionSent: true, collectionHistory: [
      { id: 'col2', transactionId: 'trx004', date: new Date('2026-01-06'), channel: 'EMAIL', userId: 'user1', userName: 'Admin' },
      { id: 'col3', transactionId: 'trx004', date: new Date('2026-01-10'), channel: 'WHATSAPP', userId: 'user1', userName: 'Admin' }
    ],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx005',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    description: 'DA CASA (Recorrente - 01/2026)',
    value: 1518.00,
    categoryId: 'tc1', categoryName: 'ACOMPANHAMENTO AMBIENTAL',
    costCenterId: 'cc1', costCenterName: 'Receita Bruta',
    paymentMethodId: 'pm2', paymentMethodName: 'PIX',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'RECIBO', documentNumber: 'REC-0045', documentStatus: 'OK',
    paymentDate: new Date('2026-01-03'), dueDate: new Date('2026-01-05'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'ENTRADA', revenueType: 'RECORRENTE',
    clientId: 'cli5', clientName: 'DA CASA', clientType: 'RECORRENTE', contractId: 'ctr5',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  // Entrada Pontual
  {
    id: 'trx006',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    description: 'Projeto EIA/RIMA - Cliente Novo',
    serviceDescription: 'Estudo de Impacto Ambiental completo para novo empreendimento',
    value: 25000.00,
    categoryId: 'tc2', categoryName: 'PROJETOS ESPECIAIS',
    costCenterId: 'cc1', costCenterName: 'Receita Bruta',
    paymentMethodId: 'pm3', paymentMethodName: 'Transferência Bancária',
    paymentRecurrence: 'AVISTA',
    documentType: 'NF', documentNumber: 'NF-001240', documentStatus: 'OK',
    paymentDate: new Date('2026-01-12'), dueDate: new Date('2026-01-12'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'ENTRADA', revenueType: 'PONTUAL',
    clientId: 'cli11', clientName: 'NOVO CLIENTE PONTUAL', clientType: 'AVULSO',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  // Despesas
  {
    id: 'trx007',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Pagamentos',
    originDestination: 'FOLHA',
    description: 'Folha de Pagamento - Janeiro/2026',
    value: 15000.00,
    categoryId: 'tc5', categoryName: 'SALÁRIOS',
    costCenterId: 'cc3', costCenterName: 'Custos Operacionais',
    paymentMethodId: 'pm3', paymentMethodName: 'Transferência Bancária',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'SEM_DOCUMENTO', documentStatus: 'NAO_APLICA',
    paymentDate: new Date('2026-01-05'), dueDate: new Date('2026-01-05'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'SAIDA', expenseType: 'FIXA',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx008',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Pagamentos',
    originDestination: 'CEMIG',
    description: 'Conta de Energia - Sede',
    value: 850.00,
    categoryId: 'tc6', categoryName: 'ENERGIA',
    costCenterId: 'cc4', costCenterName: 'Despesas Administrativas',
    paymentMethodId: 'pm6', paymentMethodName: 'Débito Automático',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'NF', documentNumber: '', documentStatus: 'PENDENTE',
    dueDate: new Date('2026-01-20'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: false, status: 'EM_ABERTO',
    nature: 'SAIDA', expenseType: 'VARIAVEL',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx009',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Pagamentos',
    originDestination: 'LOCADOR',
    description: 'Aluguel do Escritório - Janeiro/2026',
    value: 4500.00,
    categoryId: 'tc7', categoryName: 'ALUGUEL',
    costCenterId: 'cc4', costCenterName: 'Despesas Administrativas',
    paymentMethodId: 'pm3', paymentMethodName: 'Transferência Bancária',
    paymentRecurrence: 'RECORRENTE',
    documentType: 'RECIBO', documentNumber: 'REC-ALG-01', documentStatus: 'OK',
    paymentDate: new Date('2026-01-01'), dueDate: new Date('2026-01-05'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'SAIDA', expenseType: 'FIXA',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx010',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Pagamentos',
    originDestination: 'PAPELARIA',
    description: 'Material de Escritório',
    value: 320.00,
    categoryId: 'tc8', categoryName: 'MATERIAL DE ESCRITÓRIO',
    costCenterId: 'cc4', costCenterName: 'Despesas Administrativas',
    paymentMethodId: 'pm4', paymentMethodName: 'Cartão de Crédito',
    paymentRecurrence: 'AVISTA',
    documentType: 'NF', documentNumber: 'NF-MAT-001', documentStatus: 'OK',
    paymentDate: new Date('2026-01-08'), dueDate: new Date('2026-01-08'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'SAIDA', expenseType: 'VARIAVEL',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  // Transferência (par de transações)
  {
    id: 'trx011',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc1', accountName: 'INTER - CONTA CORRENTE PJ',
    transactionType: 'Transferência',
    originDestination: 'INVEST. INTER - CDB',
    description: 'Aplicação em CDB',
    value: 10000.00,
    categoryId: 'tc11', categoryName: 'TRANSFERÊNCIA',
    costCenterId: 'cc7', costCenterName: 'Transferências',
    paymentMethodId: 'pm3', paymentMethodName: 'Transferência Bancária',
    paymentRecurrence: 'AVISTA',
    documentType: 'SEM_DOCUMENTO', documentStatus: 'NAO_APLICA',
    paymentDate: new Date('2026-01-15'), dueDate: new Date('2026-01-15'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'TRANSFERENCIA_SAIDA',
    transferId: 'trf001', transferAccountId: 'acc4',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'trx012',
    companyId: 'emp1', companyName: 'RAMOS ENGENHARIA',
    accountId: 'acc4', accountName: 'INVEST. INTER - CDB',
    transactionType: 'Transferência',
    originDestination: 'INTER - CONTA CORRENTE PJ',
    description: 'Aplicação em CDB',
    value: 10000.00,
    categoryId: 'tc11', categoryName: 'TRANSFERÊNCIA',
    costCenterId: 'cc7', costCenterName: 'Transferências',
    paymentMethodId: 'pm3', paymentMethodName: 'Transferência Bancária',
    paymentRecurrence: 'AVISTA',
    documentType: 'SEM_DOCUMENTO', documentStatus: 'NAO_APLICA',
    paymentDate: new Date('2026-01-15'), dueDate: new Date('2026-01-15'),
    competenceMonth: 1, competenceYear: 2026,
    isPaid: true, status: 'PAGO',
    nature: 'TRANSFERENCIA_ENTRADA',
    transferId: 'trf001', transferAccountId: 'acc1',
    collectionSent: false, collectionHistory: [],
    createdAt: new Date(), updatedAt: new Date()
  },
];

// ============= FUNÇÕES DE CÁLCULO =============

export const calculateKPIs = (transactions: Transaction[]): DashboardKPIs => {
  // Excluir transferências do cálculo
  const filtered = transactions.filter(t => !t.nature.startsWith('TRANSFERENCIA'));
  
  const totalRevenue = filtered.filter(t => t.nature === 'ENTRADA').reduce((sum, t) => sum + t.value, 0);
  const totalExpenses = filtered.filter(t => t.nature === 'SAIDA').reduce((sum, t) => sum + t.value, 0);
  const receivable = filtered.filter(t => t.nature === 'ENTRADA' && t.status !== 'PAGO').reduce((sum, t) => sum + t.value, 0);
  const payable = filtered.filter(t => t.nature === 'SAIDA' && t.status !== 'PAGO').reduce((sum, t) => sum + t.value, 0);
  
  const recurringRevenue = filtered.filter(t => t.nature === 'ENTRADA' && t.revenueType === 'RECORRENTE').reduce((sum, t) => sum + t.value, 0);
  const pontualRevenue = filtered.filter(t => t.nature === 'ENTRADA' && t.revenueType === 'PONTUAL').reduce((sum, t) => sum + t.value, 0);
  const fixedExpenses = filtered.filter(t => t.nature === 'SAIDA' && t.expenseType === 'FIXA').reduce((sum, t) => sum + t.value, 0);
  const variableExpenses = filtered.filter(t => t.nature === 'SAIDA' && t.expenseType === 'VARIAVEL').reduce((sum, t) => sum + t.value, 0);

  return {
    totalRevenue,
    totalExpenses,
    netResult: totalRevenue - totalExpenses,
    receivable,
    payable,
    recurringPercentage: totalRevenue > 0 ? (recurringRevenue / totalRevenue) * 100 : 0,
    pontualPercentage: totalRevenue > 0 ? (pontualRevenue / totalRevenue) * 100 : 0,
    fixedExpensePercentage: totalExpenses > 0 ? (fixedExpenses / totalExpenses) * 100 : 0,
    variableExpensePercentage: totalExpenses > 0 ? (variableExpenses / totalExpenses) * 100 : 0,
  };
};

export const calculateAccountCategoryBalances = (accounts: Account[], categories: AccountCategory[]): AccountCategoryBalance[] => {
  return categories.map(cat => {
    const categoryAccounts = accounts.filter(acc => acc.categoryId === cat.id && acc.active);
    const totalBalance = categoryAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalBalance,
      color: cat.color,
      accounts: categoryAccounts
    };
  }).filter(cat => cat.accounts.length > 0 || cat.totalBalance > 0);
};

export const calculateClientProfitability = (transactions: Transaction[]): ClientProfitability[] => {
  const filtered = transactions.filter(t => !t.nature.startsWith('TRANSFERENCIA') && t.clientId);
  const clientMap = new Map<string, ClientProfitability>();
  
  filtered.forEach(t => {
    if (!t.clientId || !t.clientName) return;
    
    if (!clientMap.has(t.clientId)) {
      clientMap.set(t.clientId, {
        clientId: t.clientId,
        clientName: t.clientName,
        clientType: t.clientType || 'AVULSO',
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0,
        margin: 0,
        pendingAmount: 0,
        overdueAmount: 0
      });
    }
    
    const client = clientMap.get(t.clientId)!;
    if (t.nature === 'ENTRADA') {
      client.totalRevenue += t.value;
      if (t.status === 'EM_ABERTO') client.pendingAmount += t.value;
      if (t.status === 'ATRASADO') client.overdueAmount += t.value;
    }
  });
  
  return Array.from(clientMap.values())
    .map(client => ({
      ...client,
      profit: client.totalRevenue - client.totalExpenses,
      margin: client.totalRevenue > 0 ? ((client.totalRevenue - client.totalExpenses) / client.totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.profit - a.profit);
};

export const calculateAgingReport = (transactions: Transaction[]): AgingReport => {
  const today = new Date();
  const pending = transactions.filter(t => t.nature === 'ENTRADA' && !t.isPaid && t.dueDate);
  
  let current = 0, week = 0, twoWeeks = 0, overMonth = 0;
  const details: AgingReport['details'] = [];
  
  pending.forEach(t => {
    if (!t.dueDate) return;
    const daysOverdue = Math.floor((today.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    
    let bucket: 'current' | 'week' | 'twoWeeks' | 'overMonth' = 'current';
    if (daysOverdue <= 7) { current += t.value; bucket = 'current'; }
    else if (daysOverdue <= 15) { week += t.value; bucket = 'week'; }
    else if (daysOverdue <= 30) { twoWeeks += t.value; bucket = 'twoWeeks'; }
    else { overMonth += t.value; bucket = 'overMonth'; }
    
    details.push({
      transactionId: t.id,
      clientName: t.clientName || 'N/A',
      value: t.value,
      dueDate: t.dueDate,
      daysOverdue: Math.max(0, daysOverdue),
      bucket
    });
  });
  
  return { current, week, twoWeeks, overMonth, details };
};
