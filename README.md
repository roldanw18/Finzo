# 💰 Finzo — Gestión financiera personal

Aplicación web de finanzas personales de calidad comercial, inspirada en **Binance / Revolut**.
Pensada para conductores de Uber: registra ingresos en menos de 10 segundos, controla
tus gastos por categoría y entiende tus hábitos con análisis, KPIs y gráficos interactivos.

Hecha con **React + TypeScript + Vite + Tailwind + Recharts + Framer Motion**, con
backend en **Supabase** (Postgres + Auth + RLS) y modo **local offline** de respaldo.

---

## ✨ Funcionalidades

- **Registro ultrarrápido de ingresos** (solo monto, fecha y nota opcional) y de gastos
  (monto, categoría, fecha, descripción, método de pago, observaciones).
- **Categorías 100% administrables**: crear, editar, eliminar, color e ícono.
- **Dashboard** con tarjetas KPI: dinero disponible, ingresos/gastos de hoy y del mes,
  balance, ahorro acumulado, promedio diario, comparación con el mes anterior y tendencia.
- **10+ gráficos interactivos**: pastel por categoría, barras ingresos vs gastos,
  evolución de ingresos/gastos, flujo de caja diario/semanal/mensual/anual,
  distribución porcentual y ranking de categorías.
- **Análisis automático**: categoría con mayor/menor gasto, promedios, ganancia neta,
  tendencias, comparación mes a mes y año a año, **alertas** de aumentos significativos
  y **recomendaciones de ahorro** personalizadas.
- **Historial** con filtros avanzados (fechas, categoría, monto, texto) y orden.
- **Exportación** a **PDF** y **Excel**.
- **Moneda configurable**: Peso colombiano (COP) o Dólar (USD).
- **Modo claro / oscuro**, animaciones suaves, barra lateral (escritorio), barra inferior
  (móvil) y botón flotante de acción rápida (FAB).
- **Módulo de Propinas** con teclado rápido tipo widget (deep-link `/propina`).
- **Plan de Libertad Financiera**: gestión de deudas con **método Avalancha**, recomendación
  automática de cuál atacar, **simulador** de pago extra (intereses ahorrados, fecha de salida),
  registro e historial de pagos, **metas**, integración con **Uber** (horas para pagar cada deuda),
  **calendario financiero** (cortes, pagos, SOAT, servicios), alertas inteligentes y motivación.

---

## 🚀 Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # previsualiza el build
```

Sin variables de entorno, la app funciona en **modo local (demo)** guardando los datos
en el navegador. Para activar la nube, configura Supabase (abajo).

---

## ☁️ Conectar Supabase (sincronización en la nube + login)

1. Crea una **organización** y un **proyecto** en <https://supabase.com/dashboard>.
2. En el **SQL Editor**, ejecuta **en orden** los archivos de `supabase/migrations/`:
   - [`0001_init.sql`](supabase/migrations/0001_init.sql) — perfiles, categorías, ingresos y gastos + RLS.
   - [`0002_tips.sql`](supabase/migrations/0002_tips.sql) — columna de propinas.
   - [`0003_debt_plan.sql`](supabase/migrations/0003_debt_plan.sql) — Plan de Libertad Financiera
     (deudas, pagos, metas, jornadas de Uber, recordatorios) + RLS.
   - [`0004_fixed_expenses.sql`](supabase/migrations/0004_fixed_expenses.sql) — gastos fijos
     mensuales (arriendo, servicios, suscripciones) + RLS.
   Cada usuario solo verá sus propios datos.
3. Copia `.env.example` a `.env` y completa con los datos de
   **Project Settings → API**:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
   ```

4. Reinicia `npm run dev`. La app detectará Supabase y mostrará la pantalla de login.
   Al registrarte, se crean automáticamente tu perfil y las categorías por defecto.

> **Email de confirmación:** por defecto Supabase pide confirmar el correo. Puedes
> desactivarlo en *Authentication → Providers → Email → Confirm email* para pruebas.

---

## 🧱 Arquitectura

```
src/
├─ data/            Capa de datos intercambiable (interfaz Database)
│  ├─ db.ts            contrato común
│  ├─ localDb.ts       backend localStorage (modo demo/offline)
│  └─ supabaseDb.ts    backend Supabase (nube)
├─ store/           Estado global (Zustand): datos, auth, UI, toasts
├─ lib/             analytics, insights, exporters, dates, utils, icons
├─ hooks/           useAnalytics, useMoney, useMediaQuery
├─ components/      UI, charts, layout, forms
└─ pages/           Dashboard, Analytics, History, Categories, Settings, Login
```

La **capa de datos** abstrae el almacenamiento: si hay credenciales de Supabase usa la
nube; si no, usa `localStorage`. Toda la lógica financiera vive en `src/lib/analytics.ts`
e `src/lib/insights.ts` como funciones puras y testeables.

---

## 🎨 Diseño

Tema oscuro como principal (paleta tipo Binance: `#0b0e11`, acento ámbar `#f0b90b`),
verde para ingresos, rojo para gastos, azul/ámbar para datos informativos. Tipografías
*Inter* (texto) y *Space Grotesk* (títulos/cifras).
