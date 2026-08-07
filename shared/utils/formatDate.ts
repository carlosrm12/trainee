export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "short",
  }).format(date);
}
