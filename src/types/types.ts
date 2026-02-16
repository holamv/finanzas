
export type DataSource = 'BACKEND' | 'PAYU' | 'MONNET' | 'MERCADOPAGO' | 'TRANSFERENCIA';

export interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
  lastUpload?: string;
}

export interface SourceConfig {
  id: DataSource;
  name: string;
  icon: string;
  color: string;
  endpoint: string;
}

export interface ReconciliationResult {
  ESTADO: string;
  ID: string | number;
  MONTO: number;
  "MONTO CONTABLE": number;
  "MONTO REAL": number;
  DIFERENCIA?: number | string;
  SERIE: string;
  CORRELATIVO: string | number;
  NOMBRE?: string;
  EMAIL?: string;
  FECHA?: string;
  FUENTE?: string;
  ORIGEN?: string;
  TIPO?: string;
  PAIS?: string;
  "CODIGO TRANSACCION"?: string;
  CODIGO_TRANSACCION?: string;
  COD_TX?: string;
  [key: string]: any; 
}

export enum TransactionType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW'
}

export enum ScenarioType {
  BASE = 'Base',
  OPTIMISTIC = 'Optimista',
  CONSERVATIVE = 'Conservador'
}

// Removed accents from Peru and Mexico
export type Country = 'Peru' | 'Colombia' | 'Mexico' | 'Global';

export type AppTab = 
  | 'cockpit'
  | 'pnl_global'
  | 'conciliation_active' 
  | 'conciliation_history' 
  | 'cash_entry' 
  | 'cash_data' 
  | 'cash_projection' 
  | 'cash_scenarios' 
  | 'cash_variance'
  | 'ai_chat'
  | 'ai_predictions';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  week: number;
  category: string;
  country: Country;
  isActual: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  startingBalance: number;
  transactions: Transaction[];
  horizonWeeks: number;
}

export interface SheetData {
  id: string;
  client: string;
  type: string;
  category: string;
  codeType: string;
  amount: number;
  currency: string;
  date: Date;
  country: Country;
}

export interface OCData {
  correlativo: string;
  tipo: string;
  country: Country;
  proveedor: string;
  id: string;
  concepto: string;
  moneda: string;
  monto: number;
  statusTesoreria: 'Pendiente' | 'Pago parcial' | 'Pago completo';
  fechaVencimiento?: string;
}

export interface PnLRow {
  label: string;
  unit: string;
  values: (number | string)[];
  isHeader?: boolean;
}

export interface PayUTransaction {
  reference_sale: string;
  state_pol: string;
  response_message_pol: string;
  payment_method_type: string;
  value: number | string;
  currency: string;
  date: string;
  email_buyer: string;
  nickname_buyer: string;
  description: string;
}

export interface Charge {
  id: string | number;
  at: string;
  amount: number;
  currency: string;
  description: string;
  pais?: string;
  name?: string;
  email?: string;
  status?: string;
}
