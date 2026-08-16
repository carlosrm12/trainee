// Estilo del botón "segmentado" (ej. kg/lb, déficit/volumen/mantenimiento).
// Extraído de profile.tsx para que Ajustes de Nutrición lo reutilice sin
// duplicar el mismo objeto de estilo en los dos archivos.
export function segmentedToggleStyle(active: boolean) {
  return {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: active ? "#F5C518" : "#1A1A20",
    borderColor: active ? "#F5C518" : "#2A2A32",
  };
}
