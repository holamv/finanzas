
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionFormProps {
  onAdd: (tx: Omit<Transaction, 'id' | 'country'>) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.INFLOW);
  const [week, setWeek] = useState(1);
  const [category, setCategory] = useState('Venta');

  const handleSubmit = () => {
    if (!desc || !amount) return;
    onAdd({
      description: desc,
      amount: parseFloat(amount),
      type,
      week,
      category,
      isActual: false,
      date: new Date().toISOString()
    });
    setDesc('');
    setAmount('');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
        <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
          <i className="fas fa-plus"></i>
        </div>
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">Añadir Supuesto de Flujo</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Descripción</label>
          <input 
            value={desc} 
            onChange={e => setDesc(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00B14F]/5 outline-none transition-all" 
            placeholder="Ej: Cobro OC Clientes VIP"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Monto ($)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00B14F]/5 outline-none transition-all" 
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Semana de Proyección</label>
          <select 
            value={week} 
            onChange={e => setWeek(parseInt(e.target.value))}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00B14F]/5 outline-none transition-all"
          >
            {[1, 2, 3, 4].map(w => <option key={w} value={w}>Semana {w}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Categoría</label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00B14F]/5 outline-none transition-all"
          >
            <option value="Venta">Venta Esperada</option>
            <option value="Pago">Pago a Proveedores</option>
            <option value="OC">Orden de Compra</option>
            <option value="Otro">Otro Ingreso/Egreso</option>
          </select>
        </div>

        <div className="md:col-span-2 flex gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <button 
            onClick={() => setType(TransactionType.INFLOW)}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === TransactionType.INFLOW ? 'bg-[#00B14F] text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
          >
            INGRESO (+)
          </button>
          <button 
            onClick={() => setType(TransactionType.OUTFLOW)}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === TransactionType.OUTFLOW ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
          >
            EGRESO (-)
          </button>
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full bg-[#00B14F] hover:bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
      >
        <i className="fas fa-plus-circle text-lg"></i>
        REGISTRAR EN PLAN DE FLUJO
      </button>
    </div>
  );
};
