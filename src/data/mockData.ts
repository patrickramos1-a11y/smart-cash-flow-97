import { 
  Transaction, 
  Client, 
  Contract, 
  Account, 
  Category, 
  CostCenter, 
  PaymentMethod,
  DashboardKPIs,
  ClientProfitability 
} from '@/types/financial';

// Helper to parse Brazilian currency
export const parseBrazilianCurrency = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// Helper to format to Brazilian currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Helper to format date
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// Mock Clients
export const mockClients: Client[] = [
  { id: '1', name: 'NATURE AMAZON', type: 'RECORRENTE', email: 'contato@natureamazon.com', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'AÇAI KAA', type: 'RECORRENTE', email: 'financeiro@acaikaa.com', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: '4 ELEMENTOS', type: 'RECORRENTE', email: 'adm@4elementos.com', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'CEIBA', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'DA CASA', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'AÇAI VIATANAT', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'CTC', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'FROM AMAZONIA', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'GUARA PARK', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '10', name: 'FLOR DE AÇAI', type: 'RECORRENTE', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '11', name: 'CLIENTE AVULSO 1', type: 'AVULSO', contracts: [], createdAt: new Date(), updatedAt: new Date() },
  { id: '12', name: 'CLIENTE AVULSO 2', type: 'AVULSO', contracts: [], createdAt: new Date(), updatedAt: new Date() },
];

// Mock Transactions (based on XLSX data)
export const mockTransactions: Transaction[] = [
  {
    id: '99815379',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'ACOMPANHAMENTO AMBIENTAL',
    description: 'NATURE AMAZON (Recorrente - 12/12)',
    value: 2277.00,
    details: 'CONSULTORIA AMBIENTAL',
    documentNumber: '',
    paymentMethod: 'Boleto Bancário',
    costCenter: 'Receita Bruta',
    isPaid: true,
    paymentDate: new Date('2026-01-10'),
    dueDate: new Date('2026-01-10'),
    collectionSent: false,
    linkedCompanies: 'RAMOS',
    nature: 'ENTRADA',
    revenueType: 'RECORRENTE',
    status: 'PAGO',
    documentType: 'NF',
    documentStatus: 'OK',
    collectionHistory: [],
    clientId: '1',
    clientName: 'NATURE AMAZON',
    clientType: 'RECORRENTE',
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '99951626',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'ACOMPANHAMENTO AMBIENTAL',
    description: 'AÇAI KAA (Recorrente - 12/12)',
    value: 3036.00,
    details: 'CONSULTORIA AMBIENTAL',
    documentNumber: '',
    paymentMethod: 'Boleto Bancário',
    costCenter: 'Receita Bruta',
    isPaid: false,
    dueDate: new Date('2026-01-13'),
    collectionSent: false,
    linkedCompanies: 'ACAI KAA',
    nature: 'ENTRADA',
    revenueType: 'RECORRENTE',
    status: 'EM_ABERTO',
    documentType: 'NF',
    documentStatus: 'PENDENTE',
    collectionHistory: [],
    clientId: '2',
    clientName: 'AÇAI KAA',
    clientType: 'RECORRENTE',
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '99951613',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'ACOMPANHAMENTO AMBIENTAL',
    description: '4 ELEMENTOS (Recorrente - 12/12)',
    value: 2277.00,
    details: 'CONSULTORIA AMBIENTAL',
    documentNumber: '',
    paymentMethod: 'Boleto Bancário',
    costCenter: 'Receita Bruta',
    isPaid: true,
    paymentDate: new Date('2026-01-10'),
    dueDate: new Date('2026-01-10'),
    collectionSent: false,
    nature: 'ENTRADA',
    revenueType: 'RECORRENTE',
    status: 'PAGO',
    documentType: 'NF',
    documentStatus: 'OK',
    collectionHistory: [],
    clientId: '3',
    clientName: '4 ELEMENTOS',
    clientType: 'RECORRENTE',
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '99951762',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'ACOMPANHAMENTO AMBIENTAL',
    description: 'CEIBA (Recorrente - 12/12)',
    value: 3036.00,
    details: 'CONSULTORIA AMBIENTAL',
    paymentMethod: 'Boleto Bancário',
    costCenter: 'Receita Bruta',
    isPaid: false,
    dueDate: new Date('2026-01-20'),
    collectionSent: false,
    nature: 'ENTRADA',
    revenueType: 'RECORRENTE',
    status: 'EM_ABERTO',
    documentType: 'NF',
    documentStatus: 'PENDENTE',
    collectionHistory: [],
    clientId: '4',
    clientName: 'CEIBA',
    clientType: 'RECORRENTE',
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '99951798',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'ACOMPANHAMENTO AMBIENTAL',
    description: 'DA CASA (Recorrente - 12/12)',
    value: 1518.00,
    details: 'CONSULTORIA AMBIENTAL',
    paymentMethod: 'Boleto Bancário',
    costCenter: 'Receita Bruta',
    isPaid: true,
    paymentDate: new Date('2026-01-03'),
    dueDate: new Date('2026-01-03'),
    collectionSent: false,
    nature: 'ENTRADA',
    revenueType: 'RECORRENTE',
    status: 'PAGO',
    documentType: 'RECIBO',
    documentStatus: 'OK',
    collectionHistory: [],
    clientId: '5',
    clientName: 'DA CASA',
    clientType: 'RECORRENTE',
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '99951649',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'ACOMPANHAMENTO AMBIENTAL',
    description: 'AÇAI VIATANAT (Recorrente - 12/12)',
    value: 1818.00,
    details: 'CONSULTORIA AMBIENTAL',
    paymentMethod: 'Boleto Bancário',
    costCenter: 'Receita Bruta',
    isPaid: true,
    paymentDate: new Date('2026-01-15'),
    dueDate: new Date('2026-01-15'),
    collectionSent: false,
    nature: 'ENTRADA',
    revenueType: 'RECORRENTE',
    status: 'PAGO',
    documentType: 'NF',
    documentStatus: 'OK',
    collectionHistory: [],
    clientId: '6',
    clientName: 'AÇAI VIATANAT',
    clientType: 'RECORRENTE',
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Expenses
  {
    id: 'EXP001',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Pagamentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'SALÁRIOS',
    description: 'Folha de Pagamento - Janeiro',
    value: 15000.00,
    details: 'Pagamento de funcionários',
    paymentMethod: 'Transferência',
    costCenter: 'Despesas Operacionais',
    isPaid: true,
    paymentDate: new Date('2026-01-05'),
    dueDate: new Date('2026-01-05'),
    collectionSent: false,
    nature: 'SAIDA',
    expenseType: 'FIXA',
    status: 'PAGO',
    documentType: 'SEM_DOCUMENTO',
    documentStatus: 'NAO_APLICA',
    collectionHistory: [],
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'EXP002',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Pagamentos',
    originDestination: 'CEMIG',
    account: 'BANCARIA',
    category: 'ENERGIA',
    description: 'Conta de Energia - Sede',
    value: 850.00,
    details: 'Energia elétrica do escritório',
    paymentMethod: 'Débito Automático',
    costCenter: 'Despesas Operacionais',
    isPaid: false,
    dueDate: new Date('2026-01-20'),
    collectionSent: false,
    nature: 'SAIDA',
    expenseType: 'VARIAVEL',
    status: 'EM_ABERTO',
    documentType: 'NF',
    documentStatus: 'PENDENTE',
    collectionHistory: [],
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'EXP003',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Pagamentos',
    originDestination: 'ALUGUEL',
    account: 'BANCARIA',
    category: 'ALUGUEL',
    description: 'Aluguel do Escritório - Janeiro',
    value: 4500.00,
    details: 'Aluguel mensal',
    paymentMethod: 'Transferência',
    costCenter: 'Despesas Operacionais',
    isPaid: true,
    paymentDate: new Date('2026-01-01'),
    dueDate: new Date('2026-01-05'),
    collectionSent: false,
    nature: 'SAIDA',
    expenseType: 'FIXA',
    status: 'PAGO',
    documentType: 'RECIBO',
    documentStatus: 'OK',
    collectionHistory: [],
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'EXP004',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Pagamentos',
    originDestination: 'MATERIAL',
    account: 'BANCARIA',
    category: 'MATERIAL DE ESCRITÓRIO',
    description: 'Compra de materiais',
    value: 320.00,
    details: 'Materiais diversos',
    paymentMethod: 'Cartão de Crédito',
    costCenter: 'Despesas Administrativas',
    isPaid: true,
    paymentDate: new Date('2026-01-08'),
    dueDate: new Date('2026-01-08'),
    collectionSent: false,
    nature: 'SAIDA',
    expenseType: 'VARIAVEL',
    status: 'PAGO',
    documentType: 'NF',
    documentStatus: 'OK',
    collectionHistory: [],
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Pontual Revenue
  {
    id: 'REC_PONT_001',
    company: 'RAMOS ENGENHARIA',
    transactionType: 'Recebimentos',
    originDestination: 'INTER',
    account: 'BANCARIA',
    category: 'PROJETOS ESPECIAIS',
    description: 'Projeto EIA/RIMA - Novo Cliente',
    value: 25000.00,
    details: 'Estudo de Impacto Ambiental',
    paymentMethod: 'Transferência',
    costCenter: 'Receita Bruta',
    isPaid: true,
    paymentDate: new Date('2026-01-12'),
    dueDate: new Date('2026-01-12'),
    collectionSent: false,
    nature: 'ENTRADA',
    revenueType: 'PONTUAL',
    status: 'PAGO',
    documentType: 'NF',
    documentStatus: 'OK',
    collectionHistory: [],
    clientId: '11',
    clientName: 'CLIENTE AVULSO 1',
    clientType: 'AVULSO',
    competenceMonth: 1,
    competenceYear: 2026,
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

// Mock Accounts
export const mockAccounts: Account[] = [
  { id: '1', name: 'Conta Corrente Banco Inter', type: 'BANCARIA', bank: 'Inter', active: true },
  { id: '2', name: 'Conta Poupança Itaú', type: 'POUPANCA', bank: 'Itaú', active: true },
  { id: '3', name: 'Caixa Físico', type: 'CAIXA', active: true },
];

// Mock Categories
export const mockCategories: Category[] = [
  { id: '1', name: 'ACOMPANHAMENTO AMBIENTAL', nature: 'ENTRADA', active: true },
  { id: '2', name: 'PROJETOS ESPECIAIS', nature: 'ENTRADA', active: true },
  { id: '3', name: 'LICENCIAMENTO', nature: 'ENTRADA', active: true },
  { id: '4', name: 'SALÁRIOS', nature: 'SAIDA', active: true },
  { id: '5', name: 'ENERGIA', nature: 'SAIDA', active: true },
  { id: '6', name: 'ALUGUEL', nature: 'SAIDA', active: true },
  { id: '7', name: 'MATERIAL DE ESCRITÓRIO', nature: 'SAIDA', active: true },
  { id: '8', name: 'MARKETING', nature: 'SAIDA', active: true },
];

// Mock Cost Centers
export const mockCostCenters: CostCenter[] = [
  { id: '1', name: 'Receita Bruta', code: 'RB', active: true },
  { id: '2', name: 'Despesas Operacionais', code: 'DO', active: true },
  { id: '3', name: 'Despesas Administrativas', code: 'DA', active: true },
  { id: '4', name: 'Investimentos', code: 'INV', active: true },
];

// Mock Payment Methods
export const mockPaymentMethods: PaymentMethod[] = [
  { id: '1', name: 'Boleto Bancário', active: true },
  { id: '2', name: 'PIX', active: true },
  { id: '3', name: 'Transferência', active: true },
  { id: '4', name: 'Cartão de Crédito', active: true },
  { id: '5', name: 'Cartão de Débito', active: true },
  { id: '6', name: 'Débito Automático', active: true },
  { id: '7', name: 'Dinheiro', active: true },
];

// Calculate KPIs
export const calculateKPIs = (transactions: Transaction[]): DashboardKPIs => {
  const totalRevenue = transactions
    .filter(t => t.nature === 'ENTRADA')
    .reduce((sum, t) => sum + t.value, 0);
  
  const totalExpenses = transactions
    .filter(t => t.nature === 'SAIDA')
    .reduce((sum, t) => sum + t.value, 0);
  
  const receivable = transactions
    .filter(t => t.nature === 'ENTRADA' && t.status !== 'PAGO')
    .reduce((sum, t) => sum + t.value, 0);
  
  const payable = transactions
    .filter(t => t.nature === 'SAIDA' && t.status !== 'PAGO')
    .reduce((sum, t) => sum + t.value, 0);
  
  const recurringRevenue = transactions
    .filter(t => t.nature === 'ENTRADA' && t.revenueType === 'RECORRENTE')
    .reduce((sum, t) => sum + t.value, 0);
  
  const fixedExpenses = transactions
    .filter(t => t.nature === 'SAIDA' && t.expenseType === 'FIXA')
    .reduce((sum, t) => sum + t.value, 0);

  return {
    totalRevenue,
    totalExpenses,
    netResult: totalRevenue - totalExpenses,
    receivable,
    payable,
    recurringPercentage: totalRevenue > 0 ? (recurringRevenue / totalRevenue) * 100 : 0,
    fixedExpensePercentage: totalExpenses > 0 ? (fixedExpenses / totalExpenses) * 100 : 0,
  };
};

// Calculate Client Profitability
export const calculateClientProfitability = (transactions: Transaction[]): ClientProfitability[] => {
  const clientMap = new Map<string, ClientProfitability>();
  
  transactions.forEach(t => {
    if (!t.clientId || !t.clientName) return;
    
    if (!clientMap.has(t.clientId)) {
      clientMap.set(t.clientId, {
        clientId: t.clientId,
        clientName: t.clientName,
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0,
        margin: 0
      });
    }
    
    const client = clientMap.get(t.clientId)!;
    if (t.nature === 'ENTRADA') {
      client.totalRevenue += t.value;
    } else {
      client.totalExpenses += t.value;
    }
  });
  
  const result = Array.from(clientMap.values()).map(client => ({
    ...client,
    profit: client.totalRevenue - client.totalExpenses,
    margin: client.totalRevenue > 0 
      ? ((client.totalRevenue - client.totalExpenses) / client.totalRevenue) * 100 
      : 0
  }));
  
  return result.sort((a, b) => b.profit - a.profit);
};
