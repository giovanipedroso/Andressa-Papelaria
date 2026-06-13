export type ProductionStatus =
  | "Aguardando Início"
  | "Em Produção"
  | "Montagem e Acabamento"
  | "Concluído"
  | "Entregue";

export interface StockItem {
  id: string;
  name: string;
  category: "Papel" | "Fita" | "Cola" | "Impressão" | "Embalagem" | "Outros";
  quantity: number;
  unit: string; // e.g., "folhas", "metros", "rolos", "unidades"
  minQuantity: number;
  unitCost: number;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  notes?: string;
}

export interface Order {
  id: string; // e.g., PED-1001
  customerId: string;
  customerName: string;
  productType: string;
  details: string; // detailed specification (theme, colors, size)
  quantity: number;
  totalPrice: number;
  paidAmount: number; // to calculate outstanding balance
  status: ProductionStatus;
  orderDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  notes?: string;
  trackingHistory: {
    status: ProductionStatus;
    changedAt: string;
    note?: string;
  }[];
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quote {
  id: string; // e.g., ORC-2001
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: QuoteItem[];
  discount: number;
  total: number;
  status: "Pendente" | "Aprovado" | "Rejeitado";
  createdAt: string;
  expiryDate: string;
  notes?: string;
}

export interface FinanceEntry {
  id: string;
  type: "receita" | "despesa";
  category: string; // e.g., "Venda de Pedido", "Material de Estoque", "Tintas", "Luz/Internet", "Outros"
  amount: number;
  date: string;
  description: string;
  relatedId?: string; // PED-xxxx or STK-xxxx
}

export interface AppSchema {
  stock: StockItem[];
  customers: Customer[];
  orders: Order[];
  quotes: Quote[];
  finance: FinanceEntry[];
  productLines?: string[];
  _supabaseStatus?: {
    provider: "supabase" | "local";
    configured: boolean;
    error: string | null;
    credentialsDemo: {
      SUPABASE_URL: boolean;
      SUPABASE_KEY: boolean;
    };
  };
}
