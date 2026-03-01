import {
  Landmark, Wallet, CreditCard, PiggyBank, TrendingUp, Shield, Banknote,
  Building2, Factory, Briefcase,
  TreePine, Leaf, Recycle, Bug,
  Monitor, Server, Globe, Lock, Mail, Cpu, Code, Database, Cloud, Wifi,
  Users, UserCheck, Heart, Gift, Calendar, Clock,
  FileText, Calculator, Scale, Receipt,
  Droplets, Zap, Home, Key,
  Truck, Fuel, Car, MapPin, Compass,
  Wrench, Hammer, Fan, Flower2, Sparkles, Trash2,
  Megaphone, Eye, Palette, Award,
  CircleDollarSign, ArrowLeftRight, ArrowUpDown, Send, Download,
  ShoppingCart, Package, Scissors, Printer, PenTool,
  Target, BarChart3, PieChart, LineChart,
  Tag, Tags, FolderOpen, Layers, Grid3X3,
  DollarSign, Coins, BadgeDollarSign, HandCoins,
  type LucideIcon,
} from 'lucide-react';

// Maps keywords to icons for smart matching
const ICON_KEYWORDS: [string[], LucideIcon][] = [
  // Revenue / Income
  [['acompanhamento', 'ambiental', 'monitoramento'], Leaf],
  [['serviço', 'servico', 'serviços', 'servicos'], Briefcase],
  [['terceirização', 'terceirizacao'], Users],
  [['receita sisramos', 'sisramos'], Code],
  [['outras receitas'], CircleDollarSign],
  [['venda'], ShoppingCart],

  // Technology
  [['saas', 'assinatura'], Cloud],
  [['inteligência artificial', 'ia', 'ferramentas de ia'], Cpu],
  [['hospedagem', 'servidor'], Server],
  [['licença', 'software'], Monitor],
  [['desenvolvimento'], Code],
  [['manutenção de ti', 'ti'], Database],
  [['segurança digital', 'seguranca'], Lock],
  [['domínio', 'dominio', 'e-mail corporativo', 'email corporativo'], Mail],

  // Personnel
  [['folha de pagamento', 'salário', 'salario'], Users],
  [['pró-labore', 'pro-labore', 'prolabore'], UserCheck],
  [['benefício', 'beneficio', 'benefícios'], Heart],
  [['bonificação', 'bonificacao', 'bonificações'], Gift],
  [['férias', 'ferias'], Calendar],
  [['hora extra', 'horas extras'], Clock],

  // Admin
  [['contabilidade'], Calculator],
  [['internet'], Wifi],
  [['água', 'agua'], Droplets],
  [['energia', 'elétrica', 'eletrica'], Zap],
  [['aluguel'], Home],
  [['material de escritório', 'material de escritorio', 'papelaria'], PenTool],
  [['gráfica', 'grafica', 'impressão', 'impressao'], Printer],
  [['serviços prestados pf'], FileText],

  // Logistics
  [['combustível', 'combustivel', 'gasolina', 'diesel'], Fuel],
  [['frete'], Truck],
  [['estacionamento'], MapPin],
  [['ipva'], Car],
  [['manutenção veicular', 'manutencao veicular'], Car],

  // Maintenance
  [['manutenção predial', 'manutencao predial'], Home],
  [['manutenção elétrica', 'manutencao eletrica'], Zap],
  [['manutenção hidráulica', 'manutencao hidraulica'], Droplets],
  [['manutenção de equipamento', 'manutencao de equipamento'], Wrench],
  [['ar condicionado'], Fan],
  [['jardinagem'], Flower2],
  [['limpeza'], Sparkles],
  [['descartáveis', 'descartaveis'], Package],

  // Commercial
  [['marketing'], Megaphone],
  [['evento', 'feira'], Award],
  [['identidade visual'], Palette],
  [['brinde'], Gift],

  // Taxes
  [['inss'], Scale],
  [['fgts'], Shield],
  [['imposto', 'impostos'], Receipt],
  [['alvará', 'alvara'], FileText],
  [['anuidade', 'conselho'], Award],

  // Investment
  [['compra de equipamento'], Package],
  [['compra de computador', 'peças de computador'], Monitor],
  [['compra de ferramenta'], Hammer],
  [['compra de mobiliário', 'mobiliario'], Grid3X3],
  [['aquisição de veículo', 'aquisicao de veiculo'], Car],
  [['investimento financeiro'], TrendingUp],
  [['aporte estratégico', 'aporte estrategico'], Shield],

  // Patrimonial movements
  [['transferência', 'transferencia'], ArrowLeftRight],
  [['distribuição de lucro', 'distribuicao'], Send],
  [['aporte para investimento'], Download],

  // Accounts
  [['banco inter', 'conta corrente', 'bancária', 'bancaria'], Landmark],
  [['caixa'], Banknote],
  [['cartão', 'cartao'], CreditCard],
  [['aplicação', 'aplicacao', 'investimento'], TrendingUp],
  [['reserva'], PiggyBank],

  // Cost centers
  [['receita bruta'], CircleDollarSign],
  [['dedução', 'deducao', 'deduções'], Receipt],
  [['custos operacionais'], Factory],
  [['despesas pessoais', 'pessoal'], Users],
  [['despesas administrativas', 'administrativ'], Building2],
  [['despesas comerciais', 'comercial'], Megaphone],
  [['logística', 'logistica'], Truck],
  [['manutenção e infraestrutura', 'manutenção'], Wrench],
  [['despesas financeiras', 'financeira'], DollarSign],
  [['infraestrutura tecnológica', 'tecnologia', 'tecnológica'], Server],
  [['investimentos e ativos'], TrendingUp],
  [['movimentações patrimoniais', 'patrimonial'], ArrowLeftRight],

  // Payment methods
  [['pix'], Zap],
  [['boleto'], FileText],
  [['cartão de crédito', 'crédito', 'credito'], CreditCard],
  [['cartão de débito', 'débito', 'debito'], CreditCard],
  [['dinheiro', 'espécie', 'especie'], Banknote],
  [['cheque'], Receipt],
  [['ted', 'doc'], Send],

  // Plans
  [['básico', 'basico'], Tag],
  [['vip', 'premium', 'master'], Award],
  [['plano'], Tags],
];

export function getEntityIcon(name: string): LucideIcon {
  const lower = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nameNorm = name.toLowerCase();
  
  for (const [keywords, icon] of ICON_KEYWORDS) {
    for (const kw of keywords) {
      if (nameNorm.includes(kw) || lower.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
        return icon;
      }
    }
  }
  
  return Tag; // fallback
}

// Default colors for entities that don't have a color field
export const ENTITY_COLORS: Record<string, string> = {
  // Cost center colors by code
  'RECEITA': '#10b981',
  'DEDUCAO': '#f59e0b',
  'CUSTO': '#ef4444',
  'DESPESA_PESSOAL': '#8b5cf6',
  'DESPESA_ADM': '#3b82f6',
  'DESPESA_COMERCIAL': '#ec4899',
  'DESPESA_LOGISTICA': '#f97316',
  'DESPESA_MANUT': '#64748b',
  'DESPESA_FIN': '#dc2626',
  'TECNOLOGIA': '#06b6d4',
  'INV_ATIVOS': '#a855f7',
  'MOV_PATR': '#78716c',
  
  // Payment method colors
  'PIX': '#32bcad',
  'BOLETO': '#6366f1',
  'CARTÃO': '#ec4899',
  'DINHEIRO': '#22c55e',
  'TED': '#3b82f6',
  'DOC': '#0ea5e9',
  'CHEQUE': '#f59e0b',
  
  // Company default
  'DEFAULT': '#6366f1',
};

export function getEntityColor(name: string, code?: string | null, fallbackColor?: string | null): string {
  if (fallbackColor) return fallbackColor;
  if (code && ENTITY_COLORS[code]) return ENTITY_COLORS[code];
  
  const upper = name.toUpperCase();
  for (const [key, color] of Object.entries(ENTITY_COLORS)) {
    if (upper.includes(key)) return color;
  }
  
  return ENTITY_COLORS.DEFAULT;
}
