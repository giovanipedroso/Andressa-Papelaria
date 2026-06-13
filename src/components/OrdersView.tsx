import React, { useState } from "react";
import { Order, Customer, StockItem, ProductionStatus } from "../types";
import { ShoppingBag, Plus, Search, Calendar, Landmark, CheckCircle, Clock, Trash2, Edit2, ChevronDown, Check, Activity, AlertCircle } from "lucide-react";

interface OrdersViewProps {
  orders: Order[];
  customers: Customer[];
  stock: StockItem[];
  productLines: string[];
  onAddProductLine: (line: string) => void;
  onDeleteProductLine: (line: string) => void;
  onAddOrder: (order: Omit<Order, "id" | "orderDate" | "trackingHistory">) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
}

export default function OrdersView({
  orders,
  customers,
  stock,
  productLines,
  onAddProductLine,
  onDeleteProductLine,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
}: OrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("Todos");
  const [isAdding, setIsAdding] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form states for adding order
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productType, setProductType] = useState<string>(productLines?.[0] || "Caixinha");
  const [details, setDetails] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  // States for tracking status dialog
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [newSelectedStatus, setNewSelectedStatus] = useState<ProductionStatus>("Aguardando Início");

  // State to manage dynamic product lines editor drawer/card
  const [isManagingLines, setIsManagingLines] = useState(false);
  const [newProductLine, setNewProductLine] = useState("");

  const statuses: ProductionStatus[] = [
    "Aguardando Início",
    "Em Produção",
    "Montagem e Acabamento",
    "Concluído",
    "Entregue",
  ];

  const productTypes = productLines || ["Caixinha", "Etiqueta", "Cardápio", "Kit Completo", "Outro"];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
    const matchesType = productTypeFilter === "Todos" || o.productType === productTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getActiveCount = () => {
    return orders.filter((o) => o.status !== "Entregue" && o.status !== "Concluído").length;
  };

  const getBacklogValue = () => {
    return orders
      .filter((o) => o.status !== "Entregue")
      .reduce((sum, o) => sum + (o.totalPrice - o.paidAmount), 0);
  };

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setProductType(productTypes?.[0] || "Caixinha");
    setDetails("");
    setQuantity(1);
    setTotalPrice(0);
    setPaidAmount(0);
    setDeliveryDate("");
    setNotes("");
    setIsAdding(false);
    setEditingOrder(null);
  };

  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const client = customers.find((c) => c.id === cId);
    if (client) {
      setCustomerName(client.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || quantity <= 0 || totalPrice <= 0) return;

    if (editingOrder) {
      onUpdateOrder({
        ...editingOrder,
        productType,
        details: details.trim(),
        quantity,
        totalPrice,
        paidAmount,
        deliveryDate,
        notes: notes.trim(),
      });
    } else {
      onAddOrder({
        customerId,
        customerName: customerName.trim(),
        productType,
        details: details.trim(),
        quantity,
        totalPrice,
        paidAmount,
        status: "Aguardando Início",
        deliveryDate,
        notes: notes.trim(),
      });
    }
    resetForm();
  };

  const handleStartUpdateStatus = (order: Order) => {
    setUpdatingStatusId(order.id);
    setNewSelectedStatus(order.status);
    setStatusChangeNote("");
  };

  const handleConfirmStatusChange = () => {
    if (!updatingStatusId) return;
    const order = orders.find((o) => o.id === updatingStatusId);
    if (order) {
      const nowStr = new Date().toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const updatedHistory = [
        ...(order.trackingHistory || []),
        {
          status: newSelectedStatus,
          changedAt: nowStr,
          note: statusChangeNote.trim() || undefined,
        },
      ];

      onUpdateOrder({
        ...order,
        status: newSelectedStatus,
        trackingHistory: updatedHistory,
      });
    }
    setUpdatingStatusId(null);
    setStatusChangeNote("");
  };

  // Helper colors for order statuses
  const getStatusStyle = (status: ProductionStatus) => {
    switch (status) {
      case "Aguardando Início":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Em Produção":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Montagem e Acabamento":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Concluído":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Entregue":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pedidos Sob Demanda</span>
            <strong className="text-2xl text-slate-800">{orders.length} cadastrados</strong>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Produção Ativa</span>
            <strong className="text-2xl text-amber-600">{getActiveCount()} em confecção</strong>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Valores a Receber Pix</span>
            <strong className="text-2xl text-emerald-600">R$ {getBacklogValue().toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mural de Pedidos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle prazos de entrega e modifique o status para o cliente acompanhar online.
          </p>
        </div>
        {!isAdding && (
          <button
            id="register-order-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Pedido Sob Medida
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border-2 border-rose-100 p-6 shadow-md transition-all">
          <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-rose-50 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
            {editingOrder ? "Editar Registro de Pedido" : "Registrar Novo Pedido Artesanal"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cliente Vinculado *
                </label>
                {editingOrder ? (
                  <input
                    type="text"
                    disabled
                    value={editingOrder.customerName}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 text-sm focus:outline-none"
                  />
                ) : (
                  <select
                    required
                    value={customerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm h-[42px]"
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Linha de Produto *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManagingLines(true)}
                    className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Gerenciar Linhas
                  </button>
                </div>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm h-[42px]"
                >
                  {productTypes.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Prazo de Entrega Programado *
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Detalhes e Especificação do Tema / Cores *
                </label>
                <input
                  type="text"
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ex: 50 Caixinhas Milk no tema Harry Potter com relevo 3D"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Quantidade Total Itens
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Preço Acordado Fechado (R$) *
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Math.max(0, Number(e.target.value)))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Sinal / Valor Pago (Pix/Dinheiro)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="Ex: 50% de sinal pago"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Saldo devedor restante:{" "}
                  <strong className="text-neutral-700">R$ {Math.max(0, totalPrice - paidAmount).toFixed(2)}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Observações Gerais de Embalagem / Impressoras Usadas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações complementares como materiais consumidos ou fita aplicada."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition duration-150 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition duration-150 cursor-pointer shadow-sm"
              >
                {editingOrder ? "Salvar Alterações" : "Salvar Pedido na Fila"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Advanced Filters Layout */}
      {!isAdding && (
        <div className="flex flex-col xl:flex-row gap-4 items-stretch justify-between">
          <div className="relative max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, cliente ou tema..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 text-sm shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter Status select */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-rose-600 cursor-pointer text-xs"
              >
                <option value="Todos">Todos os status</option>
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Product view category */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
              <span>Linha:</span>
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-rose-600 cursor-pointer text-xs"
              >
                <option value="Todos">Todos os produtos</option>
                {productTypes.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Line Management Access */}
            <button
              onClick={() => setIsManagingLines(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-rose-300 hover:border-rose-400 bg-rose-50/50 rounded-xl text-xs font-bold text-[#A31B32] transition hover:bg-rose-100/50 cursor-pointer"
            >
              ⚙️ Linhas de Produto
            </button>
          </div>
        </div>
      )}

      {/* Dialogue Form for Status Updates */}
      {updatingStatusId && (
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5 shadow-md flex flex-col md:flex-row gap-4 justify-between items-center max-w-xl mx-auto">
          <div className="flex-1 space-y-3">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-500 animate-spin" /> Atualizar Status Pedido {updatingStatusId}
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="new-status-select" className="sr-only">Novo Status</label>
              <select
                id="new-status-select"
                value={newSelectedStatus}
                onChange={(e) => setNewSelectedStatus(e.target.value as ProductionStatus)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={statusChangeNote}
                onChange={(e) => setStatusChangeNote(e.target.value)}
                placeholder="Obs pública: ex: Cortes prontos..."
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 flex-1 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setUpdatingStatusId(null)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="confirm-status-update-btn"
              onClick={handleConfirmStatusChange}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-sm"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Orders Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const balanceLeft = order.totalPrice - order.paidAmount;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Status header & Actions */}
                  <div className="flex justify-between items-center gap-4 mb-4">
                    <span className="text-xs font-mono font-extrabold text-rose-600">
                      {order.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setCustomerId(order.customerId);
                          setCustomerName(order.customerName);
                          setProductType(order.productType);
                          setDetails(order.details);
                          setQuantity(order.quantity);
                          setTotalPrice(order.totalPrice);
                          setPaidAmount(order.paidAmount);
                          setDeliveryDate(order.deliveryDate);
                          setNotes(order.notes || "");
                          setIsAdding(true);
                        }}
                        title="Modificar dados"
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja mesmo arquivar e deletar o pedido ${order.id}?`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        title="Remover"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer details */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 tracking-tight text-sm">
                      {order.customerName}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {order.productType}
                      </span>
                      <span className="text-xs text-slate-400">
                        {order.quantity} un.
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-2">
                      {order.details}
                    </p>
                  </div>

                  {/* Timeline change triggers */}
                  <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status Produção</span>
                      <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartUpdateStatus(order)}
                      className="inline-flex items-center gap-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-500 font-semibold text-xs px-2.5 py-1.5 rounded-xl border border-slate-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Atualizar
                    </button>
                  </div>

                  {/* Print delivery date */}
                  <div className="mt-4 bg-slate-50/50 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-rose-500" /> Entrega Programada:
                    </span>
                    <strong className="text-slate-800">
                      {order.deliveryDate ? new Date(order.deliveryDate + "T00:00:00").toLocaleDateString("pt-BR") : "Não agendado"}
                    </strong>
                  </div>

                  {/* History narrative check */}
                  {order.trackingHistory && order.trackingHistory.length > 0 && (
                    <div className="mt-3.5 space-y-1 bg-rose-50/30 p-2.5 rounded-xl border border-rose-100/40 text-[11px] text-slate-500">
                      <strong className="text-rose-700">Histórico de Passos:</strong>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                        {order.trackingHistory.map((h, idx) => (
                          <div key={idx} className="flex justify-between items-baseline gap-2 border-b border-rose-50/50 pb-0.5 last:border-0">
                            <span className="truncate max-w-[120px]">
                              {h.status} {h.note ? `(${h.note})` : ""}
                            </span>
                            <span className="text-[9px] font-mono shrink-0">{h.changedAt.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <p className="mt-3 text-xs text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-100 italic">
                      Obs: "{order.notes}"
                    </p>
                  )}
                </div>

                {/* Pricing / Payments outstanding balance */}
                <div className="mt-5 pt-4 border-t border-slate-100/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total</span>
                    <strong className="text-sm font-bold text-slate-800 font-mono">
                      R$ {order.totalPrice.toFixed(2)}
                    </strong>
                  </div>

                  <div className="text-right">
                    {balanceLeft === 0 ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2.5 py-1 rounded-full uppercase">
                        Pago Integral
                      </span>
                    ) : (
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Restante</span>
                        <strong className="text-rose-600 font-mono font-bold leading-normal text-xs">
                          R$ {balanceLeft.toFixed(2)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <span className="block font-bold text-slate-700 text-lg">Nenhum pedido na lista</span>
            <p className="text-slate-400 max-w-sm mx-auto text-sm mt-1">
              Use "Novo Pedido Sob Medida" para agendar os prazos de produção de lembrancinhas.
            </p>
          </div>
        )}
      </div>

      {/* Dialogue Form for Managing Product Lines (Categorias) */}
      {isManagingLines && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-rose-50 pb-3">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5 font-serif italic">
                ⚙️ Gerenciar Linhas de Produto
              </h4>
              <button
                onClick={() => {
                  setIsManagingLines(false);
                  setNewProductLine("");
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 hover:bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Cadastre novas linhas ou remova as existentes de sua grade de papelaria artesanal.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = newProductLine.trim();
                if (!name) return;
                onAddProductLine(name);
                setNewProductLine("");
              }}
              className="space-y-2"
            >
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Cadastrar Nova Linha
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newProductLine}
                  onChange={(e) => setNewProductLine(e.target.value)}
                  placeholder="Ex: Topo de Bolo"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 flex-1 focus:outline-none focus:border-rose-300"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition"
                >
                  Cadastrar
                </button>
              </div>
            </form>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Linhas Ativas no Sistema ({productTypes.length})
              </label>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-100/60 p-2.5 rounded-xl bg-slate-50/50">
                {productTypes.map((pt) => {
                  const ordersCount = orders.filter((o) => o.productType === pt).length;

                  return (
                    <div key={pt} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg text-xs hover:border-rose-100/50 transition">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{pt}</span>
                        <span className="text-[9px] text-slate-400">{ordersCount} pedido(s) vinculado(s)</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (ordersCount > 0) {
                            if (!window.confirm(`Você tem certeza? Existem ${ordersCount} pedido(s) vinculados a esta linha de produto.`)) {
                              return;
                            }
                          }
                          onDeleteProductLine(pt);
                        }}
                        className="p-1 px-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition cursor-pointer"
                        title="Deletar da lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsManagingLines(false);
                  setNewProductLine("");
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Fechar Gerenciamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
