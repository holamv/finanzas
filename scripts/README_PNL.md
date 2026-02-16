Importador P&L local
=====================

Descripción
-----------
Este script simple transforma un archivo TSV/CSV de entrada (`data/pnl_input.tsv`) en un JSON (`data/pnl_db.json`) que actúa como base de datos local para consumir en la app.

Formato esperado del archivo `data/pnl_input.tsv`
- Primera fila: cabeceras separadas por tab (o coma). Ejemplo:

  Category\tUnit\t1 2025\t2 2025\t3 2025\t...\n
- Filas siguientes: cada métrica en una fila con valores por mes.

Ejecutar
-------
Desde la raíz del proyecto:

```bash
node scripts/import_pnl_to_json.js
```

El script detecta `data/pnl_input.csv` o `data/pnl_input.tsv` (se prioriza `.csv` si existe).

Salida
-----
- `data/pnl_db.json`: contiene { months: [...], metrics: [{category, unit, values:[...]}], generated_at }

Notas
-----
- El importador intenta limpiar comas y paréntesis y convertir valores a numbers; valores inválidos se guardan como 0.
El importador ahora detecta y agrupa automáticamente sub-métricas comunes bajo su métrica padre: scheduled, on_demand, franchises. Si varias filas corresponden al mismo sub-key, sus valores se suman por mes.
