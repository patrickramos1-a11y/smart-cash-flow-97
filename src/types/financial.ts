// ============= TIPOS SISRAMOS - MÓDULO FINANCEIRO =============

// Enums - Natureza e Tipos
export type TransactionNature = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA_ENTRADA' | 'TRANSFERENCIA_SAIDA';
export type RevenueType = 'RECORRENTE' | 'PONTUAL';
export type ExpenseType = 'FIXA' | 'VARIAVEL';
export type TransactionStatus = 'PAGO' | 'EM_ABERTO' | 'ATRASADO';
export type DocumentType = 'NF' | 'RECIBO' | 'NOTA_DEBITO' | 'SEM_DOCUMENTO';
export type DocumentStatus = 'PENDENTE' | 'OK' | 'NAO_APLICA';
export type ClientType = 'RECORRENTE' | 'AVULSO';
export type CollectionChannel = 'WHATSAPP' | 'EMAIL' | 'TELEFONE' | 'OUTRO';
export type PaymentRecurrence = 'AVISTA' | 'RECORRENTE';

// ============= CATEGORIA DE CONTA (Agrupador de saldo) =============
// Exemplo: CONTA INTER, BINANCE (CRIPTO), INVEST. INTER, CONTA BENEFICIO
export interface AccountCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  active: boolean;
  order: number;
}

// ============= CONTA (com saldo) =============
export interface Account {
  id: string;
  name: string;
  categoryId: string; // FK para AccountCategory
  categoryName?: string;
  bank?: string;
  balance: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============= CATEGORIA DE TRANSAÇÃO (natureza do gasto/receita) =============
// Exemplo: SERVIÇOS, TAXAS, PAPELARIA, ACOMPANHAMENTO AMBIENTAL
export interface TransactionCategory {
  id: string;
  name: string;
  nature: 'ENTRADA' | 'SAIDA' | 'AMBOS';
  parentId?: string;
  color?: string;
  active: boolean;
}

// ============= CENTRO DE CUSTO (DRE) =============
// Exemplo: Receita Bruta, Custos Operacionais, Despesas Administrativas
export interface CostCenter {
  id: string;
  name: string;
  code?: string;
  includeInDRE: boolean;
  dreLabel?: string; // Como aparece na DRE
  dreOrder: number;
  active: boolean;
}

// ============= EMPRESA FINANCEIRA =============
export interface FinancialCompany {
  id: string;
  name: string;
  cnpj?: string;
  active: boolean;
}

// ============= FONTE FINANCEIRA =============
export interface FinancialSource {
  id: string;
  name: string;
  active: boolean;
}

// ============= FORMA DE PAGAMENTO =============
export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

// ============= CLIENTE =============
export interface Client {
  id: string;
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  document?: string; // CNPJ/CPF
  address?: string;
  contracts: Contract[];
  createdAt: Date;
  updatedAt: Date;
}

// ============= CONTRATO (Salários Mínimos) =============
export interface Contract {
  id: string;
  clientId: string;
  clientName?: string;
  description?: string;
  minimumWages: number; // Quantidade de SMs
  minimumWageValue: number; // Valor do SM de referência
  minimumWageMonth: number;
  minimumWageYear: number;
  calculatedMonthlyValue: number; // minimumWages * minimumWageValue
  startDate: Date;
  endDate?: Date;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============= TRANSAÇÃO (Lançamento) =============
export interface Transaction {
  id: string;
  
  // Dados base (preservados do sistema atual)
  companyId: string;
  companyName?: string;
  accountId: string;
  accountName?: string;
  transactionType: string; // Recebimentos, Pagamentos
  originDestination: string;
  description: string;
  serviceDescription?: string; // Descrição detalhada do serviço
  value: number;
  details?: string;
  
  // Categorização
  categoryId: string;
  categoryName?: string;
  costCenterId: string;
  costCenterName?: string;
  
  // Pagamento
  paymentMethodId: string;
  paymentMethodName?: string;
  paymentRecurrence: PaymentRecurrence;
  
  // Documento fiscal
  documentType: DocumentType;
  documentNumber?: string;
  documentStatus: DocumentStatus;
  documentAttachment?: string;
  
  // Datas
  paymentDate?: Date;
  dueDate?: Date;
  competenceMonth: number;
  competenceYear: number;
  
  // Status
  isPaid: boolean;
  status: TransactionStatus;
  
  // Natureza e tipo
  nature: TransactionNature;
  revenueType?: RevenueType;
  expenseType?: ExpenseType;
  
  // Vinculação com cliente/contrato
  clientId?: string;
  clientName?: string;
  clientType?: ClientType;
  contractId?: string;
  
  // Cobrança
  collectionSent: boolean;
  collectionHistory: CollectionRecord[];
  
  // Vínculos
  linkedCompanies?: string;
  linkedUsers?: string;
  budgetId?: string;
  hasNoLinks?: boolean;
  responsibleUserId?: string;
  
  // Transferência (quando aplicável)
  transferId?: string; // Liga 2 transações de transferência
  transferAccountId?: string; // Conta de origem/destino
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// ============= REGISTRO DE COBRANÇA =============
export interface CollectionRecord {
  id: string;
  transactionId: string;
  date: Date;
  channel: CollectionChannel;
  userId: string;
  userName?: string;
  notes?: string;
}

// ============= TRANSFERÊNCIA (helper para criar par de transações) =============
export interface TransferRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  destinationCompanyId: string;
  value: number;
  description: string;
  paymentDate?: Date;
  isPaid: boolean;
}

// ============= IMPORTAÇÃO =============
export interface ImportLog {
  id: string;
  date: Date;
  userId: string;
  userName?: string;
  fileName: string;
  entityType: 'TRANSACOES' | 'CONTAS' | 'CATEGORIAS' | 'CENTROS_CUSTO' | 'FONTES';
  totalRecords: number;
  successRecords: number;
  errorRecords: number;
  errors: ImportError[];
  status: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

// ============= DASHBOARD & RELATÓRIOS =============
export interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  receivable: number;
  payable: number;
  recurringPercentage: number;
  pontualPercentage: number;
  fixedExpensePercentage: number;
  variableExpensePercentage: number;
}

export interface AccountCategoryBalance {
  categoryId: string;
  categoryName: string;
  totalBalance: number;
  color?: string;
  accounts: Account[];
}

export interface ClientProfitability {
  clientId: string;
  clientName: string;
  clientType: ClientType;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  margin: number;
  pendingAmount: number;
  overdueAmount: number;
}

export interface AgingReport {
  current: number; // 0-7 days
  week: number; // 8-15 days
  twoWeeks: number; // 16-30 days
  overMonth: number; // 30+ days
  details: AgingDetail[];
}

export interface AgingDetail {
  transactionId: string;
  clientName: string;
  value: number;
  dueDate: Date;
  daysOverdue: number;
  bucket: 'current' | 'week' | 'twoWeeks' | 'overMonth';
}

export interface DREReport {
  period: { start: Date; end: Date };
  grossRevenue: number;
  recurringRevenue: number;
  pontualRevenue: number;
  operationalCosts: number;
  administrativeExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  netResult: number;
  items: DREItem[];
}

export interface DREItem {
  costCenterId: string;
  costCenterName: string;
  dreLabel: string;
  order: number;
  value: number;
  type: 'RECEITA' | 'CUSTO' | 'DESPESA';
}

export interface ContractPerformance {
  contractId: string;
  clientId: string;
  clientName: string;
  minimumWages: number;
  expectedMonthly: number;
  months: ContractMonthStatus[];
}

export interface ContractMonthStatus {
  month: number;
  year: number;
  expected: number;
  realized: number;
  status: 'PAGO' | 'EM_ABERTO' | 'ATRASADO' | 'NAO_VENCIDO';
}

// ============= FILTROS =============
export interface TransactionFilters {
  period?: { start: Date; end: Date };
  competence?: { month: number; year: number };
  companyId?: string;
  clientId?: string;
  accountId?: string;
  accountCategoryId?: string;
  costCenterId?: string;
  categoryId?: string;
  nature?: TransactionNature;
  status?: TransactionStatus;
  revenueType?: RevenueType;
  expenseType?: ExpenseType;
  documentType?: DocumentType;
  search?: string;
  showTransfers?: boolean;
}

// ============= EXTRATO =============
export interface AccountStatement {
  accountId: string;
  accountName: string;
  categoryName: string;
  openingBalance: number;
  closingBalance: number;
  transactions: Transaction[];
  period: { start: Date; end: Date };
}

// ============= LEGACY TYPES (para compatibilidade) =============
export type Category = TransactionCategory;
