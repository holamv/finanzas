import { Country } from '@/types';

/**
 * Tipos de cambio actuales (Febrero 2026)
 * 1 USD = X moneda local
 */
export const EXCHANGE_RATES: Record<string, number> = {
  // Perú
  'PE': 3.80,
  'PEN': 3.80,
  'PERU': 3.80,
  'PERÚ': 3.80,
  'SOL': 3.80,
  'SOLES': 3.80,
  // Colombia
  'CO': 4000,
  'COP': 4000,
  'COL': 4000,
  'COLOMBIA': 4000,
  // México
  'MX': 18.50,
  'MXN': 18.50,
  'MEX': 18.50,
  'MEXICO': 18.50,
  'MÉXICO': 18.50,
  // Base
  'USD': 1,
  'US': 1,
  'DOLAR': 1,
  'DÓLAR': 1,
} as const;

export type CurrencyCode = keyof typeof EXCHANGE_RATES;



/**
 * Obtiene el código de moneda según el país
 */
export function getCurrencyByCountry(country: Country): string {
  const currencyMap: Record<Country, string> = {
    Peru: 'PE',
    Colombia: 'COP',
    Mexico: 'MXN',
    Global: 'USD',
  };
  return currencyMap[country] || 'USD';
}

/**
 * Obtiene el símbolo de moneda según el país
 */
export function getCurrencySymbol(country: Country): string {
  const symbolMap: Record<Country, string> = {
    Peru: 'PE',
    Colombia: 'COP',
    Mexico: 'MXN',
    Global: '$',
  };
  return symbolMap[country] || '$';
}

/**
 * Formatea un valor numérico como moneda según el país
 */
export function formatCurrency(value: number, country: Country): string {
  // Configuración de locales
  const locales: Record<Country, string> = {
    Peru: 'es-PE',
    Colombia: 'es-CO',
    Mexico: 'es-MX',
    Global: 'en-US',
  };

  const code = getCurrencyByCountry(country);
  const locale = locales[country] || 'en-US';

  // Si es PE, COP o MXN y NO queremos el símbolo estándar de Intl (como S/ o $)
  // sino los códigos específicos solicitados (PE, COP, MXN)
  if (country !== 'Global') {
    const symbol = getCurrencySymbol(country);
    return `${symbol} ${value.toLocaleString(locale, {
      minimumFractionDigits: country === 'Colombia' ? 0 : 2,
      maximumFractionDigits: country === 'Colombia' ? 0 : 2,
    })}`;
  }

  // Para Global (USD)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Suma un array de montos considerando conversión a USD si es Global
 * @param amounts Array de objetos con monto y moneda
 * @param country País seleccionado
 * @returns Suma total (en USD si es Global, en moneda local si no)
 */
export function sumAmountsWithConversion(
  amounts: Array<{ amount: number; currency: string }>,
  country: Country
): number {
  if (country === 'Global') {
    // Convertir todo a USD y sumar
    return amounts.reduce((sum, item) => {
      const amountInUSD = convertToUSD(item.amount, item.currency);
      return sum + amountInUSD;
    }, 0);
  } else {
    // Suma directa en moneda local
    return amounts.reduce((sum, item) => sum + item.amount, 0);
  }
}

/**
 * Infiere la moneda desde el nombre del país (string flexible)
 * @param paisStr String con el nombre del país (puede ser 'peru', 'Peru', 'PE', etc.)
 * @returns Código de moneda inferido
 */
// Redefiniendo las funciones de forma limpia al final o reemplazando las antiguas
export function inferCurrencyFromCountryString(paisStr: string): string {
  if (!paisStr) return 'USD';
  const s = paisStr.toLowerCase().trim();

  if (s.includes('peru') || s.includes('perú') || s.includes('sol') || s === 'pe' || s === 'pen') return 'PEN';
  if (s.includes('colombia') || s.includes('cop') || s === 'co') return 'COP';
  if (s.includes('mexico') || s.includes('méxico') || s.includes('mxn') || s === 'mx') return 'MXN';

  return 'USD';
}

export function convertToUSD(amount: number, currencyOrCountry: string): number {
  if (!amount || isNaN(amount)) return 0;
  if (!currencyOrCountry) return amount;

  const input = currencyOrCountry.toUpperCase().trim();

  // 1. Detección directa por el nombre/código
  if (EXCHANGE_RATES[input]) {
    return amount / EXCHANGE_RATES[input];
  }

  // 2. Inferencia por nombre de país si no se encontró el código
  const inferred = inferCurrencyFromCountryString(currencyOrCountry);
  const rate = EXCHANGE_RATES[inferred] || 1;

  console.log(`[Currency] Converting ${amount} from ${currencyOrCountry} (Inferred: ${inferred}, Rate: ${rate})`);

  return amount / rate;
}
