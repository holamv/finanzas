import { Country } from '@/types';

const SHEETS_API_KEY = 'AIzaSyBWYawO4OyhYRGFH8O83baGLUCbY-Se59w';
const SALES_SPREADSHEET_ID = '1gMCkYO9084UY2y0xqnxTFkU_6jKXHEUgcIFoMI4kY6Y';
const OC_SPREADSHEET_ID = '1r-axVBoDMBIbnTtKrXlr4RGR_6icP0dkmjYHRvSvoto';

export interface SalesRecord {
  id: string;
  fecha: string;
  cliente: string;
  monto: number;
  tipo: string;
  pais: string;
  descripcion?: string;
}

export interface OCRecord {
  id: string;
  fecha: string;
  proveedor: string;
  monto: number;
  tipo: string;
  pais: string;
  descripcion?: string;
}

export const getSalesData = async (): Promise<SalesRecord[]> => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SALES_SPREADSHEET_ID}/values/Data%20total?key=${SHEETS_API_KEY}`;
    console.log('Fetching sales data from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Sales API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Error fetching sales data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Sales data received:', data);
    const rows = data.values || [];

    if (rows.length === 0) return [];

    // Asumiendo que la primera fila son headers
    const headers = rows[0];
    const records: SalesRecord[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      records.push({
        id: row[0] || `sale-${i}`,
        cliente: row[1] || 'Sin nombre',
        tipo: row[2] || 'VENTA',
        monto: parseFloat(row[5]) || 0,
        fecha: row[7] || '',
        pais: row[8] || '', // Columna I es PAIS (índice 8)
        descripcion: row[3] || '',
      });
    }

    return records;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};

export const getOCData = async (): Promise<OCRecord[]> => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${OC_SPREADSHEET_ID}/values/OC_MASTER?key=${SHEETS_API_KEY}`;
    console.log('Fetching OC data from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OC API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Error fetching OC data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OC data received:', data);
    const rows = data.values || [];

    if (rows.length === 0) return [];

    // Estructura completa: Correlativo, Tipo_OC, País, Proveedor, Id, Concepto, Moneda, Monto, Centro de costo, Línea_Servicio, fecha, Fecha_Servicio, Fecha_Vencimiento, Solicitante, Estado
    const records: OCRecord[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      records.push({
        id: row[0] || `oc-${i}`, // Correlativo
        proveedor: row[3] || 'Sin proveedor',
        tipo: row[1] || 'PAGO PLANIFICADO',
        pais: row[2] || '',
        monto: parseFloat(row[7]) || 0,
        fecha: row[10] || '', // Fecha registro
        descripcion: row[5] || '', // Concepto
      });
    }

    return records;
  } catch (error) {
    console.error('Error fetching OC data:', error);
    return [];
  }
};

// ===== HELPER FUNCTIONS PARA PROYECCIONES =====

/**
 * Filtra ventas por país y rango de fechas
 */
export function filterSalesByCountryAndDateRange(
  sales: SalesRecord[],
  country: Country,
  startDate: Date,
  endDate: Date
): SalesRecord[] {
  return sales.filter(s => {
    const saleDate = new Date(s.fecha);
    // Filtro por fecha
    const inDateRange = saleDate >= startDate && saleDate <= endDate;

    // Filtro por país
    const countryMatch = country === 'Global' || (s.pais && s.pais.toLowerCase().includes(country.toLowerCase()));

    return inDateRange && countryMatch;
  });
}

/**
 * Filtra órdenes de compra por país y rango de fechas
 */
export function filterOCByCountryAndDateRange(
  ocs: OCRecord[],
  country: Country,
  startDate: Date,
  endDate: Date
): OCRecord[] {
  return ocs.filter(o => {
    const ocDate = new Date(o.fecha);
    // Filtro por fecha
    const inDateRange = ocDate >= startDate && ocDate <= endDate;

    // Filtro por país
    const countryMatch = country === 'Global' || (o.pais && o.pais.toLowerCase().includes(country.toLowerCase()));

    return inDateRange && countryMatch;
  });
}

/**
 * Agrupa datos de inflows y outflows por semana
 */
export function groupByWeek(
  inflows: SalesRecord[],
  outflows: OCRecord[],
  weekRanges: { startDate: Date, endDate: Date }[]
): Array<{
  week: number,
  totalInflows: number,
  totalOutflows: number,
  netCashFlow: number,
  hasData: boolean
}> {
  return weekRanges.map((range, index) => {
    const weekInflows = inflows.filter(i => {
      const d = new Date(i.fecha);
      return d >= range.startDate && d <= range.endDate;
    });

    const weekOutflows = outflows.filter(o => {
      const d = new Date(o.fecha);
      return d >= range.startDate && d <= range.endDate;
    });

    const totalInflows = weekInflows.reduce((sum, i) => sum + i.monto, 0);
    const totalOutflows = weekOutflows.reduce((sum, o) => sum + o.monto, 0);

    return {
      week: index + 1,
      totalInflows,
      totalOutflows,
      netCashFlow: totalInflows - totalOutflows,
      hasData: weekInflows.length > 0 || weekOutflows.length > 0
    };
  });
}
