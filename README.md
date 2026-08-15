# 🦋 Morphos (Trainee)

> **Tu registro personal de entrenamiento de bolsillo.**
> Una aplicación móvil diseñada para el entorno del gimnasio, enfocada en la rapidez, cero fricciones y legibilidad bajo cualquier tipo de luz gracias a su sistema de diseño utilitario.

##  Sobre el Proyecto

Morphos (originalmente conceptualizada como *Trainee* o *TrainLog*) nace de la necesidad de tener un registro de entrenamiento eficiente, eliminando interacciones innecesarias durante la rutina en el gimnasio. El flujo central está optimizado para funcionar en un máximo de dos toques desde la pantalla principal: elegir la rutina, ejecutarla con un temporizador integrado y guardar el registro histórico.

##  Sistema de Diseño y Arquitectura (Fase 1)

La interfaz está construida bajo una filosofía de diseño utilitaria, estructurada en capas para resolver diferentes problemas de experiencia de usuario:

*   **Base "Dark Flat Minimal":** 
    Fondos oscuros (`#0E0E12`) con tarjetas planas y bordes sutiles de 1px. Evitamos sombras difusas complejas para garantizar un renderizado económico (60fps) y alto contraste, ideal para la luz dura del gimnasio.
*   **Acentos Neo-Brutalistas:** 
    Los CTAs (Call to Action) principales como "Empezar Rutina" o "Marcar Set" y los estados activos (como la píldora del menú inferior) utilizan bordes duros de 2px y sombras offset sólidas (color de acento amarillo `#F5C518`). Esto comunica acciones de forma contundente sin interrumpir el diseño minimalista de la base.
*   **Bento Selectivo & Stat-Rows:** 
    El formato "Bento Grid" se reserva exclusivamente para comunicar jerarquía real (ej. resaltar la última sesión completada en el historial). Para métricas relacionadas en pantalla (como duración, series, repeticiones), se utilizan "Stat-rows segmentados" para condensar la información sin multiplicar innecesariamente la cantidad de componentes visuales.
*   **Chips Outline:**
    Para los filtros rápidos (ej. tipos de rutinas, vistas de historial), se utilizan "chips" transparentes con borde de acento, reservando el color amarillo de relleno únicamente para las acciones primarias.

##  Animaciones y Micro-interacciones

El sistema de movimiento de la aplicación refuerza la jerarquía visual:

*   **Elementos Brutalistas (Acentos):** Cuentan con físicas de resorte (springs) que generan un rebote perceptible al interactuar, comunicando solidez. Al completar un set, los botones transicionan de estado con breves animaciones de escala.
*   **Elementos Flat (Base):** Movimientos con tiempos suaves y discretos para listas y navegaciones.
*   **Swipe-to-delete:** Gestos fluidos integrados en las listas (historial, rutinas) para acciones secundarias como edición o borrado.
*   **Feedback Inmersivo:** El `RestTimerRing` cuenta con animaciones de progreso SVG fluidas y una celebración visual (confetti minimalista + odómetro) exclusiva para la pantalla de finalización del entrenamiento.
*   **Modo Focus (Ejecución):** Transición suave al iniciar una rutina que esconde la navegación inferior para evitar distracciones durante la ejecución de los sets.

##  Stack Tecnológico

**Frontend & UI:**
*   React Native / Expo
*   Expo Router (Navegación basada en archivos)
*   NativeWind (Tailwind CSS adaptado a RN)
*   React Native Reanimated v3 + Moti (Animaciones fluidas y gestos)
*   Lottie & React Native Skia (Animaciones SVG vectoriales)

**Base de Datos & Configuración Local:**
*   SQLite
*   Drizzle ORM
*   EAS (Expo Application Services) para builds nativos.

##  Instalación y Desarrollo local

1. Clona el repositorio:
   ```bash
   git clone [https://github.com/carlosrm12/trainee.git](https://github.com/carlosrm12/trainee.git)
2. Instala las dependencias:
   ```bash
   npm install
3. Inicia el servidor de desarrollo de Expo:
   ```bash
   npx expo start
