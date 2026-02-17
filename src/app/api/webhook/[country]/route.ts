import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const SERVICE_ACCOUNT = {
  client_email: "bot-sheets@sheet-automazitation.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrLZhYmGmf/2Gm\nmlWr4DCCrUXlXuSdGPJ1E1AQWU8QZ3YazbesR2NbgBbLQceH6C96ViYh5fbYwmxU\nhDG14d6HRI+U+vOSt3dBpm1YfQSmXlDIcZKPSN7FU4rfcwx0vB3OKdOYz4cAVQA8\nwuaDINv63lWCY3GaM5ZL7IPjjFOBNkbDS2YbXy/E/HtlYTYAUZ65dMKYfjjVPVGL\nekZSltMSdB9jgX9HYU+Bgkicw/YMU+mbZDiNNSzGrpu0bFJQcnVY9MDgvhsWFycx\nV/WOLn23z3erro+wsfq9nJnid22ORuwa9rTij7T57LHmSbZuT1VHTxGQy002IV0Q\nIR9o44GtAgMBAAECggEADMU3yKJEPQa/KP/6FLrCu7kEDibcbNjr266fajzTcHCb\nh8fhpEVmJPEjIjJL2biJdDnBmgVPO2AT12FOWRia8qH7iTyIl+E+kSQCo9ed1XCT\nW8TXT3+6+OMw6NcrLnlLSvJlYhDXbD+rJx1ON6mnp6lXHUVgeAXRuGPSehMhtrGv\nmUoAXQuKYZGozqI9r3+6HPsFeIJrKMsR6WBPdKll9RR6sGHl7sDg3PWkHt6kGm6f\nqEGQqcfouIM29T3i7xNCnFf++7ve7MFBfdYJp9wgBbwEf3P8plXE2ns/HYVwvoQh\nBQma/gqCaSeVq0waBGgc6X6anCQB2QQ8UYgLNoKueQKBgQDx8amxUsPYnrVaQQUf\nmtxesb7Nq77p/TOjtCoUY2AFpbTCRJwdYcZjR61Na+fHfOWCXSulwO1lZJhDyDMU\nyNkwKxB6Meyez8KFCMpszcOisI8p2nPV91z/Gb9ZPiaCfU6ytL1zHgCbSq+YWN4O\nuefDikw8mwl1DEfwlukZSJ6GOQKBgQC1H3WPFQfpiqzzE4YGJvigxFsg0FJdWXw+\nnl+cWBJ4u+fc8CkN00oFU+uElRN5p0hH3BL1CHAfOIRaVWV2SihOsLGj4mMhAUxB\njME9aUoE4lyURNcvJmoqbGxSDPDqcLP4rIXvrFD6XWMzZe1VcnNcFxGrn0rAsSSA\n0HvNz253FQKBgEOmlBFeGB74+bKb3afhsF7WCokNzds1jnvmw6FhzBaoJ+vuLUzV\n6xgVkbLFSlDwbmhOTwcQ9BBW2XCSiR31ry0VzYytawFZDIYQWDGmM17JSa6lQ6B/\ng0RdWbDFfRUdnqS/fv2yVO8XKhRKPQUXHGQDxp9npnRRE8iFGfaU5KaZAoGAeLvd\nu2EDgzQDkY0EG/nCZjg9nqP/I2bRIVSk2y0CMyTerDISy7p6bw6/wgM1ljRiRDR5\nFolnZAhigWzHU5CfScUSxPHVrlyVHmTbMzqKMrNJjzRMVIvA3UKk+hTSSxSRg0RN\ni7RLzniN9ecNy5WdPFfMWaC3TbdHY+6VeF27fvkCgYBi3zhDN5SMFs1UkxuGeTWE\nSUz7ywflSZEzM5pH+roVnGbFuuR04ZRwwaXgbX8g5Y8hYeN6V8erM7QLHO3/CMl9\nNiEqBKYbphDv0IFMLsvgkErTUms9ZZt1AsLiAGS9ARaq+0q47X4ULMEsnkJ0ulMF\n755SpKmfhlqQjAk6si0x/Q==\n-----END PRIVATE KEY-----\n"
};

const SPREADSHEET_ID = "1tueVZftXS428MpjIYwRq3SsZ09QhagRVfX4oUdg_RLY";
const SHEET_NAME = "Hoja 1";

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

async function saveWebhookDataToSheets(
  webhookData: any,
  country: string,
  token: string
) {
  try {
    // Obtener datos actuales
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:K?access_token=${token}`;
    const readRes = await fetch(readUrl);
    if (!readRes.ok) throw new Error("Error al leer Google Sheets");

    const sheetData = await readRes.json();
    const rows = sheetData.values || [];
    const nextRowIndex = rows.length + 1;

    // Mapear datos del webhook a las columnas del sheet
    const internlId = `${country.toUpperCase()}-${Date.now()}`;
    const newRow = [
      webhookData.estado || "Por validar", // Columna A: ESTADO
      internlId, // Columna B: ID Interno
      webhookData.codigo_transaccion || webhookData.transaction_code || "", // Columna C: CODIGO TRANSACCION
      webhookData.fecha || new Date().toISOString().split('T')[0], // Columna D: FECHA
      webhookData.nombre || webhookData.customer_name || "", // Columna E: NOMBRE
      webhookData.email || webhookData.customer_email || "", // Columna F: EMAIL
      country.toUpperCase(), // Columna G: PAIS
      webhookData.origen || webhookData.source || "", // Columna H: ORIGEN
      parseFloat(webhookData.monto || webhookData.amount || 0), // Columna I: MONTO
      parseFloat(webhookData.monto_contable || webhookData.accounting_amount || 0), // Columna J: MONTO CONTABLE
      0 // Columna K: DIFERENCIA (se calcula luego)
    ];

    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A${nextRowIndex}?valueInputOption=USER_ENTERED&access_token=${token}`;
    const appendRes = await fetch(appendUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [newRow] })
    });

    if (!appendRes.ok) throw new Error("Error al guardar en Google Sheets");

    return { success: true, internalId: internlId, rowIndex: nextRowIndex };
  } catch (error) {
    console.error("Error saving to Sheets:", error);
    throw error;
  }
}

export async function POST(
  req: NextRequest,
  context: any
) {
  try {
    const params = await context.params;
    const { country } = params;
    const body = await req.json();

    console.log(`✅ Webhook recibido de n8n para ${country}:`, body);

    // Autenticar con Google Sheets
    const token = await getAccessToken();

    // Guardar datos en Google Sheets
    const result = await saveWebhookDataToSheets(body, country, token);

    // Respuesta exitosa para que n8n sepa que se recibió correctamente
    return NextResponse.json(
      {
        success: true,
        message: `Webhook procesado y guardado para ${country}`,
        country: country,
        internalId: result.internalId,
        receivedAt: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`❌ Error procesando webhook:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: 'Error al procesar webhook'
      },
      { status: 500 }
    );
  }
}

// También permite GET para testing desde n8n
export async function GET(
  req: NextRequest,
  context: any
) {
  const params = await context.params;
  const { country } = params;
  
  return NextResponse.json({
    status: 'webhook endpoint activo',
    country: country,
    receivedAt: new Date().toISOString()
  });
}
