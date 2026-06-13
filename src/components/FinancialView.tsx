import React, { useState } from "react";
import { FinanceEntry } from "../types";
import { Plus, Trash2, Search, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, PieChart, BarChart3, Receipt, Tag } from "lucide-react";

interface FinancialViewProps {
  finance: FinanceEntry[];
  onAddFinanceEntry: (entry: Omit<FinanceEntry, "id">) => void;
  onDeleteFinanceEntry: (id: string) => void;
}

export default function FinancialView({
  finance,
  onAddFinanceEntry,
  onDeleteFinanceEntry,
}: FinancialViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Todos" | "receita" | "despesa">("Todos");
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [category, setCategory] = useState("Venda de Pedido");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const filteredEntries = finance.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "Todos" || entry.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Financial aggregates
  const totalIncomes = finance.filter((f) => f.type === "receita").reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = finance.filter((f) => f.type === "despesa").reduce((sum, f) => sum + f.amount, 0);
  const netEarnings = totalIncomes - totalExpenses;

  // Static options based on type selection
  const incomeCategories = ["Venda de Pedido", "Orçamento Convertido", "Outros"];
  const expenseCategories = ["Material de Estoque", "Tintas", "Manutenção", "Luz/Internet", "Embalagens", "Outros"];

  const handleTypeChange = (newType: "receita" | "despesa") => {
    setType(newType);
    setCategory(newType === "receita" ? "Venda de Pedido" : "Material de Estoque");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    onAddFinanceEntry({
      type,
      category,
      amount,
      date,
      description: description.trim(),
    });

    // Reset Form
    setDescription("");
    setAmount(0);
    setDate(new Date().toISOString().split("T")[0]);
    setIsAdding(false);
  };

  // SVG Chart data formatting
  // 1. Group income / expenses by date or custom category
  const categoriesMap: { [cat: string]: number } = {};
  finance.forEach((item) => {
    if (item.type === "despesa") {
      categoriesMap[item.category] = (categoriesMap[item.category] || 0) + item.amount;
    }
  });

  const costCategories = Object.keys(categoriesMap).map((key) => ({
    name: key,
    value: categoriesMap[key],
  }));

  const totalCostCategoriesSum = costCategories.reduce((s, i) => s + i.value, 0);

  // Colors for costs pie chart slices
  const sliceColors = [
    "#f43f5e", // Rose
    "#f59e0b", // Amber
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#10b981", // Emerald
    "#64748b", // Slate
  ];

  return (
    <div className="space-y-6">
      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Receitas (Pix/Sinal)</span>
              <strong className="text-2xl text-slate-800 font-mono">R$ {totalIncomes.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total de Despesas (Custos)</span>
              <strong className="text-2xl text-slate-800 font-mono">R$ {totalExpenses.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between ${netEarnings >= 0 ? "border-emerald-100" : "border-rose-100"}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${netEarnings >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Saldo Líquido de Caixa</span>
              <strong className={`text-2xl font-mono ${netEarnings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                R$ {netEarnings.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* SVG charts panel */}
      {finance.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost breakdown pie chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-800 font-bold text-sm mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" /> Distribuição de Despesas (Custo de Tintas, Papel etc.)
            </h3>
            {costCategories.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
                {/* Custom Elegant Donut SVG */}
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {(() => {
                      let accumulatedPercent = 0;
                      return costCategories.map((slice, index) => {
                        const percent = (slice.value / totalCostCategoriesSum) * 100;
                        const sliceColor = sliceColors[index % sliceColors.length];
                        
                        // dasharray calculations for SVG stroke-dasharray
                        const dashArray = `${percent} ${100 - percent}`;
                        const dashOffset = 100 - accumulatedPercent + 25; // standard coordinate offset
                        accumulatedPercent += percent;

                        return (
                          <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="35"
                            fill="transparent"
                            stroke={sliceColor}
                            strokeWidth="15"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-300 hover:stroke-[18]"
                            style={{ strokeDasharray: `${percent * 2.2} 220`, strokeDashoffset: `-${accumulatedPercent * 2.2 - percent * 2.2}` }} // 2*PI*R = 2 * 3.14 * 35 = 220
                          />
                        );
                      });
                    })()}
                    {/* Ring mask inside for donut effect */}
                    <circle cx="50" cy="50" r="22" fill="white" />
                  </svg>
                  {/* Total Value Overlay in center of Donut */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Custo</span>
                    <span className="text-xs font-extrabold text-slate-700 font-mono">
                      R$ {totalCostCategoriesSum.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Slices legend list */}
                <div className="flex-1 space-y-2 w-full">
                  {costCategories.map((slice, index) => {
                    const color = sliceColors[index % sliceColors.length];
                    const percent = (slice.value / totalCostCategoriesSum) * 100;

                    return (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: color }} />
                          <span className="color-slate-600 font-semibold">{slice.name}</span>
                        </div>
                        <span className="font-mono text-slate-500">
                          R$ {slice.value.toFixed(2)} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Registre despesas de embalagem ou papéis para alimentar o gráfico de custos.
              </div>
            )}
          </div>

          {/* Simple historical balances / recent margins bar chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-slate-800 font-bold text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-500" /> Fluxo Diário de Caixa Recente (Receita vs Custos)
              </h3>
              <p className="text-xs text-slate-400 leading-normal mb-4">
                Exibição do balanço agregado de faturamento bruto comparado a gastos.
              </p>
            </div>

            <div className="flex items-end gap-1.5 h-36 border-b border-l border-slate-100 px-4 pt-4">
              {/* Receipts comparative Pillar */}
              <div className="flex-1 flex flex-col items-center justify-end h-full group">
                <span className="text-[10px] font-bold text-emerald-600 mb-1 font-mono hidden group-hover:block">
                  R$ {totalIncomes.toFixed(0)}
                </span>
                <div 
                  className="bg-emerald-400 hover:bg-emerald-500 rounded-t-lg w-full transition-all duration-300" 
                  style={{ height: `${totalIncomes > 0 ? (totalIncomes / Math.max(totalIncomes, totalExpenses)) * 100 : 0}%`, minHeight: "10px" }}
                />
                <span className="text-[10px] font-sans font-bold text-slate-400 mt-2">Entradas</span>
              </div>

              {/* Spacing pillar */}
              <div className="w-4" />

              {/* Expenses comparative pillar */}
              <div className="flex-1 flex flex-col items-center justify-end h-full group">
                <span className="text-[10px] font-bold text-rose-600 mb-1 font-mono hidden group-hover:block">
                  R$ {totalExpenses.toFixed(0)}
                </span>
                <div 
                  className="bg-rose-400 hover:bg-rose-500 rounded-t-lg w-full transition-all duration-300" 
                  style={{ height: `${totalExpenses > 0 ? (totalExpenses / Math.max(totalIncomes, totalExpenses)) * 100 : 0}%`, minHeight: "10px" }}
                />
                <span className="text-[10px] font-sans font-bold text-slate-400 mt-2">Saídas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inputs Form and Search Trigger bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lançamentos de Caixa</h2>
          <p className="text-sm text-slate-500 mt-1">
            Insira manualmente faturamentos de caixa ou despesas administrativas de insumos.
          </p>
        </div>
        {!isAdding && (
          <button
            id="write-finance-btn"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        )}
      </div>

      {/* Add Finance Form Container */}
      {isAdding && (
        <div className="bg-white rounded-2xl border-2 border-rose-100 p-6 shadow-md transition-all">
          <h3 className="text-md font-bold text-slate-800 mb-4 pb-2 border-b border-rose-50 flex items-center gap-2 animate-pulse">
            <Receipt className="w-5 h-5 text-rose-500" />
            Adicionar Novo Lançamento Financeiro
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tipo de Lançamento *
                </label>
                <div className="grid grid-cols-2 gap-2 h-[42px]">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("receita")}
                    className={`text-xs font-bold py-2 rounded-xl border cursor-pointer ${
                      type === "receita"
                        ? "bg-emerald-550 border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("despesa")}
                    className={`text-xs font-bold py-2 rounded-xl border cursor-pointer ${
                      type === "despesa"
                        ? "bg-rose-550 border-rose-600 bg-rose-50 text-rose-800 font-extrabold"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    Saída (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Categoria Ajustada *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm h-[42px]"
                >
                  {type === "receita"
                    ? incomeCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    : expenseCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Data do Fluxo *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-rose-400 text-sm h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Valor Total Monetário (R$) *
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Descrição ou Histórico de Caixa *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exemplo: Compra de fita modelo cetim ou Sinal do cliente João PED-1002"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-rose-400 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition duration-150 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition duration-150 cursor-pointer shadow-sm"
              >
                Registrar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Filtering Row */}
      {!isAdding && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch">
          <div className="relative max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, venda..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 text-sm shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            {(["Todos", "receita", "despesa"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer ${
                  typeFilter === t
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t === "Todos" ? "Todos os fluxos" : t === "receita" ? "Entradas (+)" : "Saídas (-)"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Table List */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Fluxo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Data</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Descrição / Histórico</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEntries.length > 0 ? (
                filteredEntries
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((entry) => {
                    const isIncome = entry.type === "receita";

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 font-bold ${isIncome ? "text-emerald-700" : "text-rose-700"}`}>
                            {isIncome ? "★ Entrada" : "● Saída"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-500">
                          {new Date(entry.date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800 break-all max-w-[280px]">
                          {entry.description}
                          {entry.relatedId && (
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              Ref: {entry.relatedId}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            {entry.category}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-extrabold font-mono text-sm ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIncome ? "+" : "-"} R$ {entry.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Excluir este lançamento de R$ ${entry.amount.toFixed(2)} permanentemente?`)) {
                                onDeleteFinanceEntry(entry.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm font-semibold">
                    Nenhum registro de caixa encontrado para os filtros ativos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
