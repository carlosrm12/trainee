// Ver docs/diseno-ui-ux-app-entrenamiento.md §7.1:
// "Cards de rutina muestran kcal y duración estimadas (derivadas de
// RoutineExercise.targetSets × tiempos promedio, no se ingresan a mano)."
//
// Solo minutos por ahora — es matemática determinística a partir de datos
// que ya existen en el dominio (targetSets, restSeconds), sin adivinar
// nada más allá de una simplificación razonable y documentada (ver abajo).
//
// Kcal queda fuera de scope a propósito: sin datos fisiológicos reales
// (peso corporal, frecuencia cardíaca, carga real levantada) estimar
// gasto calórico es una adivinanza sin importar cuánto se pula la
// fórmula. Se retoma cuando exista el módulo de nutrición con el peso
// del usuario como input real — no antes, para no contaminar con un
// número inventado los cálculos de déficit calórico que ese módulo
// vaya a hacer más adelante.

// Tiempo de trabajo real por set (setup + ejecución), sin contar el
// descanso — el descanso real de cada ejercicio se suma aparte.
const AVG_SECONDS_PER_SET = 45;

export type EstimationInput = {
  targetSets: number;
  restSeconds: number;
};

export function estimateMinutes(items: EstimationInput[]): number {
  const totalSeconds = items.reduce(
    (sum, item) =>
      sum + item.targetSets * (AVG_SECONDS_PER_SET + item.restSeconds),
    0,
  );
  return Math.round(totalSeconds / 60);
}
