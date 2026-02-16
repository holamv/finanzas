import {
  Country,
  ProjectionPlan,
  ProjectionWeek,
  ScenarioFactors,
  HistoricalStats,
  PlanVsRealComparison,
  FlowDetail,
  GeminiProjectionResponse
} from '@/types';
import {
  getSalesData,
  getOCData,
  filterSalesByCountryAndDateRange,
  filterOCByCountryAndDateRange,
  groupByWeek,
  SalesRecord,
  OCRecord
} from './cashFlowService';
import { getProjectionFactors } from './geminiService';
import { convertToUSD } from '@/lib/currencyUtils';
import {
  getWeeklyFinancialData,
  getCountryMetrics,
  calculateProjectionFromWeekly
} from './weeklyFinancialService';

/**
 * Obtiene datos históricos y calcula estadísticas
 */
export async function getHistoricalStats(
  country: Country,
  days: number = 30
): Promise<HistoricalStats> {
  // Obtener datos
  const [salesData, ocData] = await Promise.all([
    getSalesData(),
    getOCData()
  ]);

  // Calcular rango de fechas (últimos N días)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Filtrar por rango
  const sales = filterSalesByCountryAndDateRange(salesData, country, startDate, endDate);
  const ocs = filterOCByCountryAndDateRange(ocData, country, startDate, endDate);

  // Calcular totales con conversión armada si es Global
  const totalInflows = sales.reduce((sum, s) => {
    const amount = country === 'Global' ? convertToUSD(s.monto, s.moneda) : s.monto;
    return sum + amount;
  }, 0);

  const totalOutflows = ocs.reduce((sum, o) => {
    const amount = country === 'Global' ? convertToUSD(o.monto, o.moneda) : o.monto;
    return sum + amount;
  }, 0);

  // Calcular promedios diarios
  const avgDailyInflows = totalInflows / days;
  const avgDailyOutflows = totalOutflows / days;

  // Calcular tendencia (regresión lineal simple)
  // Agrupar por día
  const dailyInflows: number[] = [];
  for (let i = 0; i < days; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(startDate.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayTotal = sales
      .filter(s => {
        const d = new Date(s.fecha);
        return d >= dayStart && d < dayEnd;
      })
      .reduce((sum, s) => {
        const amount = country === 'Global' ? convertToUSD(s.monto, s.moneda) : s.monto;
        return sum + amount;
      }, 0);

    dailyInflows.push(dayTotal);
  }

  // Calcular slope (tendencia)
  const n = dailyInflows.length;
  const xMean = (n - 1) / 2;
  const yMean = dailyInflows.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (dailyInflows[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  const trend = denominator !== 0 ? numerator / denominator : 0;

  // Calcular volatilidad (desviación estándar)
  const variance = dailyInflows.reduce((sum, y) => sum + (y - avgDailyInflows) ** 2, 0) / n;
  const volatility = Math.sqrt(variance);

  return {
    totalInflows,
    totalOutflows,
    avgDailyInflows,
    avgDailyOutflows,
    trend,
    volatility,
    days
  };
}

/**
 * Calcula proyecciones base sin ML (matemática simple)
 */
export function calculateBaseProjections(
  stats: HistoricalStats,
  weeks: number = 4
): ProjectionWeek[] {
  const projections: ProjectionWeek[] = [];
  let cumulativeCashFlow = 0;

  for (let week = 1; week <= weeks; week++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (week - 1) * 7);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Proyección simple: promedio diario × 7 días
    const baseInflows = stats.avgDailyInflows * 7;
    const baseOutflows = stats.avgDailyOutflows * 7;

    // Ajuste por tendencia (pequeño)
    const trendAdjustment = stats.trend * 7 * week;

    const projectedInflows = baseInflows + trendAdjustment;
    const projectedOutflows = baseOutflows;

    const netCashFlow = projectedInflows - projectedOutflows;
    cumulativeCashFlow += netCashFlow;

    projections.push({
      week,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      projectedInflows,
      inflowsDetail: {
        base: baseInflows,
        factor: 1.0,
        result: projectedInflows
      },
      projectedOutflows,
      outflowsDetail: {
        base: baseOutflows,
        factor: 1.0,
        result: projectedOutflows
      },
      netCashFlow,
      cumulativeCashFlow,
      actualInflows: null,
      actualOutflows: null,
      actualNet: null,
      variance: null,
      varianceAbsolute: null
    });
  }

  return projections;
}

/**
 * Aplica factores ML a proyecciones base
 */
export function applyMLFactors(
  baseProjections: ProjectionWeek[],
  factors: ScenarioFactors
): ProjectionWeek[] {
  let cumulativeCashFlow = 0;

  return baseProjections.map(proj => {
    const adjustedInflows = proj.inflowsDetail.base * factors.inflowFactor;
    const adjustedOutflows = proj.outflowsDetail.base * factors.outflowFactor;
    const netCashFlow = adjustedInflows - adjustedOutflows;
    cumulativeCashFlow += netCashFlow;

    return {
      ...proj,
      projectedInflows: adjustedInflows,
      inflowsDetail: {
        base: proj.inflowsDetail.base,
        factor: factors.inflowFactor,
        result: adjustedInflows
      },
      projectedOutflows: adjustedOutflows,
      outflowsDetail: {
        base: proj.outflowsDetail.base,
        factor: factors.outflowFactor,
        result: adjustedOutflows
      },
      netCashFlow,
      cumulativeCashFlow
    };
  });
}

/**
 * Genera un plan de proyección completo con ML
 */
export async function generateProjectionPlan(
  country: Country,
  weeks: number = 4
): Promise<ProjectionPlan> {
  // Obtener estadísticas históricas
  const stats = await getHistoricalStats(country, 30);

  // Obtener datos históricos detallados para Gemini
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const [salesData, ocData, weeklyData] = await Promise.all([
    getSalesData(),
    getOCData(),
    getWeeklyFinancialData()
  ]);

  const historicalSales = filterSalesByCountryAndDateRange(salesData, country, startDate, endDate);
  const historicalOCs = filterOCByCountryAndDateRange(ocData, country, startDate, endDate);

  // Intentar obtener datos del Weekly Financial Model (Baseline 2025 para 2026)
  let weeklyProjection = null;
  let weeklyMetrics = null;
  if (weeklyData) {
    weeklyMetrics = getCountryMetrics(weeklyData, country);
    if (weeklyMetrics) {
      // Usar Seasonal Baseline (Hoy en 2026 -> Semanas correspondientes en 2025)
      weeklyProjection = calculateProjectionFromWeekly(weeklyMetrics, weeks, new Date());
      console.log('Seasonal Weekly Model Projection (Baseline 2025):', weeklyProjection);
    }
  }

  // Ajustar estadísticas si tenemos datos del Weekly Model
  if (weeklyProjection && weeklyProjection.projectedSales.length > 0) {
    const weeklyAvgSales = weeklyProjection.projectedSales.reduce((sum, v) => sum + v, 0) / weeklyProjection.projectedSales.length;
    // Usar promedio semanal del Weekly Model como ajuste
    stats.avgDailyInflows = weeklyAvgSales / 7;
  }

  // Calcular proyecciones base
  const baseProjections = calculateBaseProjections(stats, weeks);

  // Obtener factores ML de Gemini AI con contexto enriquecido
  const mlFactors = await getProjectionFactors(
    stats,
    {
      inflows: historicalSales,
      outflows: historicalOCs
    },
    country
  );

  // Ajustar confianza si tenemos datos del Weekly Model
  if (weeklyProjection && weeklyProjection.confidence > mlFactors.confidence) {
    mlFactors.confidence = (mlFactors.confidence + weeklyProjection.confidence) / 2;
    mlFactors.insights.unshift(`Proyección mejorada con datos del Weekly Financial Model (confianza: ${(weeklyProjection.confidence * 100).toFixed(0)}%)`);
  }

  // Definir Factores de Escenario basados en el Baseline Estacional
  // Base: 1.10x (Crecimiento moderado sobre histórico)
  // Optimista: 1.18x
  // Conservador: 1.02x (Mantenimiento)

  const factorsBase: ScenarioFactors = {
    inflowFactor: 1.10,
    outflowFactor: 1.05,
    rationale: 'Escenario Base: Crecimiento proyectado del 10% sobre histórico 2025'
  };

  const factorsOptimistic: ScenarioFactors = {
    inflowFactor: 1.18,
    outflowFactor: 1.08,
    rationale: 'Escenario Optimista: Fuerte tracción comercial (+18%)'
  };

  const factorsConservative: ScenarioFactors = {
    inflowFactor: 1.02,
    outflowFactor: 1.03,
    rationale: 'Escenario Conservador: Estancamiento o crecimiento mínimo (+2%)'
  };

  // Aplicar factores
  const scenarioBase = applyMLFactors(baseProjections, factorsBase);
  const scenarioOptimistic = applyMLFactors(baseProjections, factorsOptimistic);
  const scenarioConservative = applyMLFactors(baseProjections, factorsConservative);

  // Crear plan
  const createdAt = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 28); // 4 semanas

  const plan: ProjectionPlan = {
    id: `plan-${country}-${Date.now()}`,
    country,
    createdAt,
    expiresAt: expiresAt.toISOString(),
    scenarios: {
      base: scenarioBase,
      optimistic: scenarioOptimistic,
      conservative: scenarioConservative
    },
    metadata: {
      historicalDays: 30,
      confidence: mlFactors.confidence,
      mlFactors: {
        ...mlFactors,
        scenarios: {
          base: factorsBase,
          optimistic: factorsOptimistic,
          conservative: factorsConservative
        }
      },
      historicalStats: stats
    }
  };

  // Guardar en localStorage
  saveProjectionPlan(plan);

  return plan;
}

/**
 * Guarda plan en localStorage
 */
export function saveProjectionPlan(plan: ProjectionPlan): void {
  try {
    const key = `projection_plan_${plan.country}`;
    localStorage.setItem(key, JSON.stringify(plan));
    console.log(`Plan guardado para ${plan.country}`);
  } catch (error) {
    console.error('Error guardando plan:', error);
  }
}

/**
 * Carga plan desde localStorage
 */
export function loadProjectionPlan(country: Country): ProjectionPlan | null {
  try {
    const key = `projection_plan_${country}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const plan: ProjectionPlan = JSON.parse(stored);
    return plan;
  } catch (error) {
    console.error('Error cargando plan:', error);
    return null;
  }
}

/**
 * Verifica si un plan expiró
 */
export function isPlanExpired(plan: ProjectionPlan): boolean {
  const now = new Date();
  const expiresAt = new Date(plan.expiresAt);
  return now > expiresAt;
}

/**
 * Compara plan vs datos reales actuales
 */
export async function comparePlanVsReal(
  plan: ProjectionPlan
): Promise<PlanVsRealComparison> {
  // Obtener datos reales actuales
  const [salesData, ocData] = await Promise.all([
    getSalesData(),
    getOCData()
  ]);

  // Determinar rango de fechas del plan
  const planStartDate = new Date(plan.scenarios.base[0].startDate);
  const planEndDate = new Date(plan.scenarios.base[plan.scenarios.base.length - 1].endDate);

  // Filtrar datos reales por rango del plan
  const realSales = filterSalesByCountryAndDateRange(
    salesData,
    plan.country,
    planStartDate,
    planEndDate
  );

  const realOCs = filterOCByCountryAndDateRange(
    ocData,
    plan.country,
    planStartDate,
    planEndDate
  );

  // Crear rangos de semanas del plan
  const weekRanges = plan.scenarios.base.map(week => ({
    startDate: new Date(week.startDate),
    endDate: new Date(week.endDate)
  }));

  // Agrupar datos reales por semana (pasando el país para conversión correcta)
  const realByWeek = groupByWeek(realSales, realOCs, weekRanges, plan.country);

  // Actualizar proyecciones con datos reales
  const comparisonByWeek = plan.scenarios.base.map((projWeek, index) => {
    const real = realByWeek[index];

    if (real && real.hasData) {
      const variance = ((real.netCashFlow - projWeek.netCashFlow) / projWeek.netCashFlow) * 100;
      const varianceAbsolute = real.netCashFlow - projWeek.netCashFlow;

      return {
        ...projWeek,
        actualInflows: real.totalInflows,
        actualOutflows: real.totalOutflows,
        actualNet: real.netCashFlow,
        variance,
        varianceAbsolute
      };
    }

    return projWeek;
  });

  // Calcular métricas de resumen
  const weeksWithData = comparisonByWeek.filter(w => w.actualNet !== null).length;
  const totalVariance = comparisonByWeek
    .filter(w => w.variance !== null)
    .reduce((sum, w) => sum + Math.abs(w.variance!), 0);
  const avgVariance = weeksWithData > 0 ? totalVariance / weeksWithData : 0;
  const accuracy = Math.max(0, 100 - avgVariance);

  return {
    plan,
    realData: {
      inflows: realSales,
      outflows: realOCs
    },
    comparisonByWeek,
    summary: {
      totalVariance,
      avgVariance,
      weeksWithData,
      accuracy
    }
  };
}

/**
 * Calcula métricas de precisión
 */
export function calculateAccuracyMetrics(comparison: PlanVsRealComparison) {
  return {
    accuracy: comparison.summary.accuracy,
    avgVariance: comparison.summary.avgVariance,
    totalVariance: comparison.summary.totalVariance
  };
}
