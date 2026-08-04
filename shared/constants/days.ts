export const DAYS = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

export function getDayLabel(dayOfWeek: number | null): string {
  if (dayOfWeek === null) return "Sin día asignado";
  return DAYS.find((d) => d.value === dayOfWeek)?.label ?? "Sin día asignado";
}

// Para ordenar de Lunes a Domingo (semana de gym), no el orden crudo de JS
// (0=Domingo). Domingo pasa a ser el "8" para quedar al final de la lista.
export function sortableDay(dayOfWeek: number | null): number {
  if (dayOfWeek === null) return 99;
  return dayOfWeek === 0 ? 8 : dayOfWeek;
}
