// URL del Google Apps Script para Weekly Financial Model
const WEEKLY_FINANCIAL_URL = 'https://script.google.com/macros/s/AKfycbw6y96A27BZc8MXvHvmDLgMf2GWBI0cx3Ihh3EuLe0Ho67cALh329uqUf9gTxa4L2K2/exec';

export interface CityMetrics {
  Sales: number[];
  Catering: number[];
  Delivery: number[];
  Foodcost: number[];
  'Marketing Costs': number[];
  'Sales Payroll': number[];
  'Gross margin': number[];
}

export interface WeeklyFinancialData {
  weeks: string[];
  citiesData: {
    Lima?: CityMetrics;
    Piura?: CityMetrics;
    Bogota?: CityMetrics;
    CDMX?: CityMetrics;
    Guadalajara?: CityMetrics;
  };
}

/**
 * Obtiene datos del Weekly Financial Model desde Google Apps Script
 */
export async function getWeeklyFinancialData(): Promise<WeeklyFinancialData | null> {
  try {
    console.log('Fetching Weekly Financial Model data from:', WEEKLY_FINANCIAL_URL);

    const response = await fetch(WEEKLY_FINANCIAL_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Sin credentials para CORS
      mode: 'cors',
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      return null;
    }

    const data: WeeklyFinancialData = await response.json();
    console.log('Weekly Financial Model data received:', data);

    return data;
  } catch (error) {
    // No romper la aplicación si falla
    console.warn('Weekly Financial Model no disponible (esto es opcional):', error);
    return null;
  }
}

/**
 * Convierte ciudad del Weekly Model al tipo Country
 */
export function cityToCountry(city: string): 'Peru' | 'Colombia' | 'Mexico' | 'Global' {
  const cityMap: { [key: string]: 'Peru' | 'Colombia' | 'Mexico' } = {
    'Lima': 'Peru',
    'Piura': 'Peru',
    'Bogota': 'Colombia',
    'CDMX': 'Mexico',
    'Guadalajara': 'Mexico'
  };

  return cityMap[city] || 'Global';
}

/**
 * Obtiene métricas agregadas por país del Weekly Financial Model
 */
export function getCountryMetrics(
  data: WeeklyFinancialData,
  country: 'Peru' | 'Colombia' | 'Mexico' | 'Global'
): {
  weeks: string[];
  totalSales: number[];
  totalCatering: number[];
  totalDelivery: number[];
  avgGrossMargin: number[];
} | null {
  if (!data || !data.citiesData) return null;

  const cities = Object.keys(data.citiesData).filter(city => {
    if (country === 'Global') return true;
    return cityToCountry(city) === country;
  });

  if (cities.length === 0) return null;

  // Inicializar arrays con zeros
  const weeks = data.weeks;
  const totalSales = new Array(weeks.length).fill(0);
  const totalCatering = new Array(weeks.length).fill(0);
  const totalDelivery = new Array(weeks.length).fill(0);
  const grossMargins: number[][] = [];

  // Sumar métricas de todas las ciudades del país
  cities.forEach(city => {
    const metrics = data.citiesData[city as keyof typeof data.citiesData];
    if (!metrics) return;

    metrics.Sales?.forEach((val, idx) => {
      totalSales[idx] = (totalSales[idx] || 0) + (val || 0);
    });

    metrics.Catering?.forEach((val, idx) => {
      totalCatering[idx] = (totalCatering[idx] || 0) + (val || 0);
    });

    metrics.Delivery?.forEach((val, idx) => {
      totalDelivery[idx] = (totalDelivery[idx] || 0) + (val || 0);
    });

    if (metrics['Gross margin']) {
      grossMargins.push(metrics['Gross margin']);
    }
  });

  // Calcular promedio de gross margin
  const avgGrossMargin = weeks.map((_, idx) => {
    const margins = grossMargins.map(gm => gm[idx] || 0).filter(v => v !== 0);
    return margins.length > 0
      ? margins.reduce((sum, v) => sum + v, 0) / margins.length
      : 0;
  });

  return {
    weeks,
    totalSales,
    totalCatering,
    totalDelivery,
    avgGrossMargin
  };
}

/**
 * Calcula proyección basada en datos del Weekly Financial Model
 */
export function calculateProjectionFromWeekly(
  countryMetrics: ReturnType<typeof getCountryMetrics>,
  futureWeeks: number = 4,
  baseDate: Date = new Date() // El "hoy" del usuario
): {
  projectedSales: number[];
  projectedCatering: number[];
  projectedDelivery: number[];
  confidence: number;
} {
  if (!countryMetrics) {
    return {
      projectedSales: [],
      projectedCatering: [],
      projectedDelivery: [],
      confidence: 0
    };
  }

  // 1. Identificar la fecha objetivo en el pasado (hace exactamente 1 año)
  const targetPastDate = new Date(baseDate);
  targetPastDate.setFullYear(baseDate.getFullYear() - 1);

  // 2. Encontrar el índice más cercano en el histórico del Weekly Model
  let closestIdx = -1;
  let minDiff = Infinity;

  countryMetrics.weeks.forEach((weekStr, idx) => {
    const weekDate = new Date(weekStr);
    const diff = Math.abs(weekDate.getTime() - targetPastDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = idx;
    }
  });

  const projectedSales: number[] = [];
  const projectedCatering: number[] = [];
  const projectedDelivery: number[] = [];
  let confidence = 0.5; // Base si no hay datos estacionales

  if (closestIdx !== -1) {
    console.log(`Seasonal match found at ${countryMetrics.weeks[closestIdx]} for target ${targetPastDate.toLocaleDateString()}`);

    // 3. Tomar las N semanas siguientes desde ese punto histórico
    for (let i = 0; i < futureWeeks; i++) {
      const idx = closestIdx + i;
      if (idx < countryMetrics.totalSales.length) {
        projectedSales.push(countryMetrics.totalSales[idx] || 0);
        projectedCatering.push(countryMetrics.totalCatering[idx] || 0);
        projectedDelivery.push(countryMetrics.totalDelivery[idx] || 0);
      } else {
        // Fallback al promedio si se acaba el histórico
        const avgSales = countryMetrics.totalSales.slice(-4).reduce((a, b) => a + b, 0) / 4;
        projectedSales.push(avgSales);
      }
    }
    confidence = 0.85; // Alta confianza por usar datos estaciónales
  } else {
    // Fallback original si no hay coincidencia estacional
    const recentWeeks = 4;
    const salesRecent = countryMetrics.totalSales.slice(-recentWeeks);
    const avgSales = salesRecent.reduce((sum, v) => sum + v, 0) / (salesRecent.length || 1);
    for (let i = 0; i < futureWeeks; i++) {
      projectedSales.push(avgSales);
      projectedCatering.push(0);
      projectedDelivery.push(0);
    }
  }

  return {
    projectedSales,
    projectedCatering,
    projectedDelivery,
    confidence
  };
}
