# Arquitectura - FlowMaster AI

## Stack Técnico

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8 (strict mode)
- **Styling**: Tailwind CSS v4 con tokens de diseño MV
- **UI Components**: Custom components con Lucide icons
- **Charts**: Recharts para visualizaciones
- **AI**: Google Gemini API

### Backend / Servicios
- **Google Sheets**: Base de datos temporal para transacciones y P&L
- **Google Apps Script**: Endpoint de P&L
- **Gemini AI**: Predicciones y análisis conversacional

### Futuro
- **Auth**: Supabase Auth
- **Database**: PostgreSQL/Supabase
- **Hosting**: Vercel (frontend)

## Estructura de Carpetas

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Layout raíz (Server Component)
│   ├── page.tsx            # Página principal (Client Component)
│   └── globals.css         # Estilos globales con tokens MV
├── components/             # Componentes React (Client Components)
│   ├── Dashboard.tsx
│   ├── GlobalPnL.tsx
│   ├── CockpitDashboard.tsx
│   ├── PredictionsDashboard.tsx
│   ├── AIChat.tsx
│   ├── ReconciliationTable.tsx
│   ├── GatewayManager.tsx
│   ├── PayUMonitor.tsx
│   ├── TransactionForm.tsx
│   ├── ChargeTable.tsx
│   ├── SummaryCard.tsx
│   ├── Header.tsx
│   └── Sidebar.tsx
├── services/               # Lógica de negocio y API clients
│   ├── googleSheetsService.ts
│   ├── geminiService.ts
│   └── apiService.ts
├── types/                  # Tipos TypeScript
│   └── index.ts
├── lib/                    # Utilidades y configuración
│   └── constants.ts
├── hooks/                  # Custom React hooks (futuro)
└── styles/                 # Estilos adicionales (futuro)
```

## Patrón de Datos

### Flujo de datos actual:

1. **P&L Data**: Google Sheets → Apps Script → Fetch → GlobalPnL component
2. **Transactions**: Google Sheets Service → Fetch → Dashboard/Reconciliation
3. **AI Predictions**: Gemini Service → PredictionsDashboard
4. **AI Chat**: User input → Gemini Service → AIChat component

### Estado (React State Management):

- Estado local con `useState` en componente principal (`page.tsx`)
- Props drilling para datos compartidos
- No usa Context API ni Redux (simplicidad)

**Futuro**: Considerar Zustand o React Context para estado global si crece la complejidad.

## Dependencias

### Producción
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "next": "^15.1.6",
  "recharts": "^3.7.0",
  "lucide-react": "^0.563.0",
  "@google/genai": "^1.40.0",
  "clsx": "^2.1.1"
}
```

### Desarrollo
```json
{
  "typescript": "^5.8.0",
  "tailwindcss": "^4.0.0",
  "eslint": "^9.19.0",
  "vitest": "^3.0.0",
  "@playwright/test": "^1.49.0"
}
```

## Variables de Entorno

### Requeridas
- `GEMINI_API_KEY` - API key de Google Gemini

### Opcionales
- `GOOGLE_SHEETS_API_KEY` - Para Google Sheets API
- `GOOGLE_SHEETS_SPREADSHEET_ID` - ID del spreadsheet
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (futuro)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (futuro)

## Decisiones Arquitectónicas

### ¿Por qué Next.js?
- SEO y performance con Server Components
- App Router para routing moderno
- Optimización automática de assets
- Deploy fácil en Vercel
- Estándar de MV

### ¿Por qué Google Sheets como DB temporal?
- Prototipado rápido
- Fácil edición manual de datos
- No requiere infraestructura de DB
- **Limitación**: No escalable, migrar a PostgreSQL/Supabase pronto

### ¿Por qué Client Components para la mayoría?
- Componentes altamente interactivos (dashboards, gráficos)
- Estado local complejo
- Hooks (useState, useEffect)
- Event handlers

## Próximas Mejoras

1. **Server Components**: Mover lógica de fetch a Server Components donde sea posible
2. **API Routes**: Crear `/api` routes en Next.js para ocultar API keys
3. **Database**: Migrar de Google Sheets a PostgreSQL/Supabase
4. **Auth**: Implementar Supabase Auth
5. **State Management**: Evaluar Zustand si el estado crece
