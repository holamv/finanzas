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
  ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
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
        const [salesData, ocsData] = await Promise.all([
          getSalesData(),
          getOCData()
        ]);
        setSales(salesData);
        setOcs(ocsData);
      } catch (error) {
        console.error("Error loading cockpit data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCurrencySymbol = (c: Country) => {
    switch (c) {
      case 'Peru': return 'S/';
      case 'Colombia': return 'COP';
      case 'Mexico': return 'MXN';
      default: return '$';
    }
  };

  const symbol = getCurrencySymbol(country);

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

  const totalInflows = filteredSales.reduce((sum, s) => sum + s.monto, 0);
  const totalOutflows = filteredOcs.reduce((sum, o) => sum + o.monto, 0);

  const cxc = filteredSales.reduce((sum, s) => sum + s.monto, 0);
  const cxp = filteredOcs.reduce((sum, o) => sum + o.monto, 0);

  const cashReconciled = filteredRecon.filter(r => r.ESTADO === 'Si está').reduce((sum, r) => {
    const isOut = r.ORIGEN?.toLowerCase().includes('pago') || r.ID.toString().startsWith('OC');
    return isOut ? sum - (r.MONTO || 0) : sum + (r.MONTO || 0);
  }, 0);

  const reconRate = filteredRecon.length > 0
    ? (filteredRecon.filter(r => r.ESTADO === 'Si está').length / filteredRecon.length) * 100
    : 0;

  // Datos para gráfico de categorías P&L (simulado con datos reales)
  const pnlData = [
    { name: 'Ventas Directas', value: totalInflows },
    { name: 'Gastos Operativos', value: totalOutflows },
    { name: 'Neto Periodo', value: totalInflows - totalOutflows },
  ].sort((a, b) => b.value - a.value);

  const stats = [
    { label: 'Caja Real (Conciliado)', value: cashReconciled, icon: <Wallet />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Ingresos Maestros (Ventas)', value: totalInflows, icon: <TrendingUp />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Egresos Maestros (OC)', value: totalOutflows, icon: <TrendingDown />, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Ingresos Totales', value: totalInflows, icon: <DollarSign />, color: 'text-slate-900', bg: 'bg-slate-100' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
            <div className={`p-4 rounded-2xl ${s.bg} ${s.color} w-fit mb-6 group-hover:scale-110 transition-transform`}>{s.icon}</div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className={`text-2xl font-black italic tracking-tighter ${s.color === 'text-slate-900' ? 'text-slate-900' : ''}`}>
              {symbol} {Math.round(s.value).toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cockpit P&L */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-full">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <PieIcon size={16} className="text-[#00B14F]" /> Cockpit P&L Categorizado
            </h4>
            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-full">Análisis de Período</span>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#00B14F" radius={[0, 10, 10, 0]} barSize={24}>
                  {pnlData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00B14F' : index === 1 ? '#10b981' : '#34d399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado Conciliación y Alertas */}
        <div className="lg:col-span-4 space-y-8 h-full">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white h-[250px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><CheckCircle2 size={100} /></div>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Salud de Conciliación</p>
            <h3 className="text-5xl font-black italic tracking-tighter text-emerald-400">{reconRate.toFixed(1)}%</h3>
            <div className="w-full bg-white/10 h-2 rounded-full mt-6 overflow-hidden">
              <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${reconRate}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[300px] overflow-y-auto custom-scrollbar">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" /> Movimientos Destacados
            </h4>
            <div className="space-y-4">
              {filteredOcs.slice(0, 5).map((o, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-2 w-2 rounded-full bg-rose-500 group-hover:scale-150 transition-transform"></div>
                  <p className="text-[10px] font-bold text-slate-600 truncate flex-1 uppercase tracking-tight">{o.proveedor}</p>
                  <span className="text-[9px] font-black text-rose-500">{symbol}{Math.round(o.monto).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CockpitDashboard;
