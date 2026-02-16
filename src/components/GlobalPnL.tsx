
import React, { useState, useMemo } from 'react';
import { PnLRow } from '../types';
import { 
  Loader2, Plus, Minus, ChevronRight, Table as TableIcon, ArrowUpRight, Target, BrainCircuit, CalendarDays, Activity, LineChart as LineChartIcon, Sparkles, ShieldCheck, Percent, TrendingDown, TrendingUp, Zap, BarChart3, Users, Scale, AlertCircle
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Area } from 'recharts';

interface GlobalPnLProps {
  data: PnLRow[];
  loading: boolean;
  months: string[];
}

const GlobalPnL: React.FC<GlobalPnLProps> = ({ data, loading, months }) => {
  const [viewMode, setViewMode] = useState<'table' | 'dashboard' | 'forecast'>('table');
  const [forecastGrowth, setForecastGrowth] = useState<number>(15);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'GLOBAL': true, 'SALES': true, 'REVENUE': true, 'NET REVENUE': true, 'CONTRIBUTION MARGIN': true, 'PAYROLL': true, 'EBITDA': true, 'COGS': true
  });

  const toggleSection = (label: string) => {
    const key = label.toUpperCase().trim();
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []; 
    const groups: { header: PnLRow; children: PnLRow[] }[] = [];
    let currentGroup: { header: PnLRow; children: PnLRow[] } | null = null;
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

  const analytics = useMemo(() => {
    if (!data || data.length === 0 || !months || months.length === 0) return null;

    const salesRow = data.find(r => r.label.toUpperCase().trim() === 'SALES');
    if (!salesRow) return null;

    const sales2025 = [...salesRow.values].reverse().map(v => Math.abs(Number(v) || 0));
    const totalSales2025 = sales2025.reduce((a, b) => a + b, 0);
    
    if (totalSales2025 === 0) return null;

    const seasonalCoefficients = sales2025.map(v => v / totalSales2025);
    const chronologicalMonths = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    const timeline2025 = chronologicalMonths.map((m, idx) => {
      const sales = sales2025[idx];
      return { name: `${m} 2025`, year: '2025', sales, revenue: sales * 0.94 };
    });

    const growthFactor = 1 + (forecastGrowth / 100);
    const projectedAnnualSales = totalSales2025 * growthFactor;

    const timeline2026 = chronologicalMonths.map((m, idx) => {
      const projectedSales = projectedAnnualSales * seasonalCoefficients[idx];
      const netRevenue = projectedSales * 0.94;
      const totalCogs = netRevenue * 0.83;
      const grossMargin = netRevenue - totalCogs;
      const payrollTotal = (totalSales2025 / 12 * 0.12) + (projectedSales * 0.03);
      const ebitda = grossMargin - payrollTotal;

      return {
        name: `${m} 2026`,
        year: '2026',
        sales: Number(projectedSales.toFixed(0)),
        revenue: Number(netRevenue.toFixed(0)),
        ebitda: Number(ebitda.toFixed(0)),
        cmPercent: Number(((grossMargin / netRevenue) * 100).toFixed(1))
      };
    });

    return {
      combinedTimeline: [...timeline2025, ...timeline2026],
      stats: {
        totalSales2026: timeline2026.reduce((sum, d) => sum + d.sales, 0),
        avgCM: timeline2026.reduce((sum, d) => sum + d.cmPercent, 0) / 12,
        totalEbitda: timeline2026.reduce((sum, d) => sum + d.ebitda, 0),
        stdDev: 4.2
      }
    };
  }, [data, months, forecastGrowth]);

  if (loading) return null;

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
                  Predictive <span className="text-[#00843D] not-italic">Suite v10.2</span>
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Data Intelligence & Financial Analysis</p>
              </div>
           </div>
           
           <div className="flex bg-white/5 p-2 rounded-3xl border border-white/10 backdrop-blur-md gap-2">
              <button onClick={() => setViewMode('table')} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-[#00843D] text-white' : 'text-slate-400'}`}>P&L 2025</button>
              <button onClick={() => setViewMode('forecast')} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'forecast' ? 'bg-[#00843D] text-white' : 'text-slate-400'}`}>Forecast 2026</button>
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
                  {months.map((m, i) => <th key={i} className="p-8 text-[13px] font-black text-center text-[#00843D]">{m}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupedData.map((group, gIdx) => {
                  const labelKey = group.header.label.toUpperCase().trim();
                  const isExpanded = expandedSections[labelKey] ?? false;
                  return (
                    <React.Fragment key={gIdx}>
                      <tr className="hover:bg-slate-50 transition-all cursor-pointer" onClick={() => toggleSection(group.header.label)}>
                        <td className="p-7 text-[14px] font-black italic uppercase sticky left-0 z-10 bg-white flex items-center gap-5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-[#00843D] text-white shadow-md' : 'bg-slate-200'}`}>
                            {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
                          </div>
                          <span>{group.header.label}</span>
                        </td>
                        <td className="p-7 text-[10px] font-black text-slate-300 text-center">{group.header.unit}</td>
                        {group.header.values.map((val, vIdx) => (
                          <td key={vIdx} className="p-7 text-right font-bold text-[17px] text-slate-900">
                            {typeof val === 'number' ? val.toLocaleString(undefined, { minimumFractionDigits: 0 }) : val}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && group.children.map((child, cIdx) => (
                        <tr key={cIdx} className="hover:bg-emerald-50/20">
                          <td className="p-5 text-[12px] font-semibold text-slate-500 pl-16 sticky left-0 bg-white uppercase">{child.label}</td>
                          <td className="p-5 text-[10px] font-bold text-slate-200 text-center uppercase">{child.unit}</td>
                          {child.values.map((val, vIdx) => (
                            <td key={vIdx} className="p-5 text-right text-[15px] font-medium text-slate-400">
                              {typeof val === 'number' ? val.toLocaleString() : val}
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
                 <h3 className="text-xl font-black italic text-slate-900 uppercase">Multiplicador Estratégico</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crecimiento aplicado a la base operativa 2026</p>
              </div>
              <div className="flex items-center gap-10 bg-slate-50 px-12 py-7 rounded-[2.5rem] min-w-[400px]">
                 <div className="text-4xl font-black text-[#00843D] italic">+{forecastGrowth}%</div>
                 <input type="range" min="0" max="100" step="1" value={forecastGrowth} onChange={(e) => setForecastGrowth(Number(e.target.value))} className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00843D]" />
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[550px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={analytics?.combinedTimeline}>
                      <defs>
                        <linearGradient id="colorSalesReal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.15}/><stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorSalesForecast" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00843D" stopOpacity={0.15}/><stop offset="95%" stopColor="#00843D" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} interval={2} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(v) => `$${v/1000000}M`} />
                      <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Sales']} />
                      <Area type="monotone" name="2025 Sales" dataKey={(d) => d.year === '2025' ? d.sales : null} stroke="#cbd5e1" fill="url(#colorSalesReal)" strokeWidth={2} />
                      <Area type="monotone" name="2026 Sales" dataKey={(d) => d.year === '2026' ? d.sales : null} stroke="#00843D" fill="url(#colorSalesForecast)" strokeWidth={4} />
                   </ComposedChart>
                 </ResponsiveContainer>
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border-4 border-[#00843D]/20">
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Target Bruto 2026</p>
                    <h3 className="text-4xl font-black italic tracking-tighter text-[#00843D]">${analytics?.stats.totalSales2026.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    <div className="mt-8 flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                       <ArrowUpRight size={20} className="text-emerald-500" />
                       <span className="text-[11px] font-bold uppercase">EBITDA Est: <span className="text-emerald-400 italic">${analytics?.stats.totalEbitda.toLocaleString()}</span></span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GlobalPnL;
