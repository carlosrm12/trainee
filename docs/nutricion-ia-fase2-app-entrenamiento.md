# Fase 2 — Módulo de Nutrición con IA — Morphos (Trainee)

> Continuación de `docs/diseno-ui-ux-app-entrenamiento.md` y `docs/animaciones-ui-app-entrenamiento.md`.
> Este documento es la hoja de ruta completa de la Fase 2: registro nutricional por foto + IA, ajustes
> propios del módulo, morning briefing (exposición pasiva, cacheo/invalidación del reporte, plan de
> afinado del prompt), lista de compras generativa y (más adelante) correlación con rendimiento de
> entrenamiento. Todas las decisiones de arquitectura y diseño están cerradas — este documento es la
> fuente de verdad para construirlo, y se actualiza en el momento en que aparezca algo nuevo que cubrir.

---

## 1. Objetivo de la Fase 2

Cerrar el círculo entrenamiento ↔ nutrición dentro de la misma app, sin backend propio: foto de plato →
IA extrae macros → se guarda en SQLite → reporte automático a la mañana siguiente → lista de compras
semanal generada a partir de tus déficits reales de la semana. Todo dentro de Morphos, cero fricción,
mismo lenguaje visual que ya existe.

Restricción de diseño más importante de esta fase: **no se agrega un tab nuevo a costa de saturar el
bottom nav**. Se reemplaza el tab que menos se usa (Perfil) y se resuelve el acceso a Perfil de otra forma.

**Proveedor de IA confirmado: Gemini, tier gratuito.** Todo lo que sigue asume ese cliente HTTP; si el
día de mañana cambia el proveedor, solo cambia la capa `features/nutrition/api/` — el resto del módulo
(modelo de datos, pantallas, flujo de confirmación) es agnóstico al proveedor.

---

## 2. Decisión de navegación: Perfil deja de ser tab

### Antes (Fase 1)

```
[ Home ] [ Rutinas ] [ Historial ] [ Buscar ] [ Perfil ]
```

### Después (Fase 2)

```
[ Home ] [ Rutinas ] [ Nutrición ] [ Historial ] [ Buscar ]
```

Ícono del tab Nutrición: `Salad` de `lucide-react-native` — coherente con el set ya usado
(`Home`, `Dumbbell`, `History`, `Search`).

Perfil pasa de tab a **acceso rápido persistente**: un círculo con la foto de perfil (o iniciales si no
hay avatar) al lado de la campana de notificaciones. Igual que la campana ya abre `reminders.tsx` desde
fuera del bottom nav, el avatar abre `profile.tsx` de la misma forma.

**El header no vive solo en Home.** Si el avatar+campana solo estuvieran en Home, perderías acceso
rápido a Perfil desde Rutinas/Nutrición/Historial/Buscar, que es peor que ahora. Se extrae un componente
`AppHeader` compartido (título de pantalla a la izquierda, cluster avatar+campana a la derecha) y se
monta en las 5 pantallas de tabs. Coherente con el principio de "máximo 2 taps desde donde estés" que ya
rige el resto de la app.

```
┌─────────────────────────────┐
│ Nutrición          ⚙ 👤 🔔  │  ← AppHeader: título + [ajustes propios del tab] + avatar + campana
│                              │     El ⚙ solo aparece en pantallas que tienen ajustes propios
│  ...contenido de la pantalla │      (hoy: solo Nutrición — ver §3).
```

- `AppHeader` recibe `title`, `avatarUri`, `hasReminderPending` y un prop opcional `onSettingsPress` —
  si se pasa, se renderiza el ícono de engranaje antes del cluster avatar+campana. Solo `nutrition.tsx`
  lo usa por ahora; Home/Rutinas/Historial/Buscar no tienen ajustes propios que lo justifiquen.
- El avatar muestra la foto de perfil o iniciales — sin ningún indicador de estado, coherente con el
  principio de §9 de que el briefing no persigue al usuario fuera de la notificación inicial.
- La campana conserva el badge de punto rojo/`danger` que ya tiene para recordatorios pendientes.
- Tamaño del avatar: 32px en el header (vs 88px en la propia pantalla de Perfil) — círculo simple,
  `border-subtle` si no hay foto, mostrando iniciales en `text-secondary`.

### Principio de propiedad de ajustes (importante, gobierna el resto del doc)

**Cada tab es dueño de sus propios ajustes específicos.** Perfil deja de ser el cajón general de "toda
configuración de la app" y queda acotado a:

- Identidad: avatar, nombre.
- Ajustes verdaderamente globales, sin dueño natural más específico: unidad de peso por defecto
  (`weightUnit`), sonido/vibración del timer de descanso, notificaciones de recordatorios de rutina,
  hora del morning briefing.

Todo lo que es específico de nutrición (macros objetivo, presupuesto, restricciones dietéticas, unidad
de peso *para ese módulo*) vive **dentro del tab Nutrición**, detrás del ícono ⚙ de su propio
`AppHeader` — no en Perfil. Esto es extensible: si en el futuro Rutinas necesitara ajustes propios
(ej. unidad de descanso por defecto), seguiría el mismo patrón en vez de volver a inflar Perfil.

### Cambios de archivos (routing)

Expo Router ya resuelve esto por convención de carpetas — no hay que tocar lógica, solo mover/crear:

1. `app/(tabs)/profile.tsx` → `app/profile.tsx` (sale del grupo de tabs, pasa a stack screen suelta,
   mismo patrón exacto que `app/reminders.tsx` ya usa hoy).
2. `app/(tabs)/_layout.tsx` → se quita el `Tabs.Screen name="profile"`, se agrega
   `Tabs.Screen name="nutrition"` en su posición (tercer ícono, entre Rutinas e Historial), con `Salad`.
3. `app/(tabs)/nutrition.tsx` (nuevo) → dashboard de nutrición, tab principal de la Fase 2.
4. `app/nutrition-settings.tsx` (nuevo) → stack screen suelta, mismo patrón que `profile.tsx`/`reminders.tsx`,
   abierta desde el ⚙ del `AppHeader` de Nutrición. Acá viven macros/presupuesto/restricciones/unidad.
5. `app/nutrition-day/[date].tsx` (nuevo) → stack screen suelta, fuera de `(tabs)`, para poder recibir
   el deep link de la notificación del morning briefing sin importar en qué tab esté el usuario. Es la
   pantalla de detalle de un día del historial nutricional — no existe una pantalla "Morning Briefing"
   separada, ver §9.
6. `shared/components/AppHeader.tsx` (nuevo) → título + ⚙ opcional + avatar + campana, se monta en las
   5 pantallas de `(tabs)`.
7. `features/nutrition/useMorningBriefingNotification.ts` (nuevo) → hook encargado de programar/cancelar
   el trigger `DAILY` de `expo-notifications` para el briefing. No reutiliza infraestructura existente
   — ver §9, subsección "Mecanismo técnico".
8. Los `Pressable` de avatar/campana usan `router.push("/profile")` y `router.push("/reminders")`
   respectivamente — mismo mecanismo que ya usa el bell actual del Home.

No hace falta migración de datos ni cambios en `useProfileStats` — solo cambia *dónde* se monta la UI
que ya existe, más las pantallas nuevas de nutrición.

---

## 3. Modelo de datos nuevo

Tres tablas nuevas en `drizzle/schema.ts`, ninguna reemplaza algo existente:

| Tabla | Campos clave | Nota |
|---|---|---|
| `nutritionProfile` | `heightCm`, `currentWeightKg`, `targetWeightKg`, `goal` (`deficit`\|`bulk`\|`maintenance`), `weightUnitOverride` (`kg`\|`lb`\|`null`), `dailyCalorieTarget`, `dailyProteinG`, `dailyCarbsG`, `dailyFatG`, `weeklyBudget`, `currency` (default `"USD"`), `dietaryPreferences` (json/text), `dietaryRestrictions` (json/text), `updatedAt` | Fila única (igual patrón que la tabla de `settings` actual). Editable **solo** desde `app/nutrition-settings.tsx`, nunca desde Perfil. Es la fuente de verdad del "system prompt" — ver §4. |
| `mealLogs` | `id`, `date` (YYYY-MM-DD), `mealType` (`breakfast`\|`lunch`\|`dinner`\|`snack`), `photoUri`, `name`, `calories`, `proteinG`, `carbsG`, `fatG`, `confidence` (0–1), `source` (`ai`\|`manual`), `notes`, `createdAt` | Una sola tabla para todos los días — igual razonamiento que ya se aplicó con `SetLog`: se filtra por `date`, no se crea tabla por día. |
| `shoppingLists` | `id`, `weekStartDate`, `itemsJson` (array de `{name, qty, unit, estCost, checked}`), `estimatedTotal`, `currency`, `generatedAt` | Cache por semana, generación lazy al abrir — mismo patrón que `nutritionDayReports`. Se conserva histórico para comparar semanas; ver §11 para el trigger y la regla de invalidación. |
| `nutritionDayReports` | `date` (PK, YYYY-MM-DD), `reportText`, `generatedAt` | Cache del texto de IA del morning briefing por día — ver §9. Una fila por fecha, se borra (no se marca) cuando el día se invalida, así "no hay fila" es directamente la señal de "hay que regenerar". |

### Tipo de columna para macros: `real`, no `integer`

`schema.ts` ya tiene el precedente exacto para esto: `setLogs.weightKg` usa `real("weight_kg")`, no
`integer`, porque es una magnitud física continua — mismo caso que los macros. Gemini puede devolver
`12.5g` de grasa perfectamente válido; forzarlo a entero en la capa de datos tira precisión que no hace
falta tirar.

- `dailyProteinG`, `dailyCarbsG`, `dailyFatG` (en `nutritionProfile`) y `proteinG`, `carbsG`, `fatG`
  (en `mealLogs`) van como `real(...)`, igual que `weightKg`.
- `calories`/`dailyCalorieTarget` sí van como `integer` — las kcal ya se muestran redondeadas en toda
  la UI existente (rutinas, resumen de sesión), no hay motivo para romper esa convención acá.
- El redondeo para mostrar en pantalla (ej. `12.5g` → `"12.5g"` vs `"13g"`) es una decisión de
  presentación, no de almacenamiento — se resuelve en el componente (`StatRow`/`MacroRing`), nunca con
  un `Math.round()` antes de insertar. Guardar el dato preciso y decidir cómo mostrarlo después es más
  barato de revertir que perder precisión en la escritura y no poder recuperarla.

### `photoUri` en `mealLogs`: no es una referencia permanente

El campo apunta a un archivo local, pero **no vive para siempre** — hay una política de retención y
borrado físico definida en §5 ("Retención de fotos"). `mealLogs` en sí (los números) sí es permanente;
la foto es un insumo temporal para llegar a esos números, no el registro histórico en sí.

### `weightUnitOverride` — cómo se resuelve la unidad

`weightUnit` global (kg/lb) sigue viviendo en `settings`, editable desde Perfil, y sigue siendo el
default para todo lo que no diga lo contrario (peso levantado en Rutinas, peso corporal general).
Dentro de `nutrition-settings.tsx` hay un selector propio: "Usar unidad global (kg/lb)" vs. "Elegir
para Nutrición". Si el usuario no lo toca, `weightUnitOverride` queda `null` y el módulo de nutrición
hereda `settings.weightUnit` tal cual. Si lo cambia, `weightUnitOverride` manda solo dentro de
nutrición, sin tocar el resto de la app.

```ts
// features/nutrition/resolveWeightUnit.ts
function resolveWeightUnit(
  globalUnit: "kg" | "lb",
  override: "kg" | "lb" | null,
): "kg" | "lb" {
  return override ?? globalUnit;
}
```

### Moneda — fija en USD, preparada para cambiar

`currency` se guarda como código ISO (`"USD"`) en vez de un símbolo hardcodeado (`"$"`) desde el día
uno, aunque hoy no haya selector visible en la UI. Todo formateo de montos pasa por una única función:

```ts
// shared/utils/formatCurrency.ts
function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  // Intl.NumberFormat con el currencyCode — nunca un template string con "$" fijo
}
```

Con esto, agregar un selector de moneda en el futuro es una sola pantalla nueva (un picker que escribe
`nutritionProfile.currency`) — cero refactor en las pantallas que ya muestran plata (dashboard, lista
de compras), porque todas pasan por `formatCurrency`, nunca concatenan `"$"` a mano.

---

## 4. El "system prompt" no es un archivo — es datos

**Decisión: no se versiona ningún `.md` estático en el repo con tu perfil físico.** Es información
personal que cambia (peso semana a semana, presupuesto, antojos), y un archivo de texto commiteado en
git no es el lugar correcto para datos que mutan — además expondría datos personales tuyos en un repo.

En su lugar: `nutritionProfile` (§3, editable desde `nutrition-settings.tsx`) es la fuente de verdad, y
una función pura la serializa al formato de prompt en tiempo de llamada:

```ts
// features/nutrition/buildSystemPrompt.ts
function buildSystemPrompt(profile: NutritionProfile): string {
  // Arma el texto de contexto (rol + perfil físico + metas de macros +
  // presupuesto en su currency + preferencias/restricciones) a partir de
  // la fila actual de nutritionProfile. Se llama en cada request a Gemini,
  // nunca se cachea en disco.
}
```

Ventaja sobre el `.md` estático: si cambiás tu peso o tu presupuesto en Ajustes de Nutrición, la próxima
foto ya usa el dato actualizado — no hay que editar un archivo y hacer rebuild de la app.

**Matiz importante, no es una contradicción con lo anterior**: lo único que *no* se versiona es el dato
personal dinámico (`nutritionProfile`, que vive en SQLite). El texto de rol/tono/formato — las reglas de
cómo debe sonar la IA, sin datos del usuario adentro — sí es estático y **sí se commitea** como cualquier
otro archivo de código en `buildSystemPrompt.ts`. Ver §10 para el trabajo específico de afinar ese texto.

---

## 5. Flujo de captura de comida (foto → macros)

Pantalla nueva en modo focus (mismo tratamiento que Ejecución de rutina: sin bottom nav, `slide_from_bottom`,
`Stack.Screen` dentro del propio archivo de ruta).

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│ ✕         Nueva comida       │        │ ✕         Analizando...      │
│                              │        │                              │
│   [ tomar foto / galería ]   │  ───▶  │    (loading, spinner accent) │
│                              │        │                              │
└─────────────────────────────┘        └─────────────────────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────┐
│ ✕      Confirmar registro    │
│  [ foto miniatura ]           │
│  Pollo con arroz              │  ← editable (nombre)
│   420 kcal │ 38g │ 40g │ 12g  │  ← StatRow segmentado (kcal/prot/carb/grasa)
│   con steppers +/- por campo  │     reutiliza el patrón de SetStepper
│   Confianza IA: 82%           │  ← ConfidenceBadge (nuevo, chico)
│        [ GUARDAR ]           │  ← brutalista, mismo tratamiento que Marcar Set
└─────────────────────────────┘
```

- Antes de enviar el Base64, la imagen se comprime/redimensiona con `expo-image-manipulator`
  (payload típico de una foto de cámara moderna es innecesariamente grande para este uso).
- La IA nunca escribe directo a SQLite — siempre devuelve un JSON candidato, el usuario confirma o
  edita, y **recién ahí** se persiste. Coherente con un aprendizaje ya validado en Fase 1 (dejaste
  kcal de rutinas fuera hasta tener datos reales): acá el dato sí se acepta, pero pasa por revisión
  humana antes de guardarse, nunca se autoguarda un número inventado.
- Si falla la llamada (sin red, error de API): el registro queda en estado `pending` con la foto
  guardada localmente, reintentable desde el dashboard — no se pierde el registro por un timeout.
- `confidence` bajo (ej. <60%) resalta el campo en vez de bloquear el guardado — es tu comida, vos
  decidís, la IA solo ayuda.
- El campo `date` que se escribe al guardar usa `getLocalDateString` (§9) — no `toISOString()` — para
  que quede en la misma zona horaria local que después va a buscar el morning briefing y el historial.

### Retención de fotos: no se acumulan para siempre

Las fotos se guardan localmente con el mismo mecanismo que ya usa `persistAvatar` en `profile.tsx`
(copiar el archivo del picker a `Paths.document`, porque el URI temporal del picker no sobrevive entre
sesiones) — pero a diferencia del avatar, acá **no es un archivo único que se sobreescribe**: es uno
nuevo por comida. A 4 comidas/día, son ~120 fotos/mes — sin límite, eso es varios cientos de MB en menos
de un año de uso real, solo para datos que ya quedaron reducidos a 4 números en SQLite.

- Las fotos de `mealLogs` se borran físicamente del dispositivo **14 días** después de creado el
  registro — tiempo de sobra para revisar/corregir una comida vieja, poco tiempo para que el
  almacenamiento crezca sin límite.
- El borrado corre al abrir la app (chequeo simple: barrer `mealLogs` con `photoUri` no nulo y
  `createdAt` de más de 14 días, borrar el archivo, poner `photoUri = null` en la fila) — no hace falta
  un background job real ni una librería nueva de scheduling; con que corra una vez por sesión alcanza,
  no es una operación sensible al segundo.
- `mealLogs.calories/proteinG/carbsG/fatG/name` **nunca se borran** — solo la foto. El dato nutricional
  es el registro permanente; la imagen fue solo el insumo para llegar a ese dato (ver nota en §3).
- La miniatura en `MealCard`/pantalla de confirmación simplemente no se renderiza si `photoUri` es
  `null` — cae al mismo estado que un registro `manual` (sin foto desde el origen), no hace falta un
  estado visual nuevo para "foto borrada por antigüedad".

---

## 6. Dashboard de Nutrición (tab principal)

```
┌─────────────────────────────┐
│ Nutrición          ⚙ 👤 🔔  │  ← AppHeader (con ⚙ propio de este tab)
│                              │
│  Hoy                         │
│ ┌──────────────────────────┐ │
│ │  1,240 / 2,100 kcal        │  ← único bento hero de esta pantalla:
│ │  ◐ anillo de progreso       │     mismo criterio que "sesión más
│ │  Prot 78g│Carb 110g│Grs 32g│     reciente" en Historial — es el
│ └──────────────────────────┘ │     único dato con jerarquía real
│                              │
│ Comidas de hoy                │
│ ┌──────────────────────────┐ │
│ │ 🍳 Desayuno   420 kcal     │  ← MealCard, filas uniformes, flat
│ │ 🍗 Almuerzo    680 kcal    │
│ └──────────────────────────┘ │
│                              │
│                       [ + ]  │  ← FAB brutalista → captura de comida
│ [Home][Rutinas][Nutrición]…  │
└─────────────────────────────┘
```

El anillo de progreso de calorías **reutiliza la lógica de `RestTimerRing`** (SVG + progreso animado),
no se construye un componente nuevo desde cero — mismo criterio de reuso que ya aplicaron con `StatRow`
en tres pantallas distintas de Fase 1.

---

## 7. Ajustes de Nutrición (`app/nutrition-settings.tsx`)

Pantalla nueva, stack suelta, abierta desde el ⚙ del `AppHeader` de Nutrición. Todo lo que es específico
del módulo vive acá, no en Perfil (ver principio de §2):

```
┌─────────────────────────────┐
│ ‹  Ajustes de Nutrición       │
│                              │
│ Perfil físico                 │
│  Altura, peso actual, peso    │
│  objetivo, meta (déficit/     │
│  volumen/mantenimiento)       │
│                              │
│ Unidad de peso                │
│  ( ) Usar unidad global (kg)  │
│  ( ) Elegir para Nutrición    │
│                              │
│ Metas diarias de macros       │
│  Calorías, proteína, carbos,  │
│  grasas — steppers            │
│                              │
│ Presupuesto semanal           │
│  $40 USD  (moneda fija por     │
│  ahora — selector futuro)      │
│                              │
│ Preferencias y restricciones  │
│  chips outline editables      │
└─────────────────────────────┘
```

- Reutiliza los mismos patrones de fila/toggle/stepper que ya existen en `profile.tsx` — se extrae un
  componente compartido `SettingsRow` (label + control a la derecha, separador `border-subtle`) para
  no duplicar esa UI entre Perfil y Ajustes de Nutrición, ya que ahora hay dos pantallas de settings
  en vez de una.
- El campo de moneda se muestra como texto fijo "USD" en esta primera versión (no hay picker aún) —
  cuando se agregue selector de moneda, es la única pantalla que cambia (ver §3, `formatCurrency`).

---

## 8. Perfil (`app/profile.tsx`) — alcance reducido

Acotado a identidad + ajustes verdaderamente globales:

- Avatar, nombre.
- Unidad de peso por defecto (`weightUnit` global — de la que Nutrición puede o no heredar).
- Sonido/vibración del timer de descanso.
- Notificaciones de recordatorios de rutina.
- Hora del morning briefing (`briefingHour`, `briefingMinute` — la hora en sí es un ajuste general del
  dispositivo/rutina diaria, no un dato nutricional, por eso vive acá y no en Ajustes de Nutrición).
  **No es un valor pasivo**: guardar este campo dispara `useMorningBriefingNotification` (§9) —
  cancela la notificación de briefing programada antes (`cancelScheduledNotificationAsync`) y
  reprograma una sola vez con `trigger: { type: DAILY, hour, minute }`. El sistema operativo repite
  el trigger solo; no hay que reprogramar cada noche ni cada mañana. Mismo patrón cancelar-y-reprogramar
  que ya usa `useRestTimer.ts`, solo que con otro tipo de trigger (`DAILY` en vez de `TIME_INTERVAL`).

No agrega ni un campo nuevo de macros/presupuesto/restricciones — todo eso se movió a §7.

---

## 9. Morning Briefing

### Principio general

**El briefing no persigue al usuario.** Si se pierde la notificación, el reporte queda disponible
pasivamente como cualquier otro día del historial — no hay segundo mecanismo de recordatorio (ni card
en Home, ni badge en ningún ícono). Notificación local, una sola vez por día, y si no la tocás no vuelve
a insistir *ese día* — coherente con el resto de la app: nada compite por atención fuera de su propio
espacio.

### Mecanismo técnico (nuevo, no reutiliza infraestructura existente)

Vale la pena dejar esto explícito porque a simple vista parece que ya existe algo parecido, y no es así:

- `useReminders.ts` (la campana 🔔) **no programa ninguna notificación del sistema** — es una lista
  derivada en memoria, sin `expo-notifications` de por medio; el propio comentario del archivo dice
  "sin estado: no se guardan en DB ni se marcan como leídos". No sirve de base para esto.
- La única llamada real a `expo-notifications` en el repo hoy es un trigger `TIME_INTERVAL` de un solo
  uso en `useRestTimer.ts`, para el timer de descanso — se dispara una vez y se termina, no se repite.
- El trigger `DAILY` para el briefing es **100% nuevo**: es recurrente, lo programa el sistema
  operativo, no la app. Sí puede reutilizar el patrón de permisos/canal de notificación que
  `useRestTimer.ts` ya resolvió — eso no hay que redescubrirlo — pero el tipo de trigger en sí no
  existe todavía en el código.
- **Configuración única**: un solo campo en Perfil (`briefingHour`, `briefingMinute` — ya estaba
  contemplado ahí, sin cambios en dónde vive). Guardarlo dispara `useMorningBriefingNotification`
  (§2, punto 7) — ver el detalle de cancelar-y-reprogramar en §8.
- **El tap de la notificación no navega solo — hay que capturarlo explícitamente**. A diferencia de un
  push con payload, un trigger local `DAILY` programado por el SO no dispara ningún deep link
  automático en Expo Router; nada en el repo hoy escucha la respuesta a una notificación (`useRestTimer.ts`
  la *programa*, pero nunca engancha qué pasa si el usuario la toca — no hacía falta para el timer). Se
  agrega `Notifications.useLastNotificationResponse()` en `app/_layout.tsx` (la raíz, para capturarlo sin
  importar en qué pantalla esté el usuario), filtrando por el identificador de este trigger específico
  (no cualquier notificación), y ahí se dispara `router.push("/nutrition-day/" + getLocalDateString(yesterday))`
  — mismo cálculo de fecha que la subsección de abajo. Respeta la carga lazy de `expo-notifications` ya
  establecida en `useRestTimer.ts` (bloquea Expo Go en cold start si se importa estático).
- **La notificación siempre dispara, todos los días, tengas o no registros** — ya no hay lógica para
  decidir de antemano si "vale la pena" dispararla, porque eso no puede saberse hasta que alguien la
  toca: el trigger `DAILY` es ciego a los datos, solo sabe la hora.
- Al tocarla (o al abrir el día manualmente desde el historial): recién ahí se calcula "ayer" y se
  aplica la condición ya definida en "Condición única" más abajo — si no hay `mealLogs` de esa fecha,
  se muestra el estado vacío sin llamar a Gemini.
- **Corrección de framing respecto a versiones anteriores de este documento**: la frase "evita spam
  vacío" ya no aplica tal cual — con este diseño, la notificación sí llega todos los días, incluso los
  vacíos. Lo que se evita es la llamada innecesaria a la IA al abrir un día sin datos, no la
  notificación en sí. Es un trade-off aceptado a propósito: mucho más simple que reprogramar el
  trigger cada noche en base a un dato (si hubo comidas) que todavía no existe al momento de programar.

### Exposición

- No existe una pantalla "Morning Briefing" como entidad propia. Es el detalle de un día dentro del
  historial nutricional — el mismo componente que se usa para ver cualquier día pasado, aplicado a
  "ayer". Menos superficie de UI que mantener, y el briefing deja de ser un caso especial.
- Ruta compartida: `app/nutrition-day/[date].tsx`, montada fuera del stack de tabs (ver §2, punto 5)
  para poder recibir el deep link de la notificación sin importar en qué tab esté el usuario.
- La notificación local hace deep link a esa ruta base — pero **no puede llevar la fecha de ayer en el
  payload**, porque es el mismo trigger `DAILY` recurrente disparando indefinidamente, no uno nuevo
  programado cada día (ver "Mecanismo técnico" arriba). "Ayer" se calcula en el momento de abrir —
  tap en la notificación o apertura manual del día desde el historial —, no al programar el trigger.
  Tocar cualquier día en el historial nutricional termina en exactamente la misma pantalla, con el
  mismo componente y el mismo cálculo de fecha.

### Cálculo de "ayer": zona horaria local, nunca UTC

Este es un riesgo real, no hipotético — ya existe una instancia del mismo patrón peligroso en el repo:
`useProfileStats.ts` calcula la racha con `toDateOnly(date.toISOString())`, y `toISOString()` siempre
devuelve la fecha en UTC. Si entrenás pasada la medianoche local en una zona con offset negativo grande
(ej. Ecuador, UTC-5), ese cálculo puede devolver el día anterior al que el dispositivo está mostrando.
Hoy pasa desapercibido porque el margen de error de la racha es de un día completo. Acá no hay ese
margen: la notificación del briefing dispara a una hora local fija (`briefingHour`), y si "ayer" se
calcula en UTC en vez de en la zona horaria del dispositivo, el `date` resultante puede no coincidir
con la fecha bajo la que SQLite realmente guardó los `mealLogs` de esa jornada — el reporte buscaría
una fila que no existe, o peor, la del día equivocado.

- Se define un único utilitario, `shared/utils/getLocalDateString.ts`, que arma `YYYY-MM-DD` a partir
  de `date.getFullYear()`, `date.getMonth()`, `date.getDate()` — los getters locales del objeto `Date`,
  nunca `toISOString()` ni ningún getter `UTC*`. Se usa en los tres lugares que necesitan resolver una
  fecha para este módulo: el cálculo de "ayer" al abrir el briefing, el `date` que se escribe al
  guardar un `mealLog`, y el `weekStartDate` de la lista de compras (§11).
- No se toca `useProfileStats.ts` como parte de esta fase — está fuera de alcance de un módulo de
  nutrición y el bug ahí es de bajo impacto — pero queda señalado acá para que si en algún momento se
  audita, no se copie el mismo patrón por costumbre.

### Generación y cacheo del reporte

- El texto de IA **no** se genera en background al momento de programar la notificación. Se genera
  la primera vez que se abre el detalle de ese día, y se cachea en `nutritionDayReports` (§3):
  `reportText` + `generatedAt` por fecha. Volver a abrir el mismo día no vuelve a llamar a Gemini.
- **Regla de invalidación única, sin excepciones**: si se edita, borra, o **agrega** un `mealLog` de
  una fecha cuyo reporte ya estaba cacheado — sin importar si el cambio pasa el mismo día o semanas
  después — ese reporte se invalida (se borra la fila de `nutritionDayReports`) y se regenera la
  próxima vez que se abra ese día. Si no, el texto podría hablar de macros que ya no son los reales.
  Agregar una comida vieja a una fecha pasada cae bajo la misma regla que editar o borrar — no es un
  caso aparte.

### Condición única: sin datos que respalden un número, no hay reporte de IA

Antes de generar texto con Gemini al abrir un día (sea por tap en la notificación diaria o de forma
manual desde el historial), se evalúa una única precondición, con dos causas posibles pero un solo
resultado:

- **Día sin `mealLog` registrado**: si la fecha no tiene ninguna comida guardada, no se genera reporte
  de IA — ni cuando se abre desde el tap de la notificación diaria, ni al abrir manualmente ese día
  desde el historial. Se muestra el estado vacío: *"Todavía no registraste comidas ayer"* (para el
  caso del briefing) o *"Todavía no registraste comidas este día"* (para cualquier otro día del
  historial que se abra vacío) — sin llamar a Gemini para nada. Es el mismo verbo y estructura que ya
  usan `reminders.tsx` ("No tienes recordatorios pendientes"), `history.tsx` ("Todavía no registraste
  ninguna sesión") y `routines.tsx` ("Todavía no tienes rutinas cargadas") — mismo patrón de copy que
  esas tres pantallas, para que quien lo implemente no invente un tono nuevo. (Nota: no hay componente
  `EmptyState` compartido en el repo — los cuatro casos son `<Text>` inline por pantalla, así que este
  va igual, sin necesidad de crear uno nuevo solo para esto.) Es también el mismo motivo que obliga al
  prompt en §10 a mencionar siempre un número concreto: con cero datos no hay número que mencionar, así
  que ni vale la pena intentar la llamada.
- **`nutritionProfile` sin configurar**: si todavía no se pasó por `nutrition-settings.tsx` (§7), no
  hay metas contra qué comparar los totales del día — mismo resultado: sin reporte de IA, se muestra
  solo el total crudo (kcal/macros) y un link directo a Ajustes de Nutrición.

Las dos causas convergen en el mismo chequeo (`¿hay mealLogs de ese día Y hay nutritionProfile
configurado?`) antes de decidir si vale la pena llamar a la IA — no son dos guards independientes que
alguien podría implementar de forma inconsistente entre la notificación y la apertura manual del día.

### Fallback si falla la llamada a la IA

- Al abrir el detalle de un día sin reporte cacheado *que sí cumple la condición de arriba*, si la
  llamada a Gemini falla (sin red, error de API): se muestran igual los números crudos — macros reales
  vs. meta, calculados localmente desde SQLite, sin depender de la IA para eso. Nunca se bloquea ver
  tus propios datos por un fallo externo.
- Un botón chico "Generar reporte" permite reintentar solo la parte de texto, sin recargar la pantalla
  completa ni perder lo que ya se está mostrando.

---

## 10. Prompt del Morning Briefing — plan de afinado

Este trabajo tiene su propio paso en el roadmap (§16, paso 8), separado de "conectar la IA" a secas —
si se cuela dentro de la integración general, el prompt se queda con el texto genérico de ejemplo y
nunca se reemplaza por algo con criterio propio.

1. **Definir criterios de tono explícitos dentro del prompt** — no dejarlo a que Gemini "decida":
   segunda persona directa; prohibido el lenguaje de coach genérico ("¡vas excelente, sigue así!");
   sin disclaimers tipo "consulta a un profesional"; límite duro de longitud (2-3 oraciones); y — el
   más importante para que no suene intercambiable — obligar a que mencione al menos un número o
   comida concreta del día, nunca una afirmación vaga sin dato real detrás.
2. **Banco de casos sintéticos**: armar 5-6 días de prueba a mano (déficit fuerte de carbos, superávit
   calórico, día perfecto, día con una sola comida registrada, día con macros al límite de la meta) y
   correr el prompt contra esos casos, ajustando el texto hasta que ninguna respuesta se sienta
   intercambiable con otra.
3. **Versionado como código, no como texto suelto**: aunque los datos (peso, metas, presupuesto) son
   dinámicos y vienen de `nutritionProfile` (§4), el texto de rol/tono/formato en `buildSystemPrompt.ts`
   sí es estático — se commitea como cualquier otro archivo, así los ajustes de tono quedan en el
   historial de git en vez de perderse en prueba y error dentro del chat.
4. **Orden**: este paso va *después* de tener capturas reales acumuladas, no antes. Sin datos reales de
   `mealLogs`, no hay contra qué validar si el tono funciona en la vida real — solo contra los casos
   sintéticos del punto 2, que sirven para arrancar pero no para dar el visto bueno final.

---

## 11. Lista de compras generativa

### Trigger: generación lazy, sin notificación

Mismo criterio que ya se resolvió para el reporte diario (§9): no hace falta un mecanismo de push para
esto. La lista se genera cuando el usuario abre la pantalla "Lista de compras" para la semana en curso
— no hay notificación local ni hook de `expo-notifications` nuevo para este caso. Simplifica el
mecanismo (nada que programar, cancelar ni reprogramar) y es consistente con que el usuario decide
cuándo quiere planificar sus compras, no la app.

### Cacheo por semana e invalidación

`shoppingLists` (§3) cachea por `weekStartDate` con su propio `generatedAt` — abrir la misma semana dos
veces no vuelve a llamar a Gemini, igual que `nutritionDayReports` para el briefing.

- **Misma regla de invalidación que §9, aplicada acá**: si se edita, borra o agrega un `mealLog` de una
  fecha dentro de una semana cuya lista ya estaba cacheada, esa lista se invalida (se borra la fila de
  `shoppingLists` de esa semana) y se regenera la próxima vez que se abra. Si no, la lista seguiría
  recomendando en base a déficits que ya no son los reales — el mismo problema que motivó la regla en
  §9, solo que a nivel semanal en vez de diario.

### Condición de cobertura: sin suficientes registros, no hay lista generada

Mismo criterio que §9 ("Condición única"), aplicado acá porque el problema de fondo es idéntico: no
generar un output confiado a partir de datos insuficientes. Con solo 2-3 comidas logueadas en toda la
semana (te olvidaste de registrar el resto, no que no comiste), el "déficit semanal" que se calcularía
estaría brutalmente inflado — la lista resultante recomendaría en base a un déficit que no es real,
solo incompleto.

- Antes de generar la lista, se evalúa si la semana tiene suficiente cobertura de registros — por
  ejemplo, al menos N días de los 7 con algún `mealLog` (no alcanza con "algún" registro suelto en
  toda la semana; el mínimo se calibra una vez que haya uso real, ver §10 sobre por qué el afinado va
  después de tener datos reales).
- Si no se cumple, no se genera lista para esa semana — no se llama a Gemini. Se muestra un estado
  indicando que faltaron registros esa semana para calcular algo confiable, con el mismo tono de copy
  que el resto de estados vacíos de la app (§9, "Condición única").

### Se genera a partir de

- Déficits acumulados de macros de la semana (`mealLogs` agrupado por semana) + presupuesto restante
  (`nutritionProfile.weeklyBudget` menos `estimatedTotal` de compras ya registradas, si las hubiera),
  en USD por ahora.
- Pantalla tipo checklist — reutiliza el patrón de fila flat + checkbox brutalista que ya existe en
  Ejecución (checkbox de set completado), no se inventa un nuevo estilo de check.

```
┌─────────────────────────────┐
│ ‹  Lista de compras — Sem 33 │
│  Presupuesto: $12 / $40      │  ← stat-row simple, vía formatCurrency
│ ┌──────────────────────────┐ │
│ │ ☐ 2 cubetas de huevo  $6   │
│ │ ☐ 1 lb pechuga pollo  $4   │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

### Fallback si falla la llamada a la IA

Mismo patrón que el fallback de §9, no se define distinto acá:

- Si la semana sí tiene cobertura suficiente pero la llamada a Gemini falla (sin red, error de API):
  se muestran igual los números crudos — déficits reales de macros y presupuesto restante, calculados
  localmente desde SQLite, sin depender de la IA para eso. Nunca se bloquea ver los propios datos por
  un fallo externo; lo único que falta es la traducción a lista de compras concreta.
- Un botón chico "Generar lista" permite reintentar solo la llamada a la IA, sin recargar la pantalla
  completa.

---

## 12. Correlación entrenamiento × nutrición ("Hermes") — Fase 2.5, opcional

Explícitamente **no es parte del MVP de esta fase**. Requiere volumen histórico real en ambas tablas
(`SetLog` y `mealLogs`) para que cualquier correlación sea algo más que ruido — antes de un par de
semanas de datos reales, cualquier "insight" generado sería tan inventado como fue la estimación de
kcal por rutina que decidiste postergar en Fase 1. Se retoma cuando haya al menos 2-3 semanas de
registro consistente. Cuando llegue: reporte quincenal, tratamiento visual de bento hero (como la
sesión más reciente de Historial), una sola llamada a la IA con datos agregados de ambas tablas, nunca
fotos ni logs crudos.

---

## 13. Componentes reutilizables nuevos (`/shared`)

| Componente | Props clave | Reutiliza de Fase 1 |
|---|---|---|
| `AppHeader` | título, avatarUri, hasReminderPending, onSettingsPress? | — (nuevo, mismo lenguaje visual) |
| `SettingsRow` | label, control (children), descripción opcional | Patrón ya existente en `profile.tsx`, ahora extraído |
| `MacroRing` | consumido, objetivo, segmentos (prot/carb/grasa) | Lógica SVG de `RestTimerRing` |
| `MealCard` | ícono/foto, nombre, kcal, hora | Mismo patrón flat que `SessionListItem` |
| `ConfidenceBadge` | porcentaje | Mismo tratamiento chico que `StreakBadge` |
| `ShoppingListItem` | nombre, cantidad, costo, checked | Checkbox brutalista de Ejecución |
| `MacroStepper` | valor, unidad, onIncrement/onDecrement | Igual a `SetStepper`, reetiquetado |

Ningún componente de Fase 2 introduce un color, sombra o radio nuevo — todo hereda de
`constants/theme.ts` tal cual está. `formatCurrency` (§3) y `getLocalDateString` (§9) viven en
`shared/utils/`, no en `/components` — son funciones puras, no piezas de UI.

---

## 14. Seguridad y manejo de la API key

- La key de Gemini se guarda con `expo-secure-store`, nunca hardcodeada en el bundle ni en `app.json`.
- Uso 100% personal (un solo usuario, tu propio build) — aceptable llamar directo desde el cliente sin
  backend intermedio. Si en algún momento distribuís el APK a terceros, ahí sí haría falta un proxy
  para no compartir tu key — no es necesario ahora, lo dejo anotado para cuando aplique.
- Las fotos de comida se guardan localmente (mismo mecanismo de `persistAvatar` ya usado en Perfil,
  copiando a `Paths.document`); nunca se suben a ningún lado salvo el payload Base64 de la llamada
  puntual a Gemini.

---

## 15. Presupuesto de llamadas a la API (referencia)

| Momento | Llamadas |
|---|---|
| Desayuno / Almuerzo / Cena / Snack | 1 c/u (foto → macros) |
| Morning briefing (día siguiente) | 1 (resumen agregado → reporte) |
| Lista de compras (semanal) | 1 — solo si pasa el chequeo de cobertura de §11 |
| **Total típico diario** | **4–5** |

Muy por debajo de los límites del tier gratuito de Gemini — no es un problema de costo/escala para uso
personal.

---

## 16. Orden de implementación sugerido

Un branch por pieza, mismo flujo que ya usás (`tsc --noEmit` + `eslint` antes de mergear cada una):

1. **Routing**: mover `profile.tsx` fuera de tabs, crear `AppHeader` (con soporte de `onSettingsPress`),
   agregar tab `Nutrición` vacío con ícono `Salad`, crear ruta vacía `nutrition-settings.tsx`.
   Mecánico, no depende de nada más — conviene ir primero.
2. **Modelo de datos**: migraciones Drizzle para `nutritionProfile`, `mealLogs`, `shoppingLists`,
   `nutritionDayReports`; `formatCurrency`, `resolveWeightUnit` y `getLocalDateString` (§9) como
   utilidades desde el día uno — esta última la necesita ya el paso 5 para escribir `mealLogs.date`
   en zona horaria local, no solo el briefing más adelante.
3. **Ajustes de Nutrición**: pantalla completa de §7 (perfil físico, macros, presupuesto, restricciones,
   unidad). Se extrae `SettingsRow` compartido reutilizando lo que ya existe en `profile.tsx`.
4. **Perfil recortado**: confirmar que `profile.tsx` solo retiene identidad + ajustes globales (§8) —
   si quedó algo de nutrición mezclado, se termina de mover acá.
5. **Captura de comida**: cámara → Gemini → confirmación → guardado (§5). La pieza más grande.
6. **Dashboard de Nutrición**: consume `mealLogs` ya existentes de los pasos anteriores.
7. **Morning briefing**: mecánica base de §9. Se hace en este orden:
   - (a) crear `useMorningBriefingNotification` con trigger `DAILY` (permisos/canal reutilizando el
     patrón ya resuelto en `useRestTimer.ts`).
   - (b) conectarlo al guardar `briefingHour`/`briefingMinute` en Perfil — cancelar + reprogramar (§8).
   - (c) `Notifications.useLastNotificationResponse()` en `app/_layout.tsx` para capturar el tap y
     navegar a `nutrition-day/[date]` con la fecha resuelta vía `getLocalDateString` (paso 2) — sin
     esto, el trigger dispara la notificación pero tocarla no lleva a ningún lado.
   - (d) implementar el cálculo de "ayer" en el handler de apertura del deep link (`nutrition-day/[date].tsx`),
     más cacheo en `nutritionDayReports`, invalidación y fallback.
   - (e) copy de estado vacío ("Todavía no registraste comidas ayer/este día", ver §9).
   Prompt genérico funcional al cierre de este paso, todavía sin afinar.
8. **Pulir y testear el prompt del briefing** (§10): recién acá, con varios días de `mealLogs` reales
   ya acumulados de usar la app — no antes.
9. **Lista de compras**: depende de 5-6 estar mergeados y con datos reales acumulados. Incluye el
   chequeo de cobertura y el fallback de §11 desde el arranque — no como algo a agregar después.
10. *(Fase 2.5, más adelante)* Correlación con entrenamiento — no antes de 2-3 semanas de datos reales.
