# Fase 2 — Progreso de implementación

> Trackea el avance contra la hoja de ruta de `docs/nutricion-ia-fase2-app-entrenamiento.md` (§16 —
> ese documento es la fuente de verdad de arquitectura/diseño y **no se edita** para reflejar avance;
> este archivo sí). Cualquier IA o persona que arranque una sesión nueva: leer primero "Estado actual"
> acá abajo, y solo abrir el .md completo si hace falta el detalle de una decisión ya tomada.
>
> El log de decisiones de acá abajo es deliberadamente breve — una o dos líneas por paso, solo lo que
> importa no repetir/redescubrir. El detalle extendido (narrativa, bugs paso a paso, alternativas
> descartadas) vive en `docs/PROGRESS-archive.md` y no hace falta leerlo salvo que se necesite el
> "por qué" completo de algo puntual.

---

## Estado actual

**Fase 2: pasos 5a, 5b y 5c mergeados a main.** Captura de comida completa y funcional: cámara/galería
→ compresión → Gemini → confirmación editable → guardado en `mealLogs`. Probado en dispositivo real,
incluyendo el camino de error/reintento.

Próximo paso: **5d — Retención de fotos a 14 días**. `clearExpiredPhotos` ya existe en
`SQLiteMealLogRepository` desde el paso 2 — falta engancharlo a correr una vez al abrir la app (§5:
"con que corra una vez por sesión alcanza, no hace falta background job"). Después de 5d, Fase 2 pasa
al **paso 6 — Dashboard de Nutrición**, que va a reemplazar el botón temporal de prueba en
`nutrition.tsx` por el dashboard real (mismo destino `/meal-capture`, no cambia la ruta).

**Modelo confirmado: `gemini-3.5-flash`**, `thinkingLevel: "LOW"`. API key vía Ajustes de Nutrición →
Configuración de IA.

**Importante para cualquier pantalla nueva con inputs**: el proyecto usa **Expo Go**, no dev client —
`KeyboardAvoidingView` está roto en Android con `edgeToEdgeEnabled: true`. Solución que sí funciona:
manejo manual con `Keyboard` + `ScrollView.scrollToEnd` (ver `nutrition-settings.tsx`). Librerías con
módulos nativos de terceros (no del SDK de Expo) no corren en Expo Go — verificar antes de instalar.

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
- `✅` **4. Perfil recortado** — confirmado: `profile.tsx` solo tiene identidad (avatar/nombre) +
  ajustes globales (unidad de peso, sonido/vibración/notificaciones del timer). Sin campos de
  nutrición mezclados. `briefingHour`/`briefingMinute` (§8) queda pendiente a propósito — se agrega
  en el paso 7 junto con el hook que los consume, no antes.
- `🔄` **5. Captura de comida** (§5) — dividido en sub-entregas:
  - `✅` (a) Configuración de IA: `expo-secure-store` para la API key de Gemini, sección propia en
    Ajustes de Nutrición.
  - `✅` (b) Cliente Gemini: función que manda la foto y devuelve el JSON de macros, probada con una
    foto real (`gemini-3.5-flash`, `thinkingLevel: "LOW"`).
  - `✅` (c) Pantalla de captura: cámara/galería → compresión (`expo-image-manipulator`) →
    confirmación editable (`MacroStepper`, `ConfidenceBadge`) → guardado en `mealLogs`. Probada
    completa en dispositivo, incluyendo error/reintento.
  - `☐` (d) Retención de fotos a 14 días — enganchar `clearExpiredPhotos` a correr al abrir la app.
- `☐` **6. Dashboard de Nutrición** — consume `mealLogs` (§6). Reemplaza el botón temporal de
  `nutrition.tsx` por el dashboard real.
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

> Una o dos líneas por paso — solo lo que importa no repetir/redescubrir. Todo el detalle narrativo,
> bugs paso a paso y alternativas descartadas viven en `docs/PROGRESS-archive.md`.

- **Paso 1**: `AppHeader` con slot `rightExtra?: ReactNode` genérico; orden del cluster
  `[rightExtra][⚙][🔔][👤]`. `useAppHeaderState` centraliza el cableado de header para las 5 tabs.
- **Paso 2**: migraciones siempre vía `drizzle-kit generate`. `dietaryPreferences`/`dietaryRestrictions`
  como JSON stringificado, no tabla relacional. `getLocalDateString` verificado en dispositivo (UTC-5).
- **Paso 3**: `MacroStepper`/`TagListEditor`/`NumberField` son variantes locales a
  `nutrition-settings.tsx`, no componentes compartidos. Serie de bugs de layout en pills segmentados
  resuelta — lección: `alignSelf: "stretch"` + `justify-center` + padding simétrico explícitos.
  Detalle completo en el archive.
- **Paso 4**: confirmación pura, sin cambios de código.
- **Paso 5a**: `expo-secure-store` para la key (UI nunca muestra el valor real, solo estado). Bug de
  teclado Android/Expo Go resuelto con `Keyboard` + `ScrollView.scrollToEnd` manual — **reutilizar
  este patrón en toda pantalla nueva con inputs**, no intentar `KeyboardAvoidingView` ni libs con
  módulo nativo de terceros (no corren en Expo Go). Detalle completo en el archive.
- **Paso 5b**: modelo `gemini-3.5-flash` (Google bloqueó `gemini-2.5-flash` a mitad de paso),
  `thinkingConfig.thinkingLevel: "LOW"`. Cliente vía REST directo (`fetch` + `responseSchema`), sin SDK.
- **Paso 5c**: `persistMealPhoto` comprime con `expo-image-manipulator` y persiste esa misma versión
  (no la original). Selector de tipo de comida agregado (no estaba en el ASCII del doc), default por
  hora del día. Reintento ante fallo de Gemini es inline en la pantalla, no hay campo "pending" en el
  schema — motivo y qué revisar en el paso 6 si hace falta el flujo completo: ver archive.
  `ConfidenceBadge` nuevo (§13). Confirmado: `expo-image-manipulator` corre en Expo Go sin rebuild.
