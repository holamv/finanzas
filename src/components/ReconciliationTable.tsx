
import React, { useState } from 'react';
// Corrected import to use types.ts for Country
import { ReconciliationResult, Country } from '../types';
import { AlertCircle, CheckCircle2, HelpCircle, User, Mail, Zap, Calendar, Hash, IdCard, Check, Loader2 } from 'lucide-react';
import { formatCurrency, convertToUSD, inferCurrencyFromCountryString } from '@/lib/currencyUtils';

interface ReconciliationTableProps {
  data: ReconciliationResult[];
  country: Country;
  onManualReconcile?: (item: ReconciliationResult) => Promise<void>;
}

const ReconciliationTable: React.FC<ReconciliationTableProps> = ({ data, country, onManualReconcile }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (data.length === 0) return null;

  const getCurrencySymbol = (c: Country) => {
    const countryStr = String(c).toLowerCase();
    switch (countryStr) {
      case 'perú':
      case 'peru': return 'S/';
      case 'colombia': return '$';
      case 'méxico':
      case 'mexico': return '$';
      default: return 'S/';
    }
  };

  const symbol = getCurrencySymbol(country);

  const getTxCode = (item: ReconciliationResult) => {
    const code = item["CODIGO TRANSACCION"] ||
      item.CODIGO_TRANSACCION ||
      item.COD_TX ||
      item.TX_ID ||
      (item.CORRELATIVO && !item.SERIE ? String(item.CORRELATIVO) : null) ||
      ((item.SERIE && item.CORRELATIVO) ? `${item.SERIE}-${item.CORRELATIVO}` : String(item.ID || 'N/A'));
    return String(code || '').trim();
  };

  const handleManualAction = async (item: ReconciliationResult) => {
    if (!onManualReconcile) return;
    const internalId = String(item.ID);
    setProcessingId(internalId);
    try {
      await onManualReconcile(item);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="space-y-1">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Reporte <span className="text-[#00b050]">Consolidado</span></h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registros procesados para {country.toUpperCase()}</p>
        </div>
        <div className="px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">{data.length} Filas Encontradas</span>
        </div>
      </div>

      <div className="overflow-x-auto p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-20">
            <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">ID Interno</th>
              <th className="px-6 py-4">Código Transacción</th>
              <th className="px-6 py-4">Usuario / Correo</th>
              <th className="px-6 py-4">Origen</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4 text-center">País</th>
              <th className="px-6 py-4 text-right">Diferencia</th>
              <th className="px-6 py-4 text-right">Cálculo Contable</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const contable = item["MONTO CONTABLE"] || 0;
              const diffValue = Number(item.DIFERENCIA) || 0;
              const txCode = getTxCode(item);
              const internalId = item.ID || 'Generando...';
              const isReconciled = item.ESTADO === 'Si está';

              return (
                <tr key={idx} className="group bg-slate-50/50 hover:bg-white border border-slate-100 transition-all animate-in fade-in" style={{ animationDelay: `${idx * 15}ms` }}>
                  <td className="px-6 py-5 first:rounded-l-3xl">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit border shadow-sm ${item.ESTADO === 'Si está'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : item.ESTADO === 'No está'
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : 'bg-amber-50 border-amber-100 text-amber-600'
                      }`}>
                      {item.ESTADO === 'Si está' ? <CheckCircle2 className="w-3 h-3" /> : item.ESTADO === 'No está' ? <AlertCircle className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                      <span className="text-[9px] font-black uppercase tracking-tight">{item.ESTADO || 'Difiere'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                      <IdCard className="w-3 h-3 text-blue-500 opacity-60" />
                      <span className="text-[10px] font-mono font-black text-blue-700 tracking-tighter">{internalId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
                      <Hash className="w-3 h-3 text-[#00b050] opacity-50" />
                      <span className="text-[10px] font-mono font-black text-slate-800 tracking-tighter">{txCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col max-w-[150px]">
                      <span className="text-[11px] font-black text-slate-900 flex items-center gap-2 truncate">
                        <User className="w-3 h-3 text-slate-400" /> {item.NOMBRE || 'N/A'}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1.5 truncate italic">
                        <Mail className="w-3 h-3" /> {item.EMAIL || 'Sin correo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 w-fit">
                      <Zap className="w-2.5 h-2.5 text-blue-500" /> {item.ORIGEN || 'SISTEMA'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                        <Calendar className="w-3 h-3 opacity-30" />
                        {item.FECHA ? item.FECHA.split(' ')[0] : '---'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{item.PAIS}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-black ${diffValue > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {country === 'Global'
                          ? formatCurrency(convertToUSD(diffValue, inferCurrencyFromCountryString(item.PAIS || '')), 'Global')
                          : `${symbol} ${diffValue.toLocaleString()}`
                        }
                      </span>
                      {diffValue > 0 && <span className="text-[8px] font-black text-rose-300 uppercase tracking-tighter">Desajuste</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-black text-emerald-600">
                      {country === 'Global'
                        ? formatCurrency(convertToUSD(contable, inferCurrencyFromCountryString(item.PAIS || '')), 'Global')
                        : `${symbol} ${contable.toLocaleString()}`
                      }
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center last:rounded-r-3xl">
                    {!isReconciled && onManualReconcile && (
                      <button
                        onClick={() => handleManualAction(item)}
                        disabled={processingId === String(internalId)}
                        className={`p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group/btn disabled:opacity-50`}
                        title="Conciliar Manualmente"
                      >
                        {processingId === String(internalId) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        )}
                      </button>
                    )}
                    {isReconciled && (
                      <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Completado</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReconciliationTable;
