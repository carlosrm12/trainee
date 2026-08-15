# Animaciones y Micro-interacciones — App de Entrenamiento Personal

> Siguiente paso tras `diseno-ui-ux-app-entrenamiento.md`. Este documento traduce el sistema de diseño (Dark Flat minimal + Neo-brutalismo en CTAs + Bento selectivo) a un sistema de **movimiento** concreto, componente por componente, con la librería exacta de React Native/Expo a usar en cada caso.

---

## 1. Principio rector

El sistema visual ya distingue entre elementos **silenciosos** (cards flat, listas, base dark) y elementos **de acento** (CTAs brutalistas, estados activos). La animación debe reforzar esa misma jerarquía, no aplanarla:

- **Elementos de acento (brutalistas)** → movimiento con **física de resorte** (`withSpring`), rebote perceptible. Comunican "esto es sólido, esto es una acción".
- **Elementos base (flat)** → movimiento con **timing suave** (`withTiming`, ease-out), discreto, casi imperceptible. Comunican continuidad, no interrumpen.

Este contraste (rebote duro vs. transición suave) es el hilo conductor de todo lo que sigue.

**Regla de performance**: todas las animaciones usan `transform` + `opacity` (correr en el UI thread vía Reanimated, 60fps aunque el JS thread esté ocupado). Nada de blur/glass — ya descartado en el doc de diseño por costo de renderizado en RN, y tampoco lo necesitamos para lograr el efecto buscado.

---

## 2. Animaciones por componente

### 2.1 `BrutalistButton` (Empezar rutina, Marcar set, Guardar, FAB)

| Interacción              | Efecto                                                                                                                                          | Detalle técnico                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Press (onPressIn)**    | El botón se desplaza hacia su propia sombra (translate 2-3px), la sombra offset "se esconde" detrás — simula que el botón se hunde físicamente. | `withTiming`, ~80ms, sin bounce (es el hundimiento, no el rebote)                                          |
| **Release (onPressOut)** | Vuelve a posición original con rebote.                                                                                                          | `withSpring` (damping bajo, ~12)                                                                           |
| **Marcar set → success** | Cambio amarillo→verde sincronizado con escala: 1 → 1.15 → 1. Ícono de check aparece con "pop" (scale desde 0).                                  | `withSpring` en scale + `interpolateColor` para el color; haptic `impactAsync(Medium)` en el frame del pop |

### 2.2 `RestTimerRing` (modal de descanso)

| Interacción             | Efecto                                                                                                                     | Detalle técnico                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Progreso**            | Anillo circular con stroke-dashoffset animado en tiempo real, siguiendo `restSeconds` restantes.                           | `react-native-skia` o `react-native-svg` + Reanimated (`useDerivedValue` sobre el contador) |
| **Llegada a 0**         | Flash amarillo→blanco (ya definido en el doc de diseño) + expansión radial breve (5-8% scale-up) antes de cerrar el modal. | `withSequence(withTiming color, withTiming scale)`; haptic `notificationAsync(Success)`     |
| **Botones -15s / +15s** | El número central salta levemente (translateY -2px) en cada tap, en vez de solo cambiar el texto.                          | `withSpring`, muy corto (~100ms)                                                            |

### 2.3 Transición Home → Ejecución (modo focus)

| Interacción                           | Efecto                                                                                                                          | Detalle técnico                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Entrada a modo focus**              | Slide-up de la pantalla de ejecución + fade/slide-down del bottom nav (se disuelve al salir del contexto de navegación normal). | Stack transition custom (React Navigation) + `Layout` animation de Reanimated en el nav |
| **Shared element (opcional, fase 2)** | El nombre de la rutina/card tocada "vuela" y se transforma en el header de Ejecución.                                           | `react-native-shared-element` o Reanimated `SharedTransition`                           |

### 2.4 Listas y cards (`RoutineCard`, `SessionListItem`) — Rutinas, Historial

| Interacción                | Efecto                                                                | Detalle técnico                                                               |
| -------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Entrada (mount)**        | Fade + translateY(8px), escalonado ~40-60ms entre cards consecutivas. | `Moti` (`from`/`animate` con `delay` por índice) o Reanimated `entering` prop |
| **Swipe-to-delete/editar** | Gesto horizontal que revela una acción en `danger` (#F26D6D).         | `react-native-gesture-handler` + Reanimated                                   |

### 2.5 `FilterChipOutline`

| Interacción   | Efecto                                                                                                             | Detalle técnico                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Selección** | El fondo se "llena" sutilmente desde el centro hacia afuera (~150ms), en vez de solo cambiar color de borde/texto. | `withTiming` sobre un `scaleX`/opacity de una capa de fondo interna |

### 2.6 `AttachedBottomNav` (tab activo)

| Interacción       | Efecto                                                                                                  | Detalle técnico                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Cambio de tab** | La pill amarilla se desliza y cambia de ancho hacia el tab de destino (no fade-out/fade-in entre tabs). | Reanimated `Layout` transition sobre la pill (efecto "liquid tab") |

### 2.7 `StreakBadge`

| Interacción             | Efecto                                                                          | Detalle técnico                                      |
| ----------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Incremento de racha** | El número anima como odómetro (scroll vertical corto) en vez de saltar directo. | `withTiming` sobre translateY de dígitos, ~200-300ms |

### 2.8 Resumen de sesión (fin de entrenamiento)

| Interacción               | Efecto                                                                                                                                 | Detalle técnico                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Aparición de pantalla** | Único momento del flujo donde se permite celebración (evento de cierre único por sesión). Partículas ligeras en `accent` cayendo 1-2s. | `lottie-react-native` con un asset minimal (no librería de confetti pesada) |
| **"3,240 kg totales"**    | Count-up animado desde 0 hasta el valor final.                                                                                         | `withTiming` sobre un valor numérico interpolado, redondeado en cada frame  |

---

## 3. Stack técnico

| Necesidad                           | Librería                       | Notas                                                                        |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| Springs, gestos, layout transitions | `react-native-reanimated` v3   | Base de todo lo anterior — requiere dev build (ya está en el proyecto)       |
| Swipe, drag                         | `react-native-gesture-handler` | Para swipe-to-delete en listas                                               |
| Sintaxis declarativa simplificada   | `moti`                         | Opcional — acelera el desarrollo de entradas/stagger, corre sobre Reanimated |
| Anillo del timer con más control    | `@shopify/react-native-skia`   | Alternativa a `react-native-svg` si se necesita más control de trazo         |
| Celebración de sesión completada    | `lottie-react-native`          | Un solo asset ligero, uso puntual (no en toda la app)                        |
| Feedback táctil sincronizado        | `expo-haptics`                 | Ya está en el stack por las notificaciones del timer                         |

---

## 4. Prioridad de implementación

Siguiendo las 4 pantallas críticas ya definidas como fase 1 en el doc de diseño:

1. **`BrutalistButton`** (press/release + transición a success) — se usa en las 4 pantallas críticas, es el componente más repetido.
2. **`RestTimerRing`** — es donde el usuario pasa más tiempo mirando fijo; el anillo animado + flash de llegada a 0 es el de mayor impacto percibido.
3. **Stagger de entrada en listas** (Rutinas, Historial) — bajo costo de implementación, alto impacto visual inmediato.
4. **`AttachedBottomNav`** (pill liquid) — un solo componente, se ve en toda la app.
5. Resto de componentes (chips, racha, transición modo focus, resumen de sesión) — se van agregando incrementalmente, no bloquean el flujo principal.
