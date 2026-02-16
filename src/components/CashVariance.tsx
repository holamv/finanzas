'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Scale,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Country, ProjectionPlan, PlanVsRealComparison } from '@/types';
import {
    generateProjectionPlan,
    loadProjectionPlan,
    comparePlanVsReal,
    isPlanExpired
} from '@/services/projectionService';

interface CashVarianceProps {
    selectedCountry: Country;
}

const CashVariance: React.FC<CashVarianceProps> = ({ selectedCountry }) => {
    const [plan, setPlan] = useState<ProjectionPlan | null>(null);
    const [comparison, setComparison] = useState<PlanVsRealComparison | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [horizonWeeks] = useState(4);

    // Cargar plan al montar o cambiar país
    useEffect(() => {
        loadPlan();
    }, [selectedCountry]);

    // Actualizar comparación
    useEffect(() => {
        if (plan) {
            updateComparison();
        }
    }, [plan]);

    const loadPlan = async () => {
        setIsLoading(true);
        try {
            const cached = loadProjectionPlan(selectedCountry);
            if (cached && !isPlanExpired(cached)) {
                setPlan(cached);
            } else {
                await generateNewPlan();
            }
        } catch (error) {
            console.error('Error cargando plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateNewPlan = async () => {
        setIsLoading(true);
        try {
            const newPlan = await generateProjectionPlan(selectedCountry, horizonWeeks);
            setPlan(newPlan);
        } catch (error) {
            console.error('Error generando plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateComparison = async () => {
        if (!plan) return;
        try {
            const comp = await comparePlanVsReal(plan);
            setComparison(comp);
            console.log('Comparación actualizada:', comp);
        } catch (error) {
            console.error('Error actualizando comparación:', error);
        }
    };

    // Datos para Plan vs Real
    const planVsRealData = useMemo(() => {
        if (!comparison) return [];

        return comparison.comparisonByWeek.map(week => ({
            week: `Sem ${week.week}`,
            plan: week.netCashFlow,
            real: week.actualNet || 0,
            hasReal: week.actualNet !== null
        }));
    }, [comparison]);

    if (isLoading && !plan) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#00B14F] mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-600">Calculando variaciones...</p>
                </div>
            </div>
        );
    }

    if (!plan || !comparison) {
        return (
            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 text-center">
                <p className="text-slate-600">No hay datos suficientes para comparar</p>
                <button
                    onClick={generateNewPlan}
                    className="mt-4 px-6 py-3 bg-[#00B14F] text-white rounded-xl font-bold hover:bg-[#00843D]"
                >
                    Actualizar Datos
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Plan vs Real Card */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-blue-50">
                        <Scale size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                            Plan vs Real · Variación de Precisión
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                            Análisis de desviación semanal
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 rounded-2xl shadow-lg shadow-emerald-200">
                        <p className="text-[8px] font-black text-white/80 uppercase tracking-widest">
                            Precisión Global
                        </p>
                        <p className="text-2xl font-black text-white italic">
                            {comparison.summary.accuracy.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Tabla de Detalle */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-600">
                                    Semana
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">
                                    Plan
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">
                                    Real
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-600">
                                    Desviación
                                </th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-600">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {planVsRealData.map((row, idx) => {
                                if (!row.hasReal) return null;

                                const deviation = ((row.real - row.plan) / row.plan) * 100;
                                const absDeviation = Math.abs(deviation);

                                const statusColor =
                                    absDeviation < 5 ? 'green' : absDeviation < 10 ? 'yellow' : 'red';

                                const statusBg = {
                                    green: 'bg-emerald-100 text-emerald-700',
                                    yellow: 'bg-yellow-100 text-yellow-700',
                                    red: 'bg-rose-100 text-rose-700'
                                }[statusColor];

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.week}</td>
                                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                                            ${row.plan.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                                            ${row.real.toLocaleString()}
                                        </td>
                                        <td
                                            className={`px-6 py-4 text-right text-sm font-black ${deviation >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                }`}
                                        >
                                            {deviation >= 0 ? '+' : ''}
                                            {deviation.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusBg}`}
                                            >
                                                {statusColor === 'green' && <CheckCircle2 size={12} />}
                                                {statusColor === 'yellow' && <AlertCircle size={12} />}
                                                {statusColor === 'red' && <XCircle size={12} />}
                                                {absDeviation.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={updateComparison}
                    className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <RefreshCw size={16} />
                    Actualizar Comparación
                </button>
            </div>
        </div>
    );
};

export default CashVariance;
