# Fase 2 — Archivo de detalle (histórico)

> Detalle extendido de decisiones y debugging que se recortó de `docs/PROGRESS.md` para mantenerlo
> liviano. Esto NO se lee al arrancar una sesión nueva — solo se consulta puntualmente si hace falta
> el "por qué" completo de algo que el log resumido de `PROGRESS.md` menciona de forma breve.

---

## Paso 3 — Ajustes de Nutrición: serie de bugs de layout en "Unidad de peso"

Contexto: el bloque de "Unidad de peso" (radio "Usar unidad global" vs. "Elegir para Nutrición" +
selector kg/lb condicional) pasó por 6 rondas de fixes antes de quedar resuelto. Se documenta acá el
detalle completo porque el mismo patrón (pills segmentados, secciones que se expanden/colapsan) se va
a repetir en pantallas futuras (dashboard de Nutrición, lista de compras) y vale la pena tener el
diagnóstico a mano en vez de repetir el mismo proceso de prueba y error.

1. **Salto visual sobre "Peso objetivo" al expandir/colapsar**: la causa fue mostrar/ocultar el
   selector kg/lb con `{condición && <View>...}` (monta/desmonta), lo que dispara reflow del
   `ScrollView`. Se intentó primero con `opacity` fijo (dejaba un hueco vacío permanente cuando estaba
   colapsado — mal) y con medición manual de altura vía `onLayout` + Reanimated
   (`useSharedValue`/`useAnimatedStyle`) — generaba parpadeo porque el `setState` de la medición
   peleaba con la animación corriendo en paralelo. **Fix final**: montar/desmontar con las animaciones
   nativas `entering={FadeIn}` / `exiting={FadeOut}` de Reanimated, sin medición manual de altura.

2. **Pills kg/lb desalineados horizontalmente**: `style={[..., { flex: 1 }]}` en un objeto de estilo
   inline no se aplicaba parejo. Fix: `flex-1` como clase Tailwind (mismo patrón que ya usa
   `SetStepper.tsx`), no como propiedad de un `style` array.

3. **"Peso objetivo" se veía como una barra fina, casi colapsada**: tenía `flex-1` (heredado de
   `NumberField`) dentro de un contenedor de columna con `width: "48%"` en vez de `flex-row` — sin un
   eje horizontal `flex-row`, ese `flex-1` intenta crecer verticalmente sin límite y colapsa la caja.
   Fix: envolver siempre `NumberField` en `flex-row`, igual que ya se hacía en la fila Altura/Peso
   actual, en vez de armar contenedores especiales con porcentajes fijos. Se corrigió también el mismo
   patrón en el campo de Presupuesto semanal, que tenía el mismo riesgo aunque no se había manifestado
   todavía como bug visible.

4. **Meta (Déficit/Volumen/Mantenimiento) se veía descuadrada**: "Mantenimiento" hacía wrap a dos
   líneas por ser más largo, lo que estiraba la altura de todo el `flex-row` y descentraba el texto de
   las otras dos opciones (que no tenían `justify-center`). Fix: acortar la etiqueta a "Mantener" (no
   hace wrap) + agregar `justify-center` a los tres pills.

5. **Pill seleccionado (amarillo) con menor altura que el pill sin seleccionar, quedando "pegado
   arriba"**: un `flex-row` no estaba forzando `alignItems: stretch` de forma confiable en Android para
   estos `Pressable`. Fix aplicado y confirmado en el código final: cada `Pressable` de pill segmentado
   usa `style={[segmentedToggleStyle(condición), { alignSelf: "stretch" }]}` (con
   `{ flex: 1, alignSelf: "stretch" }` en el caso de Meta, que además necesita repartir ancho) junto
   con `className="items-center justify-center"` — no depender del default implícito de `flex-row`.
   Aplicado en los tres lugares: Meta y kg/lb de `nutrition-settings.tsx`, y kg/lb de `profile.tsx`.

6. **Causa final y real de "el botón queda pegado arriba"**: no era el `Pressable` ni el `Text` — era
   el contenedor `<View className="flex-row gap-2 px-4 pb-4">` del selector kg/lb, que solo tenía
   padding inferior (`pb-4`) y nada arriba, contra la línea divisoria de "Elegir para Nutrición". Fix:
   `pt-4` agregado junto al `pb-4` existente.

**Nota**: en el medio de este proceso se propuso un fix de `includeFontPadding: false` /
`textAlignVertical: "center"` para un supuesto bug de padding de fuente en Android
(`segmentedToggleTextStyle` en `shared/utils/segmentedToggleStyle.ts`) — quedó descartado, la causa
real terminó siendo la del punto 6. Confirmado: no se aplicó en el código final — el único cambio que
quedó en los `Text` de los pills es el que ya traían antes (clases de color y peso de fuente
condicionales), sin `style={segmentedToggleTextStyle}` en ninguno.

**Lección general para pantallas futuras con pills/toggles segmentados**: en un `flex-row` con
`Pressable`s de altura variable, no confiar en los defaults de `alignItems`/padding — declarar
explícito `alignSelf: "stretch"`, `justify-center`, y padding simétrico arriba/abajo desde el
principio, en vez de descubrir el problema visual y corregirlo reactivamente.

---

## Paso 5a (Configuración de IA) — bug de teclado en Android con Expo Go

Contexto: al implementar el campo para pegar la API key de Gemini en `nutrition-settings.tsx`, el
teclado tapaba el input y los botones "Cancelar"/"Guardar" sin dejar hacer scroll para verlos.

**Intento 1 — `KeyboardAvoidingView` con `behavior={Platform.OS === "ios" ? "padding" : "height"}`**:
no funcionó en Android. Causa: el proyecto tiene `"edgeToEdgeEnabled": true` en `app.json` (obligatorio
desde Android 15, Expo ya lo dejó activado). Con edge-to-edge, el comportamiento automático de
`adjustResize` que Android usaba para correr la pantalla sola cuando aparece el teclado deja de
funcionar, y `KeyboardAvoidingView` de React Native no lo compensa correctamente — es un bug conocido
de la librería en esta combinación específica (edge-to-edge + a veces New Architecture, que también
está activa acá con `newArchEnabled: true`).

**Intento 2 — `react-native-keyboard-controller`** (`KeyboardProvider` en `app/_layout.tsx` +
`KeyboardAwareScrollView` reemplazando `ScrollView` en `nutrition-settings.tsx`): es la solución que
recomienda hoy el propio equipo de Expo para este caso exacto, y funciona bien con edge-to-edge y New
Architecture. **Pero es un módulo nativo de terceros — no corre en Expo Go**, que es lo que usa el
proyecto (no dev client). Se revirtió por completo antes de instalar/probar en el dispositivo, apenas
se confirmó la incompatibilidad.

**Fix final — 100% JS, sin dependencias nuevas, compatible con Expo Go**:

- Listener manual de teclado con `Keyboard.addListener("keyboardDidShow", ...)` /
  `Keyboard.addListener("keyboardDidHide", ...)`, ambas APIs core de `react-native`.
- Al mostrarse el teclado: guardar su altura en un `useState`, y en el próximo frame
  (`requestAnimationFrame`) llamar `scrollRef.current?.scrollToEnd({ animated: true })` sobre un
  `ScrollView` referenciado con `useRef`.
- El `contentContainerStyle` del `ScrollView` usa `paddingBottom: 100 + keyboardHeight` (dinámico), así
  hay espacio real de scroll suficiente para que `scrollToEnd` pueda llevar el contenido arriba del
  teclado.
- Funciona porque "Configuración de IA" es siempre la última sección de la pantalla — para un caso
  donde el input a destapar esté en el medio de un scroll largo, este mismo patrón necesitaría
  `scrollTo({ y: <posición medida del input> })` en vez de `scrollToEnd()`, con la posición obtenida
  vía `onLayout` del contenedor del input en cuestión.

**Lección para pantallas futuras con inputs** (captura de comida en 5c, lista de compras en el paso 9):
reutilizar este mismo patrón manual de `Keyboard` + `ScrollView` en vez de `KeyboardAvoidingView` — ya
sabemos que no funciona en este proyecto con la config actual de `app.json`. Si en algún momento el
proyecto migra de Expo Go a dev client, ahí sí conviene reconsiderar `react-native-keyboard-controller`
como solución más robusta y unificada.

---

## Paso 3 — Fix post-merge: limpieza de `nutrition-settings.tsx` (branch `fix/nutrition-settings-cleanup`)

Contexto: en la revisión del paso 3 ya mergeado se encontraron dos problemas menores, ninguno
bloqueante, pero que valía la pena limpiar antes de arrancar el paso 4.

1. **`resolveWeightUnit` sin usar**: la función se creó en el paso 2
   (`features/nutrition/resolveWeightUnit.ts`) específicamente para ser el único lugar donde se
   resuelve "¿unidad global o override?". `nutrition-settings.tsx` no la importaba y reescribía la
   misma lógica inline con `current.weightUnitOverride ?? globalWeightUnit`. Mismo resultado en
   runtime, pero duplicación que el propio doc de Fase 2 quería evitar al extraer la función. Fix:
   reemplazar por `resolveWeightUnit(globalWeightUnit, current.weightUnitOverride)`.

2. **Borde colgante en el bloque "Unidad de peso"**: dos `SettingsRow` seguidos de un
   `WeightUnitPicker` que renderiza `null` cuando está colapsado. Como ninguna de las dos filas pasaba
   `isLast`, la segunda ("Elegir para Nutrición") siempre pintaba su `border-b` — cuando el picker
   estaba colapsado, ese borde quedaba flotando justo antes de la esquina redondeada del contenedor,
   sin nada abajo. Fix: `isLast={!usesOwnUnit}` en esa fila, así el borde solo aparece cuando el
   picker sí va a mostrarse debajo.

3. **Ronda 2 del mismo fix**: al revisar el fix anterior se notó que `WeightUnitPicker` seguía
   recalculando `current.weightUnitOverride ?? globalWeightUnit` por su cuenta para su prop `value`,
   en vez de reusar la variable `displayUnit` ya calculada arriba con `resolveWeightUnit` — la misma
   regla escrita dos veces en el mismo archivo, justo lo que el fix 1 buscaba evitar. Fix: `value={displayUnit}`.

**Prueba manual usada para validar los tres fixes juntos** (sin cambio de comportamiento esperado):

1. Abrir con `weightUnitOverride = null` → radio "Usar unidad global" marcado, picker oculto, sufijos
   de peso en la unidad global.
2. Tocar "Elegir para Nutrición" → picker aparece con la unidad global ya preseleccionada (confirma
   que `displayUnit` se pasa bien como `value`).
3. Cambiar a `lb` dentro del picker → sufijos de peso arriba se actualizan al instante.
4. Volver a "Usar unidad global" → picker desaparece sin borde colgando.
5. Cerrar y reabrir la pantalla → estado persistido correctamente.

---

## Paso 5b — botón "Probar conexión" en `GeminiApiKeySection`

Contexto: mientras se armaba el cliente de Gemini (`analyzeMealPhoto.ts`), se agregó un botón dentro
de la sección "Configuración de IA" de `nutrition-settings.tsx` para poder validar que la API key
funciona de punta a punta (llamada real a Gemini con una foto) sin tener que esperar a que exista la
pantalla completa de captura (5c).

**Cómo funciona**: pide permiso de galería, abre `ImagePicker.launchImageLibraryAsync` con
`base64: true` y `quality: 0.5`, llama a `analyzeMealPhoto(base64, apiKey)`, y muestra el resultado
(nombre, macros, confianza) en un `Alert.alert`. Reusa `GeminiAnalysisError` para distinguir errores
de conexión vs. errores de la API en el mensaje mostrado.

**Por qué `quality: 0.5` no alcanza para el flujo real de captura**: ese parámetro de `ImagePicker`
solo reduce la calidad de compresión JPEG — no cambia la resolución de la imagen. Una foto de cámara
moderna sigue teniendo varios miles de píxeles de lado aunque se comprima a 0.5, lo que sigue siendo
un payload Base64 grande para mandar a Gemini. El doc de Fase 2 (§5) pide explícitamente
`expo-image-manipulator` para comprimir **y redimensionar** antes de mandar el Base64 — esa librería
todavía no está instalada (`expo-image-manipulator` no aparece en `package.json` a la fecha de este
registro).

**Para 5c**: no reusar el patrón de este botón de prueba tal cual para el flujo de producción — hay
que agregar `expo-image-manipulator` y redimensionar antes de comprimir, tal como pide §5. El botón de
prueba está bien como está porque es un caso de uso puntual (una foto elegida a mano para validar la
key), no el flujo repetido de 4-5 fotos/día que sí necesita el resize real.

---

## Paso 5a — Bug de teclado en Android con Expo Go (detalle completo)

Ver la entrada ya existente más arriba en este archivo bajo "Paso 5a" — sin cambios, se mantiene igual.

## Paso 5b — Cambio de modelo Gemini a mitad de paso

Se armó `analyzeMealPhoto.ts` originalmente contra `gemini-2.5-flash` (elegido en el paso 5a). A mitad
de las pruebas de 5b, Google empezó a bloquear ese modelo para API keys nuevas — se migró a
`gemini-3.5-flash` (serie Gemini 3.x), probado con una foto real de comida, respuesta correcta.

Esta serie reemplaza `thinking_budget` por `thinking_level`
(`generationConfig.thinkingConfig.thinkingLevel`); se seteó en `"LOW"` porque la tarea (estimar macros
de una imagen) no necesita el razonamiento profundo del default `"MEDIUM"` — más rápido y más barato.
Google también desaconseja tocar `temperature`/`top_p`/`top_k` en esta serie; el código nunca los usó,
queda anotado para no agregarlos a futuro sin revisar esto primero.

De paso, se agregó un botón "Probar conexión" dentro de `GeminiApiKeySection`
(`nutrition-settings.tsx`) para poder validar el cliente de Gemini de forma aislada, sin esperar a la
pantalla de captura completa (5c) — usa `expo-image-picker` sobre la galería como fuente de prueba
(con `quality: 0.5`, compresión simple, distinto del pipeline real de 5c que usa
`expo-image-manipulator` con resize).

## Paso 5c — Pantalla de captura: decisiones de alcance

**`persistMealPhoto.ts`**: comprime/redimensiona con `expo-image-manipulator` (max width 1024px, JPEG
calidad 0.7) y persiste esa misma versión comprimida como copia local (no la original) — ahorra
espacio, un solo archivo por comida en vez de dos.

**Selector de tipo de comida**: el ASCII de §5 del doc no muestra un selector de
Desayuno/Almuerzo/Cena/Snack, pero el schema de `mealLogs` lo exige (`mealType`). Se agregó como chips
en la pantalla de confirmación, con default inferido automáticamente según la hora del día
(`inferMealType`), siempre editable por el usuario.

**Estado "pending" ante fallo de Gemini, no implementado como tal**: el doc dice que un fallo debería
dejar el registro "en estado pending, reintentable desde el dashboard" (§5). Pero `mealLogs` no tiene
ninguna columna de estado para eso (no se agregó en el paso 2, no estaba contemplada en el diseño
original de esa tabla) y el dashboard de nutrición todavía no existe (es el paso 6). Agregar una
columna de schema nueva a mitad de 5c, sin que el doc especifique su forma exacta, se consideró
prematuro. Para 5c, el reintento ante fallo es **inline, dentro de la misma pantalla de captura**
(reusa el `base64` ya generado en memoria, sin volver a pedir la foto) — cubre el espíritu de "no
perder el registro por un timeout" sin comprometerse a un cambio de schema no documentado.

Probado en dispositivo real (modo avión activado a propósito): el botón "Reintentar" no se traba y
reusa correctamente la foto ya elegida.

**Pendiente a revisar en el paso 6**: si el dashboard necesita mostrar comidas en estado "pendiente de
análisis" en la lista (por ejemplo, para que el usuario las vea y reintente después, no solo en el
momento), ahí sí va a hacer falta evaluar agregar una columna de estado a `mealLogs` — no antes, cuando
ya se sepa exactamente qué necesita mostrar esa pantalla.

**`ConfidenceBadge`** (nuevo, §13): mismo tratamiento visual chico que `StreakBadge`. Se resalta en
rojo (`text-danger`/`border-danger`) cuando la confianza es menor a 60%, sin bloquear el guardado — es
la comida del usuario, la IA solo ayuda.

**Entrada temporal en `nutrition.tsx`**: botón "Probar registrar una comida" → `/meal-capture`, para
poder probar 5c en dispositivo sin esperar a que exista el dashboard del paso 6. Misma ruta que va a
usar el FAB definitivo del dashboard — se reubica en el paso 6, no se descarta ni se reescribe.

**Confirmado en dispositivo**: `expo-image-manipulator` corre en Expo Go sin necesitar rebuild de dev
client, a diferencia de `react-native-keyboard-controller` (paso 5a). No todo módulo nativo requiere
dev client — depende de si es parte del SDK de Expo (viene precompilado en el binario de Expo Go) o es
una librería de terceros fuera de ese set.
