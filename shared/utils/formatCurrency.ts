// Único punto de formateo de montos del módulo de nutrición — nunca
// concatenar "$" a mano en una pantalla. Preparado para selector de moneda
// futuro sin tocar las pantallas que ya muestran plata (§3 del doc de Fase 2).
export function formatCurrency(
  amount: number,
  currencyCode: string = "USD",
): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
