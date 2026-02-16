
import { Transaction, TransactionType, Country } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Fix: Removed accents from country names to match the Country type in types.ts
  { id: '1', description: 'Venta Anticipada A', amount: 5000, type: TransactionType.INFLOW, date: '2023-11-01', week: 1, isActual: true, category: 'Venta', country: 'Peru' },
  { id: '2', description: 'Pago Proveedor X', amount: 2000, type: TransactionType.OUTFLOW, date: '2023-11-02', week: 1, isActual: true, category: 'Pago', country: 'Peru' },
  { id: '3', description: 'Nómina Semana 1', amount: 1500, type: TransactionType.OUTFLOW, date: '2023-11-03', week: 1, isActual: true, category: 'Gasto', country: 'Mexico' },
  { id: '4', description: 'OC Pendiente 123', amount: 8000, type: TransactionType.INFLOW, date: '2023-11-10', week: 2, isActual: false, category: 'OC', country: 'Colombia' },
  { id: '5', description: 'Renta Oficina', amount: 3000, type: TransactionType.OUTFLOW, date: '2023-11-12', week: 2, isActual: false, category: 'Gasto', country: 'Mexico' },
  { id: '6', description: 'Proyección Venta B', amount: 12000, type: TransactionType.INFLOW, date: '2023-11-18', week: 3, isActual: false, category: 'Venta', country: 'Peru' },
  { id: '7', description: 'Mantenimiento Equipos', amount: 1000, type: TransactionType.OUTFLOW, date: '2023-11-20', week: 3, isActual: false, category: 'Gasto', country: 'Colombia' },
  { id: '8', description: 'Cierre Proyecto C', amount: 15000, type: TransactionType.INFLOW, date: '2023-11-25', week: 4, isActual: false, category: 'Venta', country: 'Mexico' },
];

export const CATEGORIES = ['Venta', 'Pago', 'OC', 'Gasto', 'Otro'] as const;
// Fix: Updated COUNTRIES constant to use the defined Country type and correct values
export const COUNTRIES: Country[] = ['Peru', 'Colombia', 'Mexico'];
