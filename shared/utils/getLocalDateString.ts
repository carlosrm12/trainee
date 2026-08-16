// Arma una fecha YYYY-MM-DD a partir de los getters LOCALES de Date.
// NUNCA usar toISOString() ni ningún getter UTC* acá: toISOString() siempre
// devuelve la fecha en UTC, y en una zona con offset negativo grande (ej.
// Ecuador, UTC-5) eso puede devolver el día anterior al que el dispositivo
// está mostrando. Ya existe una instancia real de este bug en
// useProfileStats.ts (cálculo de racha) — no se toca en esta fase, pero no
// hay margen de error acá: el morning briefing dispara a una hora local fija
// y necesita que `mealLogs.date` y el cálculo de "ayer" coincidan siempre.
//
// Usar en los tres lugares que el doc de Fase 2 marca (§9): el cálculo de
// "ayer" al abrir el briefing, el `date` que se escribe al guardar un
// mealLog, y el `weekStartDate` de la lista de compras.
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
