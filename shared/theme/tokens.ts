// Fuente única de verdad para colores — sincronizado con docs/diseno-ui-ux-app-entrenamiento.md v2
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

export const radius = {
  cardLg: 18,
  card: 16,
  chip: 11,
  pill: 22,
} as const;

export const fontSize = {
  screenTitle: 20,
  cardTitle: 15,
  bigValue: 34,
  body: 12,
  chipLabel: 10,
} as const;

// Sombra offset dura del neo-brutalismo — solo para BrutalistButton
export const brutalistShadow = {
  offset: 3,
  color: colors.accentPressed,
} as const;
