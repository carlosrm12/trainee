# Fase 2 — Progreso de implementación

> Trackea el avance contra la hoja de ruta de `docs/nutricion-ia-fase2-app-entrenamiento.md` (§16 —
> ese documento es la fuente de verdad de arquitectura/diseño y **no se edita** para reflejar avance;
> este archivo sí). Cualquier IA o persona que arranque una sesión nueva: leer primero "Estado actual"
> acá abajo, y solo abrir el .md completo si hace falta el detalle de una decisión ya tomada.

---

## Estado actual

**Fase 2: paso 2 (Modelo de datos) mergeado a main.**
Próximo paso: **3 — Ajustes de Nutrición** (pantalla completa de §7: perfil físico, macros,
presupuesto, restricciones, unidad; extraer `SettingsRow` compartido reutilizando el patrón de
`profile.tsx`).

Branch activo: ninguno todavía.

Pendiente arrastrado del paso 2 (no bloqueante): hacer el sanity check manual de
`getLocalDateString` en el dispositivo apenas haya una pantalla real donde probarlo — confirmar que
una hora tipo 23:30 del 1 de enero en zona local (UTC-5) devuelve `"2026-01-01"` y no `"2026-01-02"`.
Se hace en el paso 3.

---

## Checklist (espejo de §16 del .md)

Leyenda: `☐` sin empezar · `🔄` en curso (branch abierto) · `✅` mergeado a main

- `✅` **1. Routing** — mover `profile.tsx`, crear `AppHeader`, tab `Nutrición` con ícono `Salad`,
  crear rutas vacías `nutrition-settings.tsx` y `nutrition-day/[date].tsx`.
- `✅` **2. Modelo de datos** — migraciones Drizzle: `nutritionProfile`, `mealLogs`, `shoppingLists`,
  `nutritionDayReports`. Utilidades: `formatCurrency`, `resolveWeightUnit`, `getLocalDateString`.
- `☐` **3. Ajustes de Nutrición** — pantalla completa (§7), extraer `SettingsRow` compartido.
- `☐` **4. Perfil recortado** — confirmar alcance de `profile.tsx` (§8), mover lo que haya quedado
  mezclado.
- `☐` **5. Captura de comida** — cámara → Gemini → confirmación → guardado (§5). Incluye retención de
  fotos a 14 días.
- `☐` **6. Dashboard de Nutrición** — consume `mealLogs` (§6).
- `☐` **7. Morning briefing** — mecánica base (§9):
  - `☐` (a) `useMorningBriefingNotification` con trigger `DAILY`
  - `☐` (b) conectar a guardar hora en Perfil (cancelar + reprogramar)
  - `☐` (c) `useLastNotificationResponse()` en `app/_layout.tsx` (captura del tap)
  - `☐` (d) handler de `nutrition-day/[date].tsx`: cálculo de "ayer", cacheo, invalidación, fallback
  - `☐` (e) copy de estado vacío
- `☐` **8. Pulir el prompt del briefing** (§10) — requiere datos reales acumulados del paso 5, no antes.
- `☐` **9. Lista de compras** — con guard de cobertura y fallback desde el arranque (§11).
- `☐` **10. Fase 2.5 — Correlación ("Hermes")** — no antes de 2-3 semanas de datos reales. Opcional.

---

## Log de decisiones tomadas durante implementación

> Cosas que surgen programando y no estaban (o no podían estar) previstas en el .md. El .md es la
> fuente de verdad de _diseño_; acá va la fuente de verdad de _lo que pasó al construirlo_. Si algo acá
> contradice al .md de forma importante, se actualiza el .md y se anota el cambio acá con fecha.

- **Paso 1 (Routing)**:
  - `AppHeader` con slot `rightExtra`: el .md no lo especifica, pero Home ya mostraba `StreakBadge`
    junto al saludo y Ejercicios ya mostraba "+ Nuevo" junto al título. En vez de agregar un prop
    nuevo por caso, `AppHeader` acepta un `rightExtra?: ReactNode` genérico.
  - Orden del cluster derecho de `AppHeader`: `[rightExtra] [⚙ si aplica] 🔔 👤` — la campana va
    antes que el avatar (el .md la mostraba con el avatar primero; se ajustó a pedido).
  - `useAppHeaderState` (hook nuevo, no estaba en el .md): centraliza el cableado de
    `routines + stats + settings + reminders` para que las 5 pantallas de tabs no repitan la misma
    lógica solo para pintar el avatar y el badge de la campana. Implica un fetch de `routines`/`stats`
    independiente del que cada pantalla ya hace para su propio contenido — duplicación de query menor,
    aceptable en SQLite local de un solo usuario. Si en algún momento pesa, se puede fusionar.
- **Paso 2 (Modelo de datos)**:
  - Migración generada con `npx drizzle-kit generate` en vez de escrita a mano, para que el nombre del
    archivo, `_journal.json` y `migrations.js` queden siempre sincronizados con el diff real de
    `schema.ts` — se revisó el `.sql` resultante antes de commitear (solo `CREATE TABLE`, sin tocar
    tablas existentes).
  - `dietaryPreferences`/`dietaryRestrictions` se guardan como texto JSON stringificado (columna
    `text`) en vez de una tabla relacional aparte — mismo criterio de simplicidad que `itemsJson` en
    `shoppingLists`; a este volumen de datos (listas cortas, un solo usuario) no se justifica una
    tabla normalizada.
  - `SQLiteNutritionProfileRepository.update` arma el objeto de cambios con spreads condicionales
    campo por campo (en vez de un cast genérico a `Record<string, unknown>`) para que TypeScript siga
    validando los tipos contra las columnas de Drizzle.
