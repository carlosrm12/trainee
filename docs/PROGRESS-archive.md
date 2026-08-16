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
