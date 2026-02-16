
import React from 'react';
import { Charge } from '../types';

interface ChargeTableProps {
  charges: Charge[];
}

const ChargeTable: React.FC<ChargeTableProps> = ({ charges }) => {
  if (charges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-transparent">
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Sin datos para este periodo.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <th className="px-6 py-4">Monto</th>
            <th className="px-6 py-4">Usuario</th>
            <th className="px-6 py-4">Descripción</th>
            <th className="px-6 py-4">País</th>
            <th className="px-6 py-4">Fecha (AT)</th>
          </tr>
        </thead>
        <tbody>
          {charges.map((charge) => (
            <tr key={charge.id} className="group bg-slate-950/40 hover:bg-slate-900 border border-white/5 rounded-2xl transition-all">
              <td className="px-6 py-5 first:rounded-l-2xl">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-emerald-400 tracking-tight">
                    S/ {charge.amount?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">ID: {charge.id}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-tight">{charge.name}</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[150px] italic">{charge.email}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="text-[11px] text-slate-400 font-medium line-clamp-1">{charge.description}</span>
              </td>
              <td className="px-6 py-5">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                  {charge.pais}
                </span>
              </td>
              <td className="px-6 py-5 last:rounded-r-2xl whitespace-nowrap">
                <span className="text-[10px] font-mono text-slate-500">
                  {charge.at ? new Date(charge.at.replace(' ', 'T')).toLocaleString('es-ES', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChargeTable;
