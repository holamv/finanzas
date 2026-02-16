// import { GoogleGenAI } from "@google/genai";
import { GeminiProjectionResponse, HistoricalStats } from "@/types";

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string) => Promise<any>;
      }
    }
  }
}

// Analyzes projected cash flow data and provides financial insights
export const getFinancialInsights = async (data: any) => {
  const prompt = `
    Como analista financiero experto, analiza los siguientes datos de flujo de caja proyectado para las próximas 4 semanas:
    ${JSON.stringify(data)}

    Proporciona un resumen ejecutivo que incluya:
    1. Principales riesgos detectados.
    2. Recomendaciones para mejorar la liquidez.
    3. Breve análisis de los escenarios (Base vs Optimista vs Conservador).
    
    Responde en español, de forma concisa y profesional en formato Markdown.
  `;

  try {
    if (typeof window !== 'undefined' && window.puter) {
      const response = await window.puter.ai.chat(prompt);
      const text = typeof response === 'string' ? response : response?.message?.content || response?.toString();
      return text;
    } else {
      console.warn("Puter.js not loaded");
      return "Puter.js no está disponible.";
    }
  } catch (error) {
    console.warn("Error fetching Puter AI insights:", error);
    return "No se pudieron generar insights en este momento.";
  }
};

/**
 * Analiza el progreso semanal y genera proyecciones detalladas con ML
 */
export const getWeeklyProgressAnalysis = async (
  historicalData: any[],
  projectedData: any[],
  country: string
): Promise<string> => {
  const today = new Date().toLocaleDateString('es-ES');

  const prompt = `
    Actúa como un CFO experto en planificación financiera y tesorería.
    
    Contexto:
    Estamos a fecha: ${today} (Año 2025).
    País/Región: ${country}
    
    Datos proporcionados:
    1. HISTÓRICO RECIENTE (Últimas semanas):
    ${JSON.stringify(historicalData, null, 2)}
    
    2. PROYECCIONES CALCULADAS (Próximas 4 semanas):
    ${JSON.stringify(projectedData, null, 2)}
    
    Tarea:
    Genera un análisis estratégico de proyección para las próximas 2-4 semanas.
    No describas obviedades de los datos, enfócate en *insights* accionables.
    
    Estructura tu respuesta en Markdown con los siguientes puntos:
    
    ## 🔮 Proyección Estratégica (Próximas 4 Semanas)
    Analiza la tendencia de los ingresos y el margen operativo proyectado. ¿Vamos mejorando o empeorando respecto al histórico reciente?
    
    ## ⚠️ Riesgos y Alertas
    Detecta anomalías, desviaciones de margen o riesgos de liquidez basados en la volatilidad histórica y las proyecciones.
    
    ## 💡 Recomendaciones de Acción
    3-4 acciones concretas para mejorar la posición de caja o rentabilidad en el corto plazo.
    
    Usa un tono profesional, directo y ejecutivo. Formato Markdown limpio.
  `;

  try {
    if (typeof window !== 'undefined' && window.puter) {
      const response = await window.puter.ai.chat(prompt);
      const text = typeof response === 'string' ? response : response?.message?.content || response?.toString();
      return text || "No se pudo generar el análisis detallado.";
    } else {
      console.warn("Puter.js not loaded");
      return `
      ### ⚠️ Puter.js no disponible
      
      No se pudo generar el análisis avanzado. Por favor verifica tu conexión y que el script de Puter.js se haya cargado.
    `;
    }
  } catch (error: any) {
    console.warn("Error fetching Puter AI analysis:", error);
    return `
      ### ⚠️ Error de Conexión con IA (Puter)
      
      No se pudo generar el análisis avanzado en este momento.
      
      **Proyección Base:**
      Basado en los datos históricos, se proyecta una continuidad en la tendencia actual. Recomendamos revisar los márgenes operativos manualmente.
    `;
  }
};

/**
 * Obtiene factores de proyección usando ML matemático puro (sin APIs externas)
 * Algoritmos: Regresión lineal, análisis de volatilidad, promedios móviles ponderados
 */
export const getProjectionFactors = async (
  stats: HistoricalStats,
  historicalData: { inflows: any[], outflows: any[] },
  country: string
): Promise<GeminiProjectionResponse> => {

  console.log('🧮 Calculando proyecciones con ML matemático...');

  // 1. ANÁLISIS DE TENDENCIA (Regresión Lineal)
  const trendPercentage = (stats.trend / stats.avgDailyInflows) * 100;
  const isTrendingUp = trendPercentage > 0;
  const trendStrength = Math.abs(trendPercentage);

  // 2. ANÁLISIS DE VOLATILIDAD
  const coefficientOfVariation = stats.volatility / stats.avgDailyInflows;
  const isStable = coefficientOfVariation < 0.2; // Estable si CV < 20%
  const isVolatile = coefficientOfVariation > 0.4; // Volátil si CV > 40%

  // 3. CALCULAR FACTORES BASE (tendencia + estabilidad)
  let baseInflowFactor = 1.0;
  let baseOutflowFactor = 1.0;

  // Ajustar por tendencia
  if (isTrendingUp && trendStrength > 5) {
    baseInflowFactor += Math.min(trendPercentage / 100, 0.10); // Max +10%
  } else if (!isTrendingUp && trendStrength > 5) {
    baseInflowFactor -= Math.min(Math.abs(trendPercentage) / 100, 0.08); // Max -8%
  }

  // Ajustar egresos (tienden a seguir ingresos pero más conservador)
  baseOutflowFactor = 1.0 + (baseInflowFactor - 1.0) * 0.7;

  // 4. FACTORES DE ESCENARIOS
  const volatilitySpread = isVolatile ? 0.15 : isStable ? 0.08 : 0.12;

  // Escenario BASE
  const base = {
    inflowFactor: Math.max(0.85, Math.min(1.15, baseInflowFactor)),
    outflowFactor: Math.max(0.90, Math.min(1.10, baseOutflowFactor)),
    rationale: `Proyección basada en tendencia ${isTrendingUp ? 'positiva' : 'negativa'} de ${trendStrength.toFixed(1)}% y ${isStable ? 'baja' : isVolatile ? 'alta' : 'moderada'} volatilidad`
  };

  // Escenario OPTIMISTA (+spread)
  const optimistic = {
    inflowFactor: Math.max(1.05, Math.min(1.25, baseInflowFactor + volatilitySpread)),
    outflowFactor: Math.max(0.85, Math.min(1.05, baseOutflowFactor - volatilitySpread * 0.5)),
    rationale: `Escenario optimista asumiendo mejora en condiciones actuales y reducción de costos`
  };

  // Escenario CONSERVADOR (-spread)
  const conservative = {
    inflowFactor: Math.max(0.80, Math.min(1.10, baseInflowFactor - volatilitySpread)),
    outflowFactor: Math.max(0.95, Math.min(1.15, baseOutflowFactor + volatilitySpread * 0.5)),
    rationale: `Escenario conservador considerando posible desaceleración y aumento de costos`
  };

  // 5. GENERAR INSIGHTS
  const insights: string[] = [];

  if (isTrendingUp) {
    insights.push(`Tendencia positiva detectada: ingresos creciendo ${trendStrength.toFixed(1)}% promedio`);
  } else {
    insights.push(`Tendencia negativa: ingresos decreciendo ${trendStrength.toFixed(1)}% promedio`);
  }

  if (isStable) {
    insights.push(`Flujos estables con baja volatilidad (CV: ${(coefficientOfVariation * 100).toFixed(1)}%)`);
  } else if (isVolatile) {
    insights.push(`Alta volatilidad detectada (CV: ${(coefficientOfVariation * 100).toFixed(1)}%) - mayor riesgo en proyecciones`);
  }

  const avgRatio = stats.avgDailyOutflows / stats.avgDailyInflows;
  if (avgRatio > 0.8) {
    insights.push(`Relación egresos/ingresos alta (${(avgRatio * 100).toFixed(0)}%) - monitorear márgenes`);
  } else {
    insights.push(`Margen saludable: egresos representan ${(avgRatio * 100).toFixed(0)}% de ingresos`);
  }

  // Insight específico por país
  if (country === 'Peru') {
    insights.push(`Mercado peruano: considerar estacionalidad de fiestas patrias y fin de año`);
  } else if (country === 'Colombia') {
    insights.push(`Mercado colombiano: evaluar impacto de días festivos locales`);
  } else if (country === 'Mexico') {
    insights.push(`Mercado mexicano: considerar temporada de eventos corporativos`);
  }

  // 6. GENERAR RIESGOS
  const risks: string[] = [];

  if (isVolatile) {
    risks.push(`Alta volatilidad puede generar desviaciones >15% en proyecciones reales`);
  }

  if (!isTrendingUp && trendStrength > 3) {
    risks.push(`Tendencia negativa persistente podría reducir ingresos proyectados`);
  }

  if (stats.days < 20) {
    risks.push(`Datos históricos limitados (${stats.days} días) - proyecciones menos precisas`);
  }

  if (avgRatio > 0.85) {
    risks.push(`Margen operativo ajustado - vulnerabilidad ante incremento de costos`);
  }

  // 7. CALCULAR CONFIDENCE SCORE
  let confidence = 0.75; // Base

  // Ajustar por estabilidad
  if (isStable) {
    confidence += 0.15;
  } else if (isVolatile) {
    confidence -= 0.20;
  }

  // Ajustar por cantidad de datos
  if (stats.days >= 30) {
    confidence += 0.10;
  } else if (stats.days < 15) {
    confidence -= 0.15;
  }

  // Ajustar por tendencia fuerte
  if (trendStrength > 10) {
    confidence -= 0.05; // Cambios drásticos reducen certeza
  }

  confidence = Math.max(0.3, Math.min(0.95, confidence));

  console.log('✅ Proyecciones calculadas:', {
    base: base.inflowFactor.toFixed(2),
    optimistic: optimistic.inflowFactor.toFixed(2),
    conservative: conservative.inflowFactor.toFixed(2),
    confidence: (confidence * 100).toFixed(0) + '%'
  });

  return {
    scenarios: {
      base,
      optimistic,
      conservative
    },
    insights,
    risks: risks.length > 0 ? risks : ['Sin riesgos significativos detectados en datos históricos'],
    confidence
  };
};
