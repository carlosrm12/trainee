# Diseño UI/UX — App de Entrenamiento Personal

> Nombre provisional: **TrainLog** (cámbialo cuando tengas el nombre final; se usa solo como referencia en este documento).

Este documento traduce el estilo visual definido para la app (rutinas → ejecución con timer → historial) a un sistema de diseño concreto, sobre el modelo de datos `Routine / Exercise / RoutineExercise / WorkoutSession / SetLog`.

---

## 1. Concepto y objetivo de la interfaz

- App **personal**, uso principalmente en el gym: pantallas grandes, botones táctiles amplios, poco texto, alto contraste para leerse bajo luz dura de gimnasio.
- El flujo central es siempre el mismo: **elegir rutina → ejecutar (con timer) → quedar registrado en historial**. Todo el diseño debe empujar hacia ese flujo en máximo 2 taps desde el Home.
- Mientras entrenás no tenés que escribir mucho: prioridad a steppers (+/-), chips y sliders sobre teclado numérico.

---

## 2. Patrón de diseño

No es un solo patrón — es una combinación de capas, cada una resolviendo un problema distinto:

| Capa | Qué aporta | Dónde se usa |
|---|---|---|
| **Base: Dark Flat minimal** | Cards planas, `border-subtle` de 1px en vez de sombras, un solo color de acento, tipografía tabular grande. Es lo más legible bajo luz de gym y lo más barato de renderizar en RN (sin blur, sin glass). | Toda la app — fondo de pantallas, cards de contenido, inputs. |
| **Organización: Bento selectivo** | Grid de tamaños variados **solo donde la jerarquía real lo justifica** (ej. la sesión más reciente en Historial). Si todos los elementos pesan lo mismo (una lista de rutinas, sets de un ejercicio), se queda en grid/lista uniforme — forzar bento ahí genera ruido visual sin aportar información. | Historial (sesión más reciente destacada). Home NO lleva bento de racha — ver nota abajo. |
| **Acentos: Neo-brutalismo en CTAs y estados activos** | Borde duro (`2px` oscuro) + sombra offset (`3px 3px 0`) sin gradientes, solo en botones de acción principal y estados activos (tab activo, "Empezar rutina/set"). Le da energía de "app de gym" sin comprometer legibilidad, porque queda acotado a 2-3 elementos por pantalla. | Botón "Empezar rutina", FAB "+ Nueva rutina", checkbox de set completado, pill del tab activo en el bottom nav. |
| **Chips outline** | Filtros con borde y texto en `accent`, fondo transparente (no relleno) — más sutil que un chip sólido y deja el amarillo relleno exclusivo para los CTAs. | Filtros de Home, Rutinas, Historial. |
| **Stat-row segmentado** | En vez de 3 cards separadas para métricas relacionadas (tiempo/kcal/sets), una sola card con columnas divididas por una línea vertical de 1px. Condensa información sin multiplicar componentes. | Card de rutina destacada (Home), sesión más reciente (Historial). |

> **Nota sobre la racha**: en la primera iteración se probó un tile de bento grande solo para la racha en el Home, pero no se justificaba (un dato chico ocupando un espacio grande). Se resolvió como *badge chico junto al saludo* (🔥 N días), como ya estaba definido en la sección de micro-interacciones — el bento se reserva para casos donde el tamaño extra realmente comunica jerarquía.

Resumen en una frase: **estructura Material (accesibilidad + elevación por capas) + Bento (solo para jerarquía real) + Neo-brutalismo (CTAs y estados activos) + chips outline — todo sobre una base Dark Flat.**

---

## 3. Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `bg-base` | `#0E0E12` | Fondo principal de pantalla |
| `bg-surface` | `#1A1A20` | Cards, inputs, bottom nav |
| `bg-surface-alt` | `#22222A` | Cards secundarias / badges / iconos en contenedor |
| `accent` | `#F5C518` (amarillo) | CTA primario, tab activo, progreso, destacados |
| `accent-pressed` | `#D9AE0E` | Sombra offset del accent (brutalismo), estado presionado |
| `text-primary` | `#FFFFFF` | Títulos, valores numéricos (peso, reps) |
| `text-secondary` | `#9B9BA5` | Subtítulos, metadata (kcal, min, fecha) |
| `text-on-accent` | `#0E0E12` | Texto sobre fondo amarillo |
| `text-on-accent-muted` | `#412402` | Texto secundario sobre fondo amarillo (ej. label de badges) |
| `success` | `#4ADE80` | Set completado, racha activa |
| `danger` | `#F26D6D` | Eliminar, deshacer set |
| `border-subtle` | `#2A2A32` | Separadores, bordes de card, divisores internos del stat-row |

Regla general: **el amarillo se reserva para acción/progreso/estado activo**, nunca como color decorativo de fondo. Todo lo demás vive en escalas de gris-carbón.

---

## 4. Tipografía

- Familia: sans-serif redondeada (ej. `Inter` o `Manrope`, ambas gratuitas y disponibles vía `expo-google-fonts`).
- Escala:
  - Título de pantalla: 18–22px / Medium-SemiBold
  - Título de card (rutina/ejercicio/sesión): 15–16px / Medium
  - Valor numérico grande (peso, reps, timer, kg totales): 28–40px / SemiBold, tabular numbers
  - Body / metadata: 11–13px / Regular, color `text-secondary`
  - Labels de chips/tabs/badges: 9–11px / Medium-SemiBold

---

## 5. Formas y elevación

- Radio de esquina: `16-18px` en cards grandes, `10-12px` en chips/inputs/botones secundarios, `20px+` (pill) en chips de filtro.
- Sin sombras duras en superficies de contenido (fondo ya es oscuro): borde sutil `border-subtle` de 1px en vez de `box-shadow`.
- **Excepción intencional**: los CTAs primarios y el FAB sí llevan sombra — pero offset y dura (`3px 3px 0 accent-pressed`), no difusa. Esa dureza es lo que comunica "esto es una acción", contrastando con el resto de la UI que es plana.
- **Bottom nav attached**: pegado a los bordes laterales y al borde inferior de la pantalla (no flotante), esquinas redondeadas solo arriba (`24px 24px 0 0`), fondo `bg-base` con `border-top` sutil. El tab activo es una pill amarilla ancha (ícono + label juntos, texto en `text-on-accent`); los tabs inactivos muestran ícono en blanco + label en `text-secondary` debajo. Barra de gesto (`110×4px`, blanco, esquinas redondeadas) al pie, estilo iOS home indicator.
  - *Decisión tomada tras comparar con alternativa flotante/detached (estilo Samsung One UI 8.5)*: se descartó porque reduce área táctil y no resuelve ningún problema real en una app de un solo propósito — el patrón attached da más superficie de toque, más práctico con manos sudadas en el gym.

---

## 6. Arquitectura de navegación

```
Bottom Tabs (attached, con labels siempre visibles)
├── Home            (dashboard)
├── Rutinas         (lista + detalle + ejecución)
├── Historial       (sesiones pasadas + detalle por ejercicio)
├── Buscar          (catálogo/buscador de ejercicios, para armar rutinas)
└── Perfil          (stats, ajustes)
```

La **ejecución de rutina** (con timer) no es un tab: se abre en modo "focus" (stack, sin bottom nav visible) desde el botón "Empezar" de una rutina, para que no haya distracción mientras entrenás.

---

## 7. Pantallas

### 7.1 Home / Dashboard

```
┌─────────────────────────────┐
│ Hola, [Nombre]  🔥4      🔔 │
│                              │
│ 🔍 Buscar ejercicio, rutina  │
│    o historial               │
│                              │
│ Rutina destacada (para hoy) │
│ ┌──────────────────────────┐ │
│ │ Torso superior (Hipertrofia)│
│ │ 5 sem · 4x/sem              │
│ │  52 min │ 410 kcal │ 6 ejer.│  ← stat-row segmentado
│ │  [ EMPEZAR RUTINA ]         │  ← brutalista (borde+sombra)
│ └──────────────────────────┘ │
│                              │
│ Tus rutinas          Ver todas
│ (Todas)(Empuje)(Tirón)        │  ← chips outline
│ ┌───────────┐ ┌───────────┐  │
│ │ Piernas   │ │ Tirón/    │  │  ← grid uniforme, SIN bento
│ │ 45 min    │ │ espalda   │  │     (no hay jerarquía real
│ │ 320 kcal  │ │ 50 min    │  │      entre estas dos)
│ └───────────┘ └───────────┘  │
│                              │
│ [Home][Rutinas][Historial]…  │  ← nav attached, labels visibles
└─────────────────────────────┘
```

- **Racha**: badge chico con borde `accent` (🔥 N) junto al saludo — nunca un tile grande.
- **Rutina destacada**: la última usada o la programada para hoy según `dayOfWeek` de `Routine`.
- Chips de filtro filtran por `muscleGroup` agregado de los ejercicios de la rutina.
- Cards de rutina muestran kcal y duración estimadas (derivadas de `RoutineExercise.targetSets` × tiempos promedio, no se ingresan a mano).

### 7.2 Lista de rutinas

```
┌─────────────────────────────┐
│ Rutinas                  ⋮  │
│ (Todas)(Empuje)(Tirón)(Pierna)│
│                              │
│ ┌──────────────────────────┐ │
│ │ Torso superior       HOY  │ │
│ │ Lun·Mié·Vie·Sáb·6 ejerc.  │ │
│ │  [ Ver ]  [ EMPEZAR ]     │ │
│ ├──────────────────────────┤ │
│ │ Piernas                    │
│ │ Mar·Vie·8 ejercicios        │
│ │  [ Ver ]  [ EMPEZAR ]     │ │
│ └──────────────────────────┘ │
│                       [ + ]  │  ← FAB brutalista
│ [Home][Rutinas][Historial]…  │
└─────────────────────────────┘
```

- Lista uniforme (sin bento): cada card pesa lo mismo — nombre, días asignados, cantidad de ejercicios, dos botones.
- Botón "Ver" (secundario) queda flat sin acento; "EMPEZAR" (primario) lleva el tratamiento brutalista completo — así el ojo va directo a la acción principal.
- Badge "HOY" con el mismo tratamiento visual que en Historial, para la rutina programada para el día actual.
- FAB `+ Nueva rutina` flotante, brutalista, sobre el bottom nav (no lo tapa).

### 7.3 Detalle de rutina (antes de empezar)

```
┌─────────────────────────────┐
│ ‹  Torso superior       ⋮   │
│                              │
│ 5 semanas · 4x/semana        │
│                              │
│ Ejercicios (6)                │
│ ┌──────────────────────────┐ │
│ │ 1  Press banca             │
│ │    4 sets · 8-10 reps       │
│ ├──────────────────────────┤ │
│ │ 2  Remo con barra           │
│ │    4 sets · 10-12 reps      │
│ └──────────────────────────┘ │
│         ...                  │
│        [ EMPEZAR RUTINA ]    │  ← brutalista
└─────────────────────────────┘
```

- Lista ordenada por `RoutineExercise.order`, filas flat sin bento (mismo peso de información en cada una).
- Cada fila es editable (tap → editar sets/reps/descanso) fuera de una sesión activa.

### 7.4 Ejecución de rutina (modo focus, con timer)

Pantalla más importante de la app — modo focus, sin bottom nav.

```
┌─────────────────────────────┐
│ ✕     Ejercicio 2 de 6   ⋮   │
│                              │
│      Remo con barra          │
│      grupo: Espalda          │
│                              │
│   Set 1 de 4                 │
│   ┌───────┐   ┌───────┐      │
│   │ 60 kg │   │  10   │      │
│   └───────┘   └───────┘      │
│    [ - ]  [ + ]  [ - ] [ + ] │
│                              │
│    [ ✓ MARCAR SET ]          │  ← brutalista, pasa a verde
│                              │      (success) al completar
│   Sets previos: ● ● ○ ○      │
└─────────────────────────────┘
```

Al marcar un set (crea `SetLog`), aparece el modal de descanso:

```
┌─────────────────────────────┐
│      Descanso                │
│        ⬤  01:32              │
│   [ -15s ]        [ +15s ]   │
│        [ Saltar descanso ]   │
└─────────────────────────────┘
```

- El botón "Marcar set" es el ejemplo más claro del acento brutalista: borde duro + sombra, y al completarse cambia a `success` con una animación corta de escala.
- El timer usa `restSeconds` de `RoutineExercise` como default, editable con +/-15s.
- Notificación local (`expo-notifications`) dispara aunque la pantalla esté apagada.
- Al terminar los sets de un ejercicio, transición automática al siguiente; al terminar el último, pantalla de resumen de sesión.

### 7.5 Resumen de sesión (fin de entrenamiento)

```
┌─────────────────────────────┐
│      ¡Sesión completada! 🎉  │
│   Torso superior              │
│   52 min · 6 ejercicios       │
│    24 sets │ 3,240 kg totales │  ← stat-row segmentado
│   [ nota opcional ]           │
│        [ GUARDAR ]           │  ← brutalista
└─────────────────────────────┘
```

- Guarda/cierra el `WorkoutSession` con `notes` opcional.
- "3,240 kg totales" es volumen calculado (Σ peso×reps de los `SetLog`) — dato derivado, no se pide al usuario.

### 7.6 Historial / Progreso

```
┌─────────────────────────────┐
│ ‹  Historial                 │
│ (Todas)(Semana)(Mes)(Año)    │  ← chips outline
│                              │
│ Sesión más reciente           │
│ ┌──────────────────────────┐ │
│ │ Torso superior       HOY  │ │
│ │  52 min │ 24 sets │3,240kg│ │  ← ÚNICO bento hero real:
│ └──────────────────────────┘ │     stat-row destacado
│                              │
│ Sesiones anteriores           │
│ ┌──────────────────────────┐ │
│ │ 🏋 Piernas   45min·320kcal│ │  ← filas uniformes, flat
│ │ 🏋 Empuje    50min·380kcal│ │
│ └──────────────────────────┘ │
│ [Home][Rutinas][Historial]…  │
└─────────────────────────────┘
```

- Solo la sesión más reciente lleva el tratamiento destacado (stat-row) — es el único dato de esta pantalla donde el tamaño extra comunica jerarquía real ("esto es lo último que hiciste"). El resto son filas compactas.
- Tap en una sesión → detalle con todos los `SetLog` agrupados por ejercicio.

### 7.7 Detalle de ejercicio (progreso individual)

```
┌─────────────────────────────┐
│ ‹  Press banca                │
│   [ gráfica de volumen ]      │  ← Fase 2 (victory-native)
│ Historial de sets              │
│ ┌──────────────────────────┐ │
│ │ 28 jul  60kg×10  62kg×8    │
│ │ 24 jul  58kg×10  60kg×8    │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

Justifica tener `SetLog` normalizado por ejercicio: progresión de un movimiento sin importar en qué rutina estaba.

### 7.8 Perfil

- Foto/avatar, nombre, racha de días entrenados, total de sesiones — mismos badges/stat-rows que el resto de la app, sin componentes nuevos.
- Ajustes: unidades (kg/lb), sonido/vibración del timer, notificaciones.
- Punto de entrada natural para, en Fase 2, el login/sync con backend (`User`).

---

## 8. Componentes reutilizables (`/shared`)

| Componente | Props clave | Dónde se usa |
|---|---|---|
| `RoutineCard` | nombre, meta (días/ejercicios o kcal/min), variante grid vs. lista | Home, Lista de rutinas |
| `StatRow` | array de `{icono, valor, label}`, divisores internos | Card destacada (Home), sesión más reciente (Historial), resumen de sesión |
| `BrutalistButton` | label, variante (primario/FAB), estado (default/success) | Empezar rutina, Marcar set, Guardar, FAB nueva rutina |
| `FilterChipOutline` | opciones, seleccionado (borde+texto accent vs. gris) | Home, Rutinas, Historial |
| `StreakBadge` | número de días | Header de Home, Perfil |
| `ExerciseRow` | orden, nombre, sets×reps objetivo, estado | Detalle de rutina, Ejecución |
| `SetStepper` | valor, unidad, onIncrement/onDecrement | Ejecución de rutina |
| `RestTimerRing` | segundos totales, restantes, onSkip | Modal de descanso |
| `SessionListItem` | nombre, fecha, duración, kcal, ícono | Historial (sesiones anteriores) |
| `AttachedBottomNav` | tab activo, labels siempre visibles | Global (fuera del modo focus) |

Construir estos primero como componentes "tontos" (solo props, sin lógica de datos) para que `/features` los reutilice libremente y queden fáciles de testear.

---

## 9. Micro-interacciones clave

- **Marcar set completado**: el botón cambia de amarillo (brutalista) a un check verde (`success`) con animación corta de escala; dispara el timer de descanso automáticamente.
- **Timer de descanso llegando a 0**: vibración + notificación, el anillo circular pasa de amarillo a blanco por un instante antes de cerrar el modal.
- **Racha en Home**: badge chico (🔥 N días) junto al saludo — refuerza el hábito sin ser intrusivo. Nunca un tile grande de bento; el tamaño no debe superar al del propio saludo.
- **Estados vacíos**: "Rutinas" vacía → ilustración simple + CTA "Crear tu primera rutina"; "Historial" vacío → "Todavía no registraste ninguna sesión".

---

## 10. Flujo principal de usuario

```
Home
 └─ tap "Empezar rutina" en rutina destacada
     └─ Ejecución de rutina (modo focus)
         ├─ completar set → Timer de descanso → siguiente set
         ├─ terminar ejercicio → siguiente ejercicio
         └─ terminar rutina → Resumen de sesión → Guardar
             └─ vuelve a Home (racha actualizada)
```

Camino alternativo: **Rutinas → Detalle → Empezar rutina** (mismo destino que el botón del Home, para cuando no es la rutina destacada).

---

## 11. Próximos pasos de diseño

1. Maquetar en código las 4 pantallas críticas primero: Home, Rutinas (lista), Ejecución + Timer, Historial — ya definidas en este documento con el sistema completo.
2. Definir el set de íconos real (`lucide-react-native` o Tabler Icons, ambos combinan bien con este estilo).
3. Construir `StatRow`, `BrutalistButton` y `FilterChipOutline` primero — son los tres componentes que se repiten en más pantallas.
4. Cuando llegue la Fase 2 (gráficas), usar el mismo `accent` amarillo para la línea/área principal del gráfico, y `text-secondary` para ejes — mantiene consistencia con el resto de la UI.
