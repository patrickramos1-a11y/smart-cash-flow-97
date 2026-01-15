// Enums
export type TransactionNature = 'ENTRADA' | 'SAIDA';
export type RevenueType = 'RECORRENTE' | 'PONTUAL';
export type ExpenseType = 'FIXA' | 'VARIAVEL';
export type TransactionStatus = 'PAGO' | 'EM_ABERTO' | 'ATRASADO';
export type DocumentType = 'NF' | 'RECIBO' | 'NOTA_DEBITO' | 'SEM_DOCUMENTO';
export type DocumentStatus = 'PENDENTE' | 'OK' | 'NAO_APLICA';
export type ClientType = 'RECORRENTE' | 'AVULSO';
export type CollectionChannel = 'WHATSAPP' | 'EMAIL' | 'TELEFONE' | 'OUTRO';

// Client & Contract
export interface Client {
  id: string;
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  document?: string; // CNPJ/CPF
  contracts: Contract[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  clientId: string;
  minimumWages: number; // Quantidade de salários mínimos
  minimumWageReference: number; // Valor do SM de referência
  referenceMonth: number;
  referenceYear: number;
  calculatedMonthlyValue: number;
  startDate: Date;
  endDate?: Date;
  active: boolean;
  notes?: string;
}

// Transaction
export interface Transaction {
  id: string;
  company: string;
  transactionType: string;
  originDestination: string;
  account: string;
  category: string;
  description: string;
  value: number;
  details?: string;
  documentNumber?: string;
  paymentMethod: string;
  costCenter: string;
  isPaid: boolean;
  paymentDate?: Date;
  dueDate?: Date;
  collectionSent: boolean;
  linkedCompanies?: string;
  linkedUsers?: string;
  budget?: string;
  
  // New fields
  clientId?: string;
  clientName?: string;
  clientType?: ClientType;
  contractId?: string;
  competenceMonth?: number;
  competenceYear?: number;
  nature: TransactionNature;
  revenueType?: RevenueType;
  expenseType?: ExpenseType;
  status: TransactionStatus;
  documentType: DocumentType;
  documentStatus: DocumentStatus;
  documentAttachment?: string;
  collectionHistory: CollectionRecord[];
  responsibleUser?: string;
  project?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionRecord {
  id: string;
  date: Date;
  channel: CollectionChannel;
  userId: string;
  notes?: string;
}

// Configuration
export interface Account {
  id: string;
  name: string;
  type: string;
  bank?: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  nature: TransactionNature;
  parent?: string;
  active: boolean;
}

export interface CostCenter {
  id: string;
  name: string;
  code?: string;
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

// Import
export interface ImportLog {
  id: string;
  date: Date;
  userId: string;
  fileName: string;
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

// Dashboard & Reports
export interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  receivable: number;
  payable: number;
  recurringPercentage: number;
  fixedExpensePercentage: number;
}

export interface ClientProfitability {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  margin: number;
}

export interface AgingReport {
  current: number; // 0-7 days
  week: number; // 8-15 days
  twoWeeks: number; // 16-30 days
  overMonth: number; // 30+ days
}

// Filters
export interface TransactionFilters {
  period?: { start: Date; end: Date };
  company?: string;
  clientId?: string;
  account?: string;
  costCenter?: string;
  category?: string;
  nature?: TransactionNature;
  status?: TransactionStatus;
  revenueType?: RevenueType;
  expenseType?: ExpenseType;
  search?: string;
}
