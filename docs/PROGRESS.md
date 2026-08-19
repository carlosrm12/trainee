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

**Fase 2: paso 6 completo, mergeado a main.** Dashboard de Nutrición real (hero `MacroRing` +
`StatRow` de macros del día, lista de comidas, sección de pendientes con reintento, FAB de captura).
Captura de comida (paso 5) sigue completa y funcional de punta a punta: cámara/galería → compresión
→ Gemini → confirmación editable → guardado en `mealLogs`. Retención de fotos a 14 días activa.

Próximo paso: **7 — Morning briefing**, mecánica base de `expo-notifications` con trigger `DAILY`
(§9). Empieza por (a) `useMorningBriefingNotification`.

**Modelo confirmado: `gemini-3.5-flash`**, `thinkingLevel: "LOW"`. API key vía Ajustes de Nutrición →
Configuración de IA.

**Importante para cualquier pantalla nueva con inputs**: el proyecto usa **Expo Go**, no dev client —
`KeyboardAvoidingView` está roto en Android con `edgeToEdgeEnabled: true`. Solución que sí funciona:
manejo manual con `Keyboard` + `ScrollView.scrollToEnd` (ver `nutrition-settings.tsx`). Librerías con
módulos nativos de terceros (no del SDK de Expo) no corren en Expo Go — verificar antes de instalar.

**Importante — cámara y Expo Go**: tomar una foto con la cámara puede hacer que Android mate el
proceso de la app para liberar memoria (Expo Go pesa mucho más que un APK standalone) — la app se
reinicia sin error capturable en JS, de forma no determinística. Confirmado armando un APK
(`eas build --profile preview`) desde este branch: el crash no ocurre nunca en standalone, solo en
Expo Go — no es un bug de código. Mitigación aplicada (reduce frecuencia en Expo Go, no la elimina):
`ImagePicker.getPendingResultAsync()` vive en el **root** (`app/_layout.tsx`), no en la pantalla que
abrió la cámara, porque si el proceso muere la app puede "revivir" en otra ruta.

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
- `✅` **5. Captura de comida** (§5) — completo, dividido en sub-entregas:
  - `✅` (a) Configuración de IA: `expo-secure-store` para la API key de Gemini, sección propia en
    Ajustes de Nutrición.
  - `✅` (b) Cliente Gemini: función que manda la foto y devuelve el JSON de macros, probada con una
    foto real (`gemini-3.5-flash`, `thinkingLevel: "LOW"`).
  - `✅` (c) Pantalla de captura: cámara/galería → compresión (`expo-image-manipulator`) →
    confirmación editable (`MacroStepper`, `ConfidenceBadge`) → guardado en `mealLogs`. Probada
    completa en dispositivo, incluyendo error/reintento.
  - `✅` (d) Retención de fotos a 14 días — `clearExpiredPhotos` enganchado en `app/_layout.tsx`,
    corre una vez al abrir la app. Probado en dispositivo: borrado de archivo físico + `photoUri = null`
    confirmados.
- `✅` **6. Dashboard de Nutrición** — consume `mealLogs` (§6). `MacroRing` (nuevo, reutiliza técnica
  SVG de `RestTimerRing`) + `StatRow` de macros del día; sección de comidas de hoy (`MealCard`,
  swipe-to-delete); sección de pendientes de analizar (`getPending()`, cualquier fecha) con
  reintento. FAB → `/meal-capture`. Probado en dispositivo (Expo Go + APK standalone).
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
  hora del día. `ConfidenceBadge` nuevo (§13). Fix post-revisión (branch `fix/paso5c`): se agregó
  `analysisStatus` (`"pending" | "complete"`) a `mealLogs` — si falla el análisis de Gemini se crea
  una fila `pending` con la foto (nunca se pierde el registro), reintentable; si el reintento
  funciona se actualiza esa misma fila en vez de duplicarla. `handleClose` también limpia fila+foto
  si se cancela desde "confirm" sin guardar. `MealLogRepository.getPending()` nuevo, listo para que
  el dashboard del paso 6 lo consuma.
- **Paso 5d**: `clearExpiredPhotos` (ya existía desde el paso 2) enganchado en un `useEffect` propio
  de `app/_layout.tsx`, separado del que corre `seedInitialData` — best-effort, fire-and-forget, un
  error ahí nunca bloquea el arranque. Umbral de 14 días como constante local en `_layout.tsx` (no
  hay ningún lugar compartido de constantes de retención todavía).
- **Paso 6**: `useTodayMealLogs` trae comidas completas de **hoy** pero pendientes de **cualquier
  fecha** (`getPending()` sin filtro) — una `pending` vieja no debe desaparecer del dashboard solo
  porque cambió el día. Reintento de una `pending` reutiliza `meal-capture.tsx` vía query params
  (`mealLogId`+`photoUri`+`mealType`), releyendo el archivo ya persistido con `File.base64()` en vez
  de re-tomar la foto. Caso borde: una `pending` de más de 14 días ya perdió su foto por la retención
  del paso 5d — el dashboard ofrece eliminar el registro en ese caso en vez de un dead-end.
  Fix: `SQLiteMealLogRepository.delete()` ahora borra también el archivo físico antes de borrar la
  fila (swipe-to-delete dejaba fotos huérfanas — `clearExpiredPhotos` solo recorre filas que
  todavía existen).
  Cámara + Expo Go: ver nota en "Estado actual".
