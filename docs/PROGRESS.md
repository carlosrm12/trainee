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

**Fase 2: pasos 5a (Configuración de IA) y 5b (Cliente Gemini) mergeados a main.**

Próximo paso: **5c — Pantalla de captura**: cámara/galería → compresión con
`expo-image-manipulator` → confirmación editable (nombre/macros con steppers, `ConfidenceBadge`) →
guardado en `mealLogs` (§5 del doc). Consume el cliente de 5b, todavía sin UI propia hasta ahora.

**Modelo confirmado: `gemini-3.5-flash`** (Google bloqueó `gemini-2.5-flash` para API keys nuevas a
mitad de 5b — ver log más abajo). La API key ya se puede guardar desde
Ajustes de Nutrición → Configuración de IA, y el cliente ya manda foto + prompt y devuelve el JSON de
macros estructurado, probado con una foto real.

**Importante para cualquier pantalla nueva con inputs**: el proyecto usa **Expo Go**, no dev client —
`KeyboardAvoidingView` está roto en Android con `edgeToEdgeEnabled: true` (activo en `app.json`), y
librerías con módulos nativos (ej. `react-native-keyboard-controller`) no corren en Expo Go. La
solución que sí funciona: manejo manual con `Keyboard` + `ScrollView.scrollToEnd` (ambas APIs core de
RN, sin dependencias nuevas) — ver el patrón ya aplicado en `nutrition-settings.tsx`, reutilizarlo tal
cual en vez de volver a probar `KeyboardAvoidingView`.

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
  - `☐` (c) Pantalla de captura: cámara/galería → compresión → confirmación editable → guardado.
  - `☐` (d) Retención de fotos a 14 días (`clearExpiredPhotos`, ya existe en el repo desde el paso 2 —
    falta engancharlo a correr al abrir la app).
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
    la resolución de unidad inline en vez de usar `resolveWeightUnit` (creado en el paso 2) —
    corregido. También se agregó `isLast` a la fila "Elegir para Nutrición" para evitar un borde
    colgante cuando el `WeightUnitPicker` está colapsado. `WeightUnitPicker` pasó a recibir
    `displayUnit` en vez de recalcular la unidad por su cuenta — misma fuente de verdad en los tres
    lugares del archivo que necesitan la unidad resuelta.
- **Paso 4 (Perfil recortado)**: confirmación pura, sin cambios de código — `profile.tsx` ya estaba
  correctamente acotado desde el paso 1.
- **Paso 5a (Configuración de IA)**:
  - Modelo elegido: `gemini-2.5-flash` (tier gratuito, con visión).
  - `features/nutrition/geminiApiKey.ts` + `useGeminiApiKey.ts`: wrapper directo sobre
    `expo-secure-store`, mismo patrón de hook que `useNutritionProfile`. El campo de UI nunca precarga
    la key real en texto — solo muestra "Configurada ✓" / "Sin configurar", para no tener el secreto
    en memoria/pantalla más tiempo del necesario.
  - "Configuración de IA" es una sección propia dentro de `nutrition-settings.tsx` (no en Perfil),
    consistente con el "principio de propiedad de ajustes" de §2 del doc.
  - **Bug de teclado en Android (Expo Go)**: `KeyboardAvoidingView` no funciona con
    `edgeToEdgeEnabled: true` (obligatorio desde Android 15, ya activo en `app.json`) — tapaba el
    campo de la API key. Se probó `react-native-keyboard-controller`, pero requiere módulo nativo y no
    corre en Expo Go (el proyecto no usa dev client). Fix final, 100% JS y compatible con Expo Go:
    listener manual de `Keyboard` (`keyboardDidShow`/`keyboardDidHide`) + `ScrollView.scrollToEnd()`
    vía `ref`, con `contentContainerStyle` padding dinámico según altura del teclado. Detalle completo
    en `docs/PROGRESS-archive.md`.
- **Paso 5b (Cliente Gemini)**:
  - **Cambio de modelo a mitad de paso**: Google empezó a bloquear `gemini-2.5-flash` para API keys
    nuevas. Se migró a `gemini-3.5-flash` (serie Gemini 3.x, con tier gratuito propio) — probado con
    una foto real de comida, respuesta correcta.
  - Esta serie reemplaza `thinking_budget` por `thinking_level`
    (`generationConfig.thinkingConfig.thinkingLevel`); se seteó en `"LOW"` porque la tarea (estimar
    macros de una imagen) no necesita el razonamiento profundo del default `"MEDIUM"` — más rápido y
    más barato.
  - Google también desaconseja tocar `temperature`/`top_p`/`top_k` en esta serie; el código nunca los
    usó, se deja anotado para no agregarlos a futuro sin revisar esto primero.
