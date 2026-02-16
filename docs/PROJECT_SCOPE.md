# FlowMaster AI - Project Scope

## Resumen

FlowMaster AI es una aplicación web de proyecciones de flujo de caja y análisis financiero con inteligencia artificial, diseñada para Manzana Verde. Permite visualizar P&L, hacer predicciones financieras, reconciliar transacciones y monitorear pasarelas de pago en múltiples países (Perú, Colombia, México).

## Estado del Proyecto

🚧 **En Desarrollo** - Migrado de React + Vite a Next.js 15

## Funcionalidades

### ✅ Implementadas

- **Dashboard de P&L Global** - Visualización de P&L con datos mensuales desde Google Sheets
- **Dashboard de Proyecciones** - Gráficos de proyección de flujo de caja
- **Predicciones con IA** - Análisis y predicciones usando Google Gemini
- **Chat con IA** - Asistente conversacional para análisis financiero
- **Reconciliación de Transacciones** - Tabla de reconciliación con estados
- **Monitor de Pasarelas** - Integración con PayU
- **Gestión Multipaís** - Filtros por Perú, Colombia, México, Global
- **Cockpit Dashboard** - Vista ejecutiva consolidada

### 🚧 En Desarrollo

- **Autenticación de usuarios** - Login/registro con Supabase Auth
- **Base de datos persistente** - PostgreSQL/Supabase para almacenar transacciones
- **Tests unitarios** - Cobertura con Vitest
- **Tests E2E** - Automatización con Playwright

### ❌ No Implementadas (Futuro)

- **Notificaciones en tiempo real** - Alertas de transacciones
- **Exportación de reportes** - PDF/Excel
- **Dashboard personalizable** - Widgets configurables por usuario
- **API REST** - Backend para integraciones externas

## Estructura de Archivos

```
finanzas/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout raíz con fonts
│   │   ├── page.tsx           # Página principal
│   │   └── globals.css        # Estilos globales con tokens MV
│   ├── components/            # 13 componentes React
│   ├── services/              # 3 servicios (API, Gemini, Sheets)
│   ├── types/                 # Tipos TypeScript
│   ├── lib/                   # Utilidades y constantes
│   ├── hooks/                 # Custom hooks (pendiente)
│   └── styles/                # Estilos adicionales (pendiente)
├── docs/                      # Documentación del proyecto
├── tests/                     # Tests (pendiente)
├── public/                    # Assets públicos
└── CLAUDE.md                  # Contexto para Claude Code
```

## APIs Consumidas

- **Google Sheets Apps Script** - P&L data endpoint
- **Google Gemini API** - Predicciones y chat con IA
- **Google Sheets Service** - Lectura/escritura de transacciones

## Dependencias Principales

- `next` ^15.1.6 - Framework React
- `react` ^19.0.0 - Librería UI
- `recharts` ^3.7.0 - Gráficos y visualizaciones
- `@google/genai` ^1.40.0 - Cliente de Gemini AI
- `lucide-react` ^0.563.0 - Iconos
- `tailwindcss` ^4.0.0 - Estilos CSS

## Variables de Entorno

Ver `.env.example`:
- `GEMINI_API_KEY` (requerida)
- Google Sheets credentials (opcional)
- Supabase credentials (futuro)

## Última Actualización

2026-02-12 - Migración completada de React + Vite a Next.js 15 con App Router y TypeScript strict.
