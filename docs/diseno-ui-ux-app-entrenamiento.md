# Diseño UI/UX — App de Entrenamiento Personal

> Nombre provisional: **TrainLog** (cámbialo cuando tengas el nombre final; se usa solo como referencia en este documento).

Este documento traduce el estilo visual de las imágenes de referencia (app de fitness, tema oscuro, acentos amarillos) a la app que estás construyendo: rutinas → ejecución con timer → historial, sobre el modelo de datos `Routine / Exercise / RoutineExercise / WorkoutSession / SetLog`.

---

## 1. Concepto y objetivo de la interfaz

- App **personal**, uso principalmente en el gym: pantallas grandes, botones táctiles amplios, poco texto, alto contraste para leerse bajo luz dura de gimnasio.
- El flujo central es siempre el mismo: **elegir rutina → ejecutar (con timer) → quedar registrado en historial**. Todo el diseño debe empujar hacia ese flujo en máximo 2 taps desde el Home.
- Mientras entrenás no tenés que escribir mucho: prioridad a steppers (+/-), chips y sliders sobre teclado numérico.

---

## 2. Estilo visual (derivado de las imágenes de referencia)

### 2.1 Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `bg-base` | `#0E0E12` | Fondo principal de pantalla |
| `bg-surface` | `#1A1A20` | Cards, inputs, bottom nav |
| `bg-surface-alt` | `#22222A` | Cards secundarias / chips no seleccionados |
| `accent` | `#F5C518` (amarillo) | CTA primario, tab activo, progreso, destacados |
| `accent-pressed` | `#D9AE0E` | Estado presionado del accent |
| `text-primary` | `#FFFFFF` | Títulos, valores numéricos (peso, reps) |
| `text-secondary` | `#9B9BA5` | Subtítulos, metadata (kcal, min, fecha) |
| `text-on-accent` | `#0E0E12` | Texto sobre fondo amarillo |
| `success` | `#4ADE80` | Set completado, racha activa |
| `danger` | `#F26D6D` | Eliminar, deshacer set |
| `border-subtle` | `#2A2A32` | Separadores, bordes de card |

Regla general: **el amarillo se reserva para acción/progreso**, nunca como color decorativo de fondo. Todo lo demás vive en escalas de gris-carbón.

### 2.2 Tipografía

- Familia: sans-serif redondeada (ej. `Inter` o `Manrope`, ambas gratuitas y disponibles vía `expo-google-fonts`).
- Escala:
  - Título de pantalla: 22–24px / Bold
  - Título de card (rutina/ejercicio): 16–18px / SemiBold
  - Valor numérico grande (peso, reps, timer): 32–40px / Bold, tabular numbers
  - Body / metadata: 13–14px / Regular, color `text-secondary`
  - Labels de chips/tabs: 13px / Medium

### 2.3 Formas y elevación

- Radio de esquina: `16px` en cards grandes, `12px` en chips/inputs, `24px+` (pill) en botones primarios y tabs de filtro.
- Sin sombras duras (fondo ya es oscuro): usar un borde sutil `border-subtle` de 1px en vez de `box-shadow` para separar cards del fondo.
- Bottom nav flotante, no pegado a los bordes: separación de 16px a cada lado, altura ~64px, ícono activo dentro de una "pill" amarilla (igual que en la referencia).

### 2.4 Iconografía y bottom nav

Adaptando los 5 íconos de la referencia a tu dominio:

| Ícono referencia | Reinterpretado como | Pantalla |
|---|---|---|
| Home | Home | Dashboard |
| Bandera/marcador | Rutinas | Lista de rutinas |
| Reloj | Historial | Progreso / sesiones pasadas |
| Lupa | Ejercicios | Buscador de ejercicios/catálogo |
| Perfil | Perfil | Ajustes y stats generales |

---

## 3. Arquitectura de navegación

```
Bottom Tabs
├── Home            (dashboard)
├── Rutinas         (lista + detalle + ejecución)
├── Historial       (sesiones pasadas + detalle por ejercicio)
├── Ejercicios       (catálogo/buscador, para armar rutinas)
└── Perfil          (stats, ajustes)
```

La **ejecución de rutina** (con timer) no es un tab: se abre en modo "focus" (stack, sin bottom nav visible) desde el botón "Start Now" de una rutina, para que no haya distracción mientras entrenás.

---

## 4. Pantallas

### 4.1 Home / Dashboard
*(equivalente directo a la Imagen 1)*

```
┌─────────────────────────────┐
│ 👤 Hola, [Nombre]        🔔 │
│    Buen día                 │
│                              │
│ 🔍 Buscar ejercicio o rutina│
│                              │
│ Rutina destacada      Ver todas
│ ┌──────────────────────────┐ │
│ │ Torso superior            │ │
│ │ 5 sem · 4x/sem            │ │
│ │ [ Empezar ]  (amarillo)   │ │
│ └──────────────────────────┘ │
│                              │
│ Mis rutinas          Ver todas
│ (Todas)(Empuje)(Tirón)(Pierna)│
│ ┌───────────┐ ┌───────────┐  │
│ │ Piernas   │ │ Torso     │  │
│ │ 320 kcal  │ │ 410 kcal  │  │
│ │ 45 min    │ │ 50 min    │  │
│ └───────────┘ └───────────┘  │
│                              │
│ [🏠][🏳️][⏱️][🔍][👤]        │
└─────────────────────────────┘
```

- **Rutina destacada**: la última usada o la programada para hoy según `dayOfWeek` de `Routine`.
- Chips de filtro (`Todas / Empuje / Tirón / Pierna...`) filtran por `muscleGroup` agregado de los ejercicios de la rutina.
- Cards de rutina muestran kcal estimadas y duración estimada (derivadas de `RoutineExercise.targetSets` × tiempos promedio, no hace falta que el usuario las ingrese a mano).

### 4.2 Lista de rutinas

- Igual estructura de chips de filtro que el Home, pero es la vista completa (`Ver todas`).
- Cada card: nombre, día(s) asignado(s), número de ejercicios, botón secundario "Ver" + botón primario "Empezar".
- Botón flotante `+ Nueva rutina` (amarillo, esquina inferior derecha, sobre el bottom nav).

### 4.3 Detalle de rutina (antes de empezar)

```
┌─────────────────────────────┐
│ ‹  Torso superior       ⋮   │
│                              │
│ 5 semanas · 4x/semana        │
│                              │
│ Ejercicios (6)                │
│ ┌──────────────────────────┐ │
│ │ 1  Press banca            │ │
│ │    4 sets · 8-10 reps      │ │
│ ├──────────────────────────┤ │
│ │ 2  Remo con barra          │ │
│ │    4 sets · 10-12 reps     │ │
│ └──────────────────────────┘ │
│         ...                  │
│                              │
│        [ Empezar rutina ]    │
└─────────────────────────────┘
```

- Lista ordenada por `RoutineExercise.order`.
- Cada fila es editable (tap → editar sets/reps/descanso) fuera de una sesión activa; dentro de una sesión activa esta pantalla no se usa.

### 4.4 Ejecución de rutina (modo focus, con timer)

Pantalla más importante de la app — es donde vivís mientras entrenás.

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
│   │  peso │   │ reps  │      │
│   └───────┘   └───────┘      │
│    [ - ]  [ + ]  [ - ] [ + ] │
│                              │
│      [ ✓ Marcar set ]        │
│                              │
│   Sets previos: ● ● ○ ○      │
│                              │
│   [ Siguiente ejercicio → ]  │
└─────────────────────────────┘
```

Al marcar un set completado (crea un `SetLog`), aparece automáticamente el **modal/pantalla de descanso**:

```
┌─────────────────────────────┐
│      Descanso                │
│                              │
│        ⬤  01:32              │
│     (anillo circular         │
│      amarillo de progreso)   │
│                              │
│   [ -15s ]        [ +15s ]   │
│                              │
│        [ Saltar descanso ]   │
└─────────────────────────────┘
```

- El timer usa `restSeconds` de `RoutineExercise` como default, editable con +/-15s.
- Notificación local (`expo-notifications`) dispara aunque la pantalla esté apagada, para que puedas guardar el celular.
- Al terminar los sets de un ejercicio, transición automática al siguiente (`order + 1`); al terminar el último, pantalla de resumen de sesión.

### 4.5 Resumen de sesión (fin de entrenamiento)

```
┌─────────────────────────────┐
│      ¡Sesión completada! 🎉  │
│                              │
│   Torso superior              │
│   52 min · 6 ejercicios       │
│   24 sets · 3,240 kg totales  │
│                              │
│   Nota de la sesión           │
│   ┌──────────────────────┐   │
│   │ (opcional, texto libre)│   │
│   └──────────────────────┘   │
│                              │
│        [ Guardar ]           │
└─────────────────────────────┘
```

- Guarda/cierra el `WorkoutSession` con `notes` opcional.
- Los "3,240 kg totales" son volumen calculado (Σ peso×reps de los `SetLog` de esa sesión) — dato derivado, no se pide al usuario.

### 4.6 Historial / Progreso
*(equivalente a la pantalla de búsqueda/detalle de la Imagen 2, reinterpretada)*

```
┌─────────────────────────────┐
│ ‹  Historial                 │
│                              │
│ (Todas)(Semana)(Mes)(Año)    │
│                              │
│ Sesiones recientes             │
│ ┌──────────────────────────┐ │
│ │ Torso superior             │
│ │ Lun 28 jul · 52 min        │
│ │ 24 sets · 3,240 kg          │
│ ├──────────────────────────┤ │
│ │ Piernas                    │
│ │ Sáb 26 jul · 45 min         │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

Tap en una sesión → detalle con todos los `SetLog` de esa sesión, agrupados por ejercicio (peso × reps por set, igual a como quedaron guardados).

### 4.7 Detalle de ejercicio (progreso individual)

```
┌─────────────────────────────┐
│ ‹  Press banca                │
│                              │
│   [ gráfica de volumen ]      │  ← Fase 2 (victory-native)
│   (peso máximo por sesión)    │
│                              │
│ Historial de sets              │
│ ┌──────────────────────────┐ │
│ │ 28 jul  60kg×10  62kg×8    │
│ │ 24 jul  58kg×10  60kg×8    │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

Esta pantalla es la que justifica tener `SetLog` normalizado por ejercicio: te deja ver progresión de un movimiento específico sin importar en qué rutina estaba.

### 4.8 Perfil

- Foto/avatar, nombre, racha de días entrenados, total de sesiones.
- Ajustes: unidades (kg/lb), sonido/vibración del timer, notificaciones.
- Punto de entrada natural para, en Fase 2, el login/sync con backend (`User`).

---

## 5. Componentes reutilizables (`/shared`)

| Componente | Props clave | Dónde se usa |
|---|---|---|
| `RoutineCard` | nombre, meta (semanas/frecuencia o kcal/min), variante destacada vs. grid | Home, Lista de rutinas |
| `ExerciseRow` | orden, nombre, sets×reps objetivo, estado (pendiente/hecho) | Detalle de rutina, Ejecución |
| `SetStepper` | valor, unidad, onIncrement/onDecrement | Ejecución de rutina |
| `RestTimerRing` | segundos totales, segundos restantes, onSkip | Modal de descanso |
| `FilterChipGroup` | opciones, seleccionado | Home, Lista de rutinas, Historial |
| `SessionSummaryStat` | label, valor, ícono | Resumen de sesión, Perfil |
| `BottomNav` | tab activo | Global (fuera del modo focus) |

Construir estos primero como componentes "tontos" (solo props, sin lógica de datos) — así el `/features` los reutiliza libremente y quedan fáciles de testear.

---

## 6. Micro-interacciones clave

- **Marcar set completado**: el botón cambia de amarillo a un check verde (`success`) con una animación corta de escala; dispara el timer de descanso automáticamente.
- **Timer de descanso llegando a 0**: vibración + notificación, el anillo circular pasa de amarillo a blanco por un instante antes de cerrar el modal.
- **Racha en Home**: si hay `WorkoutSession` en días consecutivos, mostrar un pequeño indicador de racha (🔥 N días) junto al saludo — refuerza el hábito sin ser intrusivo.
- **Estados vacíos**: "Lista de rutinas" vacía → ilustración simple + CTA "Crear tu primera rutina"; "Historial" vacío → "Todavía no registraste ninguna sesión".

---

## 7. Flujo principal de usuario

```
Home
 └─ tap "Empezar" en rutina destacada
     └─ Ejecución de rutina (modo focus)
         ├─ completar set → Timer de descanso → siguiente set
         ├─ terminar ejercicio → siguiente ejercicio
         └─ terminar rutina → Resumen de sesión → Guardar
             └─ vuelve a Home (racha actualizada)
```

Camino alternativo: **Rutinas → Detalle → Empezar rutina** (mismo destino que el botón del Home, para cuando no es la rutina destacada).

---

## 8. Próximos pasos de diseño

1. Maquetar estas 4 pantallas críticas primero en Figma o directo en código: Home, Detalle de rutina, Ejecución + Timer, Resumen de sesión — son las que definen el 90% de la experiencia.
2. Definir el set de íconos real (ej. `lucide-react-native`, que combina bien con este estilo).
3. Cuando llegue la Fase 2 (gráficas), usar el mismo `accent` amarillo para la línea/área principal del gráfico, y `text-secondary` para ejes — mantiene consistencia con el resto de la UI.
