
import React, { useState, useEffect } from 'react';
import { PayUTransaction } from '../types';
import { Shield, Zap, Terminal, Copy, Check, Info, Server, Activity, ArrowRight, CloudLightning, Database, Globe, MousePointer2, AlertCircle } from 'lucide-react';

const PAYU_CREDS = {
  merchantId: "860822",
  accountId: "868430",
  apiKey: "4RXibrt8ZyvvQRIPb4YC3LPK3s",
  apiLogin: "91QawO3SFH2o8t5",
  publicK: "PK61k3x91t77x0d7053rqi9Gsh"
};

const PayUMonitor: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [logs, setLogs] = useState<PayUTransaction[]>([]);
  const [testJson, setTestJson] = useState('');
  const [totalDay, setTotalDay] = useState(0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Función para inyectar un pago a la lista (Simula la llegada al servidor)
  const injectPayment = (data?: Partial<PayUTransaction>) => {
    const newTx: PayUTransaction = {
      reference_sale: data?.reference_sale || `MV-PE-${Math.floor(Math.random() * 90000 + 10000)}`,
      state_pol: "4",
      response_message_pol: "APPROVED",
      payment_method_type: "CC",
      value: data?.value || parseFloat((Math.random() * 120 + 30).toFixed(2)),
      currency: "PEN",
      date: new Date().toISOString(),
      email_buyer: data?.email_buyer || "cliente_peru@manzanaverde.la",
      nickname_buyer: data?.nickname_buyer || "Comprador Local PE",
      description: "Plan de Alimentación"
    };
    
    setLogs(prev => [newTx, ...prev].slice(0, 20));
    setTotalDay(prev => prev + Number(newTx.value));
  };

  const handleManualInject = () => {
    try {
      // Intentar procesar lo que el usuario pegue como si fuera el webhook de PayU
      const parsed = JSON.parse(testJson);
      injectPayment({
        reference_sale: parsed.reference_sale,
        value: parsed.value,
        email_buyer: parsed.email_buyer,
        nickname_buyer: parsed.nickname_buyer
      });
      setTestJson('');
    } catch (e) {
      alert("Formato JSON inválido. Asegúrate de pegar el contenido del Webhook de PayU.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header de Estado */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-emerald-500/20">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
          <Activity className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></span>
              Receptor Live Activo
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter leading-none">TERMINAL <br/> <span className="text-emerald-500">PAYU PERÚ</span></h2>
            <p className="text-slate-400 text-sm font-medium max-w-sm">Esta pantalla recibirá y listará cada transferencia que llegue desde PayU en tiempo real.</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Recibido (Sesión)</p>
             <p className="text-5xl font-black text-emerald-400 tracking-tighter">S/ {totalDay.toLocaleString()}</p>
             <button 
                onClick={() => injectPayment()}
                className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 active:scale-95"
             >
                <Zap className="w-4 h-4 fill-current" /> SIMULAR RECEPCIÓN DE PAGO
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Izquierdo: Monitor en Vivo */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-black text-slate-900 italic uppercase flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-slate-400" /> Cola de Transacciones
               </h3>
               <span className="text-[10px] font-black text-slate-400">{logs.length} registros en memoria</span>
            </div>

            <div className="flex-1">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-4 opacity-30">
                   <CloudLightning className="w-16 h-16" />
                   <p className="font-bold text-slate-500 uppercase tracking-widest">Esperando primer impacto...</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {logs.map((tx, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50 transition-all flex items-center gap-6 group animate-in slide-in-from-left-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                         <Check className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{tx.reference_sale}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">APPROVED</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-1">{tx.nickname_buyer} • {tx.email_buyer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-lg tracking-tight">S/ {tx.value}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{new Date(tx.date).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Herramientas de Inyección Manual */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-widest">
              <MousePointer2 className="w-4 h-4" /> Inyector de Pruebas
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Pega aquí el contenido del mensaje (Webhook) que te envía PayU para ver cómo se registra en la tabla.
            </p>
            <textarea 
              value={testJson}
              onChange={(e) => setTestJson(e.target.value)}
              placeholder='{ "reference_sale": "PRUEBA-123", "value": 150.00 }'
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[10px] outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
            <button 
              onClick={handleManualInject}
              disabled={!testJson}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-all disabled:opacity-30"
            >
              INYECTAR REGISTRO
            </button>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-4">
             <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" /> Importante
             </div>
             <p className="text-emerald-800/70 text-xs leading-relaxed">
               Para que los datos lleguen <strong>automáticamente</strong> sin que tú hagas nada, necesitas configurar en tu servidor el código que te mostré antes. Este Dashboard está listo para pintar la información apenas la reciba.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CredItem = ({ label, value, onCopy, isCopied }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group hover:border-emerald-500 transition-all">
      <span className="flex-1 text-[11px] font-mono text-slate-600 truncate">{value}</span>
      <button onClick={onCopy} className="text-slate-400 hover:text-emerald-600">
        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100" />}
      </button>
    </div>
  </div>
);

export default PayUMonitor;
