
import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Share2, Network, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

interface AIChatProps {
  data: any[];
  onSync?: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ data, onSync }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Soy Lumina Oracle. Estoy conectado a tu flujo de n8n para analizar tus ventas. ¿Qué estrategia financiera deseas discutir hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setConnectionError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const contextSummary = {
        total_sales_count: data.length,
        countries_active: Array.from(new Set(data.map(d => d.country))),
        timestamp: new Date().toISOString()
      };

      // Nota: Si n8n devuelve error de CORS, es porque el servidor n8n debe tener permitidos los orígenes.
      const response = await fetch('https://n8n.manzanaverde.la/webhook/chat-gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          question: userMsg,
          context: contextSummary,
          chatHistory: messages.slice(-3)
        })
      });

      if (!response.ok) {
        throw new Error(`Servidor n8n respondió con error ${response.status}. Verifica que el Webhook esté activo.`);
      }
      
      const result = await response.json();
      
      // Adaptación flexible para diferentes formatos de salida de n8n
      const assistantText = result.output || result.text || result.response || (Array.isArray(result) ? result[0]?.output : null) || "Recibí una respuesta de n8n pero el formato no es reconocido.";
      const sources = result.sources || [];

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText, sources }]);
    } catch (error: any) {
      const errorDetail = error.message || 'Error desconocido';
      setConnectionError(errorDetail);
      setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR DE CONEXIÓN] No se pudo comunicar con n8n. Detalle: ${errorDetail}` }]);
      console.error("n8n Connection Error Details:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[32px] font-[900] text-slate-900 tracking-tighter italic leading-none uppercase">Lumina Oracle</h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.15em] text-[9px] mt-1">Agente Inteligente vía n8n Webhook</p>
        </div>
        <div className="flex gap-3">
           <button onClick={onSync} className="px-6 py-2.5 bg-white border border-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
             <RefreshCw size={14} /> Refrescar Contexto
           </button>
           <div className={`px-6 py-2.5 ${connectionError ? 'bg-rose-500 shadow-rose-100' : 'bg-[#00B14F] shadow-emerald-100'} text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all`}>
             {connectionError ? <AlertCircle size={14} /> : <Network size={14} />} 
             {connectionError ? 'Error n8n' : 'n8n Activo'}
           </div>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-8 rounded-[2.5rem] ${
                m.role === 'user' ? 'bg-slate-900 text-white shadow-xl rounded-tr-none' : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
              } ${m.content.includes('[ERROR DE CONEXIÓN]') ? 'border-rose-200 bg-rose-50 text-rose-700' : ''}`}>
                <p className="text-[13px] font-medium leading-[1.7] whitespace-pre-wrap">{m.content}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 flex gap-2 overflow-x-auto pb-1">
                    {m.sources.map((s: any, si: number) => (
                      <span key={si} className="text-[8px] font-black uppercase bg-white/10 px-2 py-1 rounded-md whitespace-nowrap">Ref: {s.title || 'Doc'}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none flex gap-1.5 items-center border border-slate-100">
                <div className="h-1.5 w-1.5 bg-[#00B14F] rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-[#00B14F] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="h-1.5 w-1.5 bg-[#00B14F] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 md:p-10 bg-white border-t border-slate-50">
          <div className="max-w-4xl mx-auto flex gap-4 bg-slate-50 p-3 pl-8 rounded-[3rem] border border-slate-200 focus-within:ring-8 focus-within:ring-emerald-500/5 transition-all focus-within:bg-white focus-within:border-[#00B14F]/30 shadow-inner">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregunta sobre las finanzas de Manzana Verde..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-semibold text-slate-700 placeholder:text-slate-300"
            />
            <button 
              onClick={handleSend} 
              disabled={isTyping || !input.trim()}
              className="h-14 w-14 bg-[#00B14F] hover:bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-20"
            >
              {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
