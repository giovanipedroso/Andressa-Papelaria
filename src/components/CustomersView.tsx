import React, { useState } from "react";
import { Customer, Order } from "../types";
import { User, Plus, Search, Phone, Mail, MapPin, FileText, Trash2, Edit2, CheckCircle } from "lucide-react";

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  onAddCustomer: (customer: Omit<Customer, "id" | "createdAt">) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomersView({
  customers,
  orders,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCustomerOrders = (customerId: string) => {
    return orders.filter((o) => o.customerId === customerId);
  };

  const getCustomerRevenue = (customerId: string) => {
    return getCustomerOrders(customerId).reduce((acc, o) => acc + o.totalPrice, 0);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = customers.find((c) => c.id === editingId);
      if (existing) {
        onUpdateCustomer({
          ...existing,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          notes: notes.trim(),
        });
      }
    } else {
      onAddCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });
    }
    resetForm();
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email);
    setAddress(customer.address);
    setNotes(customer.notes || "");
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clientes Atendidos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie contatos e observe o histórico de cada cliente atendido.
          </p>
        </div>
        {!isAdding && (
          <button
            id="add-customer-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        )}
      </div>

      {/* Add / Edit Form Modal-like view */}
      {isAdding && (
        <div className="bg-white rounded-2xl border-2 border-rose-100 p-6 shadow-md transition-all">
          <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-rose-50 flex items-center gap-2">
            <User className="w-5 h-5 text-rose-500" />
            {editingId ? "Editar Cliente" : "Cadastrar Novo Cliente"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 placeholder:text-slate-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 placeholder:text-slate-400 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 placeholder:text-slate-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 placeholder:text-slate-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Preferências de Papelaria / Observações Gerais
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Exemplo: Gosta de papel kraft rústico, temas florais, data de aniversário dos filhos..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 placeholder:text-slate-400 text-sm"
              />
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
                {editingId ? "Salvar Alterações" : "Salvar Cliente"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input */}
      {!isAdding && (
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail/whats..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 text-sm shadow-sm"
          />
        </div>
      )}

      {/* Customers List & details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const customerOrders = getCustomerOrders(customer.id);
            const totalRevenue = getCustomerRevenue(customer.id);

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-4">
                  {/* Card Title Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        {customer.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 break-all">
                          {customer.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          Cadastrado em {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(customer)}
                        title="Editar"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Deseja realmente excluir o cliente ${customer.name}? Os pedidos vinculados a ele continuarão no sistema.`
                            )
                          ) {
                            onDeleteCustomer(customer.id);
                          }
                        }}
                        title="Excluir"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Core Details */}
                  <div className="space-y-2 text-sm text-slate-600 border-t border-b border-slate-50 py-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="break-all">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-xs leading-relaxed">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Preferences / notes */}
                  {customer.notes && (
                    <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50">
                      <span className="block text-xs font-bold text-rose-700/80 mb-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Notas da Andressa
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{customer.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Orders / billing Footer summary */}
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold">
                  <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>{customerOrders.length} {customerOrders.length === 1 ? 'Pedido' : 'Pedidos'}</span>
                  </div>
                  <div className="text-slate-700">
                    Total em Compras: <strong className="text-rose-600 text-sm">R$ {totalRevenue.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-1 xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <span className="block font-bold text-slate-700 text-lg">Nenhum cliente encontrado</span>
            <p className="text-slate-400 max-w-sm mx-auto text-sm mt-1">
              Refine sua pesquisa ou clique em "Novo Cliente" para preencher novo cadastro.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
