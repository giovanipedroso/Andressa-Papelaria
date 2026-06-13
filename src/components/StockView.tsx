import React, { useState } from "react";
import { StockItem } from "../types";
import { Layers, Plus, Minus, Search, AlertTriangle, Trash2, Edit2, Archive, DollarSign } from "lucide-react";

interface StockViewProps {
  stock: StockItem[];
  onAddStockItem: (item: Omit<StockItem, "id" | "updatedAt">) => void;
  onUpdateStockItem: (item: StockItem) => void;
  onDeleteStockItem: (id: string) => void;
}

export default function StockView({
  stock,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
}: StockViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StockItem["category"]>("Papel");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("folhas");
  const [minQuantity, setMinQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(1.0);

  const categories: ("Todas" | StockItem["category"])[] = [
    "Todas",
    "Papel",
    "Fita",
    "Cola",
    "Impressão",
    "Embalagem",
    "Outros",
  ];

  const filteredItems = stock.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Todas" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = stock.filter((item) => item.quantity <= item.minQuantity).length;

  const resetForm = () => {
    setName("");
    setCategory("Papel");
    setQuantity(0);
    setUnit("folhas");
    setMinQuantity(10);
    setUnitCost(1.0);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || quantity < 0) return;

    if (editingId) {
      const existing = stock.find((item) => item.id === editingId);
      if (existing) {
        onUpdateStockItem({
          ...existing,
          name: name.trim(),
          category,
          quantity,
          unit: unit.trim(),
          minQuantity,
          unitCost,
          updatedAt: new Date().toISOString().split("T")[0],
        });
      }
    } else {
      onAddStockItem({
        name: name.trim(),
        category,
        quantity,
        unit: unit.trim(),
        minQuantity,
        unitCost,
      });
    }
    resetForm();
  };

  const startEdit = (item: StockItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setMinQuantity(item.minQuantity);
    setUnitCost(item.unitCost);
    setIsAdding(true);
  };

  const adjustQty = (item: StockItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    onUpdateStockItem({
      ...item,
      quantity: newQty,
      updatedAt: new Date().toISOString().split("T")[0],
    });
  };

  const getCategoryColor = (cat: StockItem["category"]) => {
    switch (cat) {
      case "Papel": return "bg-blue-50 text-blue-700 border-blue-100";
      case "Fita": return "bg-rose-50 text-rose-700 border-rose-100";
      case "Cola": return "bg-amber-50 text-amber-700 border-amber-100";
      case "Impressão": return "bg-purple-50 text-purple-700 border-purple-100";
      case "Embalagem": return "bg-teal-50 text-teal-700 border-teal-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Materiais Cadastrados</span>
            <strong className="text-2xl text-slate-800">{stock.length} itens</strong>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${lowStockCount > 0 ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estoque Crítico (Atenção)</span>
            {lowStockCount > 0 ? (
              <strong className="text-2xl text-amber-600">{lowStockCount} precisando reposição</strong>
            ) : (
              <strong className="text-2xl text-emerald-600">Nenhum item baixo</strong>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold text-lg">
            R$
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Valor Investido em Estoque</span>
            <strong className="text-2xl text-slate-800">
              R$ {stock.reduce((total, i) => total + (i.quantity * i.unitCost), 0).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Estoque de Materiais</h2>
          <p className="text-sm text-slate-500 mt-1">
            Controle papéis, fitas, tintas e embalagens para a confecção das caixinhas e cardápios.
          </p>
        </div>
        {!isAdding && (
          <button
            id="add-stock-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cadastrar Material
          </button>
        )}
      </div>

      {/* Insert / Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border-2 border-rose-100 p-6 shadow-md transition-all">
          <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-rose-50 flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" />
            {editingId ? "Editar Material" : "Cadastrar Novo Material"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome do Item / Papel / Fita *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Papel Opalina Texturizado 240g A4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 placeholder:text-slate-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StockItem["category"])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm h-[42px]"
                >
                  <option value="Papel">Papel</option>
                  <option value="Fita">Fita</option>
                  <option value="Cola">Cola</option>
                  <option value="Impressão">Impressão</option>
                  <option value="Embalagem">Embalagem</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Quantidade Atual *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Unidade Medida *
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Ex: folhas, metros, rolos"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  min={0}
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(Number(e.target.value))}
                  placeholder="Alerta de baixo estoque"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Custo Unitário (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
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
                {editingId ? "Salvar Alterações" : "Salvar Material"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      {!isAdding && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
          <div className="relative max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar materiais..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 text-sm shadow-sm"
            />
          </div>

          <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isLow = item.quantity <= item.minQuantity;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  isLow ? "border-amber-200 bg-amber-50/10" : "border-slate-100"
                }`}
              >
                <div>
                  {/* Category Badge & Tools */}
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(item)}
                        title="Editar"
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir ${item.name} definitivamente de seu estoque?`)) {
                            onDeleteStockItem(item.id);
                          }
                        }}
                        title="Deletar"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Stats */}
                  <h4 className="font-bold text-slate-800 leading-snug tracking-tight text-sm mb-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>ID: {item.id}</span>
                    <span>•</span>
                    <span>Atualizado: {item.updatedAt}</span>
                  </div>

                  {/* Pricing cost info */}
                  <div className="mt-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50 flex justify-between items-center text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Est. Cost:
                    </div>
                    <strong>R$ {item.unitCost.toFixed(2)} / {item.unit.replace("s", "")}</strong>
                  </div>
                </div>

                {/* Inline Quantity adjuster */}
                <div className="mt-6 pt-4 border-t border-slate-100/60 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quantidade</span>
                    <span className={`font-mono text-lg font-bold ${isLow ? "text-amber-600" : "text-slate-800"}`}>
                      {item.quantity} <span className="text-xs font-normal text-slate-500 uppercase">{item.unit}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustQty(item, -1)}
                      title="Diminuir"
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => adjustQty(item, 1)}
                      title="Aumentar"
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Low Stock Warning Alert */}
                {isLow && (
                  <div className="mt-3 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 w-full shrink-0 border border-amber-100">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> Estoque baixo! Recomenda-se comprar mais.
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <span className="block font-bold text-slate-700 text-lg">Nenhum material encontrado</span>
            <p className="text-slate-400 max-w-sm mx-auto text-sm mt-1">
              Revine sua filtragem ou adicione materiais clicando em "Cadastrar Material".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
