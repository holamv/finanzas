'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
  PieChart as PieIcon,
  Calendar,
  Filter,
  DollarSign,
  Search,
  ArrowRight,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Country, ReconciliationResult } from '../types';
import { getSalesData, getOCData, SalesRecord, OCRecord } from '@/services/cashFlowService';

interface CockpitProps {
  recon: ReconciliationResult[];
  country: Country;
}

const CockpitDashboard: React.FC<CockpitProps> = ({ recon, country }) => {
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [ocs, setOcs] = useState<OCRecord[]>([]);
  const [pnlMonthly, setPnlMonthly] = useState<any[]>([]);
  const [pnlMonthsLabels, setPnlMonthsLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de fecha
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [salesData, ocsData, pnlRes] = await Promise.all([
          getSalesData(),
          getOCData(),
          fetch(`/api/monthly-pnl?country=${country}&city=all&line=total`).then(res => res.json())
        ]);
        setSales(salesData);
        setOcs(ocsData);
        if (pnlRes.pnl_data) {
          setPnlMonthly(pnlRes.pnl_data);
          setPnlMonthsLabels(pnlRes.months || []);
        }
      } catch (error) {
        console.error("Error loading cockpit data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [country]);

  // Siempre mostrar $ sin conversión de tasas
  const symbol = '$';

  // Filtrado por fecha y país
  const filteredSales = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sales.filter(s => {
      const d = new Date(s.fecha);
      const inDateRange = d >= start && d <= end;
      const countryMatch = country === 'Global' || (s.pais && s.pais.toLowerCase().includes(country.toLowerCase()));
      return inDateRange && countryMatch;
    });
  }, [sales, startDate, endDate, country]);

  const filteredOcs = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return ocs.filter(o => {
      const d = new Date(o.fecha);
      const inDateRange = d >= start && d <= end;
      const countryMatch = country === 'Global' || (o.pais && o.pais.toLowerCase().includes(country.toLowerCase()));
      return inDateRange && countryMatch;
    });
  }, [ocs, startDate, endDate, country]);

  // Cálculos Core
  // Filtrado de Reconciliación por País
  const filteredRecon = useMemo(() => {
    if (country === 'Global') return recon;
    const codeMap: Record<string, string> = {
      'Peru': 'PE',
      'Colombia': 'CO',
      'Mexico': 'MX'
    };
    const targetCode = codeMap[country];
    return recon.filter(r => r.PAIS === targetCode || r.PAIS === country);
  }, [recon, country]);

  // Calcular totales sin conversión de tasas (valores globales en $)
  const totalInflows = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.monto, 0);
  }, [filteredSales]);

  const totalOutflows = useMemo(() => {
    return filteredOcs.reduce((sum, o) => sum + o.monto, 0);
  }, [filteredOcs]);

  const cxc = totalInflows;
  const cxp = totalOutflows;

  const cashReconciled = filteredRecon.filter(r => r.ESTADO === 'Si está').reduce((sum, r) => {
    const isOut = r.ORIGEN?.toLowerCase().includes('pago') || r.ID.toString().startsWith('OC');
    const rawAmount = r.MONTO || 0;
    return isOut ? sum - rawAmount : sum + rawAmount;
  }, 0);

  const reconRate = filteredRecon.length > 0
    ? (filteredRecon.filter(r => r.ESTADO === 'Si está').length / filteredRecon.length) * 100
    : 0;

  // Datos para gráfico de tendencias (agrupar por fecha, sin conversión)
  const trendData = useMemo(() => {
    const days: Record<string, { date: string, inflows: number, outflows: number }> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().split('T')[0];
      days[ds] = { date: ds, inflows: 0, outflows: 0 };
    }

    filteredSales.forEach(s => {
      if (days[s.fecha]) days[s.fecha].inflows += s.monto;
    });

    filteredOcs.forEach(o => {
      if (days[o.fecha]) days[o.fecha].outflows += o.monto;
    });

    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, filteredOcs, startDate, endDate]);

  // Formatear datos de P&L de la BD para gráficos
  const formattedPnlData = useMemo(() => {
    if (!pnlMonthly.length || !pnlMonthsLabels.length) return [];

    return pnlMonthsLabels.map((month, idx) => {
      const dataPoint: any = { month };
      pnlMonthly.forEach(cat => {
        dataPoint[cat.category] = cat.values[idx];
      });
      return dataPoint;
    });
  }, [pnlMonthly, pnlMonthsLabels]);

  // Datos para gráfico de comparación EBITDA vs Contribution Margin
  const pnlData = useMemo(() => {
    // Si tenemos datos de la DB, usamos el último mes para este gráfico rápido
    if (formattedPnlData.length > 0) {
      const lastMonth = formattedPnlData[formattedPnlData.length - 2] || formattedPnlData[formattedPnlData.length - 1];
      return [
        { name: 'EBITDA', value: lastMonth['EBITDA'] || 0 },
        { name: 'Contribution Margin', value: lastMonth['Contribution margin'] || 0 },
      ];
    }
    return [
      { name: 'EBITDA', value: 0 },
      { name: 'Contribution Margin', value: 0 },
    ];
  }, [formattedPnlData]);

  const radialData = [
    { name: 'Conciliado', value: reconRate, fill: '#10b981' }
  ];

  // Calcular métricas P&L del último mes disponible
  const lastMonthRevenue = useMemo(() => {
    if (formattedPnlData.length === 0) return 0;
    const lastMonth = formattedPnlData[formattedPnlData.length - 2] || formattedPnlData[formattedPnlData.length - 1];
    return lastMonth['Revenue'] || 0;
  }, [formattedPnlData]);

  const lastMonthGrossMargin = useMemo(() => {
    if (formattedPnlData.length === 0) return 0;
    const lastMonth = formattedPnlData[formattedPnlData.length - 2] || formattedPnlData[formattedPnlData.length - 1];
    return lastMonth['Gross Margin'] || 0;
  }, [formattedPnlData]);

  const lastMonthEBITDA = useMemo(() => {
    if (formattedPnlData.length === 0) return 0;
    const lastMonth = formattedPnlData[formattedPnlData.length - 2] || formattedPnlData[formattedPnlData.length - 1];
    return lastMonth['EBITDA'] || 0;
  }, [formattedPnlData]);

  const lastMonthCOGS = useMemo(() => {
    if (formattedPnlData.length === 0) return 0;
    const lastMonth = formattedPnlData[formattedPnlData.length - 2] || formattedPnlData[formattedPnlData.length - 1];
    return lastMonth['COGS'] || 0;
  }, [formattedPnlData]);

  const lastMonthSales = useMemo(() => {
    if (formattedPnlData.length === 0) return 0;
    const lastMonth = formattedPnlData[formattedPnlData.length - 2] || formattedPnlData[formattedPnlData.length - 1];
    return lastMonth['Sales'] || 0;
  }, [formattedPnlData]);

  const lastMonthContributionMargin = useMemo(() => {
    if (formattedPnlData.length === 0) return 0;
    const lastMonth = formattedPnlData[formattedPnlData.length - 2] || formattedPnlData[formattedPnlData.length - 1];
    return lastMonth['Contribution margin'] || 0;
  }, [formattedPnlData]);

  const stats = [
    { label: 'Sales', value: lastMonthSales, icon: <DollarSign />, color: 'text-purple-500', bg: 'bg-purple-50', trend: 'sales' },
    { label: 'Revenue', value: lastMonthRevenue, icon: <Wallet />, color: 'text-indigo-500', bg: 'bg-indigo-50', trend: 'revenue' },
    { label: 'Gross Margin', value: lastMonthGrossMargin, icon: <TrendingUp />, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: 'grossMargin' },
    { label: 'EBITDA', value: lastMonthEBITDA, icon: <Activity />, color: 'text-blue-500', bg: 'bg-blue-50', trend: 'ebitda' },
    { label: 'COGS', value: lastMonthCOGS, icon: <TrendingDown />, color: 'text-rose-500', bg: 'bg-rose-50', trend: 'cogs' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B14F] mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Torre de Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 gap-6">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">Control <span className="text-[#00B14F]">Torre</span> v0</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Visión consolidada de {country}</p>
        </div>

        {/* Filtro de Fechas */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
          <div className="flex items-center gap-3 px-4">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none"
            />
          </div>
          <ArrowRight size={14} className="text-slate-300" />
          <div className="flex items-center gap-3 px-4">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none"
            />
          </div>
          <div className="bg-white p-2 rounded-full shadow-sm">
            <Filter size={14} className="text-[#00B14F]" />
          </div>
        </div>
      </div>

      {/* P&L Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {React.cloneElement(s.icon as any, { size: 80 })}
            </div>
            <div className={`p-4 rounded-2xl ${s.bg} ${s.color} w-fit mb-6 group-hover:scale-110 transition-transform`}>{s.icon}</div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className={`text-2xl font-black italic tracking-tighter ${s.color === 'text-slate-900' ? 'text-slate-900' : ''}`}>
              ${s.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        ))}
      </div>



      {/* NUEVA SECCION: P&L Performance (desde monthly_db.json) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] opacity-50"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 relative z-10">
            <div>
              <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                <TrendingUp size={18} className="text-emerald-500" /> Rendimiento P&L Histórico
              </h4>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Métricas oficiales desde Base de Datos Consolidada (Accrual)</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 min-w-[140px]">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Gross Margin Avg</p>
                <p className="text-xl font-black italic tracking-tighter text-slate-900">
                  {(formattedPnlData.reduce((acc, curr) => acc + (curr['Gross Margin'] / (curr['Revenue'] || 1)), 0) / (formattedPnlData.length || 1) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-900 rounded-3xl min-w-[140px] text-white">
                <p className="text-[8px] font-black opacity-50 uppercase mb-1">EBITDA Margin</p>
                <p className="text-xl font-black italic tracking-tighter text-emerald-400">
                  {(formattedPnlData.reduce((acc, curr) => acc + (curr['EBITDA'] / (curr['Revenue'] || 1)), 0) / (formattedPnlData.length || 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedPnlData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  formatter={(v: any) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Area type="monotone" dataKey="Sales" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Gross Margin" stroke="#fbbf24" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="EBITDA" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEbitda)" />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Cockpit P&L Detallado */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <PieIcon size={16} className="text-[#00B14F]" /> Rentabilidad Consolidada
            </h4>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button className="px-4 py-1.5 text-[8px] font-black uppercase bg-white rounded-lg shadow-sm">Real</button>
              <button className="px-4 py-1.5 text-[8px] font-black uppercase text-slate-400">Proyectado</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="p-7 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Gross Margin %</p>
              <div className="flex items-end gap-3">
                <h5 className="text-3xl font-black italic tracking-tighter text-slate-900">
                  {lastMonthRevenue > 0 ? ((lastMonthGrossMargin / lastMonthRevenue) * 100).toFixed(1) : '0.0'}%
                </h5>
                <div className="mb-1 flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                  <TrendingUp size={12} />
                </div>
              </div>
            </div>
            <div className="p-7 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
              <p className="text-[9px] font-black opacity-60 uppercase mb-2">Contribution Margin</p>
              <h5 className="text-3xl font-black italic tracking-tighter text-emerald-400">
                ${lastMonthContributionMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h5>
            </div>
          </div>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                  {pnlData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#fbbf24'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CockpitDashboard;
