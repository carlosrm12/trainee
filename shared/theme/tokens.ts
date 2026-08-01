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
  success: "#4ADE80",
  danger: "#F26D6D",
  borderSubtle: "#2A2A32",
} as const;

export const radius = {
  card: 16,
  chip: 12,
  pill: 24,
} as const;

export const fontSize = {
  screenTitle: 24,
  cardTitle: 18,
  bigValue: 36,
  body: 14,
  chipLabel: 13,
} as const;
