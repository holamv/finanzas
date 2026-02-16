
import React, { useState, useMemo } from 'react';
// Removed duplicate import below
import {
  Loader2, Plus, Minus, ChevronRight, Table as TableIcon, ArrowUpRight, Target, BrainCircuit, CalendarDays, Activity, LineChart as LineChartIcon, Sparkles, ShieldCheck, Percent, TrendingDown, TrendingUp, Zap, BarChart3, Users, Scale, AlertCircle
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Area, Legend } from 'recharts';

import { Country, PnLRow } from '../types';
import { formatCurrency } from '@/lib/currencyUtils';
import { forecastSales } from '@/services/mlService';

interface GlobalPnLProps {
  data: PnLRow[];
  loading: boolean;
  months: string[];
  country?: Country;
}

const GlobalPnL: React.FC<GlobalPnLProps> = ({ data: initialData, loading: initialLoading, months: initialMonths, country: initialCountry = 'Global' }) => {
  const [viewMode, setViewMode] = useState<'table' | 'dashboard' | 'forecast'>('table');
  const [forecastGrowth, setForecastGrowth] = useState<number>(15);

  // States for dynamic filtering
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedLine, setSelectedLine] = useState<string>('total');

  const [data, setData] = useState<PnLRow[]>(initialData);
  const [months, setMonths] = useState<string[]>(initialMonths);
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'GLOBAL': true, 'SALES': true, 'REVENUE': true, 'NET REVENUE': true, 'CONTRIBUTION MARGIN': true, 'PAYROLL': true, 'EBITDA': true, 'COGS': true, 'GROSS MARGIN': true, 'EXPENSES': true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        country: selectedCountry,
        city: selectedCity,
        line: selectedLine
      });
      const response = await fetch(`/api/monthly-pnl?${params}`);
      const result = await response.json();

      if (result.pnl_data) {
        // Ordenamos de Dic a Ene (Revertido por petición previa del usuario)
        const reversedMonths = [...result.months].reverse();
        setMonths(reversedMonths);

        const rows = result.pnl_data.map((m: any) => ({
          label: m.category,
          unit: 'USD',
          isHeader: true,
          values: [...m.values].reverse() // Invertir valores para coincidir con meses
        }));

        setData(rows);
        if (result.availableCities) setAvailableCities(result.availableCities);
      }
    } catch (e) {
      console.error("Error fetching filtered P&L:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [selectedCountry, selectedCity, selectedLine]);

  const toggleSection = (label: string) => {
    const key = label.toUpperCase().trim();
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    const groups: { header: any; children: any[] }[] = [];
    let currentGroup: { header: any; children: any[] } | null = null;

    data.forEach(row => {
      if (row.isHeader) {
        currentGroup = { header: row, children: [] };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.children.push(row);
      }
    });
    return groups;
  }, [data]);

  // Colores para métricas clave
  const metricStyles: Record<string, string> = {
    'SALES': 'border-l-4 border-emerald-500 bg-emerald-50/10',
    'REVENUE': 'border-l-4 border-blue-500 bg-blue-50/10',
    'COGS': 'border-l-4 border-slate-500 bg-slate-50/10',
    'GROSS MARGIN': 'border-l-4 border-indigo-500 bg-indigo-50/10',
    'EXPENSES': 'border-l-4 border-orange-500 bg-orange-50/10',
    'EBITDA': 'border-l-4 border-amber-500 bg-amber-50/10',
    'BURN RATE': 'border-l-4 border-rose-500 bg-rose-50/10',
  };

  const analytics = useMemo(() => {
    if (!data || data.length === 0 || !months || months.length === 0) return null;

    const salesRow = data.find(r => r.label.toUpperCase().trim() === 'SALES');
    if (!salesRow) return null;

    const salesValuesReversed = [...salesRow.values].map(v => Math.abs(Number(v) || 0));
    // El orden actual de 'months' y 'values' es Dic -> Ene (revertido por el usuario)
    // Para el ML necesitamos orden cronológico: Ene -> Dic
    const salesValuesOrdered = [...salesValuesReversed].reverse();
    const monthsOrdered = [...months].reverse();

    const totalSales = salesValuesReversed.reduce((a, b) => a + b, 0);
    if (totalSales === 0) return null;

    // Ejecutar ML Forecast
    const mlData = forecastSales(salesValuesOrdered, monthsOrdered);

    // Timeline para gráficos (Combinando histórico y predicción)
    const timeline = mlData.map(p => ({
      name: p.date,
      historical: p.historical,
      predicted: p.predicted
    }));

    return {
      timeline,
      stats: {
        totalSales,
        avgSales: totalSales / months.length,
        stdDev: 4.2
      }
    };
  }, [data, months, forecastGrowth, selectedCountry]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-sans tabular-nums">
      <div className="bg-[#0f172a] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-4 border-[#00843D]/20">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-7">
            <div className="p-5 bg-[#00843D] rounded-[1.8rem] shadow-2xl">
              <BrainCircuit size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                COCLPKI <span className="text-[#00843D] not-italic">P&L Dashboard</span>
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Segmented Financial Analysis - monthly_db.json</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              {(['Global', 'Peru', 'Mexico', 'Colombia'] as Country[]).map(c => (
                <button
                  key={c}
                  onClick={() => { setSelectedCountry(c); setSelectedCity('all'); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCountry === c ? 'bg-[#00843D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:border-[#00843D]/50"
            >
              <option value="all" className="bg-slate-900">Todas las ciudades</option>
              {availableCities
                .filter(city => selectedCountry === 'Global' || (city === 'Lima' || city === 'Piura' ? selectedCountry === 'Peru' : city === 'Bogota' ? selectedCountry === 'Colombia' : selectedCountry === 'Mexico'))
                .map(city => (
                  <option key={city} value={city} className="bg-slate-900">{city}</option>
                ))}
            </select>

            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:border-[#00843D]/50"
            >
              <option value="total" className="bg-slate-900">Línea: Total</option>
              <option value="Scheduled orders" className="bg-slate-900">Línea: Scheduled</option>
              <option value="On demand orders" className="bg-slate-900">Línea: On Demand</option>
              <option value="Franchises" className="bg-slate-900">Línea: Franchises</option>
            </select>

            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-[#00843D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Tabla</button>
              <button onClick={() => setViewMode('forecast')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'forecast' ? 'bg-[#00843D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Forecast</button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-left-5">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-white">
                  <th className="p-8 text-[11px] font-black uppercase tracking-widest sticky left-0 bg-[#0f172a] z-50 min-w-[320px]">Concepto</th>
                  <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-center">UND</th>
                  {months.map((m, i) => <th key={i} className="p-8 text-[13px] font-black text-center text-[#00843D] whitespace-nowrap">{m}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupedData.map((group, gIdx) => {
                  const labelKey = group.header.label.toUpperCase().trim();
                  const isExpanded = expandedSections[labelKey] ?? false;
                  const rowStyle = metricStyles[labelKey] || '';

                  return (
                    <React.Fragment key={gIdx}>
                      <tr className={`hover:bg-slate-50 transition-all cursor-pointer ${rowStyle}`} onClick={() => toggleSection(group.header.label)}>
                        <td className="p-7 text-[14px] font-black italic uppercase sticky left-0 z-10 bg-inherit flex items-center gap-5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-[#00843D] text-white shadow-md' : 'bg-slate-200'}`}>
                            {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
                          </div>
                          <span className={Object.keys(metricStyles).includes(labelKey) ? 'text-slate-900 border-b-2 border-[#00843D]/20' : ''}>{group.header.label}</span>
                        </td>
                        <td className="p-7 text-[10px] font-black text-slate-300 text-center uppercase">{group.header.unit}</td>
                        {group.header.values.map((val: any, vIdx: number) => (
                          <td key={vIdx} className="p-7 text-right font-black text-[17px] text-slate-900">
                            {typeof val === 'number' ? (
                              formatCurrency(val, selectedCountry)
                            ) : val}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && group.children.map((child, cIdx) => (
                        <tr key={cIdx} className="hover:bg-emerald-50/20 bg-slate-50/30">
                          <td className="p-5 text-[11px] font-bold text-slate-500 pl-16 sticky left-0 bg-inherit uppercase tracking-tight">{child.label}</td>
                          <td className="p-5 text-[9px] font-black text-slate-300 text-center uppercase">{child.unit}</td>
                          {child.values.map((val: any, vIdx: number) => (
                            <td key={vIdx} className="p-5 text-right text-[15px] font-bold text-slate-400">
                              {typeof val === 'number' ? formatCurrency(val, selectedCountry) : val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-2">
              <h3 className="text-xl font-black italic text-slate-900 uppercase">Crecimiento Proyectado</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajuste de presupuesto para análisis de escenarios</p>
            </div>
            <div className="flex items-center gap-10 bg-slate-50 px-12 py-7 rounded-[2.5rem] min-w-[400px]">
              <div className="text-4xl font-black text-[#00843D] italic">+{forecastGrowth}%</div>
              <input type="range" min="0" max="100" step="1" value={forecastGrowth} onChange={(e) => setForecastGrowth(Number(e.target.value))} className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00843D]" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[550px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics?.timeline}>
                  <defs>
                    <linearGradient id="colorSalesHist" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00843D" stopOpacity={0.15} /><stop offset="95%" stopColor="#00843D" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorSalesPred" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    formatter={(v: any, name?: string) => [formatCurrency(Number(v) || 0, selectedCountry), name === 'historical' ? 'Real 2025' : 'ML Prediction 2026']}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Area type="monotone" name="historical" dataKey="historical" stroke="#00843D" fill="url(#colorSalesHist)" strokeWidth={4} />
                  <Area type="monotone" name="predicted" dataKey="predicted" stroke="#6366f1" fill="url(#colorSalesPred)" strokeWidth={4} strokeDasharray="8 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border-4 border-[#00843D]/20">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Ventas Totales (Periodo)</p>
                <h3 className="text-4xl font-black italic tracking-tighter text-[#00843D]">{formatCurrency(analytics?.stats.totalSales || 0, selectedCountry)}</h3>
                <div className="mt-8 flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                  <ArrowUpRight size={20} className="text-emerald-500" />
                  <span className="text-[11px] font-bold uppercase">Promedio Mensual: <span className="text-emerald-400 italic">{formatCurrency(analytics?.stats.avgSales || 0, selectedCountry)}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }</div>
  );
};

export default GlobalPnL;
