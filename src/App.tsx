import React, { useState, useEffect } from "react";
import { AppSchema, Customer, StockItem, Order, Quote, FinanceEntry, ProductionStatus } from "./types";
import { fetchAppData, saveAppData, login as executeLogin } from "./utils/api";
import TrackingView from "./components/TrackingView";
import StockView from "./components/StockView";
import OrdersView from "./components/OrdersView";
import QuotesView from "./components/QuotesView";
import CustomersView from "./components/CustomersView";
import FinancialView from "./components/FinancialView";
import { 
  ShoppingBag, 
  Archive, 
  FileSpreadsheet, 
  Users, 
  DollarSign, 
  Lock, 
  LogOut, 
  Compass, 
  Heart, 
  RefreshCw, 
  CheckCircle,
  Loader2,
  Calendar,
  Sparkles,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Authentication & session variables
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("andressa_token"));
  const [managerUser, setManagerUser] = useState<string | null>(() => localStorage.getItem("andressa_user"));
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Applet mode: false = client tracking portal, true = manager login view
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Core business database state
  const [data, setData] = useState<AppSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Manager dashboard main tabs
  const [activeTab, setActiveTab] = useState<"pedidos" | "estoque" | "orçamentos" | "clientes" | "financeiro">("pedidos");

  // Supabase help modal toggle
  const [showSupabaseHelp, setShowSupabaseHelp] = useState(false);

  // Fetch full state when valid token is available
  useEffect(() => {
    if (token) {
      loadState();
    }
  }, [token]);

  const loadState = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAppData(token);
      if (!payload.productLines || payload.productLines.length === 0) {
        payload.productLines = ["Caixinha", "Etiqueta", "Cardápio", "Kit Completo", "Outro"];
      }
      setData(payload);
    } catch (err: any) {
      setError("Sessão expirada ou erro ao conectar. Por favor, logue novamente.");
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Synchronize state with background save API
  const syncWithRemote = async (updatedData: AppSchema) => {
    if (!token) return;
    setSyncing(true);
    setSyncStatus("Sincronizando...");
    try {
      await saveAppData(token, updatedData);
      setSyncStatus("Salvo com sucesso!");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      setSyncStatus("Erro de sincronização!");
      alert("Não foi possível salvar as alterações no servidor.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) return;

    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await executeLogin(loginUsername, loginPassword);
      if (response.success && response.token) {
        localStorage.setItem("andressa_token", response.token);
        localStorage.setItem("andressa_user", response.user.name);
        setToken(response.token);
        setManagerUser(response.user.name);
        setIsAdminMode(false); // Switch out of login form to fully authenticated dashboard
        setLoginUsername("");
        setLoginPassword("");
      }
    } catch (err: any) {
      setLoginError(err.message || "Erro ao realizar login.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("andressa_token");
    localStorage.removeItem("andressa_user");
    setToken(null);
    setManagerUser(null);
    setData(null);
    setIsAdminMode(false);
  };

  // --- BUSINESS HANDLERS FOR SYNCS---

  // Customers Management
  const handleAddCustomer = (newCustomer: Omit<Customer, "id" | "createdAt">) => {
    if (!data) return;
    const cid = `CLI-${Date.now()}`;
    const entry: Customer = {
      ...newCustomer,
      id: cid,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = { ...data, customers: [entry, ...data.customers] };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    if (!data) return;
    const filtered = data.customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
    const updated = { ...data, customers: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleDeleteCustomer = (id: string) => {
    if (!data) return;
    const filtered = data.customers.filter((c) => c.id !== id);
    const updated = { ...data, customers: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  // Stock Management
  const handleAddStockItem = (newItem: Omit<StockItem, "id" | "updatedAt">) => {
    if (!data) return;
    const sid = `STK-${Date.now()}`;
    const entry: StockItem = {
      ...newItem,
      id: sid,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    const updated = { ...data, stock: [entry, ...data.stock] };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleUpdateStockItem = (updatedItem: StockItem) => {
    if (!data) return;
    const filtered = data.stock.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    const updated = { ...data, stock: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleDeleteStockItem = (id: string) => {
    if (!data) return;
    const filtered = data.stock.filter((item) => item.id !== id);
    const updated = { ...data, stock: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  // Orders Management & Production tracking
  const handleAddOrder = (newOrder: Omit<Order, "id" | "orderDate" | "trackingHistory">) => {
    if (!data) return;
    const oid = `PED-${1000 + data.orders.length + 1}`;
    const nowStr = new Date().toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const entry: Order = {
      ...newOrder,
      id: oid,
      orderDate: new Date().toISOString().split("T")[0],
      trackingHistory: [
        { status: "Aguardando Início", changedAt: nowStr, note: "Pedido recebido e sinal registrado." }
      ],
    };

    // Add to orders
    const updatedOrders = [entry, ...data.orders];

    // Automatically create a Financial receipts log for signal payments if paidAmount > 0
    let updatedFinance = [...data.finance];
    if (entry.paidAmount > 0) {
      updatedFinance = [
        {
          id: `FIN-${Date.now()}`,
          type: "receita",
          category: "Venda de Pedido",
          amount: entry.paidAmount,
          date: new Date().toISOString().split("T")[0],
          description: `Sinal recebido: ${entry.customerName} - Pedido ${oid}`,
          relatedId: oid,
        },
        ...updatedFinance,
      ];
    }

    const updated = { ...data, orders: updatedOrders, finance: updatedFinance };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    if (!data) return;
    
    // Check if paidAmount changed to log extra receipt
    const previous = data.orders.find((o) => o.id === updatedOrder.id);
    let updatedFinance = [...data.finance];

    if (previous && updatedOrder.paidAmount > previous.paidAmount) {
      const extraPaid = updatedOrder.paidAmount - previous.paidAmount;
      updatedFinance = [
        {
          id: `FIN-${Date.now()}`,
          type: "receita",
          category: "Venda de Pedido",
          amount: extraPaid,
          date: new Date().toISOString().split("T")[0],
          description: `Aporte de pagamento: ${updatedOrder.customerName} - Pedido ${updatedOrder.id}`,
          relatedId: updatedOrder.id,
        },
        ...updatedFinance,
      ];
    }

    const filtered = data.orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    const updated = { ...data, orders: filtered, finance: updatedFinance };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleDeleteOrder = (id: string) => {
    if (!data) return;
    const filtered = data.orders.filter((o) => o.id !== id);
    const updated = { ...data, orders: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  // Quotes Management (Orçamentos)
  const handleAddQuote = (newQuote: Omit<Quote, "id" | "createdAt">) => {
    if (!data) return;
    const qid = `ORC-${2000 + data.quotes.length + 1}`;
    const entry: Quote = {
      ...newQuote,
      id: qid,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updated = { ...data, quotes: [entry, ...data.quotes] };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleUpdateQuote = (updatedQuote: Quote) => {
    if (!data) return;
    const filtered = data.quotes.map((q) => (q.id === updatedQuote.id ? updatedQuote : q));
    const updated = { ...data, quotes: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleDeleteQuote = (id: string) => {
    if (!data) return;
    const filtered = data.quotes.filter((q) => q.id !== id);
    const updated = { ...data, quotes: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  // AUTOMATED QUOTE TO ORDER CONVERSION
  const handleConvertToOrder = (quote: Quote) => {
    if (!data) return;

    // 1. Check/bind client
    let linkedClientId = "";
    const clientMatch = data.customers.find(
      (c) => c.name.toLowerCase().trim() === quote.customerName.toLowerCase().trim()
    );

    let updatedCustomers = [...data.customers];

    if (clientMatch) {
      linkedClientId = clientMatch.id;
    } else {
      // Create new client
      linkedClientId = `CLI-${Date.now()}`;
      const newClientEntry: Customer = {
        id: linkedClientId,
        name: quote.customerName,
        phone: quote.customerPhone || "(xx) xxxxx-xxxx",
        email: quote.customerEmail || "",
        address: "Confirmar endereço de entrega",
        createdAt: new Date().toISOString().split("T")[0],
        notes: `Criado automaticamente do Orçamento ${quote.id}`,
      };
      updatedCustomers = [newClientEntry, ...updatedCustomers];
    }

    // 2. Generate detailed string description
    const compiledDetails = quote.items
      .map((it) => `${it.quantity}x ${it.description} (R$ ${it.unitPrice.toFixed(2)}/un)`)
      .join(", ");

    // Determine default product class category based on item names
    let detectedType: Order["productType"] = "Caixinha";
    const lowercaseDesc = compiledDetails.toLowerCase();
    if (lowercaseDesc.includes("etiqueta") || lowercaseDesc.includes("adesiv")) {
      detectedType = "Etiqueta";
    } else if (lowercaseDesc.includes("cardap") || lowercaseDesc.includes("menu")) {
      detectedType = "Cardápio";
    } else if (quote.items.length > 1) {
      detectedType = "Kit Completo";
    }

    // 3. Create full Order entry
    const newOrderId = `PED-${1000 + data.orders.length + 1}`;
    const nowStr = new Date().toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newOrderEntry: Order = {
      id: newOrderId,
      customerId: linkedClientId,
      customerName: quote.customerName,
      productType: detectedType,
      details: compiledDetails,
      quantity: quote.items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: quote.total,
      paidAmount: 0, // start unpaid, user will mark signal as paid
      status: "Aguardando Início",
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: quote.expiryDate, // placeholder for delivery
      notes: `Convertido de orçamento emitido. Obs original: ${quote.notes || "Não há"}`,
      trackingHistory: [
        { status: "Aguardando Início", changedAt: nowStr, note: `Pedido oficial gerado após aprovação do ${quote.id}.` },
      ],
    };

    // 4. Update parent quote status to approved
    const updatedQuotes = data.quotes.map((q) =>
      q.id === quote.id ? { ...q, status: "Aprovado" as const } : q
    );

    const updated = {
      ...data,
      customers: updatedCustomers,
      orders: [newOrderEntry, ...data.orders],
      quotes: updatedQuotes,
    };

    setData(updated);
    syncWithRemote(updated);
    alert(`Sucesso! Orçamento convertido no pedido ${newOrderId}. Cliente cadastrado.`);
  };

  // Financial Ledger entries
  const handleAddFinanceEntry = (entry: Omit<FinanceEntry, "id">) => {
    if (!data) return;
    const fid = `FIN-${Date.now()}`;
    const newEntry: FinanceEntry = {
      ...entry,
      id: fid,
    };
    const updated = { ...data, finance: [newEntry, ...data.finance] };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleDeleteFinanceEntry = (id: string) => {
    if (!data) return;
    const filtered = data.finance.filter((f) => f.id !== id);
    const updated = { ...data, finance: filtered };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleAddProductLine = (newLineName: string) => {
    if (!data) return;
    const current = data.productLines || ["Caixinha", "Etiqueta", "Cardápio", "Kit Completo", "Outro"];
    const normalized = newLineName.trim();
    if (!normalized) return;
    if (current.map(c => c.toLowerCase()).includes(normalized.toLowerCase())) {
      alert("Esta linha de produto já existe no sistema!");
      return;
    }
    const updated = {
      ...data,
      productLines: [...current, normalized]
    };
    setData(updated);
    syncWithRemote(updated);
  };

  const handleDeleteProductLine = (lineToDelete: string) => {
    if (!data) return;
    const current = data.productLines || ["Caixinha", "Etiqueta", "Cardápio", "Kit Completo", "Outro"];
    const updatedLines = current.filter(li => li !== lineToDelete);
    const updated = {
      ...data,
      productLines: updatedLines
    };
    setData(updated);
    syncWithRemote(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Visual Navigation Top Header Bar */}
      <header className="bg-white border-b border-rose-50 shadow-sm sticky top-0 z-40 print:hidden shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-rose-200">
              A
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-800 font-serif italic tracking-tight leading-none">Andressa</h1>
              <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">Papelaria Criativa</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {data?._supabaseStatus && (
              <button 
                onClick={() => setShowSupabaseHelp(true)}
                className={`text-[10px] md:text-xs font-bold rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border transition-all cursor-pointer leading-none ${
                  data._supabaseStatus.provider === "supabase"
                    ? "bg-rose-50/80 text-rose-700 border-rose-150 hover:bg-rose-100/50"
                    : "bg-amber-50/80 text-amber-700 border-amber-150 hover:bg-amber-100/50"
                }`}
                title={data._supabaseStatus.error || (data._supabaseStatus.provider === "supabase" ? "Conectado ao Supabase com Sincronização em Nuvem Ativa!" : "Usando backup local (Credenciais de banco pendentes). Clique para configurar.")}
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">
                  {data._supabaseStatus.provider === "supabase" ? "Supabase Nuvem" : "Backup Local"}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${data._supabaseStatus.provider === "supabase" ? "bg-rose-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
              </button>
            )}

            {syncStatus && (
              <span className="text-[11px] font-bold text-slate-400 italic bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-rose-500" /> {syncStatus}
              </span>
            )}

            {token ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline-block font-semibold">
                  Olá, <strong>{managerUser}</strong>
                </span>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  title="Sair do Painel"
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Desconectar</span>
                </button>
              </div>
            ) : (
              <button
                id="toggle-admin-btn"
                onClick={() => setIsAdminMode(!isAdminMode)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-50/50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-inner bg-slate-50"
              >
                <Lock className="w-3.5 h-3.5" />
                {isAdminMode ? "Voltar ao Rastreio" : "Painel Gestão"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Core Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20">
        
        {/* LOGGED IN VIEW: Andressa's Management Suite */}
        {token && data ? (
          <div className="space-y-6">
            
            {/* Horizontal Module Selectors */}
            <div className="flex gap-2 items-center overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pt-1 print:hidden">
              <button
                onClick={() => setActiveTab("pedidos")}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                  activeTab === "pedidos"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200 scale-102"
                    : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
                }`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" /> Produção & Pedidos
              </button>

              <button
                onClick={() => setActiveTab("estoque")}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                  activeTab === "estoque"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200 scale-102"
                    : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
                }`}
              >
                <Archive className="w-4 h-4 shrink-0" /> Controle de Estoque
              </button>

              <button
                onClick={() => setActiveTab("orçamentos")}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                  activeTab === "orçamentos"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200 scale-102"
                    : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" /> Orçamentos & Propostas
              </button>

              <button
                onClick={() => setActiveTab("clientes")}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                  activeTab === "clientes"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200 scale-102"
                    : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" /> Clientes Cadastrados
              </button>

              <button
                onClick={() => setActiveTab("financeiro")}
                className={`flex items-center gap-2 px-4.5 py-3 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                  activeTab === "financeiro"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200 scale-102"
                    : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100"
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0" /> Balanços Financeiros
              </button>
            </div>

            {/* Active Content Window Router */}
            <div className="bg-transparent rounded-2xl min-h-[400px]">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
                  <span className="text-sm text-slate-400 font-semibold uppercase">Carregando Banco de Dados...</span>
                </div>
              ) : (
                <>
                  {activeTab === "pedidos" && (
                    <OrdersView
                      orders={data.orders}
                      customers={data.customers}
                      stock={data.stock}
                      productLines={data.productLines || ["Caixinha", "Etiqueta", "Cardápio", "Kit Completo", "Outro"]}
                      onAddProductLine={handleAddProductLine}
                      onDeleteProductLine={handleDeleteProductLine}
                      onAddOrder={handleAddOrder}
                      onUpdateOrder={handleUpdateOrder}
                      onDeleteOrder={handleDeleteOrder}
                    />
                  )}
                  {activeTab === "estoque" && (
                    <StockView
                      stock={data.stock}
                      onAddStockItem={handleAddStockItem}
                      onUpdateStockItem={handleUpdateStockItem}
                      onDeleteStockItem={handleDeleteStockItem}
                    />
                  )}
                  {activeTab === "orçamentos" && (
                    <QuotesView
                      quotes={data.quotes}
                      customers={data.customers}
                      onAddQuote={handleAddQuote}
                      onUpdateQuote={handleUpdateQuote}
                      onDeleteQuote={handleDeleteQuote}
                      onConvertToOrder={handleConvertToOrder}
                    />
                  )}
                  {activeTab === "clientes" && (
                    <CustomersView
                      customers={data.customers}
                      orders={data.orders}
                      onAddCustomer={handleAddCustomer}
                      onUpdateCustomer={handleUpdateCustomer}
                      onDeleteCustomer={handleDeleteCustomer}
                    />
                  )}
                  {activeTab === "financeiro" && (
                    <FinancialView
                      finance={data.finance}
                      onAddFinanceEntry={handleAddFinanceEntry}
                      onDeleteFinanceEntry={handleDeleteFinanceEntry}
                    />
                  )}
                </>
              )}
            </div>

          </div>
        ) : isAdminMode ? (
          
          /* AUTHENTICATION LOGIN FORM COMPONENT */
          <div className="max-w-md mx-auto py-12" id="login-form-container">
            <div className="bg-white rounded-3xl border border-slate-150 p-8 shadow-lg">
              <div className="text-center mb-6">
                <span className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold mx-auto mb-3">
                  <Lock className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-800 font-sans">Acesso à Gestão</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Digite as credenciais da gestora para monitorar estoque e finanças.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-username-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nome de Usuário
                  </label>
                  <input
                    id="login-username-input"
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Usuário"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digitar senha"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 text-sm"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50/70 py-1.5 px-3 rounded-lg border border-rose-100">
                    ⚠️ {loginError}
                  </p>
                )}

                <button
                  id="submit-login-btn"
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl transition duration-150 cursor-pointer shadow-md shadow-rose-250 flex justify-center items-center gap-2"
                >
                  {loginLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Autenticar"
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <button
                  id="go-back-track"
                  onClick={() => setIsAdminMode(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors uppercase tracking-wider"
                >
                  ← Voltar ao Rastreamento Público
                </button>
              </div>
            </div>
          </div>
        ) : (
          
          /* PUBLIC PORTAL: CLIENT TRACKING DASHBOARD */
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-3xl p-6 md:p-8 border border-rose-100 flex flex-col md:flex-row items-center gap-6 justify-between max-w-4xl mx-auto shadow-sm">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-800 font-serif italic tracking-tight">
                  Bem-vindo à Papelaria Artesanal da Andressa!
                </h2>
                <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                  Criamos caixas de aniversário customizadas, etiquetas decorativas impermeáveis e cardápios para casamentos, batizados e eventos corporativos. Digite as informações abaixo para verificar o andamento do seu produto.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-rose-100/50 flex flex-col items-center shrink-0 w-full md:w-auto shadow-inner">
                <Heart className="w-8 h-8 text-rose-500 animate-pulse fill-rose-150 mb-1" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Artesanal</span>
                <span className="text-xs font-bold text-slate-700">100% Feito à Mão</span>
              </div>
            </div>

            <TrackingView onBackToLogin={() => setIsAdminMode(true)} />

            {/* Seção Conheça Nossos Produtos */}
            <div className="mt-12 space-y-6 max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-rose-600 bg-rose-150 rounded-full px-3 py-1">Catálogo Exclusivo</span>
                <h3 className="text-2xl font-bold text-slate-800 font-serif italic">Conheça nossos produtos</h3>
                <p className="text-sm text-slate-500 max-w-lg mx-auto">
                  Encante seus convidados com cada detalhe fofo e sofisticado, feito com amor sob medida.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Produto 1 */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/3] bg-rose-50 overflow-hidden relative">
                      <img
                        src="/src/assets/images/caixas_personalizadas_1781373290649.jpg"
                        alt="Caixinhas Personalizadas"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 right-2 bg-white/90 text-[9px] text-[#A31B32] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                        Sucesso de Vendas
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-800 font-serif">Caixinhas de Aniversário</h4>
                      <p className="text-xs text-slate-500 leading-relaxed text-wrap">
                        Caixa milk, pirâmide e modelos temáticos com recortes especiais em papel 240g, laços artesanais e apliques tridimensionais (3D).
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-1 border-t border-rose-100/30 flex items-center justify-between">
                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">A partir de R$ 5,50/un</span>
                    <span className="text-xs text-slate-400 font-medium">Modelos 3D</span>
                  </div>
                </div>

                {/* Produto 2 */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/3] bg-rose-50 overflow-hidden relative">
                      <img
                        src="/src/assets/images/etiquetas_adesivas_1781373303936.jpg"
                        alt="Etiquetas Decorativas"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 right-2 bg-white/90 text-[9px] text-[#A31B32] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                        Impermeável
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-800 font-serif">Etiquetas Adesivas</h4>
                      <p className="text-xs text-slate-500 leading-relaxed text-wrap">
                        Rótulos decorativos redondos, stickers holográficos e identificadores escolares em vinil premium super resistente à água e ao tempo.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-1 border-t border-rose-100/30 flex items-center justify-between">
                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">A partir de R$ 0,80/un</span>
                    <span className="text-xs text-slate-400 font-medium">Vinil Premium</span>
                  </div>
                </div>

                {/* Produto 3 */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/3] bg-rose-50 overflow-hidden relative">
                      <img
                        src="/src/assets/images/cardapios_elegantes_1781373316017.jpg"
                        alt="Cardápios Elegantes"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 right-2 bg-white/90 text-[9px] text-[#A31B32] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                        Casamentos & Festas
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-800 font-serif">Cardápios & Menus</h4>
                      <p className="text-xs text-slate-500 leading-relaxed text-wrap">
                        Cardápios individuais em papéis texturizados de alta gramatura, com folhagens aquareladas suaves e acabamentos em cordão rústico ou cera.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-1 border-t border-rose-100/30 flex items-center justify-between">
                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">A partir de R$ 4,50/un</span>
                    <span className="text-xs text-slate-400 font-medium">Papel Nobre</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding credits */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-sans print:hidden shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>&copy; {new Date().getFullYear()} Papelaria Personalizada da Andressa. Todos os direitos reservados.</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
            Plataforma de Gestão de Negócios <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </span>
        </div>
      </footer>

      {/* Help screen explaining the Supabase configuration and credentials */}
      {showSupabaseHelp && data?._supabaseStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-xl w-full max-w-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rose-50 pb-3">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5 font-serif italic">
                <Database className="w-5 h-5 text-rose-500" /> Integração Supabase
              </h4>
              <button
                onClick={() => setShowSupabaseHelp(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 hover:bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-sans">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Status do Banco:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                    data._supabaseStatus.provider === "supabase" 
                      ? "bg-rose-100 text-rose-700" 
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {data._supabaseStatus.provider === "supabase" ? "Conectado à Nuvem (Supabase) ✅" : "Backup Local (database.json) ⚠️"}
                  </span>
                </div>
                
                {data._supabaseStatus.error && (
                  <p className="text-[11px] text-rose-600 italic bg-rose-50/50 p-2 rounded-lg border border-rose-100/40 leading-relaxed">
                    <strong>Alerta:</strong> {data._supabaseStatus.error}
                  </p>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">SUPABASE_URL detectado:</span>
                    <span className="font-semibold">{data._supabaseStatus.credentialsDemo.SUPABASE_URL ? "Sim ✅" : "Não ❌"}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">SUPABASE_KEY detectado:</span>
                    <span className="font-semibold">{data._supabaseStatus.credentialsDemo.SUPABASE_KEY ? "Sim ✅" : "Não ❌"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <h5 className="font-bold text-[#5C1925] font-serif">Como configurar suas credenciais?</h5>
                <p>
                  Para habilitar a sincronização na nuvem com o seu banco de dados <strong>Supabase</strong>, declare as variáveis abaixo no painel de configurações (Variables/Secrets) de seu projeto ou em um arquivo <code>.env</code> local:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] select-all overflow-x-auto space-y-1">
                  <div>SUPABASE_URL="https://seu-projeto-id.supabase.co"</div>
                  <div>SUPABASE_KEY="sua-chave-anon-ou-service-role"</div>
                </div>
                <p className="text-[10px] text-slate-400">
                  * Obtenha as chaves no console Supabase em <strong>Project Settings &gt; API</strong>.
                </p>
              </div>

              <div className="space-y-1.5 pt-1.5">
                <h5 className="font-bold text-[#5C1925] font-serif">Script SQL para criação da tabela</h5>
                <p>
                  No painel do Supabase, acesse o <strong>SQL Editor</strong>, abra uma nova consulta, insira o código SQL a seguir e clique em <strong>Run</strong>:
                </p>
                <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[10px] overflow-x-auto max-h-48 overflow-y-auto select-all leading-normal">
{`-- 1. Cria a tabela de estado do ateliê
create table if not exists public.atelier_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilita acesso de leitura e escrita pública para este registro único (singleton)
alter table public.atelier_state enable row level security;

create policy "Permitir acesso completo a todos"
on public.atelier_state
for all
using (true)
with check (true);
`}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSupabaseHelp(false)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer text-center shadow-sm"
              >
                Voltar à Gestão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
