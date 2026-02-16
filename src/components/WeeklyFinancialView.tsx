'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Truck,
  Calendar,
  BarChart3,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Country } from '@/types';
import {
  getWeeklyFinancialData,
  getCountryMetrics,
  WeeklyFinancialData,
  cityToCountry
} from '@/services/weeklyFinancialService';
import { formatCurrency } from '@/lib/currencyUtils';

interface WeeklyFinancialViewProps {
  selectedCountry: Country;
}

const WeeklyFinancialView: React.FC<WeeklyFinancialViewProps> = ({ selectedCountry }) => {
  const [weeklyData, setWeeklyData] = useState<WeeklyFinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Función para formatear fecha (solo fecha, sin hora)
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getWeeklyFinancialData();
      setWeeklyData(data);
      console.log('Weekly Financial Data loaded:', data);
    } catch (error) {
      console.error('Error loading Weekly Financial Data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener métricas del país seleccionado
  const countryMetrics = useMemo(() => {
    if (!weeklyData) return null;
    return getCountryMetrics(weeklyData, selectedCountry);
  }, [weeklyData, selectedCountry]);

  // Datos para gráficos con filtro de fechas
  const chartData = useMemo(() => {
    if (!countryMetrics) return [];

    let data = countryMetrics.weeks.map((week, idx) => ({
      week,
      sales: countryMetrics.totalSales[idx] || 0,
      catering: countryMetrics.totalCatering[idx] || 0,
      delivery: countryMetrics.totalDelivery[idx] || 0,
      margin: countryMetrics.avgGrossMargin[idx] || 0
    }));

    // Filtrar por rango de fechas si están definidas
    if (startDate || endDate) {
      data = data.filter(row => {
        const rowDate = new Date(row.week);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        return rowDate >= start && rowDate <= end;
      });
    }

    return data;
  }, [countryMetrics, startDate, endDate]);

  // Calcular totales y promedios
  const summary = useMemo(() => {
    if (!countryMetrics) return null;

    const totalSales = countryMetrics.totalSales.reduce((sum, v) => sum + (v || 0), 0);
    const totalCatering = countryMetrics.totalCatering.reduce((sum, v) => sum + (v || 0), 0);
    const totalDelivery = countryMetrics.totalDelivery.reduce((sum, v) => sum + (v || 0), 0);
    const avgMargin = countryMetrics.avgGrossMargin.reduce((sum, v) => sum + (v || 0), 0) / countryMetrics.avgGrossMargin.filter(v => v > 0).length;

    const weeksCount = countryMetrics.weeks.length;
    const avgWeeklySales = totalSales / weeksCount;

    // Calcular tendencia (últimas 4 vs primeras 4)
    const recent4 = countryMetrics.totalSales.slice(-4).reduce((sum, v) => sum + v, 0) / 4;
    const first4 = countryMetrics.totalSales.slice(0, 4).reduce((sum, v) => sum + v, 0) / 4;
    const trend = ((recent4 - first4) / first4) * 100;

    return {
      totalSales,
      totalCatering,
      totalDelivery,
      avgMargin,
      avgWeeklySales,
      weeksCount,
      trend
    };
  }, [countryMetrics]);

  // Datos por ciudad (solo del país seleccionado)
  const cityData = useMemo(() => {
    if (!weeklyData) return [];

    const cities = Object.keys(weeklyData.citiesData).filter(city => {
      if (selectedCountry === 'Global') return true;
      return cityToCountry(city) === selectedCountry;
    });

    return cities.map(city => {
      const metrics = weeklyData.citiesData[city as keyof typeof weeklyData.citiesData];
      if (!metrics) return null;

      const totalSales = metrics.Sales?.reduce((sum, v) => sum + (v || 0), 0) || 0;
      const totalCatering = metrics.Catering?.reduce((sum, v) => sum + (v || 0), 0) || 0;
      const totalDelivery = metrics.Delivery?.reduce((sum, v) => sum + (v || 0), 0) || 0;

      return {
        city,
        totalSales,
        totalCatering,
        totalDelivery,
        avgGrossMargin: metrics['Gross margin']?.reduce((sum, v) => sum + v, 0) / metrics['Gross margin'].length || 0
      };
    }).filter(Boolean);
  }, [weeklyData, selectedCountry]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">Cargando datos semanales...</p>
        </div>
      </div>
    );
  }

  if (!weeklyData || !countryMetrics) {
    return (
      <div className="bg-white rounded-[3rem] p-10 border border-slate-200 text-center">
        <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">Datos no disponibles</h3>
        <p className="text-sm text-slate-500 mb-4">
          No se pudieron cargar los datos del Weekly Financial Model.
        </p>
        <p className="text-xs text-slate-400">
          Verifica que el Apps Script esté publicado correctamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[3rem] p-10 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur rounded-2xl">
              <Database size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter">Weekly Financial Model</h1>
              <p className="text-purple-100 text-sm font-medium mt-1">
                Datos reales por semana • {countryMetrics.weeks.length} semanas registradas
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 mb-1">
              Total {selectedCountry}
            </p>
            <p className="text-4xl font-black italic tracking-tighter">${summary && formatCurrency(summary.totalSales, selectedCountry)}</p>
            {summary && summary.trend !== 0 && (
              <div className={`flex items-center gap-2 justify-end mt-2 ${summary.trend > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {summary.trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="text-sm font-bold">{summary.trend > 0 ? '+' : ''}{summary.trend.toFixed(1)}% tendencia</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Sales</p>
          </div>
          <p className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
            ${summary && formatCurrency(summary.totalSales, selectedCountry)}
          </p>
          <p className="text-xs font-bold text-slate-500">
            Promedio: ${summary && formatCurrency(summary.avgWeeklySales, selectedCountry)}/semana
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-indigo-50">
              <ShoppingBag size={20} className="text-indigo-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Catering</p>
          </div>
          <p className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
            ${summary && formatCurrency(summary.totalCatering, selectedCountry)}
          </p>
          <p className="text-xs font-bold text-slate-500">
            {summary && summary.totalSales ? ((summary.totalCatering / summary.totalSales) * 100).toFixed(1) : '0'}% del total
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Truck size={20} className="text-blue-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Delivery</p>
          </div>
          <p className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
            ${summary && formatCurrency(summary.totalDelivery, selectedCountry)}
          </p>
          <p className="text-xs font-bold text-slate-500">
            {summary && summary.totalSales ? ((summary.totalDelivery / summary.totalSales) * 100).toFixed(1) : '0'}% del total
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <BarChart3 size={20} className="text-emerald-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Margin</p>
          </div>
          <p className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
            {summary?.avgMargin.toFixed(1)}%
          </p>
          <p className="text-xs font-bold text-slate-500">
            Promedio ponderado
          </p>
        </div>
      </div>

      {/* Toggle View Mode y Filtros */}
      <div className="flex items-center justify-between gap-4">
        <div className="bg-white p-2 rounded-2xl border border-slate-200 flex gap-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'chart'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Gráficos
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tabla
          </button>
        </div>

        {/* Filtros de Fecha */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 transition-all"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Vista de Gráficos */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Sales */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-600" />
              Evolución de Sales
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '12px' }}
                    formatter={(value: number | undefined) => value !== undefined ? [formatCurrency(value, selectedCountry), 'Sales'] : [formatCurrency(0, selectedCountry), 'Sales']}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#9333ea" strokeWidth={3} dot={{ r: 5, fill: '#9333ea' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Catering vs Delivery */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-6 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-600" />
              Catering vs Delivery
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '12px' }}
                    formatter={(value: number | undefined) => value !== undefined ? [formatCurrency(value, selectedCountry), ''] : [formatCurrency(0, selectedCountry), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900 }} />
                  <Bar dataKey="catering" fill="#6366f1" radius={[8, 8, 0, 0]} name="Catering" />
                  <Bar dataKey="delivery" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Delivery" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Desglose por Ciudad */}
          {cityData.length > 1 && (
            <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm lg:col-span-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-6 flex items-center gap-2">
                <Database size={16} className="text-purple-600" />
                Comparación por Ciudad
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="city" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '12px' }}
                      formatter={(value: number | undefined) => value !== undefined ? [formatCurrency(value, selectedCountry), ''] : [formatCurrency(0, selectedCountry), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900 }} />
                    <Bar dataKey="totalSales" fill="#9333ea" radius={[8, 8, 0, 0]} name="Total Sales">
                      {cityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#9333ea' : '#a855f7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de Tabla */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-6 flex items-center gap-2">
            <Calendar size={16} className="text-purple-600" />
            Datos Semanales Detallados
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-600">Semana</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">Sales</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">Catering</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">Delivery</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatDate(row.week)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{formatCurrency(row.sales, selectedCountry)}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">{formatCurrency(row.catering, selectedCountry)}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">{formatCurrency(row.delivery, selectedCountry)}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-purple-700">{row.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-purple-50 border-t-2 border-purple-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-black uppercase text-purple-900">Total</td>
                  <td className="px-6 py-4 text-right text-lg font-black text-purple-900">${summary && formatCurrency(summary.totalSales, selectedCountry)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-purple-700">${summary && formatCurrency(summary.totalCatering, selectedCountry)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-purple-700">${summary && formatCurrency(summary.totalDelivery, selectedCountry)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-purple-900">{summary?.avgMargin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyFinancialView;
