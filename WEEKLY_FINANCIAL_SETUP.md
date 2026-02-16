# Configuración del Weekly Financial Model

## Problema Actual

La aplicación no puede acceder al Google Apps Script debido a restricciones CORS. Esto es normal y tiene solución.

## Solución: Configurar Apps Script Correctamente

### Paso 1: Verificar el Código del Apps Script

Asegúrate de que tu función `doGet()` en Apps Script incluya los headers CORS correctos:

```javascript
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Weekly Financial Model");

  // 1. Obtener todos los datos
  const fullData = sheet.getDataRange().getValues();

  // 2. Extraer las Semanas (Fila 2, desde columna H)
  const weeks = fullData[1].slice(7).filter(w => w !== "" && w !== null);

  // 3. Definir ciudades y métricas
  const cities = ["Lima", "Piura", "Bogota", "CDMX", "Guadalajara"];
  const targetMetrics = [
    "Sales", "Catering", "Delivery", "Foodcost",
    "Marketing Costs", "Sales Payroll", "Gross margin"
  ];

  const results = {};
  let currentCity = "";

  // 4. Procesar la hoja fila por fila
  for (let i = 0; i < fullData.length; i++) {
    let concept = fullData[i][0] ? fullData[i][0].toString().trim() : "";

    if (cities.includes(concept)) {
      currentCity = concept;
      results[currentCity] = {};
      continue;
    }

    if (currentCity && targetMetrics.includes(concept)) {
      let values = fullData[i].slice(7, 7 + weeks.length).map(v => {
        return (v === "" || isNaN(v)) ? 0 : v;
      });

      if (!results[currentCity][concept]) {
        results[currentCity][concept] = values;
      }
    }
  }

  // 5. Estructura final
  const finalResponse = {
    weeks: weeks,
    citiesData: results
  };

  // ⚠️ IMPORTANTE: Agregar headers CORS
  return ContentService
    .createTextOutput(JSON.stringify(finalResponse))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Paso 2: Publicar el Script como Web App

1. En tu Google Apps Script, ve a: **Deploy** → **New deployment**
2. Selecciona tipo: **Web app**
3. Configuración:
   - **Execute as**: Me (tu email)
   - **Who has access**: **Anyone** ⚠️ MUY IMPORTANTE
4. Click en **Deploy**
5. Copia la nueva URL del Web App

### Paso 3: Actualizar la URL en el Código

La URL debe tener este formato:
```
https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
```

**Tu URL actual:**
```
https://script.google.com/macros/s/AKfycbw6y96A27BZc8MXvHvmDLgMf2GWBI0cx3Ihh3EuLe0Ho67cALh329uqUf9gTxa4L2K2/exec
```

Si cambiaste algo en el script, necesitas una **nueva URL de deployment**.

### Paso 4: Probar la URL

Abre esta URL en tu navegador (modo incógnito):
```
https://script.google.com/macros/s/AKfycbw6y96A27BZc8MXvHvmDLgMf2GWBI0cx3Ihh3EuLe0Ho67cALh329uqUf9gTxa4L2K2/exec
```

**Deberías ver JSON como:**
```json
{
  "weeks": ["Week 1", "Week 2", ...],
  "citiesData": {
    "Lima": {
      "Sales": [10000, 12000, ...],
      "Catering": [5000, 6000, ...],
      ...
    },
    ...
  }
}
```

**Si ves un error o pide login:**
- El script no está publicado como "Anyone"
- Necesitas crear un nuevo deployment

### Paso 5: Actualizar el Código si Cambió la URL

Si obtuviste una nueva URL de deployment, actualízala en:

**Archivo:** `src/services/weeklyFinancialService.ts`

```typescript
const WEEKLY_FINANCIAL_URL = 'TU_NUEVA_URL_AQUI';
```

## Alternativa: Deshabilitar Temporalmente

Si prefieres no configurar esto ahora, la aplicación seguirá funcionando. El Weekly Financial Model es **opcional**. Las proyecciones usarán solo:
- Datos de Google Sheets (Sales y OC)
- Gemini AI para factores ML

El panel morado "Weekly Financial Model" simplemente no aparecerá.

## Verificación

Una vez configurado correctamente, deberías ver en la consola del navegador:
```
✅ Weekly Financial Model data received: {...}
```

Si ves:
```
⚠️ Weekly Financial Model no disponible (esto es opcional)
```

Revisa los pasos anteriores.

## Troubleshooting

### Error: "Script function not found: doGet"
- Asegúrate de que la función se llame exactamente `doGet`
- Redeploy el script

### Error: "Authorization required"
- El script no está publicado como "Anyone"
- Crea un nuevo deployment con acceso "Anyone"

### Error: "Failed to fetch"
- Problema de CORS
- Verifica que el deployment sea tipo "Web app"
- La URL debe terminar en `/exec`

### El JSON está vacío o incompleto
- Verifica que la hoja se llame exactamente "Weekly Financial Model"
- Verifica que las ciudades estén en la columna A
- Verifica que los datos comiencen en la columna H (índice 7)
