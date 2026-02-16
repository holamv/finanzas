
import { ReconciliationResult, OCData } from "../types";
import * as jose from 'jose';

const SERVICE_ACCOUNT = {
  client_email: "bot-sheets@sheet-automazitation.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrLZhYmGmf/2Gm\nmlWr4DCCrUXlXuSdGPJ1E1AQWU8QZ3YazbesR2NbgBbLQceH6C96ViYh5fbYwmxU\nhDG14d6HRI+U+vOSt3dBpm1YfQSmXlDIcZKPSN7FU4rfcwx0vB3OKdOYz4cAVQA8\nwuaDINv63lWCY3GaM5ZL7IPjjFOBNkbDS2YbXy/E/HtlYTYAUZ65dMKYfjjVPVGL\nekZSltMSdB9jgX9HYU+Bgkicw/YMU+mbZDiNNSzGrpu0bFJQcnVY9MDgvhsWFycx\nV/WOLn23z3erro+wsfq9nJnid22ORuwa9rTij7T57LHmSbZuT1VHTxGQy002IV0Q\nIR9o44GtAgMBAAECggEADMU3yKJEPQa/KP/6FLrCu7kEDibcbNjr266fajzTcHCb\nh8fhpEVmJPEjIjJL2biJdDnBmgVPO2AT12FOWRia8qH7iTyIl+E+kSQCo9ed1XCT\nW8TXT3+6+OMw6NcrLnlLSvJlYhDXbD+rJx1ON6mnp6lXHUVgeAXRuGPSehMhtrGv\nmUoAXQuKYZGozqI9r3+6HPsFeIJrKMsR6WBPdKll9RR6sGHl7sDg3PWkHt6kGm6f\nqEGQqcfouIM29T3i7xNCnFf++7ve7MFBfdYJp9wgBbwEf3P8plXE2ns/HYVwvoQh\nBQma/gqCaSeVq0waBGgc6X6anCQB2QQ8UYgLNoKueQKBgQDx8amxUsPYnrVaQQUf\nmtxesb7Nq77p/TOjtCoUY2AFpbTCRJwdYcZjR61Na+fHfOWCXSulwO1lZJhDyDMU\nyNkwKxB6Meyez8KFCMpszcOisI8p2nPV91z/Gb9ZPiaCfU6ytL1zHgCbSq+YWN4O\nuefDikw8mwl1DEfwlukZSJ6GOQKBgQC1H3WPFQfpiqzzE4YGJvigxFsg0FJdWXw+\nnl+cWBJ4u+fc8CkN00oFU+uElRN5p0hH3BL1CHAfOIRaVWV2SihOsLGj4mMhAUxB\njME9aUoE4lyURNcvJmoqbGxSDPDqcLP4rIXvrFD6XWMzZe1VcnNcFxGrn0rAsSSA\n0HvNz253FQKBgEOmlBFeGB74+bKb3afhsF7WCokNzds1jnvmw6FhzBaoJ+vuLUzV\n6xgVkbLFSlDwbmhOTwcQ9BBW2XCSiR31ry0VzYytawFZDIYQWDGmM17JSa6lQ6B/\ng0RdWbDFfRUdnqS/fv2yVO8XKhRKPQUXHGQDxp9npnRRE8iFGfaU5KaZAoGAeLvd\nu2EDgzQDkY0EG/nCZjg9nqP/I2bRIVSk2y0CMyTerDISy7p6bw6/wgM1ljRiRDR5\nFolnZAhigWzHU5CfScUSxPHVrlyVHmTbMzqKMrNJjzRMVIvA3UKk+hTSSxSRg0RN\ni7RLzniN9ecNy5WdPFfMWaC3TbdHY+6VeF27fvkCgYBi3zhDN5SMFs1UkxuGeTWE\nSUz7ywflSZEzM5pH+roVnGbFuuR04ZRwwaXgbX8g5Y8hYeN6V8erM7QLHO3/CMl9\nNiEqBKYbphDv0IFMLsvgkErTUms9ZZt1AsLiAGS9ARaq+0q47X4ULMEsnkJ0ulMF\n755SpKmfhlqQjAk6si0x/Q==\n-----END PRIVATE KEY-----\n"
};

const SPREADSHEET_ID = "1tueVZftXS428MpjIYwRq3SsZ09QhagRVfX4oUdg_RLY";
const SHEET_NAME = "Hoja 1";
const OC_SPREADSHEET_ID = "1r-axVBoDMBIbnTtKrXlr4RGR_6icP0dkmjYHRvSvoto";
const OC_SHEET_NAME = "OC_MASTER";
const PROV_SHEET_NAME = "PROVEEDORES";

async function getAccessToken(): Promise<string> {
  const pk = await jose.importPKCS8(SERVICE_ACCOUNT.private_key, 'RS256');
  const jwt = await new jose.SignJWT({
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'RS256' })
    .sign(pk);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

export const getAllTransactions = async (): Promise<ReconciliationResult[]> => {
  try {
    const token = await getAccessToken();
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:K?access_token=${token}`;
    const readRes = await fetch(readUrl);
    if (!readRes.ok) throw new Error("Error al leer el Google Sheet.");

    const sheetData = await readRes.json();
    const rows = sheetData.values || [];

    if (rows.length <= 1) return [];

    return rows.slice(1).map((row: any[]) => ({
      ESTADO: row[0] || '',
      ID: row[1] || '',
      "CODIGO TRANSACCION": row[2] || '',
      FECHA: row[3] || '',
      NOMBRE: row[4] || '',
      EMAIL: row[5] || '',
      PAIS: row[6] || '',
      ORIGEN: row[7] || '',
      MONTO: parseFloat(row[8] || '0'),
      "MONTO CONTABLE": parseFloat(row[9] || '0'),
      DIFERENCIA: row[10] || 0
    }));
  } catch (err) {
    console.error("Error fetching all transactions:", err);
    return [];
  }
};

export const manualUpdateRowStatus = async (internalId: string, newStatus: string): Promise<boolean> => {
  try {
    const token = await getAccessToken();
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!B:B?access_token=${token}`;
    const readRes = await fetch(readUrl);
    if (!readRes.ok) return false;

    const sheetData = await readRes.json();
    const ids = sheetData.values || [];

    // Buscar la fila por el ID Interno (Columna B)
    const rowIndex = ids.findIndex((row: any[]) => String(row[0]).trim() === internalId.trim());

    if (rowIndex === -1) {
      console.error("Fila no encontrada para actualización manual:", internalId);
      return false;
    }

    const updates = [
      {
        range: `${SHEET_NAME}!A${rowIndex + 1}`,
        values: [[newStatus]]
      },
      {
        range: `${SHEET_NAME}!K${rowIndex + 1}`,
        values: [[0]] // Al conciliar manualmente, la diferencia pasa a 0
      }
    ];

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate?access_token=${token}`;
    await fetch(batchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updates
      })
    });

    return true;
  } catch (err) {
    console.error("Manual Update Error:", err);
    return false;
  }
};

export const syncInternalToSheets = async (
  data: ReconciliationResult[],
  getTxCode: (item: ReconciliationResult) => string,
  country: string
) => {
  if (!data || data.length === 0) return;

  try {
    const token = await getAccessToken();

    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:F?access_token=${token}`;
    const readRes = await fetch(readUrl);
    if (!readRes.ok) throw new Error("Error al leer el Google Sheet.");

    const sheetData = await readRes.json();
    const rows = sheetData.values || [];

    const prefixMap: Record<string, string> = {
      'peru': 'PE-',
      'colombia': 'CO-',
      'mexico': 'MX-'
    };
    const codeMap: Record<string, string> = {
      'peru': 'PE',
      'colombia': 'CO',
      'mexico': 'MX'
    };

    const currentPrefix = prefixMap[country] || 'XX-';
    const currentCountryCode = codeMap[country] || 'XX';

    const sheetMap = new Map<string, { status: string, rowIndex: number, internalId: string }>();
    let maxCounter = 0;

    rows.forEach((row: any[], index: number) => {
      const status = String(row[0] || '').trim();
      const idVal = String(row[1] || '').trim();
      const code = String(row[2] || '').trim().toLowerCase();
      const name = String(row[4] || '').trim().toLowerCase();
      const email = String(row[5] || '').trim().toLowerCase();

      if (code && name && email) {
        const key = `${code}|${name}|${email}`;
        sheetMap.set(key, { status, rowIndex: index, internalId: idVal });
      }

      if (idVal.startsWith(currentPrefix)) {
        const numPart = parseInt(idVal.split('-')[1]);
        if (!isNaN(numPart) && numPart > maxCounter) {
          maxCounter = numPart;
        }
      }
    });

    const rowsToAppend: any[][] = [];
    const updates: { range: string, values: any[][] }[] = [];

    data.forEach(item => {
      const code = String(getTxCode(item) || '').trim().toLowerCase();
      const name = String(item.NOMBRE || '').trim().toLowerCase();
      const email = String(item.EMAIL || '').trim().toLowerCase();
      const newStatus = item.ESTADO || 'Difiere';
      const diferenciaValue = item.DIFERENCIA || 0;

      const key = `${code}|${name}|${email}`;
      const existing = sheetMap.get(key);
      const paisFinal = item.PAIS || currentCountryCode;

      if (!existing) {
        maxCounter++;
        const newId = `${currentPrefix}${String(maxCounter).padStart(6, '0')}`;

        rowsToAppend.push([
          newStatus,
          newId,
          String(getTxCode(item) || '').trim(),
          item.FECHA || new Date().toISOString().split('T')[0],
          item.NOMBRE || 'N/A',
          item.EMAIL || 'N/A',
          paisFinal,
          item.ORIGEN || 'SISTEMA',
          item.MONTO || 0,
          item["MONTO CONTABLE"] || 0,
          diferenciaValue // Columna K
        ]);

        sheetMap.set(key, { status: newStatus, rowIndex: -1, internalId: newId });
      } else {
        // REGLA DE PROTECCIÓN: 
        // Si el estado en el Excel ya es 'Si está', NO lo sobreescribimos con 'No está' o 'Difiere'.
        // Solo actualizamos si el estado actual NO es 'Si está'.
        if (existing.rowIndex !== -1 && existing.status !== 'Si está') {
          updates.push({
            range: `${SHEET_NAME}!A${existing.rowIndex + 1}`,
            values: [[newStatus]]
          });
          updates.push({
            range: `${SHEET_NAME}!K${existing.rowIndex + 1}`,
            values: [[diferenciaValue]]
          });

          existing.status = newStatus;
        }
      }
    });

    if (updates.length > 0) {
      const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate?access_token=${token}`;
      await fetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: updates
        })
      });
    }

    if (rowsToAppend.length > 0) {
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A1:append?valueInputOption=USER_ENTERED&access_token=${token}`;
      await fetch(appendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rowsToAppend })
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Internal Sync Error:", err);
    throw err;
  }
};

/**
 * Obtiene la lista de proveedores autorizados
 */
export const getProviders = async (): Promise<{ id: string, name: string, country: string }[]> => {
  try {
    const token = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${OC_SPREADSHEET_ID}/values/${PROV_SHEET_NAME}!A:C?access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1).map((row: any[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      country: row[2] || ''
    }));
  } catch (err) {
    console.error("Error fetching providers:", err);
    return [];
  }
};

/**
 * Crea una nueva OC directamente en el Google Sheet
 */
export const createQuickOC = async (data: {
  proveedor: string;
  monto: number;
  tipo: string;
  pais: string;
  concepto: string;
  moneda: string;
  centroCosto: string;
  lineaServicio: string;
  fechaServicio: string;
  fechaVencimiento: string;
  solicitante: string;
  id?: string;
}): Promise<boolean> => {
  try {
    const token = await getAccessToken();

    // Mapeo extendido para OC_MASTER
    const newRow = [
      `OC-${Date.now().toString().slice(-6)}`,
      data.tipo,
      data.pais,
      data.proveedor,
      data.id || `NEW-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      data.concepto,
      data.moneda,
      data.monto,
      data.centroCosto,
      data.lineaServicio,
      data.fechaServicio, // K (10)
      data.fechaVencimiento, // L (11)
      "0", // M (12) - Días Retraso
      data.solicitante, // N (13)
      "", // O (14) - Sustento
      "", // P (15) - Comprobante
      "Pendiente", // Q (16) - Status CEO
      "Pendiente", // R (17) - Status Tesoreria
      "" // S (18) - Comentarios
    ];

    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${OC_SPREADSHEET_ID}/values/${OC_SHEET_NAME}!A1:append?valueInputOption=USER_ENTERED&access_token=${token}`;

    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [newRow] })
    });

    return res.ok;
  } catch (err) {
    console.error("Error creating quick OC:", err);
    return false;
  }
};

/**
 * Obtiene todas las OCs con su metatada completa desde OC_MASTER
 */
export const getOrdersMaster = async (): Promise<OCData[]> => {
  try {
    const token = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${OC_SPREADSHEET_ID}/values/${OC_SHEET_NAME}!A:R?access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    // Header structure: 
    // [0]=Correlativo, [1]=Tipo, [2]=País, [3]=Proveedor, [4]=ID(RUC), [5]=Concepto, [6]=Moneda, [7]=Monto, 
    // [8]=CentroCosto, [9]=LineaServicio, [10]=FechaRegistro, [11]=FechaServicio, [12]=FechaVencimiento, 
    // [13]=Solicitante, [14]=Estado, [15]=Responsable, [16]=Comentarios
    return rows.slice(1).map((row: any[]) => {
      const ceoStatus = (row[16] || '').trim();
      const tesStatus = (row[17] || '').trim();

      const isAprobada = ceoStatus.toLowerCase() === 'aprobada';
      const isPendiente = tesStatus.toLowerCase() === 'pendiente';
      const isParcial = tesStatus.toLowerCase() === 'pago parcial';
      const isCompleto = tesStatus.toLowerCase() === 'pago completo';

      let derivedStatus: 'Pendiente' | 'Recibido' | 'Facturado' | 'Pagado' = 'Pendiente';

      // 1. Prioridad: Si Tesorería dice Pago completo -> PAGADO
      if (isCompleto) {
        derivedStatus = 'Pagado';
      }
      // 2. Si CEO es aprobada y Tesorería es Pago parcial -> FACTURADO
      else if (isAprobada && isParcial) {
        derivedStatus = 'Facturado';
      }
      // 3. Si CEO es aprobada y Tesorería es Pendiente -> RECIBIDO
      else if (isAprobada && isPendiente) {
        derivedStatus = 'Recibido';
      }
      // 4. Si ambos están en Pendiente -> PENDIENTE
      else if (!isAprobada && isPendiente) {
        derivedStatus = 'Pendiente';
      }

      // Limpiar el monto de comas (separador de miles) para parsear correctamente
      const rawMonto = (row[7] || '0').toString().replace(/,/g, '');

      return {
        correlativo: row[0] || '',
        tipo: row[1] || '',
        pais: row[2] || '',
        country: ((row[2] || '').toString().toUpperCase().includes('PER') ? 'Peru' :
          (row[2] || '').toString().toUpperCase().includes('COL') ? 'Colombia' :
            (row[2] || '').toString().toUpperCase().includes('MEX') ? 'Mexico' : 'Peru') as any,
        proveedor: row[3] || '',
        id: row[4] || '',
        concepto: row[5] || '',
        moneda: row[6] || '',
        monto: parseFloat(rawMonto) || 0, // Columna H (index 7) corregida
        centroCosto: row[8] || '',
        lineaServicio: row[9] || '',
        fechaServicio: row[10] || '',
        fechaVencimiento: row[11] || '',
        solicitante: row[13] || '',
        evidenciaUrl: row[14] || '',
        statusTesoreria: derivedStatus,
        statusCEO: ceoStatus,
        statusTesoreriaRaw: tesStatus,
        responsable: row[15] || '', // P (15) - EstadoInicial is not used, this is the actual responsable
        comentarios: row[18] || '', // S (18)
        fechaRegistro: '',
      };
    });
  } catch (err) {
    console.error("Error fetching orders master:", err);
    return [];
  }
};

/**
 * Actualiza el estado o metadatos de una OC existente
 */
export const updateOrderMetadata = async (correlativo: string, updates: Partial<OCData>): Promise<boolean> => {
  try {
    const token = await getAccessToken();

    // Primero buscamos la fila
    const orders = await getOrdersMaster();
    const index = orders.findIndex(o => o.correlativo === correlativo);
    if (index === -1) return false;

    const rowIndex = index + 2; // +1 header, +1 google sheets 1-based index

    let ceoValue = orders[index].statusCEO;
    let tesValue = orders[index].statusTesoreriaRaw;

    if (updates.statusTesoreria) {
      switch (updates.statusTesoreria) {
        case 'Pendiente':
          ceoValue = 'Pendiente';
          tesValue = 'Pendiente';
          break;
        case 'Recibido':
          ceoValue = 'Aprobada';
          tesValue = 'Pendiente';
          break;
        case 'Facturado':
          ceoValue = 'Aprobada';
          tesValue = 'Pago parcial';
          break;
        case 'Pagado':
          ceoValue = 'Aprobada';
          tesValue = 'Pago completo';
          break;
      }
    }

    // Nueva estructura: Q (16 - Status CEO), R (17 - Status Tesoreria), S (18 - Comentarios)
    const range = `${OC_SHEET_NAME}!Q${rowIndex}:S${rowIndex}`;
    const value = [
      ceoValue,
      tesValue,
      updates.comentarios || orders[index].comentarios
    ];

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${OC_SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&access_token=${token}`;

    const res = await fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [value] })
    });

    return res.ok;
  } catch (err) {
    console.error("Error updating order metadata:", err);
    return false;
  }
};
