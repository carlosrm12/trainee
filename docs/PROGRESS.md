# Fase 2 — Progreso de implementación

> Trackea el avance contra la hoja de ruta de `docs/nutricion-ia-fase2-app-entrenamiento.md` (§16 —
> ese documento es la fuente de verdad de arquitectura/diseño y **no se edita** para reflejar avance;
> este archivo sí). Cualquier IA o persona que arranque una sesión nueva: leer primero "Estado actual"
> acá abajo, y solo abrir el .md completo si hace falta el detalle de una decisión ya tomada.
>
> El log de decisiones de acá abajo es deliberadamente breve — solo arquitectura y contratos que
> importan para no repetir una decisión ya tomada. El detalle extendido de sesiones de debugging
> (ej. series de bugs visuales) vive en `docs/PROGRESS-archive.md` y no hace falta leerlo salvo que
> se necesite el "por qué" completo de algo puntual.

---

## Estado actual

**Fase 2: paso 3 (Ajustes de Nutrición) mergeado a main.**
Próximo paso: **4 — Perfil recortado**. Con el refactor de `SettingsRow` ya hecho en el paso 3, este
paso queda mayormente en confirmar que `profile.tsx` (§8) no tiene ni tuvo nunca campos de nutrición
mezclados — no se espera una reescritura grande.

Branch activo: ninguno todavía.

---

## Checklist (espejo de §16 del .md)

Leyenda: `☐` sin empezar · `🔄` en curso (branch abierto) · `✅` mergeado a main

- `✅` **1. Routing** — mover `profile.tsx`, crear `AppHeader`, tab `Nutrición` con ícono `Salad`,
  crear rutas vacías `nutrition-settings.tsx` y `nutrition-day/[date].tsx`.
- `✅` **2. Modelo de datos** — migraciones Drizzle: `nutritionProfile`, `mealLogs`, `shoppingLists`,
  `nutritionDayReports`. Utilidades: `formatCurrency`, `resolveWeightUnit`, `getLocalDateString`.
  Repos: `SQLiteNutritionProfileRepository`, `SQLiteMealLogRepository`,
  `SQLiteShoppingListRepository`, `SQLiteNutritionDayReportRepository`.
- `✅` **3. Ajustes de Nutrición** — pantalla completa (§7): perfil físico, meta, unidad de peso
  (global vs. override + kg/lb), metas diarias de macros (`MacroStepper`), presupuesto semanal,
  preferencias/restricciones editables. `SettingsRow` extraído y `profile.tsx` refactorizado para
  reutilizarlo.
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

## Log de decisiones de arquitectura

> Solo decisiones que importa no repetir/redescubrir. Debugging paso a paso y post-mortems extensos
> viven en `docs/PROGRESS-archive.md`, no acá.

- **Paso 1 (Routing)**:
  - `AppHeader` con slot `rightExtra?: ReactNode` (no estaba en el .md) para casos como `StreakBadge`
    en Home o "+ Nuevo" en Ejercicios, en vez de un prop nuevo por caso.
  - Orden del cluster derecho de `AppHeader`: `[rightExtra] [⚙ si aplica] 🔔 👤` (campana antes que
    avatar — el .md la mostraba al revés, se ajustó a pedido).
  - `useAppHeaderState` (hook nuevo): centraliza `routines + stats + settings + reminders` para las 5
    pantallas de tabs. Hace un fetch de `routines`/`stats` independiente del que cada pantalla ya hace
    para su propio contenido — duplicación de query menor, aceptable en SQLite local de un usuario.

- **Paso 2 (Modelo de datos)**:
  - Migraciones siempre con `npx drizzle-kit generate`, nunca escritas a mano.
  - `dietaryPreferences`/`dietaryRestrictions` como texto JSON stringificado, no tabla relacional
    (mismo criterio que `itemsJson` en `shoppingLists`).
  - `SQLiteNutritionProfileRepository.update` arma el objeto de cambios con spreads condicionales
    campo por campo, no un cast genérico, para mantener el chequeo de tipos de Drizzle.
  - Sanity check de `getLocalDateString` confirmado en dispositivo real (UTC-5): 23:50 del 16/ago →
    `"2026-08-16"` correcto.

- **Paso 3 (Ajustes de Nutrición)**:
  - `MacroStepper`: mismo patrón de interacción que `SetStepper` pero compacto (texto 4xl → 2xl, layout
    de card) para que entren 2 por fila en una pantalla de ajustes.
  - `TagListEditor` (preferencias/restricciones) y `NumberField` (input numérico con commit en
    `onBlur`) quedaron locales a `nutrition-settings.tsx`, no como componentes compartidos — se
    extraen si otra pantalla los necesita.
  - Serie de bugs de layout en pills segmentados ("Unidad de peso") resuelta — detalle completo en
    `docs/PROGRESS-archive.md`. Lección aplicada ya en el código: pills segmentados en `flex-row`
    necesitan `alignSelf: "stretch"` + `justify-center` + padding simétrico explícitos, no confiar en
    defaults.
  - Fix post-merge (branch `fix/nutrition-settings-cleanup`): `nutrition-settings.tsx` reimplementaba
    la resolución de unidad inline en vez de usar `resolveWeightUnit` (creado en el paso 2) — corregido.
    También se agregó `isLast` a la fila "Elegir para Nutrición" para evitar un borde colgante cuando
    el `WeightUnitPicker` está colapsado.
