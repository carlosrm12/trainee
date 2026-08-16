# Fase 2 — Progreso de implementación

> Trackea el avance contra la hoja de ruta de `docs/nutricion-ia-fase2-app-entrenamiento.md` (§16 —
> ese documento es la fuente de verdad de arquitectura/diseño y **no se edita** para reflejar avance;
> este archivo sí). Cualquier IA o persona que arranque una sesión nueva: leer primero "Estado actual"
> acá abajo, y solo abrir el .md completo si hace falta el detalle de una decisión ya tomada.

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
- `✅` **3. Ajustes de Nutrición** — pantalla completa (§7), extraer `SettingsRow` compartido.
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
  - Sanity check de `getLocalDateString` confirmado en dispositivo real (UTC-5, Ecuador): 23:50 del
    16/ago devolvió `"2026-08-16"` correctamente — no el bug de `toISOString()` que hubiera dado
    `"2026-08-17"`.
- **Paso 3 (Ajustes de Nutrición)**:
  - `MacroStepper` reduce el tamaño de texto de `SetStepper` (4xl → 2xl) y usa layout de card
    compacta en vez de la versión grande centrada, para que entren 2 por fila en una pantalla de
    ajustes — mismo patrón de interacción (±, valor grande), formato distinto. Ver doc §13.
  - "Chips outline editables" de preferencias/restricciones (§7) no reutiliza `FilterChipOutline`
    (ese componente es de selección única sobre opciones fijas; acá se necesita una lista libre de
    tags con alta/baja) — se armó un `TagListEditor` local dentro de `nutrition-settings.tsx`, no
    como componente compartido nuevo. Si en algún momento otra pantalla necesita el mismo patrón, se
    extrae recién ahí.
  - `NumberField` (input numérico con commit solo en `onBlur`, no en cada tecla) también quedó local
    al archivo — mismo criterio, se extrae si se reutiliza en otra pantalla.
  - **Serie de bugs de layout en "Unidad de peso" (radio global/override + selector kg/lb), todos
    corregidos, con la causa real de cada uno documentada para no repetirlos en pantallas futuras
    con pills segmentados (dashboard de Nutrición, lista de compras):**
    1. _Salto visual sobre "Peso objetivo" al expandir/colapsar_: la causa fue mostrar/ocultar el
       selector kg/lb con `{condición && <View>...}` (monta/desmonta), lo que dispara reflow del
       `ScrollView`. Se intentó primero con `opacity` fijo (dejaba un hueco vacío permanente cuando
       estaba colapsado — mal) y con medición manual de altura vía `onLayout` + Reanimated
       (`useSharedValue`/`useAnimatedStyle`) — generaba parpadeo porque el `setState` de la medición
       peleaba con la animación corriendo en paralelo. **Fix final**: montar/desmontar con las
       animaciones nativas `entering={FadeIn}` / `exiting={FadeOut}` de Reanimated, sin medición
       manual de altura.
    2. _Pills kg/lb desalineados horizontalmente_: `style={[..., { flex: 1 }]}` en un objeto de estilo
       inline no se aplicaba parejo. Fix: `flex-1` como clase Tailwind (mismo patrón que ya usa
       `SetStepper.tsx`), no como propiedad de un `style` array.
    3. _"Peso objetivo" se veía como una barra fina, casi colapsada_: tenía `flex-1` (heredado de
       `NumberField`) dentro de un contenedor de columna con `width: "48%"` en vez de `flex-row` — sin
       un eje horizontal `flex-row`, ese `flex-1` intenta crecer verticalmente sin límite y colapsa la
       caja. Fix: envolver siempre `NumberField` en `flex-row`, igual que ya se hacía en la fila
       Altura/Peso actual, en vez de armar contenedores especiales con porcentajes fijos. Se corrigió
       también el mismo patrón en el campo de Presupuesto semanal, que tenía el mismo riesgo aunque no
       se había manifestado todavía como bug visible.
    4. _Meta (Déficit/Volumen/Mantenimiento) se veía descuadrada_: "Mantenimiento" hacía wrap a dos
       líneas por ser más largo, lo que estiraba la altura de todo el `flex-row` y descentraba el
       texto de las otras dos opciones (que no tenían `justify-center`). Fix: acortar la etiqueta a
       "Mantener" (no hace wrap) + agregar `justify-center` a los tres pills.
    5. _Pill seleccionado (amarillo) con menor altura que el pill sin seleccionar, quedando "pegado
       arriba"_: un `flex-row` no estaba forzando `alignItems: stretch` de forma confiable en Android
       para estos `Pressable`. Fix aplicado y confirmado en el código final: cada `Pressable` de pill
       segmentado usa `style={[segmentedToggleStyle(condición), { alignSelf: "stretch" }]}` (con
       `{ flex: 1, alignSelf: "stretch" }` en el caso de Meta, que además necesita repartir ancho)
       junto con `className="items-center justify-center"` — no depender del default implícito de
       `flex-row`. Aplicado en los tres lugares: Meta y kg/lb de `nutrition-settings.tsx`, y kg/lb de
       `profile.tsx`.
    6. _Causa final y real de "el botón queda pegado arriba"_: no era el `Pressable` ni el `Text` —
       era el contenedor `<View className="flex-row gap-2 px-4 pb-4">` del selector kg/lb, que solo
       tenía padding inferior (`pb-4`) y nada arriba, contra la línea divisoria de "Elegir para
       Nutrición". Fix: `pt-4` agregado junto al `pb-4` existente.
    - **Nota**: en el medio de este proceso se propuso un fix de `includeFontPadding: false` /
      `textAlignVertical: "center"` para un supuesto bug de padding de fuente en Android
      (`segmentedToggleTextStyle` en `shared/utils/segmentedToggleStyle.ts`) — quedó descartado, la
      causa real terminó siendo la del punto 6. **Confirmado: no se aplicó en el código final** — el
      único cambio que quedó en los `Text` de los pills es el que ya traían antes (clases de color y
      peso de fuente condicionales), sin `style={segmentedToggleTextStyle}` en ninguno.
