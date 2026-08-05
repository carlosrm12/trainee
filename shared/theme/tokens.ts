// Fuente única de verdad para colores — sincronizado con docs/diseno-ui-ux-app-entrenamiento.md
// Si cambias un valor aquí, actualiza también tailwind.config.js

export const colors = {
  bgBase: "#0E0E12",
  bgSurface: "#1A1A20",
  bgSurfaceAlt: "#22222A",
  accent: "#F5C518",
  accentPressed: "#D9AE0E",
  textPrimary: "#FFFFFF",
  textSecondary: "#9B9BA5",
  textOnAccent: "#0E0E12",
  textOnAccentMuted: "#412402",
  success: "#4ADE80",
  danger: "#F26D6D",
  borderSubtle: "#2A2A32",
} as const;

// Radios ya estaban dentro de los rangos de la v2 (card 16-18, chip 10-12, pill 20+) — sin cambios.
export const radius = {
  card: 16,
  chip: 12,
  pill: 24,
} as const;

export const fontSize = {
  screenTitle: 20, // 18-22px
  cardTitle: 16, // 15-16px
  bigValue: 36, // 28-40px
  body: 12, // 11-13px
  chipLabel: 10, // 9-11px
} as const;
