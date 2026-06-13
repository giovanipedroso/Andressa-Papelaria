import React, { useState } from "react";
import { Quote, QuoteItem, Customer } from "../types";
import { FileSpreadsheet, Plus, Trash2, Search, Printer, CheckCircle, XCircle, ArrowRight, DollarSign, Calendar, FileText } from "lucide-react";

interface QuotesViewProps {
  quotes: Quote[];
  customers: Customer[];
  onAddQuote: (quote: Omit<Quote, "id" | "createdAt">) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onConvertToOrder: (quote: Quote) => void;
}

export default function QuotesView({
  quotes,
  customers,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onConvertToOrder,
}: QuotesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [discount, setDiscount] = useState(0);
  const [expiryDays, setExpiryDays] = useState(15);
  const [notes, setNotes] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unitPrice: 0, subtotal: 0 },
  ]);

  const filteredQuotes = quotes.filter(
    (q) =>
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerPhone.includes(searchTerm) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItemRow = () => {
    setQuoteItems([...quoteItems, { description: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (quoteItems.length === 1) return;
    const newItems = quoteItems.filter((_, i) => i !== index);
    setQuoteItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...quoteItems];
    const item = { ...newItems[index] };

    if (field === "quantity") {
      item.quantity = Math.max(1, Number(value));
    } else if (field === "unitPrice") {
      item.unitPrice = Math.max(0, Number(value));
    } else if (field === "description") {
      item.description = String(value);
    }

    item.subtotal = item.quantity * item.unitPrice;
    newItems[index] = item;
    setQuoteItems(newItems);
  };

  const itemsTotal = quoteItems.reduce((acc, item) => acc + item.subtotal, 0);
  const calculatedTotal = Math.max(0, itemsTotal - discount);

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDiscount(0);
    setExpiryDays(15);
    setNotes("");
    setQuoteItems([{ description: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
    setIsAdding(false);
  };

  // Pre-fill fields if customer matches
  const handleSelectPreExistingCustomer = (cName: string) => {
    setCustomerName(cName);
    const existing = customers.find(c => c.name.toLowerCase() === cName.toLowerCase());
    if (existing) {
      setCustomerPhone(existing.phone);
      setCustomerEmail(existing.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    // Validate rows
    const validItems = quoteItems.filter(item => item.description.trim() !== "");
    if (validItems.length === 0) {
      alert("Por favor, preencha a descrição de pelo menos 1 item.");
      return;
    }

    const expiryDateObj = new Date();
    expiryDateObj.setDate(expiryDateObj.getDate() + expiryDays);
    const expiryDateStr = expiryDateObj.toISOString().split("T")[0];

    onAddQuote({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      items: validItems,
      discount: discount,
      total: calculatedTotal,
      status: "Pendente",
      expiryDate: expiryDateStr,
      notes: notes.trim(),
    });

    resetForm();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Trigger Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans">Orçamentos & Previsões</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gere orçamentos personalizados de caixinhas para festas, converta-os em pedidos com um clique.
          </p>
        </div>
        {!isAdding && !viewingQuote && (
          <button
            id="register-quote-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Orçamento
          </button>
        )}
      </div>

      {/* Quote creation form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border-2 border-rose-100 p-6 shadow-md transition-all print:hidden">
          <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-rose-50 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-rose-500" />
            Cadastrar Novo Orçamento
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  list="pre-existing-clients"
                  value={customerName}
                  onChange={(e) => handleSelectPreExistingCustomer(e.target.value)}
                  placeholder="Nome do cliente (ou selecione na lista)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 placeholder:text-slate-400 text-sm"
                />
                <datalist id="pre-existing-clients">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  WhatsApp / Telefone
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
            </div>

            {/* Editable Invoice dynamic list */}
            <div>
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Itens do Orçamento</span>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Item
                </button>
              </div>

              <div className="space-y-3">
                {quoteItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
                    <div className="md:col-span-6">
                      <label className="block md:hidden text-xs font-bold text-slate-400 mb-0.5">Descrição do Item</label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Ex: 35 Caixinhas Milk 3D Tema Dinossauro"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block md:hidden text-xs font-bold text-slate-400 mb-0.5">Qtd</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block md:hidden text-xs font-bold text-slate-400 mb-0.5">Preço Unit.</label>
                      <input
                        type="number"
                        required
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-1 border-t md:border-t-0 pt-2 md:pt-0 text-center font-bold font-mono text-xs text-slate-700">
                      R$ {item.subtotal.toFixed(2)}
                    </div>
                    <div className="md:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={quoteItems.length === 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations and Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Prazo de Validade (Dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Math.max(1, Number(e.target.value)))}
                    className="max-w-[120px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none text-sm"
                  />
                  <span className="text-xs text-slate-400 ml-3">Vence em cerca de {expiryDays} dias à partir de hoje.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Observações de Prazo / Entrega / Temas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Pagamento de sinal (50%) na aprovação e restante na retirada. Prazo de confecção: 12 dias úteis."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Subtotal sidebar cards */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Subtotal itens</span>
                  <span className="font-mono">R$ {itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                  <span>Desconto Especial (R$)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-mono text-xs text-right focus:outline-none"
                  />
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-700">Total do Orçamento</span>
                  <span className="text-xl font-extrabold text-rose-600 font-mono">
                    R$ {calculatedTotal.toFixed(2)}
                  </span>
                </div>
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
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition duration-150 cursor-pointer shadow-sm animate-pulse"
              >
                Salvar Orçamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Viewing details / print template overlay */}
      {viewingQuote && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-3xl mx-auto shadow-md">
          {/* Print tools */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 print:hidden">
            <button
              onClick={() => setViewingQuote(null)}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← Voltar para lista
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir Orçamento
              </button>
              {viewingQuote.status === "Pendente" && (
                <button
                  onClick={() => {
                    if (confirm("Confirmar fechamento e converter este Orçamento em Pedido Ativo?")) {
                      onConvertToOrder(viewingQuote);
                      setViewingQuote(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <ArrowRight className="w-4 h-4" /> Converter em Pedido
                </button>
              )}
            </div>
          </div>

          {/* REAL PRINT LAYOUT COMPONENT */}
          <div id="printable-quote-area" className="space-y-6 text-slate-800">
            {/* Header Print */}
            <div className="flex justify-between items-start gap-4 pb-6 border-b-2 border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">
                  CONVITES & ARTES PERSONNALISÉES
                </h2>
                <h1 className="text-2xl font-bold text-rose-600 font-sans mt-1">Andressa Papelaria</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Artesanato de luxo, Caixinhas de Aniversário, Etiquetas e Cardápios
                </p>
                <p className="text-xs text-slate-400">Responsável: Andressa | Contato Comercial</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full uppercase">
                  Orçamento: {viewingQuote.id}
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Emissão: {new Date(viewingQuote.createdAt).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-xs font-semibold text-rose-600">
                  Vence em: {new Date(viewingQuote.expiryDate + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {/* Clients Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 print:bg-white print:border-none print:p-0">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados do Cliente</h4>
                <p className="font-bold text-slate-800 mt-1">{viewingQuote.customerName}</p>
                <p className="text-xs text-slate-600 mt-1">Whats: {viewingQuote.customerPhone || "Não informado"}</p>
                <p className="text-xs text-slate-600">E-mail: {viewingQuote.customerEmail || "Não informado"}</p>
              </div>
              <div className="md:text-right print:text-left">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Proposta</h4>
                <div className="inline-flex items-center gap-1.5 mt-2">
                  {viewingQuote.status === "Aprovado" ? (
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">✓ Proposta Aprovada</span>
                  ) : viewingQuote.status === "Rejeitado" ? (
                    <span className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">✗ Proposta Recusada</span>
                  ) : (
                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">⏳ Pendente de Análise</span>
                  )}
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-hidden border border-slate-100 rounded-xl print:border-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 print:bg-white">
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Item / Descrição Personalização</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-center">Quantidade</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">Valor Unitário</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {viewingQuote.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{item.description}</td>
                      <td className="px-4 py-3.5 text-center font-mono">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-right font-mono">R$ {item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-700">R$ {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col items-end spacing-y-2 pt-4 border-t border-slate-100 text-sm">
              <div className="w-full md:max-w-xs space-y-1.5 font-medium text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">R$ {viewingQuote.items.reduce((a,i)=>a+i.subtotal, 0).toFixed(2)}</span>
                </div>
                {viewingQuote.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Desconto Aplicado:</span>
                    <span className="font-mono">- R$ {viewingQuote.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-800 font-bold">
                  <span>Custo Total Estimado:</span>
                  <span className="text-lg font-extrabold text-rose-600 font-mono">R$ {viewingQuote.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Print Note */}
            {viewingQuote.notes && (
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 text-xs text-slate-600">
                <p className="font-bold text-slate-700 mb-1">Notas do Orçamento:</p>
                <p className="italic">"{viewingQuote.notes}"</p>
              </div>
            )}

            {/* Signature fields */}
            <div className="mt-16 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs print:mt-24">
              <div className="space-y-4">
                <div className="w-48 border-b border-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">Andressa - Papelaria Artesanal</p>
              </div>
              <div className="space-y-4">
                <div className="w-48 border-b border-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">Aceite do Cliente: {viewingQuote.customerName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quotes Search Bar & Listings */}
      {!isAdding && !viewingQuote && (
        <>
          <div className="relative max-w-md print:hidden">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar orçamentos..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 text-sm shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 print:hidden">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => {
                const totalItemsCount = q.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Quote header */}
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {q.id}
                        </span>
                        <span>
                          {q.status === "Aprovado" ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                              Aprovado
                            </span>
                          ) : q.status === "Rejeitado" ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase">
                              Recusado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 uppercase">
                              Pendente
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Client info */}
                      <h4 className="font-bold text-slate-800 mb-1 leading-tight text-sm">
                        {q.customerName}
                      </h4>
                      <div className="text-xs text-slate-400 flex items-center justify-between pb-3 border-b border-slate-50">
                        <span>Validade: {new Date(q.expiryDate + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                        <span>{totalItemsCount} {totalItemsCount === 1 ? "item" : "itens"}</span>
                      </div>

                      {/* Items description preview */}
                      <div className="py-3 space-y-1.5">
                        {q.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-500">
                            <span className="truncate max-w-[150px]">{item.description}</span>
                            <span className="font-mono">({item.quantity}x)</span>
                          </div>
                        ))}
                        {q.items.length > 2 && (
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            + {q.items.length - 2} outros itens na lista...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer values and click detail trigger */}
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Custo Total</span>
                        <span className="font-mono font-extrabold text-slate-700 text-base">R$ {q.total.toFixed(2)}</span>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            if (confirm(`Remover proposta ${q.id} definitivamente?`)) {
                              onDeleteQuote(q.id);
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          Deletar
                        </button>
                        <button
                          onClick={() => setViewingQuote(q)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <span className="block font-bold text-slate-700 text-lg">Nenhum orçamento encontrado</span>
                <p className="text-slate-400 max-w-sm mx-auto text-sm mt-1">
                  Crie orçamentos rústicos ou de caixas para enviar a clientes clicando em "Novo Orçamento".
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
