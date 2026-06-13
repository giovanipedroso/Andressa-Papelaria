import React, { useState } from "react";
import { trackOrderPublic } from "../utils/api";
import { Search, Loader2, Package, Clock, Calendar, CheckCircle2, Circle, AlertCircle, ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductionStatus } from "../types";

interface TrackingHistoryItem {
  status: ProductionStatus;
  changedAt: string;
  note?: string;
}

interface OrderTrackingResult {
  id: string;
  customerName: string;
  productType: string;
  details: string;
  quantity: number;
  status: ProductionStatus;
  deliveryDate: string;
  orderDate: string;
  notes?: string;
  trackingHistory: TrackingHistoryItem[];
}

interface TrackingViewProps {
  onBackToLogin: () => void;
}

export default function TrackingView({ onBackToLogin }: TrackingViewProps) {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderTrackingResult | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await trackOrderPublic(orderId);
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Pedido não encontrado.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao buscar pedido.");
    } finally {
      setLoading(false);
    }
  };

  const steps: { status: ProductionStatus; label: string; desc: string }[] = [
    { status: "Aguardando Início", label: "Pedido Aprovado", desc: "Orçamento aceito, sinal confirmado e programado em fila." },
    { status: "Em Produção", label: "Em Produção", desc: "Design artesanal criado, moldes coloridos impressos e recortados." },
    { status: "Montagem e Acabamento", label: "Montagem & Dobra", desc: "Dobraduras estruturais feitas a mão, aplicação de laços e colagem." },
    { status: "Concluído", label: "Pronto para Retirada", desc: "Embalado amorosamente e pronto para envio ou retirada física." },
    { status: "Entregue", label: "Entregue com Sucesso", desc: "Entregue para o cliente ou recolhido na papelaria." },
  ];

  const getStepStatus = (stepStatus: ProductionStatus, currentStatus: ProductionStatus) => {
    const statusOrder: ProductionStatus[] = [
      "Aguardando Início",
      "Em Produção",
      "Montagem e Acabamento",
      "Concluído",
      "Entregue"
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4" id="tracking-portal">
      {/* Header */}
      <div className="text-center mb-8 print:hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-600 mb-4 shadow-sm border border-rose-100">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight font-serif italic">
          Área do Cliente Andressa
        </h1>
        <p className="text-slate-500 mt-2 font-sans">
          Acompanhe em tempo real as etapas de confecção de suas lembranças personalizadas.
        </p>
      </div>

      {/* Tracking Form */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 md:p-8 mb-6 print:hidden">
        <form onSubmit={handleTrack}>
          <label htmlFor="order-number-input" className="block text-sm font-semibold text-slate-700 mb-2">
            Número do Pedido (Ex: PED-1001 ou apenas 1001)
          </label>
          <div className="relative flex shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-200 transition-all duration-200">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="order-number-input"
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Digite o código do pedido..."
              className="block w-full pl-10 pr-4 py-3.5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base"
              disabled={loading}
            />
            <button
              id="track-btn"
              type="submit"
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Buscar"
              )}
            </button>
          </div>
        </form>


      </div>

      {/* Error State */}
      <AnimatePresence mode="popLayout">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3 mb-6 print:hidden"
            id="tracking-error"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900">Código inválido ou não encontrado</h3>
              <p className="text-sm text-rose-800/90 mt-0.5">
                {error} Se acabou de aprovar o orçamento, ele pode demorar alguns momentos para entrar no sistema. Se precisar, entre em contato.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display */}
      {result && (
        <div 
          className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden print:shadow-none print:border-none"
          id="tracking-result"
        >
          {/* Result Header */}
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-6 border-b border-rose-100 flex flex-wrap justify-between items-center gap-4 print:bg-white print:border-b-2 print:border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Pedido {result.id}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Cadastrado em {result.orderDate}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mt-2 font-sans">
                Olá, {result.customerName}!
              </h2>
              <p className="text-sm text-slate-500 font-sans">
                Seu produto personalizado já está sob nossos cuidados.
              </p>
            </div>
            
            <div className="flex gap-2 print:hidden">
              <button
                id="refresh-track-btn"
                onClick={handleTrack}
                title="Atualizar"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                id="print-track-btn"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* General Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100 print:bg-white print:border-slate-200 print:p-2">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Produto Criado</span>
                <div className="flex items-center gap-2 font-medium text-slate-800 text-lg">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                  {result.productType}
                </div>
                <p className="text-sm text-slate-600 pl-4">{result.details}</p>
              </div>

              <div className="space-y-1 md:border-l md:border-slate-200 md:pl-6 print:pl-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Previsão de Entrega</span>
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  {result.deliveryDate ? new Date(result.deliveryDate + "T00:00:00").toLocaleDateString("pt-BR") : "A definir"}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 pl-7">
                  <Clock className="w-3.5 h-3.5" /> Status Atual: <strong className="text-rose-600">{result.status}</strong>
                </div>
              </div>
            </div>

            {/* Visual Timeline Tracker */}
            <h3 className="text-base font-bold text-slate-800 mb-6 font-sans border-b border-slate-100 pb-2">
              Etapas de Confecção
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:inset-y-1 before:left-2.5 before:w-0.5 before:bg-slate-100">
              {steps.map((step) => {
                const stepState = getStepStatus(step.status, result.status);
                const stepChangeDate = result.trackingHistory.find(h => h.status === step.status)?.changedAt;
                const stepNote = result.trackingHistory.find(h => h.status === step.status)?.note;

                return (
                  <div key={step.status} className="relative flex flex-col md:flex-row md:items-start gap-1 md:gap-8 group">
                    {/* Circle Indicator */}
                    <div className="absolute -left-6 top-1 flex items-center justify-center p-0.5 bg-white rounded-full z-10 transition-transform group-hover:scale-110">
                      {stepState === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white" />
                      ) : stepState === "current" ? (
                        <div className="w-5 h-5 rounded-full bg-rose-600 border-4 border-rose-100 flex items-center justify-center pulse-badge" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 bg-white" />
                      )}
                    </div>

                    <div className="flex-1 pl-2">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h4 className={`font-bold font-sans ${stepState === "current" ? "text-rose-600 text-base" : stepState === "completed" ? "text-slate-800" : "text-slate-400"}`}>
                          {step.label}
                        </h4>
                        {stepChangeDate && (
                          <span className="text-xs text-slate-400 font-mono">
                            Concluído em: {stepChangeDate}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${stepState === "pending" ? "text-slate-400" : "text-slate-600"}`}>
                        {step.desc}
                      </p>
                      
                      {stepNote && stepState !== "pending" && (
                        <div className="mt-1.5 text-xs bg-slate-50 border border-slate-100 text-slate-500 rounded-lg px-3 py-1.5 italic inline-block">
                          Obs: {stepNote}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note alert */}
            {result.notes && (
              <div className="mt-8 p-4 bg-amber-50/55 rounded-xl border border-amber-100 text-amber-900 text-sm">
                <p className="font-semibold text-amber-900">Nota da produção:</p>
                <p className="text-amber-800/95 mt-0.5 italic">{result.notes}</p>
              </div>
            )}

            {/* Contact Advice */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 print:hidden font-sans">
              Está com dúvidas sobre o andamento do pedido ou gostaria de fazer modificações? <br />
              Fale conosco direto no suporte. Muito obrigado por confiar no trabalho artesanal!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
