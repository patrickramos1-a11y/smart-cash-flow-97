import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface ImportedRow {
  tipoLancamento: string;
  conta: string;
  categoria: string;
  valor: number;
  centroCusto: string;
  pago: boolean;
  dataPagamento: Date | null;
  empresa: string;
}

export interface ParsedData {
  rows: ImportedRow[];
  accounts: Set<string>;
  categories: Map<string, { movimento: 'ENTRADA' | 'SAIDA'; natureza: 'FIXA' | 'VARIAVEL' | 'IMPOSTO' }>;
  costCenters: Set<string>;
  clients: Set<string>;
  years: Set<number>;
  summary: {
    totalRows: number;
    totalAccounts: number;
    totalCategories: number;
    totalCostCenters: number;
    totalClients: number;
  };
}

export interface AnalysisResult {
  newItems: {
    accounts: string[];
    categories: string[];
    costCenters: string[];
    clients: string[];
    transactions: ImportedRow[];
  };
  duplicates: {
    accounts: string[];
    categories: string[];
    costCenters: string[];
    clients: string[];
    transactions: ImportedRow[];
  };
  conflicts: {
    accounts: { name: string; reason: string }[];
    categories: { name: string; reason: string }[];
    costCenters: { name: string; reason: string }[];
    clients: { name: string; reason: string }[];
    transactions: { row: ImportedRow; reason: string }[];
  };
}

// Normalize text for comparison
const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Parse value string to number
const parseValue = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value)
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// Parse date string (MM/DD/YY format from Excel)
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  return new Date(year, month - 1, day);
};

// Map tipo lancamento to transaction type
const mapTipoLancamento = (tipo: string): { movimento: 'ENTRADA' | 'SAIDA'; natureza: 'FIXA' | 'VARIAVEL' | 'IMPOSTO' } => {
  const normalized = normalizeText(tipo);
  if (normalized.includes('RECEBIMENTO') || normalized.includes('RECEITA')) {
    return { movimento: 'ENTRADA', natureza: 'VARIAVEL' };
  }
  if (normalized.includes('IMPOSTO')) {
    return { movimento: 'SAIDA', natureza: 'IMPOSTO' };
  }
  if (normalized.includes('FIXA') || normalized.includes('FIXO')) {
    return { movimento: 'SAIDA', natureza: 'FIXA' };
  }
  return { movimento: 'SAIDA', natureza: 'VARIAVEL' };
};

export function useSmartImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Parse XLSX file from ArrayBuffer
  const parseXlsxFile = useCallback((buffer: ArrayBuffer): ParsedData => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    const rows: ImportedRow[] = [];
    const accounts = new Set<string>();
    const categories = new Map<string, { movimento: 'ENTRADA' | 'SAIDA'; natureza: 'FIXA' | 'VARIAVEL' | 'IMPOSTO' }>();
    const costCenters = new Set<string>();
    const clients = new Set<string>();
    const years = new Set<number>();

    // Find header row and column indices
    let headerRowIndex = 0;
    const headerMap: Record<string, number> = {};
    
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.some(cell => 
        String(cell || '').toLowerCase().includes('tipo') ||
        String(cell || '').toLowerCase().includes('categoria')
      )) {
        headerRowIndex = i;
        row.forEach((cell, idx) => {
          const normalized = normalizeText(String(cell || ''));
          if (normalized.includes('TIPO') && normalized.includes('LANCAMENTO')) headerMap['tipo'] = idx;
          else if (normalized === 'CONTA') headerMap['conta'] = idx;
          else if (normalized === 'CATEGORIA') headerMap['categoria'] = idx;
          else if (normalized === 'VALOR') headerMap['valor'] = idx;
          else if (normalized.includes('CENTRO') && normalized.includes('CUSTO')) headerMap['centroCusto'] = idx;
          else if (normalized === 'PAGO' || normalized.includes('PAGO')) headerMap['pago'] = idx;
          else if (normalized.includes('DATA') && normalized.includes('PAGAMENTO')) headerMap['data'] = idx;
          else if (normalized.includes('EMPRESA') || normalized.includes('ATRELADA')) headerMap['empresa'] = idx;
        });
        break;
      }
    }

    // Default column positions if headers not found
    const colTipo = headerMap['tipo'] ?? 0;
    const colConta = headerMap['conta'] ?? 1;
    const colCategoria = headerMap['categoria'] ?? 2;
    const colValor = headerMap['valor'] ?? 3;
    const colCentroCusto = headerMap['centroCusto'] ?? 4;
    const colPago = headerMap['pago'] ?? 5;
    const colData = headerMap['data'] ?? 6;
    const colEmpresa = headerMap['empresa'] ?? 7;

    // Process data rows
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      if (!rowData || rowData.length < 4) continue;

      const tipoLancamento = String(rowData[colTipo] || '');
      const conta = String(rowData[colConta] || '');
      const categoria = String(rowData[colCategoria] || '');
      const valorRaw = rowData[colValor];
      const centroCusto = String(rowData[colCentroCusto] || '');
      const pagoStr = String(rowData[colPago] || '');
      const dataRaw = rowData[colData];
      const empresa = String(rowData[colEmpresa] || '');

      if (!tipoLancamento && !categoria) continue;

      const tipoInfo = mapTipoLancamento(tipoLancamento);
      
      // Handle Excel date serial number or string date
      let date: Date | null = null;
      if (typeof dataRaw === 'number') {
        // Excel serial date
        date = new Date((dataRaw - 25569) * 86400 * 1000);
      } else if (dataRaw) {
        date = parseDate(String(dataRaw));
      }
      
      if (date) {
        years.add(date.getFullYear());
      }

      const row: ImportedRow = {
        tipoLancamento,
        conta,
        categoria,
        valor: parseValue(valorRaw),
        centroCusto,
        pago: pagoStr?.toUpperCase() === 'SIM',
        dataPagamento: date,
        empresa: empresa && empresa !== 'undefined' ? empresa : ''
      };

      rows.push(row);
      
      if (conta) accounts.add(conta);
      if (categoria) categories.set(categoria, tipoInfo);
      if (centroCusto) costCenters.add(centroCusto);
      if (empresa && empresa !== 'undefined') clients.add(empresa);
    }

    return {
      rows,
      accounts,
      categories,
      costCenters,
      clients,
      years,
      summary: {
        totalRows: rows.length,
        totalAccounts: accounts.size,
        totalCategories: categories.size,
        totalCostCenters: costCenters.size,
        totalClients: clients.size
      }
    };
  }, []);

  // Parse file content (markdown table from document parser)
  const parseFileContent = useCallback((content: string): ParsedData => {
    const lines = content.split('\n').filter(line => line.startsWith('|') && !line.includes('|-'));
    
    const rows: ImportedRow[] = [];
    const accounts = new Set<string>();
    const categories = new Map<string, { movimento: 'ENTRADA' | 'SAIDA'; natureza: 'FIXA' | 'VARIAVEL' | 'IMPOSTO' }>();
    const costCenters = new Set<string>();
    const clients = new Set<string>();
    const years = new Set<number>();

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 8) continue;

      const [tipoLancamento, conta, categoria, valorStr, centroCusto, pagoStr, dataStr, empresa] = cells;
      
      // Skip header row (check if first cell is a header)
      if (tipoLancamento === 'Tipo de Lançamento') continue;

      const tipoInfo = mapTipoLancamento(tipoLancamento);
      const date = parseDate(dataStr);
      
      if (date) {
        years.add(date.getFullYear());
      }

      const row: ImportedRow = {
        tipoLancamento,
        conta,
        categoria,
        valor: parseValue(valorStr),
        centroCusto,
        pago: pagoStr?.toUpperCase() === 'SIM',
        dataPagamento: date,
        empresa: empresa && empresa !== 'undefined' ? empresa : ''
      };

      rows.push(row);
      
      if (conta) accounts.add(conta);
      if (categoria) categories.set(categoria, tipoInfo);
      if (centroCusto) costCenters.add(centroCusto);
      if (empresa && empresa !== 'undefined') clients.add(empresa);
    }

    return {
      rows,
      accounts,
      categories,
      costCenters,
      clients,
      years,
      summary: {
        totalRows: rows.length,
        totalAccounts: accounts.size,
        totalCategories: categories.size,
        totalCostCenters: costCenters.size,
        totalClients: clients.size
      }
    };
  }, []);

  // Analyze data for duplicates and conflicts
  const analyzeData = useCallback(async (data: ParsedData, selectedYears: number[]): Promise<AnalysisResult> => {
    setIsLoading(true);
    
    try {
      // Fetch existing data from database
      const [
        { data: existingAccounts },
        { data: existingCategories },
        { data: existingCostCenters },
        { data: existingClients },
        { data: existingTransactions }
      ] = await Promise.all([
        supabase.from('accounts').select('name'),
        supabase.from('transaction_categories').select('name, cost_center_id'),
        supabase.from('cost_centers').select('name'),
        supabase.from('recurring_clients').select('name'),
        supabase.from('transactions').select('*')
      ]);

      const existingAccountNames = new Set((existingAccounts || []).map(a => normalizeText(a.name)));
      const existingCategoryNames = new Set((existingCategories || []).map(c => normalizeText(c.name)));
      const existingCostCenterNames = new Set((existingCostCenters || []).map(c => normalizeText(c.name)));
      const existingClientNames = new Set((existingClients || []).map(c => normalizeText(c.name)));

      // Filter rows by selected years
      const filteredRows = data.rows.filter(row => {
        if (!row.dataPagamento) return false;
        return selectedYears.includes(row.dataPagamento.getFullYear());
      });

      // Categorize accounts
      const newAccounts: string[] = [];
      const duplicateAccounts: string[] = [];
      data.accounts.forEach(acc => {
        if (existingAccountNames.has(normalizeText(acc))) {
          duplicateAccounts.push(acc);
        } else {
          newAccounts.push(acc);
        }
      });

      // Categorize cost centers
      const newCostCenters: string[] = [];
      const duplicateCostCenters: string[] = [];
      data.costCenters.forEach(cc => {
        if (existingCostCenterNames.has(normalizeText(cc))) {
          duplicateCostCenters.push(cc);
        } else {
          newCostCenters.push(cc);
        }
      });

      // Categorize categories
      const newCategories: string[] = [];
      const duplicateCategories: string[] = [];
      data.categories.forEach((_, cat) => {
        if (existingCategoryNames.has(normalizeText(cat))) {
          duplicateCategories.push(cat);
        } else {
          newCategories.push(cat);
        }
      });

      // Categorize clients
      const newClients: string[] = [];
      const duplicateClients: string[] = [];
      data.clients.forEach(client => {
        if (existingClientNames.has(normalizeText(client))) {
          duplicateClients.push(client);
        } else {
          newClients.push(client);
        }
      });

      // For transactions, we'll mark all filtered as new for now
      // Real deduplication would require more complex matching
      const newTransactions = filteredRows;
      const duplicateTransactions: ImportedRow[] = [];
      const conflictTransactions: { row: ImportedRow; reason: string }[] = [];

      return {
        newItems: {
          accounts: newAccounts,
          categories: newCategories,
          costCenters: newCostCenters,
          clients: newClients,
          transactions: newTransactions
        },
        duplicates: {
          accounts: duplicateAccounts,
          categories: duplicateCategories,
          costCenters: duplicateCostCenters,
          clients: duplicateClients,
          transactions: duplicateTransactions
        },
        conflicts: {
          accounts: [],
          categories: [],
          costCenters: [],
          clients: [],
          transactions: conflictTransactions
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset all data in database
  const resetDatabase = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Delete in correct order due to foreign key constraints
      const tables = [
        'transaction_history',
        'transactions',
        'recurring_installments',
        'recurring_contracts',
        'recurring_clients',
        'fixed_expenses',
        'account_transfers',
        'transaction_categories',
        'cost_centers',
        'accounts',
        'account_categories',
        'payment_methods',
        'minimum_wage_config',
        'contract_plans',
        'financial_companies'
      ];

      for (const table of tables) {
        const { error } = await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          // Continue with other tables even if one fails
        }
      }

      toast.success('Base de dados zerada com sucesso');
      return true;
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Erro ao zerar base de dados');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute import
  const executeImport = useCallback(async (
    data: ParsedData,
    analysis: AnalysisResult,
    selectedYears: number[]
  ): Promise<{ success: boolean; stats: Record<string, number> }> => {
    setIsLoading(true);
    const stats = {
      costCenters: 0,
      accounts: 0,
      categories: 0,
      clients: 0,
      transactions: 0,
      errors: 0
    };

    try {
      // 1. Create default company if not exists
      let companyId: string;
      const { data: existingCompany } = await supabase
        .from('financial_companies')
        .select('id')
        .eq('name', 'RAMOS')
        .single();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error } = await supabase
          .from('financial_companies')
          .insert({ name: 'RAMOS', active: true })
          .select('id')
          .single();
        
        if (error) throw error;
        companyId = newCompany.id;
      }

      // 2. Create cost centers
      const costCenterMap = new Map<string, string>();
      for (const ccName of analysis.newItems.costCenters) {
        const dreGroup = ccName.toLowerCase().includes('receita') ? 'Receitas' : 
                         ccName.toLowerCase().includes('imposto') ? 'Impostos' :
                         ccName.toLowerCase().includes('custo') ? 'Custos' : 'Despesas';
        
        const { data: cc, error } = await supabase
          .from('cost_centers')
          .insert({
            name: ccName,
            company_id: companyId,
            dre_group: dreGroup,
            dre_label: ccName,
            dre_order: stats.costCenters + 1,
            is_expense: !ccName.toLowerCase().includes('receita')
          })
          .select('id')
          .single();

        if (!error && cc) {
          costCenterMap.set(normalizeText(ccName), cc.id);
          stats.costCenters++;
        } else {
          stats.errors++;
        }
      }

      // Get existing cost centers
      const { data: existingCCs } = await supabase.from('cost_centers').select('id, name');
      (existingCCs || []).forEach(cc => {
        costCenterMap.set(normalizeText(cc.name), cc.id);
      });

      // 3. Create account category first
      let accountCategoryId: string;
      const { data: existingAccCat } = await supabase
        .from('account_categories')
        .select('id')
        .eq('name', 'Bancária')
        .single();

      if (existingAccCat) {
        accountCategoryId = existingAccCat.id;
      } else {
        const { data: newAccCat, error } = await supabase
          .from('account_categories')
          .insert({ name: 'Bancária', company_id: companyId, color: '#3B82F6' })
          .select('id')
          .single();
        
        if (error) throw error;
        accountCategoryId = newAccCat.id;
      }

      // 4. Create accounts
      const accountMap = new Map<string, string>();
      for (const accName of analysis.newItems.accounts) {
        const { data: acc, error } = await supabase
          .from('accounts')
          .insert({
            name: accName,
            company_id: companyId,
            category_id: accountCategoryId,
            initial_balance: 0,
            current_balance: 0
          })
          .select('id')
          .single();

        if (!error && acc) {
          accountMap.set(normalizeText(accName), acc.id);
          stats.accounts++;
        } else {
          stats.errors++;
        }
      }

      // Get existing accounts
      const { data: existingAccounts } = await supabase.from('accounts').select('id, name');
      (existingAccounts || []).forEach(acc => {
        accountMap.set(normalizeText(acc.name), acc.id);
      });

      // 5. Create transaction categories
      const categoryMap = new Map<string, string>();
      for (const catName of analysis.newItems.categories) {
        const catInfo = data.categories.get(catName);
        const defaultCostCenter = Array.from(data.rows)
          .find(r => r.categoria === catName)?.centroCusto;
        
        const costCenterId = costCenterMap.get(normalizeText(defaultCostCenter || '')) ||
                            costCenterMap.values().next().value;

        if (!costCenterId) {
          stats.errors++;
          continue;
        }

        const { data: cat, error } = await supabase
          .from('transaction_categories')
          .insert({
            name: catName,
            company_id: companyId,
            cost_center_id: costCenterId,
            type: catInfo?.movimento || 'SAIDA',
            expense_type: catInfo?.natureza || 'VARIAVEL'
          })
          .select('id')
          .single();

        if (!error && cat) {
          categoryMap.set(normalizeText(catName), cat.id);
          stats.categories++;
        } else {
          stats.errors++;
        }
      }

      // Get existing categories
      const { data: existingCats } = await supabase.from('transaction_categories').select('id, name');
      (existingCats || []).forEach(cat => {
        categoryMap.set(normalizeText(cat.name), cat.id);
      });

      // 6. Create clients
      const clientMap = new Map<string, string>();
      for (const clientName of analysis.newItems.clients) {
        const { data: client, error } = await supabase
          .from('recurring_clients')
          .insert({ name: clientName, active: true })
          .select('id')
          .single();

        if (!error && client) {
          clientMap.set(normalizeText(clientName), client.id);
          stats.clients++;
        } else {
          stats.errors++;
        }
      }

      // Get existing clients
      const { data: existingClients } = await supabase.from('recurring_clients').select('id, name');
      (existingClients || []).forEach(client => {
        clientMap.set(normalizeText(client.name), client.id);
      });

      // 7. Create transactions
      for (const row of analysis.newItems.transactions) {
        if (!row.dataPagamento) continue;

        const tipoInfo = mapTipoLancamento(row.tipoLancamento);
        const accountId = accountMap.get(normalizeText(row.conta));
        const categoryId = categoryMap.get(normalizeText(row.categoria));
        const clientId = row.empresa ? clientMap.get(normalizeText(row.empresa)) : null;
        const costCenterId = costCenterMap.get(normalizeText(row.centroCusto));

        const { error } = await supabase.from('transactions').insert({
          tipo_movimento: tipoInfo.movimento,
          natureza: tipoInfo.natureza === 'FIXA' ? 'RECORRENTE' : 'AVULSA',
          origem: 'IMPORTACAO',
          conta_id: accountId || null,
          account_id: accountId || null,
          transaction_category_id: categoryId || null,
          cliente_id: clientId,
          cost_center_id: costCenterId || null,
          competencia_mes: row.dataPagamento.getMonth() + 1,
          competencia_ano: row.dataPagamento.getFullYear(),
          valor: row.valor,
          valor_pago: row.pago ? row.valor : null,
          data_vencimento: row.dataPagamento.toISOString().split('T')[0],
          data_pagamento: row.pago ? row.dataPagamento.toISOString().split('T')[0] : null,
          status: row.pago ? 'PAGO' : 'EM_ABERTO',
          descricao: `${row.categoria} - ${row.empresa || 'Sem cliente'}`
        });

        if (!error) {
          stats.transactions++;
        } else {
          console.error('Transaction error:', error);
          stats.errors++;
        }
      }

      toast.success(`Importação concluída! ${stats.transactions} transações importadas.`);
      return { success: true, stats };
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante importação');
      return { success: false, stats };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    parsedData,
    setParsedData,
    analysisResult,
    setAnalysisResult,
    parseFileContent,
    parseXlsxFile,
    analyzeData,
    resetDatabase,
    executeImport
  };
}
