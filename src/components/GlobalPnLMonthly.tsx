'use client';

import React, { useState, useMemo } from 'react';
import {
  Loader2, Plus, Minus, ChevronRight, Table as TableIcon, ArrowUpRight, Target, BrainCircuit, CalendarDays, Activity, LineChart as LineChartIcon, Sparkles, ShieldCheck, Percent, TrendingDown, TrendingUp, Zap, BarChart3, Users, Scale, AlertCircle
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Area, Legend } from 'recharts';
import { Country, PnLRow } from '../types';
import { formatCurrency } from '@/lib/currencyUtils';

interface GlobalPnLMonthlyProps {
  country?: Country;
}

const GlobalPnLMonthly: React.FC<GlobalPnLMonthlyProps> = ({ country: initialCountry = 'Global' }) => {
  const [viewMode, setViewMode] = useState<'table' | 'dashboard'>('table');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'SALES': true, 'REVENUE': true, 'NET REVENUE': true, 'COGS': true, 'GROSS MARGIN': true, 'MARKETING COST': true, 'SALES PAYROLL': true, 'CONTRIBUTION MARGIN': true, 'PAYROLL': true, 'TAX EXPENSES': true, 'EBITDA': true, 'BURN RATE': true
  });

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Datos estáticos de pnl_db.json
  const pnlData = useMemo(() => {
    const data: Record<string, number[]> = {
      'SALES': [139288.81, 295272.24, 351953.54, 292997.21, 351320.26, 312326.53, 326069.80, 351590.25, 353677.74, 362831.67, 355191.84, 237863.69],
      'REVENUE': [323307.75, 326240.38, 380145.27, 337381.02, 396628.17, 357721.75, 382046.55, 395178.61, 404276.29, 408988.90, 398527.66, 294896.25],
      'SALES REDUCTION': [24252.70, 23634.70, 27419.29, 20140.04, 24488.55, 22460.32, 22789.09, 22338.51, 22948.49, 21747.30, 22704.63, 15518.10],
      'NET REVENUE': [299055.05, 302605.68, 352725.98, 317240.98, 372139.62, 335261.43, 359257.47, 372840.11, 381327.79, 387241.60, 375823.03, 279378.16],
      'COGS': [-205661.01, -217150.10, -261156.34, -234880.01, -264872.60, -250628.91, -274147.04, -284456.12, -291635.21, -296210.11, -289025.55, -212157.50],
      'GROSS MARGIN': [93394.04, 85455.57, 91569.64, 82360.97, 107267.02, 84632.52, 85110.42, 88383.99, 89692.58, 91031.49, 86797.49, 67220.66],
      'MARKETING COST': [-23047, -18674, -20036, -21026, -22651, -15693, -19355, -19434, -12779, -11319, -10994, -7221],
      'SALES PAYROLL': [4262084, 4416413, 4142996, 4525536, 4964339, 5359772, 4547553, 4871725, 4908848, 4908390, 4907554, 4544784],
      'CONTRIBUTION MARGIN': [4332431.13, -4349631.65, -4071462.64, -4464201.37, -4879723.00, -5290832.38, -4481797.12, -4802775.39, -4831934.63, -4828677.87, -4831751.06, -4484783.92],
      'PAYROLL': [-41949.20, -41286.72, -41028.53, -42651.01, -42532.63, -42306.86, -42524.44, -44265.89, -43702.70, -42002.94, -40825.42, -38866.08],
      'TAX EXPENSES': [0, 0, -7006.53, -10545.39, -2607.83, -1500.06, -1515.00, -1431.00, -1790.00, -1440.00, -1349.00, -1083.00],
      'EBITDA': [32345.73, 20773.94, 5126.34, -12246.69, 19078.47, 7401.32, 5942.76, 4482.98, 14554.66, 17623.71, 16280.79, 3620.77],
      'BURN RATE': [32254.07, 13440.50, 4353.90, -36490.46, -1740.89, -15533.58, -27244.91, -16766.88, -13095.40, -6786.21, 17582.19, 6809.37]
    };
    return data;
  }, []);

  const toggleSection = (label: string) => {
    const key = label.toUpperCase().trim();
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const metricStyles: Record<string, string> = {
    'SALES': 'border-l-4 border-emerald-500 bg-emerald-50/10',
    'REVENUE': 'border-l-4 border-blue-500 bg-blue-50/10',
    'COGS': 'border-l-4 border-slate-500 bg-slate-50/10',
    'GROSS MARGIN': 'border-l-4 border-indigo-500 bg-indigo-50/10',
    'MARKETING COST': 'border-l-4 border-orange-500 bg-orange-50/10',
    'SALES PAYROLL': 'border-l-4 border-purple-500 bg-purple-50/10',
    'CONTRIBUTION MARGIN': 'border-l-4 border-teal-500 bg-teal-50/10',
    'PAYROLL': 'border-l-4 border-rose-500 bg-rose-50/10',
    'TAX EXPENSES': 'border-l-4 border-red-500 bg-red-50/10',
    'EBITDA': 'border-l-4 border-amber-500 bg-amber-50/10',
    'BURN RATE': 'border-l-4 border-red-600 bg-red-50/10',
    'NET REVENUE': 'border-l-4 border-cyan-500 bg-cyan-50/10',
    'SALES REDUCTION': 'border-l-4 border-yellow-500 bg-yellow-50/10',
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-sans tabular-nums">
      <div className="bg-[#0f172a] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-4 border-[#00843D]/20">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-7">
            <div className="p-5 bg-[#00843D] rounded-[1.8rem] shadow-2xl">
              <CalendarDays size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                MONTHLY <span className="text-[#00843D] not-italic">P&L DASHBOARD</span>
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Direct Data from pnl_db.json - 2025 Actual</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-[#00843D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Tabla</button>
              <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'dashboard' ? 'bg-[#00843D] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Dashboard</button>
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
                  <th className="p-8 text-[11px] font-black uppercase tracking-widest sticky left-0 bg-[#0f172a] z-50 min-w-[280px]">Concepto</th>
                  <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-center">UND</th>
                  {months.map((m, i) => <th key={i} className="p-8 text-[13px] font-black text-center text-[#00843D] whitespace-nowrap">{m}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(pnlData).map(([label, values], idx) => {
                  const labelKey = label.toUpperCase().trim();
                  const isExpanded = expandedSections[labelKey] ?? false;
                  const rowStyle = metricStyles[labelKey] || '';

                  return (
                    <React.Fragment key={idx}>
                      <tr className={`hover:bg-slate-50 transition-all cursor-pointer ${rowStyle}`} onClick={() => toggleSection(label)}>
                        <td className="p-7 text-[14px] font-black italic uppercase sticky left-0 z-10 bg-inherit flex items-center gap-5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-[#00843D] text-white shadow-md' : 'bg-slate-200'}`}>
                            {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
                          </div>
                          <span className={Object.keys(metricStyles).includes(labelKey) ? 'text-slate-900 border-b-2 border-[#00843D]/20' : ''}>{label}</span>
                        </td>
                        <td className="p-7 text-[10px] font-black text-slate-300 text-center uppercase">USD</td>
                        {values.map((val, vIdx) => (
                          <td key={vIdx} className="p-7 text-right font-black text-[17px] text-slate-900">
                            {formatCurrency(val, 'Global')}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'SALES', key: 'SALES', icon: '📊', color: 'emerald' },
              { label: 'REVENUE', key: 'REVENUE', icon: '💰', color: 'blue' },
              { label: 'GROSS MARGIN', key: 'GROSS MARGIN', icon: '📈', color: 'indigo' },
              { label: 'NET REVENUE', key: 'NET REVENUE', icon: '🎯', color: 'cyan' },
              { label: 'EBITDA', key: 'EBITDA', icon: '⚡', color: 'amber' },
              { label: 'CONTRIBUTION MARGIN', key: 'CONTRIBUTION MARGIN', icon: '🎪', color: 'teal' },
            ].map((metric) => {
              const values = pnlData[metric.key] || [];
              const total = values.reduce((a, b) => a + b, 0);
              const avg = total / values.length;
              const maxVal = Math.max(...values);
              const minVal = Math.min(...values);

              const colorClass = {
                emerald: 'from-emerald-500 to-green-600',
                blue: 'from-blue-500 to-cyan-600',
                indigo: 'from-indigo-500 to-purple-600',
                cyan: 'from-cyan-500 to-blue-600',
                amber: 'from-amber-500 to-orange-600',
                teal: 'from-teal-500 to-cyan-600',
              }[metric.color] || 'from-slate-500 to-slate-600';

              return (
                <div key={metric.key} className={`bg-gradient-to-br ${colorClass} rounded-[2rem] p-8 text-white shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{metric.icon}</span>
                    <span className="text-2xl font-black">{metric.label}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs opacity-80 uppercase tracking-widest">Total Anual</p>
                      <p className="text-2xl font-black">{formatCurrency(total, 'Global')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/30">
                      <div>
                        <p className="text-xs opacity-80 uppercase">Promedio</p>
                        <p className="text-lg font-bold">{formatCurrency(avg, 'Global')}</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-80 uppercase">Máximo</p>
                        <p className="text-lg font-bold">{formatCurrency(maxVal, 'Global')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen Ejecutivo */}
          <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-[2rem] p-8 text-white shadow-xl border border-slate-700/50">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <Activity size={24} className="text-[#00843D]" />
              Resumen Ejecutivo 2025
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Ventas Totales', value: pnlData['SALES'].reduce((a, b) => a + b, 0), color: 'text-emerald-400' },
                { label: 'Ingresos Totales', value: pnlData['REVENUE'].reduce((a, b) => a + b, 0), color: 'text-blue-400' },
                { label: 'EBITDA Total', value: pnlData['EBITDA'].reduce((a, b) => a + b, 0), color: 'text-amber-400' },
                { label: 'Margen Contribución', value: pnlData['CONTRIBUTION MARGIN'].reduce((a, b) => a + b, 0), color: 'text-teal-400' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{formatCurrency(stat.value, 'Global')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalPnLMonthly;
