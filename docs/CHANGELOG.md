# Changelog - FlowMaster AI

Todas las actualizaciones importantes del proyecto se documentan aquí.

## [1.0.0] - 2026-02-12

### 🎉 Migración Completa a Next.js

#### Added
- ✅ Estructura Next.js 15 con App Router
- ✅ Layout raíz con fuentes Google (Inter + Nunito)
- ✅ Configuración Tailwind CSS v4 con tokens de diseño MV
- ✅ TypeScript strict mode
- ✅ Documentación completa del proyecto
  - `CLAUDE.md` - Contexto para Claude Code
  - `docs/PROJECT_SCOPE.md` - Scope y estado
  - `docs/ARCHITECTURE.md` - Arquitectura técnica
  - `docs/CHANGELOG.md` - Historial de cambios
- ✅ Configuración de testing (Vitest + Playwright)
- ✅ `.env.example` con variables de entorno documentadas

#### Changed
- 🔄 Migrado de React + Vite → Next.js 15
- 🔄 Todos los componentes convertidos a Client Components
- 🔄 Imports actualizados a alias `@/` de Next.js
- 🔄 `package.json` actualizado con dependencias de Next.js
- 🔄 `tsconfig.json` configurado para Next.js
- 🔄 Estructura de carpetas reorganizada a `src/`

#### Removed
- ❌ Vite config (`vite.config.ts`)
- ❌ index.html (no necesario en Next.js)
- ❌ index.tsx (reemplazado por `app/page.tsx`)
- ❌ Dependencias de Vite

### 📁 Estructura de Archivos Final

```
finanzas/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/ (13 componentes)
│   ├── services/ (3 servicios)
│   ├── types/
│   └── lib/
├── docs/
│   ├── PROJECT_SCOPE.md
│   ├── ARCHITECTURE.md
│   └── CHANGELOG.md
├── CLAUDE.md
├── package.json
├── next.config.ts
├── tsconfig.json
└── .env.example
```

### 🚀 Próximos Pasos

1. Instalar dependencias con `npm install`
2. Configurar `GEMINI_API_KEY` en `.env.local`
3. Ejecutar `npm run dev` para probar
4. Implementar autenticación con Supabase
5. Migrar datos de Google Sheets a PostgreSQL
6. Agregar tests unitarios y E2E
7. Deploy a Vercel

---

## [0.0.1] - 2026-02-12 (Pre-migración)

### Initial Setup
- ✅ Proyecto inicial en React + Vite
- ✅ 13 componentes desarrollados
- ✅ Integración con Google Gemini AI
- ✅ Integración con Google Sheets
- ✅ Dashboard de P&L, predicciones, chat IA
- ✅ Repositorio vinculado: https://github.com/carlosllanos-cloud/fiananzas
