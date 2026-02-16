'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  RefreshCw,
  Loader2,
  Database,
  BrainCircuit,
  Sparkles,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Country, ProjectionPlan } from '@/types';
import {
  generateProjectionPlan,
  loadProjectionPlan,
  isPlanExpired
} from '@/services/projectionService';
import {
  getWeeklyFinancialData,
  getCountryMetrics,
  WeeklyFinancialData
} from '@/services/weeklyFinancialService';
import { getWeeklyProgressAnalysis } from '@/services/geminiService';
import ReactMarkdown from 'react-markdown';
import SalesChart from './SalesChart';
import CashFlowTrendChart from './CashFlowTrendChart';

interface ProjectionDashboardProps {
  selectedCountry: Country;
}

const ProjectionDashboard: React.FC<ProjectionDashboardProps> = ({ selectedCountry }) => {
  const [plan, setPlan] = useState<ProjectionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [horizonWeeks] = useState(4);
  const [weeklyData, setWeeklyData] = useState<WeeklyFinancialData | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<ReturnType<typeof getCountryMetrics> | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<string | null>(null);
  const [salesProjection, setSalesProjection] = useState<{
    weeks: string[];
    values: number[];
    growth: number;
    year2024: number[];
  } | null>(null);


  // Cargar plan al montar o cambiar país
  useEffect(() => {
    loadPlan();
    loadWeeklyData();
    setMlAnalysis(null);
  }, [selectedCountry]);

  // Generar análisis ML cuando hay datos disponibles
  useEffect(() => {
    if (plan && weeklyMetrics && !mlAnalysis && !isAnalyzing) {
      generateMLAnalysis();
    }
  }, [plan, weeklyMetrics]);

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

  const loadWeeklyData = async () => {
    try {
      const data = await getWeeklyFinancialData();
      if (data) {
        setWeeklyData(data);
        const metrics = getCountryMetrics(data, selectedCountry);
        setWeeklyMetrics(metrics);
        console.log('Weekly Financial Data cargada:', { data, metrics });
      }
    } catch (error) {
      console.error('Error cargando Weekly Financial Data:', error);
    }
  };

  const generateDeterministicAnalysis = (
    currentPlan: ProjectionPlan,
    projectionState: any,
    metricsData: any
  ): string => {
    const isPositive = projectionState?.growth > 1;
    const growthPercent = projectionState ? ((projectionState.growth - 1) * 100).toFixed(1) : "0";

    return `
## 📊 Análísis Estocástico (Modo Fallback 3.0)

⚠️ **Nota:** El sistema de IA avanzada no está disponible actualmente. Se ha generado este análisis utilizando algoritmos deterministas basados en sus datos históricos.

### 🔮 Proyección de Tendencia
El modelo de ventas proyecta una tendencia **${isPositive ? 'ALCISTA 🚀' : 'BAJISTA 📉'}** para las próximas 3 semanas.
Se estima un crecimiento del **${growthPercent}%** basado en el comportamiento estacional registrado en el periodo homólogo de 2024.

**Factores Clave:**
*   **Base Histórica:** Comportamiento validado con datos de ${selectedCountry} 2024.
*   **Consistencia:** ${currentPlan.metadata.confidence > 0.8 ? 'Alta' : 'Moderada'} (${(currentPlan.metadata.confidence * 100).toFixed(0)}% confianza).

### 🛡️ Estado de Liquidez
*   **Caja Proyectada:** $${metricsData?.projectedBalance.toLocaleString()}
*   ${metricsData?.projectedBalance < 0 ? '⚠️ **ALERTA CRÍTICA:** Se proyecta un flujo de caja negativo. Es urgente revisar los egresos planificados.' : '✅ **ESTADO SALUDABLE:** La proyección de caja se mantiene positiva.'}

### 💡 Recomendaciones Automáticas
1.  **Revisión de Márgenes:** Monitorear semanalmente el margen bruto, actual: ${weeklyMetrics?.avgGrossMargin.slice(-1)[0]?.toFixed(1)}%.
2.  **Control de Gastos:** ${metricsData?.plannedExpenses > metricsData?.expectedIncome ? 'Reducir gastos inmediatos, los egresos superan a los ingresos.' : 'Mantener la disciplina de gastos actuales.'}
3.  **Seguimiento de Ventas:** Verificar si se cumple el crecimiento del ${growthPercent}% esta semana.
    `;
  };

  const generateMLAnalysis = async () => {
    if (!plan || !weeklyMetrics) return;

    // Calcular métricas locales para el fallback si es necesario
    const scenarioBase = plan.scenarios.base;
    const expectedIncome = scenarioBase.reduce((sum, w) => sum + w.projectedInflows, 0);
    const plannedExpenses = scenarioBase.reduce((sum, w) => sum + w.projectedOutflows, 0);
    const projectedBalance = expectedIncome - plannedExpenses;
    const currentMetrics = { projectedBalance, expectedIncome, plannedExpenses };

    setIsAnalyzing(true);
    // try {
    // Filtrar semanas cercanas a "Hoy" (Feb 2025)
    // Buscamos semanas que contengan '2025-02' o '2025-01-25' para referencia
    const recentWeeksIndices = weeklyMetrics.weeks.map((w, i) => (w.includes('2025-02') || w.includes('2025-01') ? i : -1)).filter(i => i !== -1);

    // Si encontramos semanas relevantes, tomamos las últimas 4 de ese grupo
    // Si no, tomamos las últimas 4 absolutas
    const relevantIndices = recentWeeksIndices.length > 0 ? recentWeeksIndices.slice(-4) : weeklyMetrics.weeks.slice(-4).map((_, i) => weeklyMetrics.weeks.length - 4 + i);

    const relevantWeeks = relevantIndices.map(i => weeklyMetrics.weeks[i]);
    const relevantSales = relevantIndices.map(i => weeklyMetrics.totalSales[i]);
    const relevantMargins = relevantIndices.map(i => weeklyMetrics.avgGrossMargin[i]);

    const historicalContext = {
      note: "Datos filtrados para contexto de Febrero 2025",
      weeks: relevantWeeks,
      sales: relevantSales,
      margins: relevantMargins
    };

    // Calcular proyección de ventas basada en 2025 (Histórico para 2026)
    const currentYear = new Date().getFullYear(); // 2026
    const prevYear = currentYear - 1; // 2025

    // Usar la fecha real del usuario (Feb 2026)
    const todayReal = new Date();

    // Encontrar índice en weeks que coincida con esa fecha aprox en el año anterior
    const targetDatePast = new Date(todayReal);
    targetDatePast.setFullYear(prevYear);

    let closestIdxPrevYear = -1;
    let minDiff = Infinity;

    weeklyMetrics.weeks.forEach((weekStr, idx) => {
      const weekDate = new Date(weekStr);
      // Solo mirar fechas del año anterior
      if (weekDate.getFullYear() === prevYear) {
        const diff = Math.abs(weekDate.getTime() - targetDatePast.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIdxPrevYear = idx;
        }
      }
    });

    let projectedSalesCurrent: number[] = [];
    let salesPrevYear: number[] = [];
    let nextWeeksDates: string[] = [];
    let growthFactor = 1.15; // Growth default 15%

    if (closestIdxPrevYear !== -1) {
      // Tomar 3 semanas a partir de la fecha encontrada
      for (let i = 0; i < 3; i++) {
        if (closestIdxPrevYear + i < weeklyMetrics.totalSales.length) {
          const sPrev = weeklyMetrics.totalSales[closestIdxPrevYear + i];
          salesPrevYear.push(sPrev);
          // Proyección 2026 = 2025 * Growth
          projectedSalesCurrent.push(sPrev * growthFactor);

          // Generar etiqueta de fecha futura
          const nextDate = new Date(todayReal);
          nextDate.setDate(todayReal.getDate() + (i * 7));
          nextWeeksDates.push(nextDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }));
        }
      }

      setSalesProjection({
        weeks: nextWeeksDates,
        values: projectedSalesCurrent,
        growth: growthFactor,
        year2024: salesPrevYear // Mantenemos el nombre de la prop pero son de 2025
      });
    }

    const projectedContext = plan.scenarios.base.map(w => ({
      week: w.week,
      netCashFlow: w.netCashFlow,
      inflows: w.projectedInflows,
      outflows: w.projectedOutflows
    }));

    try {
      const analysis = await getWeeklyProgressAnalysis(
        [historicalContext, {
          note: `Proyección de Ventas (Basada en estacionalidad ${prevYear})`,
          projectedSales: projectedSalesCurrent,
          baselinePrev: salesPrevYear,
          growthFactorApplied: growthFactor
        }],
        projectedContext,
        selectedCountry
      );

      // Validar si la respuesta es un error genérico o vacío
      if (!analysis || analysis.includes("No se pudo generar") || analysis.includes("Error de Conexión")) {
        throw new Error("AI response invalid");
      }

      setMlAnalysis(analysis);
    } catch (error) {
      console.error('Error generando análisis ML, usando fallback:', error);

      // FALLBACK DETERMINISTA
      // Necesitamos el estado salesProjection que acabamos de calcular arriba
      const fallbackProjection = closestIdxPrevYear !== -1 ? {
        weeks: nextWeeksDates,
        values: projectedSalesCurrent,
        growth: growthFactor,
        year2024: salesPrevYear
      } : { growth: 0 }; // Default safe value

      const fallbackAnalysis = generateDeterministicAnalysis(plan, fallbackProjection, currentMetrics);
      setMlAnalysis(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (!plan) return null;

    const scenarioBase = plan.scenarios.base;
    const expectedIncome = scenarioBase.reduce((sum, w) => sum + w.projectedInflows, 0);
    const plannedExpenses = scenarioBase.reduce((sum, w) => sum + w.projectedOutflows, 0);
    const projectedBalance = expectedIncome - plannedExpenses;

    return {
      projectedBalance,
      expectedIncome,
      plannedExpenses,
      accuracy: plan.metadata.confidence * 100
    };
  }, [plan]);

  if (isLoading && !plan) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#00B14F] mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">Conectando con IA (Puter)...</p>
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
          Generar Proyección
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      {/* Área Principal - MÁQUINA DEL TIEMPO & ANÁLISIS */}
      <div className="lg:col-span-8 space-y-8">

        {/* ML Strategic Analysis */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden h-full min-h-[500px]">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-[100%] -z-0 opacity-50" />

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                <BrainCircuit className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  Proyección Estratégica AI
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] border border-indigo-200">
                    GenAI 2.0
                  </span>
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Análisis predictivo · Contexto: Febrero 2025
                </p>
              </div>
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Analizando...</span>
              </div>
            )}
          </div>

          <div className="relative z-10">
            {mlAnalysis ? (
              <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-indigo-700 prose-li:text-slate-600">
                <ReactMarkdown>{mlAnalysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Sparkles size={48} className="text-slate-200 mb-4" />
                <p className="text-xs font-medium">Esperando datos para análisis...</p>
                <p className="text-[10px] opacity-60 mt-2">Sincronizando con modelo semanal 2025</p>
              </div>
            )}
          </div>

          {salesProjection && (
            <SalesChart
              weeks={salesProjection.weeks}
              sales2024={salesProjection.year2024}
              sales2025={salesProjection.values}
            />
          )}

          {/* Cash Flow Evolution Chart */}
          {plan && (
            <div className="mt-8">
              <CashFlowTrendChart
                data={plan.scenarios.base.map(w => ({
                  week: w.startDate, // Usar fecha como label
                  inflows: w.projectedInflows,
                  outflows: w.projectedOutflows,
                  net: w.netCashFlow
                }))}
              />
            </div>
          )}
        </div>

      </div>

      {/* Sidebar de Control */}
      <div className="lg:col-span-4 space-y-8">

        {/* Nueva Tarjeta de Proyección de Ventas */}
        {salesProjection && (
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  Proyección Ventas
                </h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  Próximas 3 semanas (vs ${new Date().getFullYear() - 1})
                </p>
              </div>
              <div className="ml-auto bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[9px] font-black">
                +{((salesProjection.growth - 1) * 100).toFixed(0)}% Growth
              </div>
            </div>

            <div className="space-y-4">
              {salesProjection.weeks.map((week, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-700 uppercase">{week}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      ${salesProjection.values[idx]?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400">
                      Baseline: ${salesProjection.year2024[idx]?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[8px] text-slate-400 text-center uppercase tracking-widest">
                Modelo Estacional: {selectedCountry}
              </p>
            </div>
          </div>
        )}

        {/* Panel de Métricas Rápidas */}
        {metrics && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-xl">
            <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-2">
              Caja Proyectada (Base)
            </p>
            <h3 className="text-4xl font-black italic tracking-tighter text-[#00B14F]">
              ${metrics.projectedBalance.toLocaleString()}
            </h3>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[8px] font-bold uppercase text-slate-400">
                  Ingresos Esperados
                </span>
                <span className="text-sm font-black text-emerald-400">
                  +${metrics.expectedIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold uppercase text-slate-400">
                  Egresos Planificados
                </span>
                <span className="text-sm font-black text-rose-400">
                  -${metrics.plannedExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Financial Model Data */}
        {weeklyMetrics && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-[3rem] border-2 border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-purple-100">
                <Database size={20} className="text-purple-600" />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-900">
                  Weekly Model 2025
                </h4>
                <p className="text-[8px] font-bold text-purple-600 uppercase tracking-wider mt-0.5">
                  Datos Reales Recientes
                </p>
              </div>
            </div>

            {/* Mostrar últimas 4 semanas disponibles (contexto 2025) */}
            <div className="space-y-4">
              {weeklyMetrics.weeks.slice(-3).map((week, idx) => {
                const weekIdx = weeklyMetrics.weeks.length - 3 + idx;
                const sales = weeklyMetrics.totalSales[weekIdx];
                const margin = weeklyMetrics.avgGrossMargin[weekIdx];

                return (
                  <div key={idx} className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-purple-100">
                    <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-2">
                      {week}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-600">Sales</span>
                      <span className="text-xs font-black text-slate-900">${sales?.toLocaleString() || 0}</span>
                    </div>
                    {margin > 0 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] font-bold text-purple-600">Gross Margin</span>
                        <span className="text-[10px] font-black text-purple-700">{margin.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Panel de Control */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <button
            onClick={() => {
              setMlAnalysis(null);
              generateNewPlan(); // Regenerate plan will trigger effect to enable analysis
            }}
            disabled={isLoading || isAnalyzing}
            className="w-full bg-[#00B14F] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00843D] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Generando...' : 'Re-analizar con IA'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectionDashboard;
