# Fase 2 — Progreso de implementación

> Trackea el avance contra la hoja de ruta de `docs/nutricion-ia-fase2-app-entrenamiento.md` (§16 —
> ese documento es la fuente de verdad de arquitectura/diseño y **no se edita** para reflejar avance;
> este archivo sí). Cualquier IA o persona que arranque una sesión nueva: leer primero "Estado actual"
> acá abajo, y solo abrir el .md completo si hace falta el detalle de una decisión ya tomada.

---

## Estado actual

**Fase 2: planificación cerrada, implementación sin empezar.**
Próximo paso: **1 — Routing** (mover `profile.tsx` fuera de tabs, crear `AppHeader`, agregar tab
`Nutrición`). Ver §2 del .md para el detalle exacto de archivos a tocar.

Branch activo: ninguno todavía.

---

## Checklist (espejo de §16 del .md)

Leyenda: `☐` sin empezar · `🔄` en curso (branch abierto) · `✅` mergeado a main

- `☐` **1. Routing** — mover `profile.tsx`, crear `AppHeader`, tab `Nutrición` con ícono `Salad`,
  crear rutas vacías `nutrition-settings.tsx` y `nutrition-day/[date].tsx`.
- `☐` **2. Modelo de datos** — migraciones Drizzle: `nutritionProfile`, `mealLogs`, `shoppingLists`,
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
> fuente de verdad de *diseño*; acá va la fuente de verdad de *lo que pasó al construirlo*. Si algo acá
> contradice al .md de forma importante, se actualiza el .md y se anota el cambio acá con fecha.

_(vacío — se completa a medida que se avanza)_
