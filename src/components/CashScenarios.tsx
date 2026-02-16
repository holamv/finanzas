'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Layers,
    Target,
    TrendingUp,
    Settings,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import {
    ComposedChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { Country, ProjectionPlan, ProjectionScenarioType } from '@/types';
import {
    generateProjectionPlan,
    loadProjectionPlan,
    isPlanExpired
} from '@/services/projectionService';

interface CashScenariosProps {
    selectedCountry: Country;
}

const CashScenarios: React.FC<CashScenariosProps> = ({ selectedCountry }) => {
    const [plan, setPlan] = useState<ProjectionPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [horizonWeeks, setHorizonWeeks] = useState(4);
    const [activeScenarios, setActiveScenarios] = useState<ProjectionScenarioType[]>([
        'base',
        'optimistic',
        'conservative'
    ]);

    // Definición de escenarios
    const scenarios = [
        {
            id: 'base' as ProjectionScenarioType,
            name: 'Base',
            multiplier: plan?.metadata.mlFactors.scenarios.base.inflowFactor || 1.0,
            color: 'slate',
            strokeColor: '#64748b',
            strokeDash: '5 5'
        },
        {
            id: 'optimistic' as ProjectionScenarioType,
            name: 'Optimista',
            multiplier: plan?.metadata.mlFactors.scenarios.optimistic.inflowFactor || 1.15,
            color: 'emerald',
            strokeColor: '#00B14F',
            strokeDash: 'none'
        },
        {
            id: 'conservative' as ProjectionScenarioType,
            name: 'Conservador',
            multiplier: plan?.metadata.mlFactors.scenarios.conservative.inflowFactor || 0.90,
            color: 'amber',
            strokeColor: '#f59e0b',
            strokeDash: '3 3'
        }
    ];

    // Cargar plan al montar o cambiar país
    useEffect(() => {
        loadPlan();
    }, [selectedCountry]);

    const loadPlan = async () => {
        setIsLoading(true);
        try {
            const cached = loadProjectionPlan(selectedCountry);
            if (cached && !isPlanExpired(cached)) {
                setPlan(cached);
                console.log('Plan cargado desde caché');
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
            console.log('Plan generado:', newPlan);
        } catch (error) {
            console.error('Error generando plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle de escenarios
    const toggleScenario = (scenarioId: ProjectionScenarioType) => {
        setActiveScenarios(prev =>
            prev.includes(scenarioId)
                ? prev.filter(s => s !== scenarioId)
                : [...prev, scenarioId]
        );
    };

    // Datos para gráfico de escenarios
    const chartData = useMemo(() => {
        if (!plan) return [];

        const weeks = ['Hoy', ...plan.scenarios.base.map(w => `Sem ${w.week}`)];

        return weeks.map((week, idx) => {
            if (idx === 0) {
                return {
                    week,
                    base: 0,
                    optimistic: 0,
                    conservative: 0
                };
            }

            const weekIdx = idx - 1;
            return {
                week,
                base: plan.scenarios.base[weekIdx]?.netCashFlow || 0,
                optimistic: plan.scenarios.optimistic[weekIdx]?.netCashFlow || 0,
                conservative: plan.scenarios.conservative[weekIdx]?.netCashFlow || 0
            };
        });
    }, [plan]);

    if (isLoading && !plan) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#00B14F] mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-600">Generando escenarios...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 text-center">
                <p className="text-slate-600">No hay proyecciones disponibles</p>
                <button
                    onClick={generateNewPlan}
                    className="mt-4 px-6 py-3 bg-[#00B14F] text-white rounded-xl font-bold hover:bg-[#00843D]"
                >
                    Generar Escenarios
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Gráfico de Escenarios */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-indigo-50">
                            <Layers className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                                Proyección Multi-Escenario
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                {horizonWeeks} semanas • Confianza: {(plan.metadata.confidence * 100).toFixed(0)}%
                            </p>
                        </div>
                    </div>

                    {/* Leyenda Interactiva */}
                    <div className="flex gap-3">
                        {scenarios.map(scenario => (
                            <button
                                key={scenario.id}
                                onClick={() => toggleScenario(scenario.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border-2 ${activeScenarios.includes(scenario.id)
                                    ? `bg-${scenario.color}-50 border-${scenario.color}-300`
                                    : 'bg-slate-50 border-slate-200 opacity-40'
                                    }`}
                            >
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: scenario.strokeColor }}
                                />
                                <span className="text-[9px] font-black uppercase">{scenario.name}</span>
                                <span className="text-xs font-bold">{scenario.multiplier.toFixed(2)}x</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gráfico */}
                <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <defs>
                                <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00B14F" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#00B14F" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />

                            <ReferenceLine
                                x="Hoy"
                                stroke="#00843D"
                                strokeWidth={2}
                                label={{ value: 'HOY', position: 'top', fill: '#00843D', fontWeight: 900, fontSize: 10 }}
                            />

                            <XAxis
                                dataKey="week"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                dy={15}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            />

                            <Tooltip
                                contentStyle={{
                                    borderRadius: '20px',
                                    border: 'none',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    padding: '16px'
                                }}
                                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                            />

                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900 }} iconType="circle" />

                            {activeScenarios.includes('base') && (
                                <Area
                                    type="monotone"
                                    dataKey="base"
                                    stroke="#64748b"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    fill="transparent"
                                    name="Base"
                                />
                            )}

                            {activeScenarios.includes('optimistic') && (
                                <Area
                                    type="monotone"
                                    dataKey="optimistic"
                                    stroke="#00B14F"
                                    strokeWidth={5}
                                    fill="url(#colorOptimistic)"
                                    name="Optimista"
                                />
                            )}

                            {activeScenarios.includes('conservative') && (
                                <Area
                                    type="monotone"
                                    dataKey="conservative"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    strokeDasharray="3 3"
                                    fill="transparent"
                                    name="Conservador"
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Cards de Métricas de Escenarios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {scenarios.map(scenario => {
                    const scenarioData = plan.scenarios[scenario.id];
                    const totalProjected = scenarioData.reduce((sum, w) => sum + w.netCashFlow, 0);
                    const weeklyAverage = totalProjected / scenarioData.length;

                    return (
                        <div
                            key={scenario.id}
                            className={`bg-gradient-to-br from-${scenario.color}-50 to-${scenario.color}-100/50 border-2 border-${scenario.color}-200 rounded-[2rem] p-6 transition-all hover:scale-[1.02] duration-300`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-white/60">
                                    <Target size={20} className={`text-${scenario.color}-700`} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        Escenario {scenario.name}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400">
                                        Factor: {scenario.multiplier.toFixed(2)}x
                                    </p>
                                </div>
                            </div>

                            <p className="text-3xl font-black italic tracking-tighter text-slate-900">
                                ${totalProjected.toLocaleString()}
                            </p>

                            <div className="mt-4 flex items-center gap-2">
                                <TrendingUp size={14} className={`text-${scenario.color}-600`} />
                                <span className="text-xs font-bold text-slate-600">
                                    ${weeklyAverage.toLocaleString()}/semana
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Control Button */}
            <div className="flex justify-end">
                <button
                    onClick={generateNewPlan}
                    disabled={isLoading}
                    className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'Recalculando...' : 'Recalcular Escenarios'}
                </button>
            </div>
        </div>
    );
};

export default CashScenarios;
