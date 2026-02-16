# FlowMaster AI - Finanzas

Aplicación de proyecciones de flujo de caja y análisis financiero con IA para Manzana Verde.

## Stack

- Next.js 15+ (App Router)
- TypeScript strict
- Tailwind CSS v4 con tokens MV
- React 19
- Recharts (gráficos y visualizaciones)
- Google Gemini AI (predicciones y análisis)
- Vitest + React Testing Library
- Playwright para E2E

## Estructura

- `src/app/` - Páginas y layouts Next.js
- `src/components/` - Componentes React
  - `Dashboard.tsx` - Dashboard principal de datos
  - `GlobalPnL.tsx` - P&L global
  - `CockpitDashboard.tsx` - Vista de cockpit
  - `PredictionsDashboard.tsx` - Dashboard de predicciones con IA
  - `AIChat.tsx` - Chat con IA
  - `ReconciliationTable.tsx` - Tabla de reconciliación
  - `GatewayManager.tsx` - Gestor de pasarelas de pago
  - `PayUMonitor.tsx` - Monitor de PayU
  - `TransactionForm.tsx` - Formulario de transacciones
  - `ChargeTable.tsx` - Tabla de cargos
  - `Sidebar.tsx` - Navegación lateral
- `src/lib/` - Utilidades y configuración
- `src/services/` - Servicios y lógica de negocio
  - `googleSheetsService.ts` - Integración con Google Sheets
  - `geminiService.ts` - Servicio de Gemini AI
  - `apiService.ts` - Cliente API general
- `src/types/` - Tipos TypeScript
- `src/hooks/` - Custom hooks (pendiente)
- `src/styles/` - Estilos adicionales (pendiente)

## Funcionalidades

- ✅ Dashboard de P&L global
- ✅ Proyecciones de flujo de caja
- ✅ Predicciones con IA (Gemini)
- ✅ Chat con IA para análisis
- ✅ Reconciliación de transacciones
- ✅ Monitor de pasarelas de pago (PayU)
- ✅ Gestión por país (Perú, Colombia, México, Global)
- 🚧 Autenticación de usuarios
- 🚧 Base de datos persistente

## Reglas

- Seguir el design system de MV (ver /mv-dev:mv-design-system)
- Server Components por defecto, 'use client' solo cuando necesario
- Tests para todo componente y hook nuevo
- No hardcodear colores, usar tokens CSS de MV
- Usar el MCP server `context7` para documentación actualizada de librerías
- Usar `memory-keeper` para guardar progreso y decisiones importantes

## Variables de Entorno

Ver `.env.example` para configurar:
- `GEMINI_API_KEY` - API key de Google Gemini (requerida)
- Google Sheets credentials (opcional)
- Supabase credentials (para autenticación futura)
- DB credentials (para persistencia futura)

## Comandos

```bash
npm run dev       # Desarrollo local (puerto 3000)
npm run build     # Build de producción
npm run start     # Servidor de producción
npm run lint      # Linter
npm test          # Tests unitarios
npm run test:e2e  # Tests E2E
```

## Próximos pasos

1. ✅ Migración a Next.js completada
2. 🚧 Implementar autenticación (Supabase Auth)
3. 🚧 Implementar base de datos (Supabase o PostgreSQL)
4. 🚧 Agregar tests unitarios
5. 🚧 Agregar tests E2E con Playwright
6. 🚧 Deploy a Vercel
