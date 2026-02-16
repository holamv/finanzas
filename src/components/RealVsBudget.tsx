'use client';

import React, { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Target,
    Wallet,
    AlertCircle,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieIcon
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line
} from 'recharts';
import { Country } from '@/types';
import { formatCurrency } from '@/lib/currencyUtils';

interface RealVsBudgetProps {
    country: Country;
}

const RealVsBudget: React.FC<RealVsBudgetProps> = ({ country }) => {
    // Datos REALES 2025 de pnl_db.json
    const realData2025 = useMemo(() => ({
        SALES: [139288.81, 295272.24, 351953.54, 292997.21, 351320.26, 312326.53, 326069.80, 351590.25, 353677.74, 362831.67, 355191.84, 237863.69],
        REVENUE: [323307.75, 326240.38, 380145.27, 337381.02, 396628.17, 357721.75, 382046.55, 395178.61, 404276.29, 408988.90, 398527.66, 294896.25],
        EBITDA: [32345.73, 20773.94, 5126.34, -12246.69, 19078.47, 7401.32, 5942.76, 4482.98, 14554.66, 17623.71, 16280.79, 3620.77],
        CONTRIBUTION_MARGIN: [4332431.13, -4349631.65, -4071462.64, -4464201.37, -4879723.00, -5290832.38, -4481797.12, -4802775.39, -4831934.63, -4828677.87, -4831751.06, -4484783.92],
        BURN_RATE: [32254.07, 13440.50, 4353.90, -36490.46, -1740.89, -15533.58, -27244.91, -16766.88, -13095.40, -6786.21, 17582.19, 6809.37],
    }), []);

    // Datos FORECAST 2026 (Proyecciones con crecimiento del 15%)
    const forecast2026 = useMemo(() => {
        const growthRate = 1.15;
        return {
            SALES: realData2025.SALES.map(v => v * growthRate),
            REVENUE: realData2025.REVENUE.map(v => v * growthRate),
            EBITDA: realData2025.EBITDA.map(v => v * growthRate),
            CONTRIBUTION_MARGIN: realData2025.CONTRIBUTION_MARGIN.map(v => v * growthRate),
            BURN_RATE: realData2025.BURN_RATE.map(v => v * growthRate),
        };
    }, [realData2025]);

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Métricas a comparar
    const metricsComparison = useMemo(() => {
        const metrics = [
            { key: 'SALES', label: 'Ventas', icon: '📊' },
            { key: 'REVENUE', label: 'Ingresos', icon: '💰' },
            { key: 'EBITDA', label: 'EBITDA', icon: '⚡' },
            { key: 'CONTRIBUTION_MARGIN', label: 'Margen Contribución', icon: '🎯' },
        ];

        return metrics.map(metric => {
            const real = realData2025[metric.key as keyof typeof realData2025];
            const budget = forecast2026[metric.key as keyof typeof forecast2026];
            
            const totalReal = real.reduce((a, b) => a + b, 0);
            const totalBudget = budget.reduce((a, b) => a + b, 0);
            const variance = totalBudget - totalReal;
            const variancePercent = totalReal !== 0 ? ((variance / Math.abs(totalReal)) * 100) : 0;

            return {
                ...metric,
                real: totalReal,
                budget: totalBudget,
                variance,
                variancePercent
            };
        });
    }, [realData2025, forecast2026]);

    // Datos para gráfico de comparación
    const chartData = useMemo(() => {
        return months.map((month, idx) => ({
            month,
            'Real 2025': realData2025.SALES[idx],
            'Forecast 2026': forecast2026.SALES[idx],
        }));
    }, [realData2025, forecast2026, months]);

    const totalRealSales = realData2025.SALES.reduce((a, b) => a + b, 0);
    const totalBudgetSales = forecast2026.SALES.reduce((a, b) => a + b, 0);
    const performance = (totalRealSales / totalBudgetSales) * 100;
    const varianceTotal = totalBudgetSales - totalRealSales;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">
                        Real vs <span className="text-[#00B14F]">Forecast 2026</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        2025 Actual vs 2026 Proyectado (Crecimiento 15%) - {country}
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">Variación 2025-2026</p>
                        <p className={`text-xl font-black text-center ${varianceTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {varianceTotal >= 0 ? '+' : ''}{((varianceTotal / Math.abs(totalRealSales)) * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricsComparison.map((metric, idx) => (
                    <MetricCard
                        key={idx}
                        title={metric.label}
                        real={metric.real}
                        budget={metric.budget}
                        variance={metric.variance}
                        variancePercent={metric.variancePercent}
                        icon={metric.icon}
                        country={country}
                    />
                ))}
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <BarChart3 size={16} className="text-[#00B14F]" /> Comparativa Anual: Ventas
                        </h4>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#00B14F]"></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase">Real 2025</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase">Forecast 2026</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                                    formatter={(value: any) => formatCurrency(value, country)}
                                />
                                <Bar dataKey="Real 2025" fill="#00B14F" radius={[10, 10, 0, 0]} barSize={32} />
                                <Bar dataKey="Forecast 2026" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                        <PieIcon size={16} className="text-[#00B14F]" /> Resumen General
                    </h4>
                    <div className="space-y-6">
                        <SummaryItem
                            label="Total Real 2025"
                            value={formatCurrency(totalRealSales, country)}
                            color="emerald"
                        />
                        <SummaryItem
                            label="Total Forecast 2026"
                            value={formatCurrency(totalBudgetSales, country)}
                            color="blue"
                        />
                        <div className="border-t border-slate-100 pt-6">
                            <SummaryItem
                                label="Variación Proyectada"
                                value={formatCurrency(varianceTotal, country)}
                                color={varianceTotal >= 0 ? 'emerald' : 'rose'}
                                subtitle={`${varianceTotal >= 0 ? '+' : ''}${((varianceTotal / Math.abs(totalRealSales)) * 100).toFixed(1)}%`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Metrics Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Análisis Detallado por Métrica</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Métrica</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Real 2025</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Forecast 2026</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Variación</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">% Cambio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {metricsComparison.map((metric, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-900">{metric.label}</td>
                                    <td className="px-8 py-5 text-right text-sm font-bold text-emerald-600">{formatCurrency(metric.real, country)}</td>
                                    <td className="px-8 py-5 text-right text-sm font-bold text-blue-600">{formatCurrency(metric.budget, country)}</td>
                                    <td className={`px-8 py-5 text-right text-sm font-bold ${metric.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(metric.variance, country)}
                                    </td>
                                    <td className={`px-8 py-5 text-right text-sm font-bold ${metric.variancePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {metric.variancePercent >= 0 ? '+' : ''}{metric.variancePercent.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, real, budget, variance, variancePercent, icon, country }: any) => {
    const isPositive = variance >= 0;
    
    return (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 hover:shadow-md transition-all group flex-1">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-xl transition-transform group-hover:scale-110 ${
                isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</p>
            <div className="mt-3 space-y-2">
                <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Real 2025</p>
                    <p className="text-lg font-black text-emerald-600 tracking-tighter italic">{formatCurrency(real, country)}</p>
                </div>
                <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Forecast 2026</p>
                    <p className="text-lg font-black text-blue-600 tracking-tighter italic">{formatCurrency(budget, country)}</p>
                </div>
            </div>
            <div className={`flex items-center gap-2 mt-4 p-3 rounded-xl ${isPositive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {isPositive ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-rose-600" />}
                <p className={`text-[9px] font-bold uppercase tracking-tight ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{variancePercent.toFixed(1)}%
                </p>
            </div>
        </div>
    );
};

const SummaryItem = ({ label, value, color, subtitle }: any) => {
    const colorClass = {
        emerald: 'text-emerald-600',
        blue: 'text-blue-600',
        rose: 'text-rose-600',
    }[color] || 'text-slate-600';

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
                {subtitle && <p className="text-[9px] font-bold text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <p className={`text-lg font-black italic tracking-tighter ${colorClass}`}>{value}</p>
        </div>
    );
};

export default RealVsBudget;

